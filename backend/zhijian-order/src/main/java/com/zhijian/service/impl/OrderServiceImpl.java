package com.zhijian.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.zhijian.user.mapper.MerchantMapper;
import com.zhijian.pojo.user.entity.Merchant;
import lombok.extern.slf4j.Slf4j;

/**
 * 订单服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {

    private final MedicineService medicineService;
    private final MedicineCommentService medicineCommentService;
    private final CartService cartService;
    private final UserAddressService userAddressService;
    private final PaymentRecordService paymentRecordService;
    private final UserCouponService userCouponService;
    private final OrderItemMapper orderItemMapper;
    private final DeliveryService deliveryService;
    private final UserService userService;
    private final ApplicationEventPublisher eventPublisher;
    private final MerchantMapper merchantMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelOrder(Long orderId) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        // 只能取消待支付订单
        if (order.getStatus() != 0) {
            throw new RuntimeException("当前状态无法取消订单");
        }
        
        order.setStatus(6); // 已取消
        boolean success = this.updateById(order);
        if (success) {
            // 恢复库存
            fillOrderItems(List.of(order));
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    medicineService.restoreStock(item.getMedicineId(), item.getCount());
                }
            }
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
        if (order.getStatus() != 1 && order.getStatus() != 2) {
            throw new RuntimeException("当前状态无法申请退款");
        }
        
        order.setStatus(4); // 售后中
        order.setRefundReason(reason);
        return this.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean processRefund(Long orderId, boolean agree, String remark) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (order.getStatus() != 4) {
            throw new RuntimeException("订单不是售后状态");
        }
        
        if (agree) {
            order.setStatus(5); // 已退款
            // 记录退款流水
            refundOrder(orderId, order.getPayAmount(), "商家同意退款");
        } else {
            // 拒绝退款，恢复原状态
            // 根据是否有发货时间判断
            if (order.getDeliveryTime() != null) {
                order.setStatus(2); // 待收货
            } else {
                order.setStatus(1); // 待发货
            }
        }
        order.setRefundRemark(remark);
        return this.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 创建订单
     *
     * @param createDTO 订单创建参数
     * @param userId    用户ID
     * @return 订单ID
     */
    public Result createOrder(OrderCreateDTO createDTO, Long userId) {
        // 1. 查询药品信息
        Medicine medicine = medicineService.getById(createDTO.getMedicineId());
        if (medicine == null) {
            return Result.failed("药品不存在");
        }

        // 2. 检查库存
        if (medicine.getStock() < createDTO.getQuantity()) {
            return Result.failed("库存不足");
        }

        // 3. 扣减库存
        boolean updateStock = medicineService.deductStock(medicine.getId(), createDTO.getQuantity());
        if (!updateStock) {
            return Result.failed("库存不足");
        }
        
        // 计算金额
        BigDecimal totalAmount = medicine.getPrice().multiply(BigDecimal.valueOf(createDTO.getQuantity()));
        
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
        BigDecimal payAmount = totalAmount.add(freight); // 初始应付 = 商品总额 + 运费

        // 优惠券逻辑
        if (createDTO.getUserCouponId() != null) {
            couponAmount = userCouponService.getCouponAmount(createDTO.getUserCouponId(), totalAmount);
            payAmount = payAmount.subtract(couponAmount);
            if (payAmount.compareTo(BigDecimal.ZERO) < 0) {
                payAmount = BigDecimal.ZERO;
            }
        }

        // 4. 创建订单
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
        order.setCouponHistoryId(createDTO.getUserCouponId());
        
        boolean isPrescription = Integer.valueOf(1).equals(medicine.getIsPrescription());
        if (isPrescription) {
            if (createDTO.getPatientId() == null) {
                return Result.failed("处方药必须选择就诊人");
            }
            if (createDTO.getPrescriptionImage() == null || createDTO.getPrescriptionImage().isEmpty()) {
                return Result.failed("处方药必须上传处方图片");
            }
            order.setAuditStatus(1); // 待审核
            order.setStatus(7);      // 待审核 (自定义状态7)
            order.setPatientId(createDTO.getPatientId());
            order.setPrescriptionImage(createDTO.getPrescriptionImage());
        } else {
            order.setAuditStatus(0); // 无需审核
            order.setStatus(0);      // 待支付
        }
        
        order.setReceiverName(createDTO.getReceiverName());
        order.setReceiverPhone(createDTO.getReceiverPhone());
        order.setReceiverAddress(createDTO.getReceiverAddress());
        order.setCommentStatus(0);

        this.save(order);

        // 5. 创建订单项
        OrderItem item = new OrderItem();
        item.setOrderId(order.getId());
        item.setMedicineId(medicine.getId());
        item.setMedicineName(medicine.getName());
        item.setMedicineImage(medicine.getMainImage());
        item.setMedicinePrice(medicine.getPrice());
        item.setCount(createDTO.getQuantity());
        item.setTotalPrice(medicine.getPrice().multiply(BigDecimal.valueOf(createDTO.getQuantity())));
        orderItemMapper.insert(item);
        
        // 6. 核销优惠券
        if (createDTO.getUserCouponId() != null) {
            userCouponService.useCoupon(createDTO.getUserCouponId(), order.getId());
        }

        return Result.success(order.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 从购物车创建订单
     *
     * @param createDTO 购物车订单创建参数
     * @param userId    用户ID
     * @return 订单ID列表
     */
    public Result<List<Long>> createOrderFromCart(OrderCreateFromCartDTO createDTO, Long userId) {
        log.info("createOrderFromCart called: userId={}, addressId={}, cartItemIds={}", userId, createDTO.getAddressId(), createDTO.getCartItemIds());
        
        // 1. 获取地址
        UserAddress address = userAddressService.getById(createDTO.getAddressId());
        log.info("Address found: {}", address);
        if (address == null || !address.getUserId().equals(userId)) {
            log.warn("Address validation failed: address={}, userId={}", address, userId);
            return Result.failed("收货地址不存在");
        }
        String fullAddress = address.getProvince() + address.getCity() + address.getRegion() + address.getDetailAddress();

        // 2. 获取购物车项
        List<CartItem> cartItems = cartService.listByIds(createDTO.getCartItemIds());
        log.info("Cart items found: {}", cartItems);
        if (cartItems == null || cartItems.isEmpty()) {
            log.warn("Cart items empty or null");
            return Result.failed("未选择商品");
        }

        // 3. 校验购物车项归属
        for (CartItem item : cartItems) {
            if (!item.getUserId().equals(userId)) {
                return Result.failed("包含无效的购物车商品");
            }
        }

        List<Long> orderIds = new ArrayList<>();

        // 4. 遍历创建订单 (拆单逻辑：目前简单按商品拆单，每个商品一个订单)
        // 注意：优惠券目前逻辑比较简单，如果是拆单，优惠券只能应用到其中一个订单，或者按比例分摊？
        // 简化逻辑：如果是购物车下单，暂不支持使用优惠券（或者只支持全场通用券且只应用到第一个订单，这比较复杂）。
        // 这里的实现：如果传入了优惠券，尝试应用到第一个金额足够的订单，或者抛出异常提示购物车下单暂不支持优惠券。
        // 为了更好的体验，我们假设 createOrderFromCart 目前不支持优惠券，或者简单地忽略优惠券参数。
        // 但既然 DTO 加了，我们就尝试实现：把优惠券应用到总金额最大的那个订单上。
        
        // 预计算所有订单金额
        // ... 比较复杂，暂时只处理单个订单逻辑，或者简单地：购物车下单暂不支持优惠券。
        // 修正：如果 cartItems 只有一个，其实等同于直接下单。
        // 既然是 MVP，我们先不支持购物车批量下单使用优惠券，或者只支持单品下单使用。
        // 但用户可能期望能用。
        // 策略：只允许在单个订单中使用优惠券。如果购物车拆成了多个订单，优惠券怎么算？
        // 简单策略：仅当拆单后只有一个订单时允许使用优惠券。否则报错或忽略。
        
        if (createDTO.getUserCouponId() != null && cartItems.size() > 1) {
            // 多商品拆单暂不支持优惠券
             return Result.failed("多商品合并下单暂不支持使用优惠券");
        }

        for (CartItem cartItem : cartItems) {
            // 查询药品
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
                order.setStatus(7);      // 待审核
                order.setPatientId(createDTO.getPatientId());
                order.setPrescriptionImage(createDTO.getPrescriptionImage());
            } else {
                order.setAuditStatus(0); // 无需审核
                order.setStatus(0);      // 待支付
            }
            
            order.setCommentStatus(0); // 未评价
            order.setReceiverName(address.getReceiverName());
            order.setReceiverPhone(address.getReceiverPhone());
            order.setReceiverAddress(fullAddress);

            this.save(order);
            orderIds.add(order.getId());

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
        wrapper.eq(queryDTO.getStatus() != null, Order::getStatus, queryDTO.getStatus())
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
        if (!order.getUserId().equals(userId)) {
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
        if (order.getStatus() != 0) {
            // 如果订单状态已经是已支付(1)，则直接返回成功
            if (order.getStatus() == 1) {
                return true;
            }
            throw new RuntimeException("订单状态异常，无法支付");
        }

        // 模拟支付成功
        order.setStatus(1);
        order.setPayTime(LocalDateTime.now());

        // 记录支付流水
        String transactionId = IdUtil.simpleUUID(); // 模拟流水号
        paymentRecordService.createRecord(order, 1, transactionId); // 默认支付宝(1)

        boolean success = this.updateById(order);
        if (success) {
            // 更新商品销量
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
        return success;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    /**
     * 检查并取消超时未支付订单
     */
    public void checkAndCancelTimeoutOrders() {
        // 1. 查询超时订单 (超过30分钟未支付)
        LocalDateTime timeout = LocalDateTime.now().minusMinutes(30);
        List<Order> orders = this.lambdaQuery()
                .eq(Order::getStatus, 0)
                .lt(Order::getCreateTime, timeout)
                .list();

        if (orders == null || orders.isEmpty()) {
            return;
        }

        // 填充订单项信息以便获取药品ID和数量
        fillOrderItems(orders);

        for (Order order : orders) {
            // 2. 恢复库存
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    medicineService.restoreStock(item.getMedicineId(), item.getCount());
                }
            }

            // 3. 更新订单状态为已取消
            order.setStatus(4); // 修正：订单取消状态应该是6(已关闭/已取消)，这里沿用之前的逻辑，假设4是已取消(之前注释写的是售后中，这里可能是个bug或者复用状态)
            // 根据 Order 实体定义： 0待支付 1待发货 2已发货 3已完成 4售后中 5已退款 6已取消 7待审核
            // 应该用 6
            order.setStatus(6);
            this.updateById(order);

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
            order.setStatus(0); // 变为待支付
        } else {
            order.setAuditStatus(3); // 审核拒绝
            order.setStatus(6); // 变为已取消 (6)
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
        record.setTransactionId(transactionId);
        record.setStatus(3); // 3: 已退款
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

