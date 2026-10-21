// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// 只声明我们要用的三个函数。Escrow 通过这个接口去调用任何 ERC20 合约。
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Escrow {
    // ---------- 状态机 ----------
    enum Status { Created, Paid, Completed, Refunded, Disputed }

    struct Order {
        address buyer;
        address seller;
        address token; // 用哪种 ERC20 结算
        uint256 amount; // 最小单位
        uint256 deadline; // unix 时间戳，秒
        Status status;
        string description;
    }

    // ---------- 存储 ----------
    address public arbiter;
    uint256 public orderCount;
    mapping(uint256 => Order) private _orders;

    // 重入锁：1 = 未加锁，2 = 已加锁（合约自带的轻量重入保护，不依赖外部库）
    uint256 private _lock = 1;

    // ---------- 事件 ----------
    event OrderCreated(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        uint256 deadline
    );
    event OrderPaid(uint256 indexed id);
    event OrderCompleted(uint256 indexed id);
    event OrderRefunded(uint256 indexed id);
    event OrderDisputed(uint256 indexed id, address by);
    event OrderResolved(uint256 indexed id, bool sellerWins);

    // ---------- 修饰器 ----------
    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Escrow: caller is not the arbiter");
        _;
    }

    modifier onlyBuyer(uint256 id) {
        require(msg.sender == _orders[id].buyer, "Escrow: caller is not the buyer");
        _;
    }

    modifier inStatus(uint256 id, Status s) {
        require(_orders[id].status == s, "Escrow: wrong status");
        _;
    }

    modifier nonReentrant() {
        require(_lock == 1, "Escrow: reentrant call");
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address _arbiter) {
        require(_arbiter != address(0), "Escrow: arbiter is the zero address");
        arbiter = _arbiter;
    }

    function getOrder(uint256 id) public view returns (Order memory) {
        require(id < orderCount, "Escrow: order does not exist");
        return _orders[id];
    }

    // ---------- TODO 1：创建订单 ----------
    function createOrder(
        address seller,
        address token,
        uint256 amount,
        uint256 deadline,
        string memory description
    ) public returns (uint256) {
        require(seller != address(0), "Escrow: seller is the zero address");
        require(seller != msg.sender, "Escrow: seller is the buyer");
        // 结算代币必须是真实合约，否则 deposit 时会调用到空地址、无 reason 回滚
        require(token != address(0), "Escrow: token is the zero address");
        require(token.code.length > 0, "Escrow: token is not a contract");
        require(amount > 0, "Escrow: amount must be positive");
        require(deadline > block.timestamp, "Escrow: deadline must be in the future");

        uint256 id = orderCount;
        _orders[id] = Order({
            buyer: msg.sender,
            seller: seller,
            token: token,
            amount: amount,
            deadline: deadline,
            status: Status.Created,
            description: description
        });
        orderCount += 1;

        emit OrderCreated(id, msg.sender, seller, token, amount, deadline);
        return id;
    }

    // ---------- TODO 2：买家付款 ----------
    function deposit(uint256 id) public onlyBuyer(id) inStatus(id, Status.Created) nonReentrant {
        Order storage o = _orders[id];

        // 先做外部调用，成功后再改状态（checks-effects-interactions）
        bool ok = IERC20(o.token).transferFrom(o.buyer, address(this), o.amount);
        require(ok, "Escrow: transferFrom failed");

        o.status = Status.Paid;

        emit OrderPaid(id);
    }

    // ---------- TODO 3：买家确认收货 ----------
    function confirm(uint256 id) public onlyBuyer(id) inStatus(id, Status.Paid) nonReentrant {
        Order storage o = _orders[id];

        o.status = Status.Completed;

        bool ok = IERC20(o.token).transfer(o.seller, o.amount);
        require(ok, "Escrow: transfer failed");

        emit OrderCompleted(id);
    }

    // ---------- TODO 4：超期退款 ----------
    function refund(uint256 id) public onlyBuyer(id) inStatus(id, Status.Paid) nonReentrant {
        Order storage o = _orders[id];
        require(block.timestamp > o.deadline, "Escrow: deadline not reached");

        o.status = Status.Refunded;

        bool ok = IERC20(o.token).transfer(o.buyer, o.amount);
        require(ok, "Escrow: transfer failed");

        emit OrderRefunded(id);
    }

    // ---------- TODO 5：发起争议 ----------
    function dispute(uint256 id) public inStatus(id, Status.Paid) nonReentrant {
        Order storage o = _orders[id];
        require(
            msg.sender == o.buyer || msg.sender == o.seller,
            "Escrow: caller is not buyer or seller"
        );

        o.status = Status.Disputed;

        emit OrderDisputed(id, msg.sender);
    }

    // ---------- TODO 6：仲裁 ----------
    function resolve(uint256 id, bool sellerWins) public onlyArbiter inStatus(id, Status.Disputed) nonReentrant {
        Order storage o = _orders[id];

        address to;
        if (sellerWins) {
            o.status = Status.Completed;
            to = o.seller;
        } else {
            o.status = Status.Refunded;
            to = o.buyer;
        }

        bool ok = IERC20(o.token).transfer(to, o.amount);
        require(ok, "Escrow: transfer failed");

        emit OrderResolved(id, sellerWins);
    }
}
