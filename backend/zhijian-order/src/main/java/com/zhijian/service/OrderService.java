package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.dto.order.OrderCreateDTO;
import com.zhijian.dto.order.OrderCreateFromCartDTO;
import com.zhijian.dto.order.OrderQueryDTO;
import com.zhijian.dto.order.ProductSalesDTO;
import com.zhijian.dto.statistics.DashboardDataVO;
import com.zhijian.pojo.Order;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单服务接口。
 */
public interface OrderService extends IService<Order> {

    /**
     * 创建订单。
     */
    Result createOrder(OrderCreateDTO createDTO, Long userId);

    /**
     * 从购物车创建订单。
     */
    Result<List<Long>> createOrderFromCart(OrderCreateFromCartDTO createDTO, Long userId);

    /**
     * 计算运费。
     */
    BigDecimal calculateFreight(OrderCreateFromCartDTO createDTO, Long userId);

    /**
     * 检查并取消超时订单。
     */
    void checkAndCancelTimeoutOrders();

    /**
     * 分页查询用户订单列表。
     */
    IPage<Order> pageList(OrderQueryDTO queryDTO, Long userId);

    /**
     * 分页查询商家订单列表。
     */
    IPage<Order> pageListSeller(OrderQueryDTO queryDTO, Long sellerId);

    /**
     * 获取订单详情。
     */
    Order getDetail(Long id, Long userId);

    /**
     * 支付订单。
     */
    boolean payOrder(Long id, Long userId);

    /**
     * 订单退款。
     */
    boolean refundOrder(Long orderId, BigDecimal amount, String reason);

    /**
     * 评价订单。
     */
    boolean commentOrder(Long orderId, Integer star, String content, String images, Long userId);

    /**
     * 获取热销商品。
     */
    List<ProductSalesDTO> getTopSellingProducts(int limit);

    /**
     * 商家发货。
     */
    boolean shipOrder(Long id, Long sellerId);

    /**
     * 确认收货。
     */
    boolean receiveOrder(Long id, Long userId);

    /**
     * 审核订单。
     */
    boolean auditOrder(Long orderId, boolean pass, String reason);

    /**
     * 取消订单。
     */
    boolean cancelOrder(Long orderId);

    /**
     * 申请退款。
     */
    boolean applyRefund(Long orderId, String reason);

    /**
     * 处理退款。
     */
    boolean processRefund(Long orderId, boolean agree, String remark);

    /**
     * 分页查询待审核订单。
     */
    IPage<Order> pageAuditList(OrderQueryDTO queryDTO);

    /**
     * 分页查询管理端订单列表。
     */
    IPage<Order> pageListAdmin(OrderQueryDTO queryDTO);

    /**
     * 获取管理端统计数据。
     */
    DashboardDataVO getAdminStatistics();

    /**
     * 获取商家端统计数据。
     */
    DashboardDataVO getMerchantStatistics(Long sellerId);
}
