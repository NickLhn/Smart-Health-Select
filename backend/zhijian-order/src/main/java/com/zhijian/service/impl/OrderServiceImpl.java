package com.zhijian.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhijian.common.context.UserContext;
import com.zhijian.cart.service.CartService;
import com.zhijian.delivery.service.DeliveryService;
import com.zhijian.marketing.service.UserCouponService;
import com.zhijian.service.*;
import com.zhijian.user.service.UserAddressService;
import com.zhijian.user.service.UserService;
import com.zhijian.common.result.Result;
import com.zhijian.dto.medicine.MedicineCommentCreateDTO;
import com.zhijian.delivery.dto.DeliveryCreateDTO;
import com.zhijian.cart.pojo.CartItem;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.OrderItem;
import com.zhijian.pojo.PaymentBatch;
import com.zhijian.pojo.PaymentRecord;
import com.zhijian.pojo.user.entity.UserAddress;
import com.zhijian.mapper.OrderItemMapper;
import com.zhijian.mapper.OrderMapper;
import com.zhijian.dto.order.OrderCreateDTO;
import com.zhijian.dto.order.OrderCreateFromCartDTO;
import com.zhijian.dto.order.OrderQueryDTO;
import com.zhijian.dto.order.ProductSalesDTO;
import com.zhijian.dto.statistics.ChartDataVO;
import com.zhijian.dto.statistics.DashboardDataVO;
import lombok.RequiredArgsConstructor;
import com.zhijian.common.event.NotificationEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.zhijian.user.mapper.MerchantMapper;
import com.zhijian.pojo.user.entity.Merchant;
import lombok.extern.slf4j.Slf4j;

/**
 * 订单服务实现类。
 * <p>
 * 负责下单、支付、发货、审核、退款、评价以及统计等完整订单生命周期管理。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {

    private static final int ORDER_STATUS_PENDING_PAYMENT = 0;
    private static final int ORDER_STATUS_PENDING_SHIPMENT = 1;
    private static final int ORDER_STATUS_AFTER_SALE = 4;
    private static final int ORDER_STATUS_CANCELED = 6;
    private static final int ORDER_STATUS_PENDING_AUDIT = 7;
    private static final int PAYMENT_TIMEOUT_MINUTES = 30;
    private static final int PAYMENT_BATCH_STATUS_PENDING = 0;
    private static final int PAYMENT_BATCH_STATUS_CANCELED = 2;
    private static final int PAYMENT_BATCH_STATUS_EXPIRED = 3;

    /**
     * 药品业务服务。
     */
    private final MedicineService medicineService;

    /**
     * 药品评价业务服务。
     */
    private final MedicineCommentService medicineCommentService;

    /**
     * 购物车业务服务。
     */
    private final CartService cartService;

    /**
     * 收货地址业务服务。
     */
    private final UserAddressService userAddressService;

    /**
     * 支付记录业务服务。
     */
    private final PaymentRecordService paymentRecordService;

    /**
     * 用户优惠券业务服务。
     */
    private final UserCouponService userCouponService;

    /**
     * 支付批次业务服务。
     */
    private final PaymentBatchService paymentBatchService;

    /**
     * 订单项数据访问对象。
     */
    private final OrderItemMapper orderItemMapper;

    /**
     * 配送业务服务。
     */
    private final DeliveryService deliveryService;

    /**
     * 用户业务服务。
     */
    private final UserService userService;

    /**
     * 应用事件发布器。
     */
    private final ApplicationEventPublisher eventPublisher;

    /**
     * JSON 工具，用于解析支付批次中的订单列表。
     */
    private final ObjectMapper objectMapper;

    /**
     * 商家数据访问对象。
     */
    private final MerchantMapper merchantMapper;

    // ========================= 订单状态流转 =========================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelOrder(Long orderId) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        // 只能取消待支付订单
        if (order.getStatus() != ORDER_STATUS_PENDING_PAYMENT) {
            throw new RuntimeException("当前状态无法取消订单");
        }

        // 先用状态条件更新抢占这笔订单，抢到之后再恢复库存，避免和支付回写并发时重复修改。
        boolean success = tryTransitionPendingOrderToCanceled(order.getId());
        if (success) {
            restoreOrderStock(order);
            closePendingPaymentBatches(List.of(order.getId()), PAYMENT_BATCH_STATUS_CANCELED, "canceled", "用户主动取消订单");
        }
        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean applyRefund(Long orderId, String reason) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        // 待发货(1)或待收货(2)状态可以申请退款
        if (order.getStatus() != ORDER_STATUS_PENDING_SHIPMENT && order.getStatus() != 2) {
            throw new RuntimeException("当前状态无法申请退款");
        }

        order.setStatus(ORDER_STATUS_AFTER_SALE);
        order.setRefundReason(reason);
        return this.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean processRefund(Long orderId, Long sellerId, boolean agree, String remark) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        // 商家处理退款时必须校验订单归属，避免不同店铺之间串单操作。
        if (sellerId == null || !sellerId.equals(order.getSellerId())) {
            throw new RuntimeException("无权处理该订单退款");
        }
        if (order.getStatus() != ORDER_STATUS_AFTER_SALE) {
            throw new RuntimeException("订单不是售后状态");
        }
        
        if (agree) {
            order.setStatus(5);
            // 商家同意后，订单进入退款完成态，并补记退款流水。
            refundOrder(orderId, order.getPayAmount(), "商家同意退款");
        } else {
            // 拒绝退款时，根据是否已发货恢复到待发货或待收货状态。
            if (order.getDeliveryTime() != null) {
                order.setStatus(2);
            } else {
                order.setStatus(ORDER_STATUS_PENDING_SHIPMENT);
            }
        }
        order.setRefundRemark(remark);
        return this.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result createOrder(OrderCreateDTO createDTO, Long userId) {
        // 单商品立即购买流程。
        Medicine medicine = medicineService.getById(createDTO.getMedicineId());
        if (medicine == null) {
            return Result.failed("药品不存在");
        }

        if (medicine.getStock() < createDTO.getQuantity()) {
            return Result.failed("库存不足");
        }

        // 先扣库存，避免并发下单导致超卖。
        boolean updateStock = medicineService.deductStock(medicine.getId(), createDTO.getQuantity());
        if (!updateStock) {
            return Result.failed("库存不足");
        }
        
        // 订单金额由商品总额、运费、优惠券三部分共同决定。
        BigDecimal totalAmount = medicine.getPrice().multiply(BigDecimal.valueOf(createDTO.getQuantity()));
        
        BigDecimal freight = BigDecimal.ZERO;
        if (medicine.getSellerId() != null) {
            Merchant merchant = merchantMapper.selectOne(new LambdaQueryWrapper<Merchant>()
                    .eq(Merchant::getUserId, medicine.getSellerId()));
            if (merchant != null && merchant.getDeliveryFee() != null) {
                freight = merchant.getDeliveryFee();
            }
        }

        BigDecimal couponAmount = BigDecimal.ZERO;
        BigDecimal payAmount = totalAmount.add(freight);

        // 如果本次使用优惠券，则在总金额基础上扣减。
        if (createDTO.getUserCouponId() != null) {
            couponAmount = userCouponService.getCouponAmount(createDTO.getUserCouponId(), totalAmount);
            payAmount = payAmount.subtract(couponAmount);
            if (payAmount.compareTo(BigDecimal.ZERO) < 0) {
                payAmount = BigDecimal.ZERO;
            }
        }

        // 生成订单主记录。
        Order order = new Order();
        // 订单号由时间戳和随机数拼接，便于演示时观察时序。
        String timeStr = cn.hutool.core.date.DateUtil.format(new java.util.Date(), "yyyyMMddHHmmssSSS");
        String randomStr = cn.hutool.core.util.RandomUtil.randomNumbers(6);
        order.setOrderNo(timeStr + randomStr);
        order.setUserId(userId);
        order.setSellerId(medicine.getSellerId());
        order.setTotalAmount(totalAmount);
        order.setCouponAmount(couponAmount);
        order.setPayAmount(payAmount);
        order.setCouponHistoryId(createDTO.getUserCouponId());
        
        boolean isPrescription = Integer.valueOf(1).equals(medicine.getIsPrescription());
        if (isPrescription) {
            // 处方药订单要求就诊人和处方图都齐全，并进入待审核状态。
            if (createDTO.getPatientId() == null) {
                return Result.failed("处方药必须选择就诊人");
            }
            if (createDTO.getPrescriptionImage() == null || createDTO.getPrescriptionImage().isEmpty()) {
                return Result.failed("处方药必须上传处方图片");
            }
            order.setAuditStatus(1);
            order.setStatus(ORDER_STATUS_PENDING_AUDIT);
            order.setPatientId(createDTO.getPatientId());
            order.setPrescriptionImage(createDTO.getPrescriptionImage());
            order.setPayExpireTime(null);
        } else {
            order.setAuditStatus(0);
            order.setStatus(ORDER_STATUS_PENDING_PAYMENT);
            // 非处方单从下单开始计时，后续超时取消只认这个字段，不再依赖 createTime。
            order.setPayExpireTime(buildPayExpireTime());
        }
        
        order.setReceiverName(createDTO.getReceiverName());
        order.setReceiverPhone(createDTO.getReceiverPhone());
        order.setReceiverAddress(createDTO.getReceiverAddress());
        order.setCommentStatus(0);

        this.save(order);

        // 生成订单项，便于后续展示和库存回滚。
        OrderItem item = new OrderItem();
        item.setOrderId(order.getId());
        item.setMedicineId(medicine.getId());
        item.setMedicineName(medicine.getName());
        item.setMedicineImage(medicine.getMainImage());
        item.setMedicinePrice(medicine.getPrice());
        item.setCount(createDTO.getQuantity());
        item.setTotalPrice(medicine.getPrice().multiply(BigDecimal.valueOf(createDTO.getQuantity())));
        orderItemMapper.insert(item);
        
        // 优惠券在订单落库后再核销，避免订单失败却提前占用。
        if (createDTO.getUserCouponId() != null) {
            userCouponService.useCoupon(createDTO.getUserCouponId(), order.getId());
        }

        return Result.success(order.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<List<String>> createOrderFromCart(OrderCreateFromCartDTO createDTO, Long userId) {
        log.info("createOrderFromCart called: userId={}, addressId={}, cartItemIds={}", userId, createDTO.getAddressId(), createDTO.getCartItemIds());
        
        // 先校验地址归属，避免用其他用户地址下单。
        UserAddress address = userAddressService.getById(createDTO.getAddressId());
        log.info("Address found: {}", address);
        if (address == null || !address.getUserId().equals(userId)) {
            log.warn("Address validation failed: address={}, userId={}", address, userId);
            return Result.failed("收货地址不存在");
        }
        String fullAddress = address.getProvince() + address.getCity() + address.getRegion() + address.getDetailAddress();

        // 获取本次勾选的购物车项。
        List<CartItem> cartItems = cartService.listByIds(createDTO.getCartItemIds());
        log.info("Cart items found: {}", cartItems);
        if (cartItems == null || cartItems.isEmpty()) {
            log.warn("Cart items empty or null");
            return Result.failed("未选择商品");
        }

        // 所有购物车项都必须属于当前用户。
        for (CartItem item : cartItems) {
            if (!item.getUserId().equals(userId)) {
                return Result.failed("包含无效的购物车商品");
            }
        }

        List<String> orderIds = new ArrayList<>();

        // 当前购物车下单采用简化拆单策略：一个购物车项对应一个订单。
        // 多商品拆单时，为避免优惠券分摊歧义，暂不支持使用优惠券。
        if (createDTO.getUserCouponId() != null && cartItems.size() > 1) {
             return Result.failed("多商品合并下单暂不支持使用优惠券");
        }

        // 同一批购物车订单共用一个支付截止时间，方便和 Stripe payment batch 对齐。
        LocalDateTime batchPayExpireTime = buildPayExpireTime();

        for (CartItem cartItem : cartItems) {
            // 逐项校验商品有效性和库存。
            Medicine medicine = medicineService.getById(cartItem.getMedicineId());
            if (medicine == null) {
                throw new RuntimeException("药品已下架: " + cartItem.getMedicineId());
            }
            if (medicine.getStock() < cartItem.getCount()) {
                throw new RuntimeException("库存不足: " + medicine.getName());
            }

            // 扣减库存
            boolean updateStock = medicineService.deductStock(medicine.getId(), cartItem.getCount());
            if (!updateStock) {
                throw new RuntimeException("库存不足: " + medicine.getName());
            }
            
            BigDecimal totalAmount = medicine.getPrice().multiply(BigDecimal.valueOf(cartItem.getCount()));
            
            // 计算运费
            BigDecimal freight = BigDecimal.ZERO;
            if (medicine.getSellerId() != null) {
                Merchant merchant = merchantMapper.selectOne(new LambdaQueryWrapper<Merchant>()
                        .eq(Merchant::getUserId, medicine.getSellerId()));
                if (merchant != null && merchant.getDeliveryFee() != null) {
                    freight = merchant.getDeliveryFee();
                }
            }

            BigDecimal couponAmount = BigDecimal.ZERO;
            BigDecimal payAmount = totalAmount.add(freight);
            
            // 如果是单商品下单（cartItems.size() == 1），且有优惠券
            if (createDTO.getUserCouponId() != null && cartItems.size() == 1) {
                couponAmount = userCouponService.getCouponAmount(createDTO.getUserCouponId(), totalAmount);
                payAmount = payAmount.subtract(couponAmount);
                if (payAmount.compareTo(BigDecimal.ZERO) < 0) {
                    payAmount = BigDecimal.ZERO;
                }
            }

            // 创建订单
            Order order = new Order();
            // 生成时间戳订单号
            String timeStr = cn.hutool.core.date.DateUtil.format(new java.util.Date(), "yyyyMMddHHmmssSSS");
            String randomStr = cn.hutool.core.util.RandomUtil.randomNumbers(6);
            order.setOrderNo(timeStr + randomStr);
            order.setUserId(userId);
            order.setSellerId(medicine.getSellerId());
            order.setTotalAmount(totalAmount);
            order.setCouponAmount(couponAmount);
            order.setPayAmount(payAmount);
            order.setCouponHistoryId(couponAmount.compareTo(BigDecimal.ZERO) > 0 ? createDTO.getUserCouponId() : null);
            
            boolean isPrescription = Integer.valueOf(1).equals(medicine.getIsPrescription());
            if (isPrescription) {
                if (createDTO.getPatientId() == null) {
                    throw new RuntimeException("处方药必须选择就诊人");
                }
                if (createDTO.getPrescriptionImage() == null || createDTO.getPrescriptionImage().isEmpty()) {
                    throw new RuntimeException("处方药必须上传处方图片");
                }
                order.setAuditStatus(1); // 待审核
                order.setStatus(ORDER_STATUS_PENDING_AUDIT);      // 待审核
                order.setPatientId(createDTO.getPatientId());
                order.setPrescriptionImage(createDTO.getPrescriptionImage());
                order.setPayExpireTime(null);
            } else {
                order.setAuditStatus(0); // 无需审核
                order.setStatus(ORDER_STATUS_PENDING_PAYMENT);      // 待支付
                // 购物车拆单后仍然共用同样的支付窗口，避免定时任务与 Stripe 批次过期时间不一致。
                order.setPayExpireTime(batchPayExpireTime);
            }
            
            order.setCommentStatus(0); // 未评价
            order.setReceiverName(address.getReceiverName());
            order.setReceiverPhone(address.getReceiverPhone());
            order.setReceiverAddress(fullAddress);

            this.save(order);
            if (order.getId() == null) {
                // 这里必须拿到数据库回填的主键，否则后续支付、订单项关联都会错位。
                throw new RuntimeException("订单创建成功但未返回订单ID，请检查主键自增配置");
            }
            // 前端是 JavaScript，Long 订单 ID 超过安全整数范围时必须改成字符串传输。
            orderIds.add(String.valueOf(order.getId()));

            // 创建订单项
            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setMedicineId(medicine.getId());
            item.setMedicineName(medicine.getName());
            item.setMedicineImage(medicine.getMainImage());
            item.setMedicinePrice(medicine.getPrice());
            item.setCount(cartItem.getCount());
            item.setTotalPrice(medicine.getPrice().multiply(new BigDecimal(cartItem.getCount())));
            orderItemMapper.insert(item);
            if (item.getId() == null) {
                throw new RuntimeException("订单项创建成功但未返回订单项ID，请检查主键自增配置");
            }
            
            // 核销
            if (couponAmount.compareTo(BigDecimal.ZERO) > 0) {
                userCouponService.useCoupon(createDTO.getUserCouponId(), order.getId());
            }
        }

        // 5. 清空购物车
        cartService.removeByIds(createDTO.getCartItemIds());

        return Result.success(orderIds);
    }

    @Override
    /**
     * 分页查询我的订单
     *
     * @param queryDTO 查询参数
     * @param userId   用户ID
     * @return 订单分页数据
     */
    public IPage<Order> pageList(OrderQueryDTO queryDTO, Long userId) {
        Page<Order> page = new Page<>(queryDTO.getPage(), queryDTO.getSize());
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getUserId, userId)
                .eq(queryDTO.getStatus() != null, Order::getStatus, queryDTO.getStatus())
                .like(StringUtils.hasText(queryDTO.getOrderNo()), Order::getOrderNo, queryDTO.getOrderNo())
                .like(StringUtils.hasText(queryDTO.getReceiverName()), Order::getReceiverName, queryDTO.getReceiverName())
                .ge(parseDateTimeOrNull(queryDTO.getStartTime()) != null, Order::getCreateTime, parseDateTimeOrNull(queryDTO.getStartTime()))
                .le(parseDateTimeOrNull(queryDTO.getEndTime()) != null, Order::getCreateTime, parseDateTimeOrNull(queryDTO.getEndTime()))
                .orderByDesc(Order::getCreateTime);
        
        IPage<Order> orderPage = this.page(page, wrapper);
        
        // 填充订单项信息
        fillOrderItems(orderPage.getRecords());
        
        return orderPage;
    }

    @Override
    /**
     * 分页查询商家订单
     *
     * @param queryDTO 查询参数
     * @param sellerId 商家ID
     * @return 订单分页数据
     */
    public IPage<Order> pageListSeller(OrderQueryDTO queryDTO, Long sellerId) {
        Page<Order> page = new Page<>(queryDTO.getPage(), queryDTO.getSize());
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getSellerId, sellerId)
                .eq(queryDTO.getStatus() != null, Order::getStatus, queryDTO.getStatus())
                .like(StringUtils.hasText(queryDTO.getOrderNo()), Order::getOrderNo, queryDTO.getOrderNo())
                .like(StringUtils.hasText(queryDTO.getReceiverName()), Order::getReceiverName, queryDTO.getReceiverName())
                .ge(parseDateTimeOrNull(queryDTO.getStartTime()) != null, Order::getCreateTime, parseDateTimeOrNull(queryDTO.getStartTime()))
                .le(parseDateTimeOrNull(queryDTO.getEndTime()) != null, Order::getCreateTime, parseDateTimeOrNull(queryDTO.getEndTime()))
                .orderByDesc(Order::getCreateTime);
        
        IPage<Order> orderPage = this.page(page, wrapper);
        
        // 填充订单项信息
        fillOrderItems(orderPage.getRecords());
        
        return orderPage;
    }

    @Override
    /**
     * 分页查询所有订单 (管理员)
     *
     * @param queryDTO 查询参数
     * @return 订单分页数据
     */
    public IPage<Order> pageListAdmin(OrderQueryDTO queryDTO) {
        Page<Order> page = new Page<>(queryDTO.getPage(), queryDTO.getSize());
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        String keyword = StringUtils.hasText(queryDTO.getKeyword()) ? queryDTO.getKeyword().trim() : null;
        wrapper.eq(queryDTO.getStatus() != null, Order::getStatus, queryDTO.getStatus())
                // 管理端的关键词筛选统一兜底到订单号和收货人，避免前端有搜索框但后端完全不生效。
                .and(StringUtils.hasText(keyword), w -> w
                        .like(Order::getOrderNo, keyword)
                        .or()
                        .like(Order::getReceiverName, keyword))
                .like(StringUtils.hasText(queryDTO.getOrderNo()), Order::getOrderNo, queryDTO.getOrderNo())
                .like(StringUtils.hasText(queryDTO.getReceiverName()), Order::getReceiverName, queryDTO.getReceiverName())
                .ge(parseDateTimeOrNull(queryDTO.getStartTime()) != null, Order::getCreateTime, parseDateTimeOrNull(queryDTO.getStartTime()))
                .le(parseDateTimeOrNull(queryDTO.getEndTime()) != null, Order::getCreateTime, parseDateTimeOrNull(queryDTO.getEndTime()))
                .orderByDesc(Order::getCreateTime);
        
        IPage<Order> orderPage = this.page(page, wrapper);
        
        // 填充订单项信息
        fillOrderItems(orderPage.getRecords());
        
        return orderPage;
    }

    @Override
    /**
     * 获取订单详情
     *
     * @param id     订单ID
     * @param userId 用户ID (用于鉴权)
     * @return 订单详情
     */
    public Order getDetail(Long id, Long userId) {
        Order order = this.getById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        String role = UserContext.getRole();
        boolean canAccess = order.getUserId().equals(userId)
                || ("SELLER".equals(role) && userId.equals(order.getSellerId()))
                || "ADMIN".equals(role);
        if (!canAccess) {
            throw new RuntimeException("无权访问该订单");
        }
        
        // 填充订单项信息
        fillOrderItems(List.of(order));
        
        return order;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 支付订单
     *
     * @param id     订单ID
     * @param userId 用户ID
     * @return 是否成功
     */
    public boolean payOrder(Long id, Long userId) {
        Order order = this.getById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该订单");
        }
        if (order.getStatus() != ORDER_STATUS_PENDING_PAYMENT) {
            // 如果订单状态已经是已支付(1)，则直接返回成功
            if (order.getStatus() == ORDER_STATUS_PENDING_SHIPMENT) {
                return true;
            }
            throw new RuntimeException("订单状态异常，无法支付");
        }

        // 保留模拟支付接口，方便旧页面或演示流程继续使用。
        return markOrderPaidInternal(order, 1, IdUtil.simpleUUID(), "mock", "cny", null, null, "paid", true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markOrdersPaid(
            List<Long> orderIds,
            Long userId,
            Integer paymentMethod,
            String transactionId,
            String provider,
            String currency,
            String checkoutSessionId,
            String paymentIntentId,
            String providerStatus
    ) {
        if (orderIds == null || orderIds.isEmpty()) {
            throw new RuntimeException("支付批次中没有可处理的订单");
        }

        // webhook 会按批次统一回写，所以这里一次性校验并处理整批订单。
        List<Order> orders = this.listByIds(orderIds);
        if (orders.size() != orderIds.size()) {
            throw new RuntimeException("支付批次中存在无效订单");
        }

        for (Order order : orders) {
            if (!order.getUserId().equals(userId)) {
                throw new RuntimeException("存在不属于当前用户的订单");
            }
            markOrderPaidInternal(
                    order,
                    paymentMethod,
                    transactionId,
                    provider,
                    currency,
                    checkoutSessionId,
                    paymentIntentId,
                    providerStatus,
                    false
            );
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 检查并取消超时未支付订单
     */
    public void checkAndCancelTimeoutOrders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime compatibilityTimeout = now.minusMinutes(PAYMENT_TIMEOUT_MINUTES);

        // 优先使用独立的支付截止时间；对老数据保留 createTime 兜底，避免历史待支付订单永远不超时。
        List<Order> orders = this.lambdaQuery()
                .eq(Order::getStatus, ORDER_STATUS_PENDING_PAYMENT)
                .and(wrapper -> wrapper
                        .le(Order::getPayExpireTime, now)
                        .or()
                        .isNull(Order::getPayExpireTime)
                        .lt(Order::getCreateTime, compatibilityTimeout))
                .list();

        if (orders == null || orders.isEmpty()) {
            return;
        }

        for (Order order : orders) {
            // 先用状态条件更新抢占订单，再恢复库存，避免和支付成功回写同时执行时把库存加回两次。
            if (!tryTransitionPendingOrderToCanceled(order.getId())) {
                continue;
            }

            restoreOrderStock(order);
            closePendingPaymentBatches(List.of(order.getId()), PAYMENT_BATCH_STATUS_EXPIRED, "expired", "订单超时未支付，批次同步过期");

            eventPublisher.publishEvent(new NotificationEvent(
                    order.getUserId(),
                    "您的订单 " + order.getOrderNo() + " 因超时未支付已自动取消",
                    "ORDER_CANCELLED",
                    order.getId()
            ));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 商家发货
     *
     * @param id       订单ID
     * @param sellerId 商家ID
     * @return 是否成功
     */
    public boolean shipOrder(Long id, Long sellerId) {
        Order order = this.getById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        // 填充订单项
        fillOrderItems(List.of(order));
        
        // 校验商家权限 (查询 Medicine 表)
        Medicine medicine = medicineService.getById(order.getMedicineId());
        if (medicine == null || !medicine.getSellerId().equals(sellerId)) {
            throw new RuntimeException("无权操作该订单");
        }

        if (order.getStatus() != 1) {
            throw new RuntimeException("订单状态异常，无法发货");
        }

        // 创建配送单
        DeliveryCreateDTO deliveryCreateDTO = new DeliveryCreateDTO();
        deliveryCreateDTO.setOrderId(order.getId());
        deliveryCreateDTO.setReceiverName(order.getReceiverName());
        deliveryCreateDTO.setReceiverPhone(order.getReceiverPhone());
        deliveryCreateDTO.setReceiverAddress(order.getReceiverAddress());

        // 填充店铺信息
        if (medicine.getSellerId() != null) {
            Merchant merchant = merchantMapper.selectOne(new LambdaQueryWrapper<Merchant>()
                    .eq(Merchant::getUserId, medicine.getSellerId()));
            if (merchant != null) {
                deliveryCreateDTO.setShopName(merchant.getShopName());
                deliveryCreateDTO.setShopAddress(merchant.getAddress());
                // 设置配送费 (假设骑手获得全额配送费)
                if (merchant.getDeliveryFee() != null) {
                    deliveryCreateDTO.setDeliveryFee(merchant.getDeliveryFee());
                } else {
                    deliveryCreateDTO.setDeliveryFee(java.math.BigDecimal.ZERO);
                }
            }
        }
        
        // 识别急单 (根据药品名称或分类，这里简单根据名称关键词)
        if (medicine.getName().contains("感冒") || 
            medicine.getName().contains("发烧") || 
            medicine.getName().contains("止痛") ||
            medicine.getName().contains("抗生素") ||
            medicine.getName().contains("急")) {
            deliveryCreateDTO.setIsUrgent(1);
        } else {
            deliveryCreateDTO.setIsUrgent(0);
        }

        deliveryService.createDelivery(deliveryCreateDTO);

        order.setStatus(8); // 8: 待揽收 (商家已发货，等待骑手接单)
        // order.setDeliveryTime(LocalDateTime.now()); // 发货时间推迟到骑手接单时记录
        boolean success = this.updateById(order);

        if (success) {
            eventPublisher.publishEvent(new NotificationEvent(
                order.getUserId(),
                "您的订单 " + order.getOrderNo() + " 已打包，等待骑手揽收",
                "ORDER_PACKED",
                order.getId()
            ));
        }
        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 确认收货
     *
     * @param id     订单ID
     * @param userId 用户ID
     * @return 是否成功
     */
    public boolean receiveOrder(Long id, Long userId) {
        Order order = this.getById(id);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该订单");
        }
        if (order.getStatus() != 2) {
            throw new RuntimeException("订单状态异常，无法确认收货");
        }

        order.setStatus(3); // 已完成
        order.setFinishTime(LocalDateTime.now());
        boolean success = this.updateById(order);
        if (success) {
            eventPublisher.publishEvent(new NotificationEvent(
                order.getUserId(),
                "您的订单 " + order.getOrderNo() + " 已完成",
                "ORDER_RECEIVED",
                order.getId()
            ));
        }
        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 评价订单
     *
     * @param orderId 订单ID
     * @param star    评分
     * @param content 评价内容
     * @param images  评价图片
     * @param userId  用户ID
     * @return 是否成功
     */
    public boolean commentOrder(Long orderId, Integer star, String content, String images, Long userId) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("无权操作");
        }
        if (order.getStatus() != 3) {
            throw new RuntimeException("订单未完成，无法评价");
        }
        if (order.getCommentStatus() != null && order.getCommentStatus() == 1) {
            throw new RuntimeException("订单已评价");
        }
        
        // 1. 保存评价 (调用 MedicineCommentService)
        // 由于 MedicineCommentService 在 zhijian-medicine 模块，而 zhijian-order 依赖 zhijian-medicine
        // 我们可以直接调用 MedicineCommentService
        // 但是 MedicineCommentService 需要注入。
        
        // 获取订单商品 (假设单商品订单)
        List<OrderItem> items = orderItemMapper.selectList(new LambdaQueryWrapper<OrderItem>()
                .eq(OrderItem::getOrderId, orderId));
        if (items.isEmpty()) {
            throw new RuntimeException("订单数据异常");
        }
        OrderItem item = items.get(0);
        
        MedicineCommentCreateDTO commentDTO = new MedicineCommentCreateDTO();
        commentDTO.setOrderId(orderId);
        commentDTO.setMedicineId(item.getMedicineId());
        commentDTO.setUserId(userId);
        
        // 获取用户信息 (需要调用 UserService)
        try {
             // 临时方案：如果拿不到用户名，就存"用户" + userId
             commentDTO.setUserName("用户" + userId);
             commentDTO.setUserAvatar(null);
        } catch (Exception e) {
            log.warn("获取用户信息失败", e);
        }

        commentDTO.setStar(star);
        commentDTO.setContent(content);
        commentDTO.setImages(images);
        
        medicineCommentService.createComment(commentDTO);
        
        // 2. 更新订单状态
        order.setCommentStatus(1);
        return this.updateById(order);
    }
    
    @Override
    /**
     * 分页查询待审核订单 (药师)
     *
     * @param queryDTO 查询参数
     * @return 订单分页数据
     */
    public IPage<Order> pageAuditList(OrderQueryDTO queryDTO) {
        Page<Order> page = new Page<>(queryDTO.getPage(), queryDTO.getSize());
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        
        if (queryDTO.getSellerId() != null) {
            wrapper.eq(Order::getSellerId, queryDTO.getSellerId());
        }

        if (queryDTO.getAuditStatus() != null) {
             wrapper.eq(Order::getAuditStatus, queryDTO.getAuditStatus());
        } else {
             // 默认只查询待审核和已审核的处方单，或者所有相关单
             // 简化：如果没传，默认查询所有需要审核或已审核的订单 (auditStatus > 0)
             wrapper.gt(Order::getAuditStatus, 0);
        }
        
        wrapper.orderByAsc(Order::getCreateTime);
        
        IPage<Order> orderPage = this.page(page, wrapper);
        fillOrderItems(orderPage.getRecords());
        return orderPage;
    }

    /**
     * 审核订单
     *
     * @param orderId 订单ID
     * @param pass    是否通过
     * @param reason  审核意见
     * @return 是否成功
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean auditOrder(Long orderId, boolean pass, String reason) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (order.getAuditStatus() != 1) { 
            throw new RuntimeException("订单状态不正确，无法审核");
        }
        
        if (pass) {
            order.setAuditStatus(2); // 审核通过
            order.setStatus(ORDER_STATUS_PENDING_PAYMENT); // 变为待支付
            // 处方审核完成后重新开始计时，避免审核等待时间直接吞掉支付窗口。
            order.setPayExpireTime(buildPayExpireTime());
        } else {
            order.setAuditStatus(3); // 审核拒绝
            order.setStatus(ORDER_STATUS_CANCELED); // 变为已取消 (6)
            order.setPayExpireTime(null);
            // 恢复库存
            // 注意：这里需要重新查询 items 才能准确恢复，因为 order.getMedicineId() 是 transient
            fillOrderItems(List.of(order));
            if (order.getMedicineId() != null) {
                medicineService.restoreStock(order.getMedicineId(), order.getQuantity());
            }
        }
        order.setAuditReason(reason);
        boolean success = this.updateById(order);

        if (success) {
            String msg = pass ? "您的处方审核通过，请尽快支付" : "您的处方审核未通过，原因：" + reason;
            String type = pass ? "PRESCRIPTION_APPROVED" : "PRESCRIPTION_REJECTED";
            eventPublisher.publishEvent(new NotificationEvent(
                order.getUserId(),
                msg,
                type,
                order.getId()
            ));
        }
        return success;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 订单退款 (仅记录)
     *
     * @param orderId 订单ID
     * @param amount  退款金额
     * @param reason  退款原因
     * @return 是否成功
     */
    public boolean refundOrder(Long orderId, BigDecimal amount, String reason) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        // 查询支付方式
        PaymentRecord lastPayment = paymentRecordService.getOne(new LambdaQueryWrapper<PaymentRecord>()
                .eq(PaymentRecord::getOrderId, orderId)
                .eq(PaymentRecord::getStatus, 1)
                .orderByDesc(PaymentRecord::getCreateTime)
                .last("LIMIT 1"));
        
        Integer paymentMethod = lastPayment != null ? lastPayment.getPaymentMethod() : 1;

        // 记录退款流水
        String transactionId = IdUtil.simpleUUID();
        PaymentRecord record = new PaymentRecord();
        record.setOrderId(order.getId());
        record.setUserId(order.getUserId());
        record.setAmount(amount.negate()); // 负数表示退款
        record.setPaymentMethod(paymentMethod);
        record.setProvider(lastPayment != null ? lastPayment.getProvider() : null);
        record.setTransactionId(transactionId);
        record.setCheckoutSessionId(lastPayment != null ? lastPayment.getCheckoutSessionId() : null);
        record.setPaymentIntentId(lastPayment != null ? lastPayment.getPaymentIntentId() : null);
        record.setStatus(3); // 3: 已退款
        record.setProviderStatus("refunded");
        record.setCurrency(lastPayment != null ? lastPayment.getCurrency() : "cny");
        paymentRecordService.save(record);

        return true;
    }

    @Override
    public BigDecimal calculateFreight(OrderCreateFromCartDTO createDTO, Long userId) {
        log.info("Starting freight calculation for user: {}, cartItems: {}", userId, createDTO.getCartItemIds());
        
        // 1. 获取购物车项
        List<CartItem> cartItems = cartService.listByIds(createDTO.getCartItemIds());
        if (cartItems == null || cartItems.isEmpty()) {
            log.warn("No cart items found for freight calculation");
            return BigDecimal.ZERO;
        }
        
        BigDecimal totalFreight = BigDecimal.ZERO;
        
        // 2. 遍历计算每个商品的运费
        for (CartItem cartItem : cartItems) {
            Medicine medicine = medicineService.getById(cartItem.getMedicineId());
            if (medicine != null && medicine.getSellerId() != null) {
                log.info("Checking freight for medicine: {}, sellerId: {}", medicine.getId(), medicine.getSellerId());
                Merchant merchant = merchantMapper.selectOne(new LambdaQueryWrapper<Merchant>()
                        .eq(Merchant::getUserId, medicine.getSellerId()));
                
                if (merchant != null) {
                    log.info("Found merchant: {}, deliveryFee: {}", merchant.getShopName(), merchant.getDeliveryFee());
                    if (merchant.getDeliveryFee() != null) {
                        totalFreight = totalFreight.add(merchant.getDeliveryFee());
                    }
                } else {
                    log.warn("Merchant not found for sellerId: {}", medicine.getSellerId());
                }
            } else {
                log.info("Medicine or sellerId is null for cartItem: {}", cartItem.getId());
            }
        }
        log.info("Total freight calculated: {}", totalFreight);
        return totalFreight;
    }

    @Override
    public List<ProductSalesDTO> getTopSellingProducts(int limit) {
        return orderItemMapper.selectTopProducts(limit);
    }

    /**
     * 填充订单项信息到 Order 实体中 (Hack for compatibility)
     */
    private void fillOrderItems(List<Order> orders) {
        if (orders == null || orders.isEmpty()) return;
        
        List<Long> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());
        List<OrderItem> items = orderItemMapper.selectList(new LambdaQueryWrapper<OrderItem>().in(OrderItem::getOrderId, orderIds));
        Map<Long, List<OrderItem>> itemMap = items.stream().collect(Collectors.groupingBy(OrderItem::getOrderId));
        
        // Collect all medicine IDs to fetch images
        List<Long> medicineIds = items.stream().map(OrderItem::getMedicineId).distinct().collect(Collectors.toList());
        Map<Long, String> medicineImageMap = new java.util.HashMap<>();
        if (!medicineIds.isEmpty()) {
             List<Medicine> medicines = medicineService.listByIds(medicineIds);
             if (medicines != null) {
                 medicineImageMap = medicines.stream().collect(Collectors.toMap(Medicine::getId, Medicine::getMainImage));
             }
        }
        
        for (Order order : orders) {
            List<OrderItem> orderItems = itemMap.get(order.getId());
            if (orderItems != null && !orderItems.isEmpty()) {
                // Populate images for all items
                for (OrderItem it : orderItems) {
                    if (it.getMedicineImage() == null || it.getMedicineImage().isEmpty()) {
                        it.setMedicineImage(medicineImageMap.get(it.getMedicineId()));
                    }
                }
                
                order.setItems(orderItems);
                
                // For backward compatibility
                OrderItem item = orderItems.get(0);
                order.setMedicineId(item.getMedicineId());
                order.setMedicineName(item.getMedicineName());
                // Try to get image from item first (if exists), then fallback to medicine service
                String image = item.getMedicineImage();
                if (image == null || image.isEmpty()) {
                    image = medicineImageMap.get(item.getMedicineId());
                }
                order.setMedicineImage(image);
                order.setPrice(item.getMedicinePrice());
                order.setQuantity(item.getCount());
            }
        }
    }

    private boolean markOrderPaidInternal(
            Order order,
            Integer paymentMethod,
            String transactionId,
            String provider,
            String currency,
            String checkoutSessionId,
            String paymentIntentId,
            String providerStatus,
            boolean allowAlreadyPaid
    ) {
        if (order.getStatus() != ORDER_STATUS_PENDING_PAYMENT) {
            if (allowAlreadyPaid && order.getStatus() == ORDER_STATUS_PENDING_SHIPMENT) {
                return true;
            }
            if (order.getStatus() == ORDER_STATUS_PENDING_SHIPMENT) {
                return true;
            }
            throw new RuntimeException("订单状态异常，无法支付");
        }

        LocalDateTime payTime = LocalDateTime.now();
        // 只有在订单仍是待支付时才允许落真实支付结果，避免重复回调或超时任务把状态打乱。
        boolean success = this.lambdaUpdate()
                .eq(Order::getId, order.getId())
                .eq(Order::getStatus, ORDER_STATUS_PENDING_PAYMENT)
                .set(Order::getStatus, ORDER_STATUS_PENDING_SHIPMENT)
                .set(Order::getPayTime, payTime)
                .set(Order::getPayExpireTime, null)
                .update();
        if (!success) {
            Order latestOrder = this.getById(order.getId());
            if (latestOrder != null && latestOrder.getStatus() == ORDER_STATUS_PENDING_SHIPMENT) {
                return true;
            }
            throw new RuntimeException("更新订单支付状态失败，订单可能已被取消或已过期");
        }

        order.setStatus(ORDER_STATUS_PENDING_SHIPMENT);
        order.setPayTime(payTime);
        order.setPayExpireTime(null);
        paymentRecordService.createRecord(
                order,
                paymentMethod,
                transactionId,
                provider,
                currency,
                checkoutSessionId,
                paymentIntentId,
                providerStatus
        );
        increaseSalesAndNotify(order);
        return true;
    }

    private LocalDateTime buildPayExpireTime() {
        return LocalDateTime.now().plusMinutes(PAYMENT_TIMEOUT_MINUTES);
    }

    private boolean tryTransitionPendingOrderToCanceled(Long orderId) {
        return this.lambdaUpdate()
                .eq(Order::getId, orderId)
                .eq(Order::getStatus, ORDER_STATUS_PENDING_PAYMENT)
                .set(Order::getStatus, ORDER_STATUS_CANCELED)
                .set(Order::getPayExpireTime, null)
                .update();
    }

    private void restoreOrderStock(Order order) {
        // 库存回补必须在抢到状态更新之后执行，避免支付成功和取消同时发生时回补两次。
        fillOrderItems(List.of(order));
        if (order.getItems() == null) {
            return;
        }
        for (OrderItem item : order.getItems()) {
            medicineService.restoreStock(item.getMedicineId(), item.getCount());
        }
    }

    private void closePendingPaymentBatches(List<Long> orderIds, Integer batchStatus, String providerStatus, String remark) {
        if (orderIds == null || orderIds.isEmpty()) {
            return;
        }

        Set<Long> targetOrderIds = new HashSet<>(orderIds);
        List<PaymentBatch> pendingBatches = paymentBatchService.lambdaQuery()
                .eq(PaymentBatch::getStatus, PAYMENT_BATCH_STATUS_PENDING)
                .list();
        for (PaymentBatch batch : pendingBatches) {
            List<Long> batchOrderIds = parseBatchOrderIds(batch.getOrderIdsJson());
            boolean containsTargetOrder = batchOrderIds.stream().anyMatch(targetOrderIds::contains);
            if (!containsTargetOrder) {
                continue;
            }

            // 一个 Stripe checkout session 对应一整个支付批次，只要其中任一订单被取消/过期，就把整批关闭。
            batch.setStatus(batchStatus);
            batch.setProviderStatus(providerStatus);
            batch.setRemark(remark);
            paymentBatchService.updateById(batch);
        }
    }

    private List<Long> parseBatchOrderIds(String orderIdsJson) {
        try {
            return objectMapper.readValue(orderIdsJson, new TypeReference<List<Long>>() {
            });
        } catch (JsonProcessingException e) {
            throw new RuntimeException("解析支付批次订单列表失败");
        }
    }

    private void increaseSalesAndNotify(Order order) {
        // 支付成功后统一在这里补销量和站内通知，避免 mock 支付和 Stripe 支付各写一套。
        List<OrderItem> orderItems = orderItemMapper.selectList(new LambdaQueryWrapper<OrderItem>()
                .eq(OrderItem::getOrderId, order.getId()));
        for (OrderItem item : orderItems) {
            medicineService.update().setSql("sales = sales + " + item.getCount())
                    .eq("id", item.getMedicineId())
                    .update();
        }

        eventPublisher.publishEvent(new NotificationEvent(
                order.getUserId(),
                "您的订单 " + order.getOrderNo() + " 支付成功",
                "ORDER_PAID",
                order.getId()
        ));
    }

    private LocalDateTime parseDateTimeOrNull(String value) {
        if (!StringUtils.hasText(value)) return null;
        String v = value.trim();
        DateTimeFormatter[] fmts = new DateTimeFormatter[] {
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd")
        };
        for (DateTimeFormatter fmt : fmts) {
            try {
                if ("yyyy-MM-dd".equals(fmt.toString())) {
                    return LocalDate.parse(v, fmt).atStartOfDay();
                }
                return LocalDateTime.parse(v, fmt);
            } catch (DateTimeParseException ignored) {
            }
        }
        try {
            return LocalDateTime.parse(v);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    @Override
    /**
     * 获取管理员仪表盘统计数据
     *
     * @return 统计数据
     */
    public DashboardDataVO getAdminStatistics() {
        DashboardDataVO data = new DashboardDataVO();

        // 1. Total Orders
        data.setTotalOrders(this.count());

        // 2. Total Sales (Paid orders: status >= 1)
        List<Order> paidOrders = this.lambdaQuery()
                .ge(Order::getStatus, 1)
                .list();
        BigDecimal totalSales = paidOrders.stream()
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTotalSales(totalSales);

        // 3. Today's Data
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        
        List<Order> todayOrders = this.lambdaQuery()
                .ge(Order::getCreateTime, startOfDay)
                .lt(Order::getCreateTime, endOfDay)
                .list();
        
        data.setTodayOrders((long) todayOrders.size());
        
        BigDecimal todaySales = todayOrders.stream()
                .filter(o -> o.getStatus() >= 1)
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTodaySales(todaySales);

        // 4. Total Users
        try {
             data.setTotalUsers(userService.count());
        } catch (Exception e) {
            log.error("Failed to get user count", e);
            data.setTotalUsers(0L);
        }

        // Total Products (for admin)
        data.setProductCount(medicineService.count());

        // To-Do Counts
        data.setPendingAudit(this.lambdaQuery().eq(Order::getStatus, 7).count());
        data.setPendingRefund(this.lambdaQuery().eq(Order::getStatus, 4).count());

        // 5. Order Trend & Sales Trend
        List<ChartDataVO> orderTrend = new ArrayList<>();
        List<ChartDataVO> salesTrend = new ArrayList<>();
        LocalDate startDate = today.minusDays(6);
        
        List<Order> last7DaysOrders = this.lambdaQuery()
                .ge(Order::getCreateTime, startDate.atStartOfDay())
                .list();
        
        Map<String, List<Order>> dateOrderMap = last7DaysOrders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                ));

        for (int i = 0; i < 7; i++) {
            LocalDate date = startDate.plusDays(i);
            String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            List<Order> dayOrders = dateOrderMap.getOrDefault(dateStr, new ArrayList<>());
            
            orderTrend.add(new ChartDataVO(dateStr, (long) dayOrders.size()));
            
            BigDecimal sales = dayOrders.stream()
                    .filter(o -> o.getStatus() >= 1)
                    .map(Order::getPayAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            salesTrend.add(new ChartDataVO(dateStr, sales));
        }
        data.setOrderTrend(orderTrend);
        data.setSalesTrend(salesTrend);

        // 6. Status Distribution
        Map<Integer, Long> statusMap = this.list().stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        
        List<ChartDataVO> distribution = new ArrayList<>();
        statusMap.forEach((status, count) -> {
            String name = getStatusName(status);
            distribution.add(new ChartDataVO(name, count));
        });
        data.setStatusDistribution(distribution);
        
        return data;
    }

    @Override
    public DashboardDataVO getMerchantStatistics(Long sellerId) {
        DashboardDataVO data = new DashboardDataVO();
        
        List<Order> sellerOrders = this.lambdaQuery()
                .eq(Order::getSellerId, sellerId)
                .list();
        
        // 1. Total Orders
        data.setTotalOrders((long) sellerOrders.size());
        
        // 2. Total Sales
        BigDecimal totalSales = sellerOrders.stream()
                .filter(o -> o.getStatus() >= 1)
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTotalSales(totalSales);
        
        // 3. Today's Data
        LocalDate today = LocalDate.now();
        List<Order> todayOrders = sellerOrders.stream()
                .filter(o -> o.getCreateTime().toLocalDate().equals(today))
                .collect(Collectors.toList());
        
        data.setTodayOrders((long) todayOrders.size());
        BigDecimal todaySales = todayOrders.stream()
                .filter(o -> o.getStatus() >= 1)
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTodaySales(todaySales);
        
        // Total Products
        data.setProductCount(medicineService.lambdaQuery().eq(Medicine::getSellerId, sellerId).count());

        // To-Do Counts
        data.setPendingPayment(sellerOrders.stream().filter(o -> o.getStatus() == 0).count());
        data.setPendingShipment(sellerOrders.stream().filter(o -> o.getStatus() == 1).count());
        data.setPendingAudit(sellerOrders.stream().filter(o -> o.getStatus() == 7).count());
        data.setPendingRefund(sellerOrders.stream().filter(o -> o.getStatus() == 4).count());

        // 4. Trend
        List<ChartDataVO> orderTrend = new ArrayList<>();
        List<ChartDataVO> salesTrend = new ArrayList<>();
        LocalDate startDate = today.minusDays(6);
        
        Map<String, List<Order>> trendMap = sellerOrders.stream()
                .filter(o -> !o.getCreateTime().toLocalDate().isBefore(startDate))
                .collect(Collectors.groupingBy(
                        o -> o.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                ));
        
        for (int i = 0; i < 7; i++) {
            LocalDate date = startDate.plusDays(i);
            String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            List<Order> dayOrders = trendMap.getOrDefault(dateStr, new ArrayList<>());
            
            orderTrend.add(new ChartDataVO(dateStr, (long) dayOrders.size()));
            
            BigDecimal sales = dayOrders.stream()
                    .filter(o -> o.getStatus() >= 1)
                    .map(Order::getPayAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            salesTrend.add(new ChartDataVO(dateStr, sales));
        }
        data.setOrderTrend(orderTrend);
        data.setSalesTrend(salesTrend);
        
        return data;
    }

    private String getStatusName(Integer status) {
        switch (status) {
            case 0: return "待支付";
            case 1: return "待发货";
            case 2: return "待收货";
            case 3: return "已完成";
            case 4: return "售后中";
            case 5: return "已退款";
            case 6: return "已取消";
            case -1: return "已取消";
            default: return "未知";
        }
    }
}
