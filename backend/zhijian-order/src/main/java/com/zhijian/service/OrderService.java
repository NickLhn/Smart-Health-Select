package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.Order;
import com.zhijian.dto.order.OrderCreateDTO;
import com.zhijian.dto.order.OrderCreateFromCartDTO;
import com.zhijian.dto.order.OrderQueryDTO;
import com.zhijian.dto.order.ProductSalesDTO;
import com.zhijian.dto.statistics.DashboardDataVO;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface OrderService extends IService<Order> {

    /**
     * 创建订单
     * @param createDTO 创建参数
     * @param userId 用户ID
     * @return 订单ID
     */
    Result createOrder(OrderCreateDTO createDTO, Long userId);

    /**
     * 从购物车创建订单
     * @param createDTO 创建参数
     * @param userId 用户ID
     * @return 订单ID列表
     */
    Result<List<Long>> createOrderFromCart(OrderCreateFromCartDTO createDTO, Long userId);

    /**
     * 计算运费
     * @param createDTO 创建参数
     * @param userId 用户ID
     * @return 运费金额
     */
    BigDecimal calculateFreight(OrderCreateFromCartDTO createDTO, Long userId);

    /**
     * 检查并取消超时订单
     */
    void checkAndCancelTimeoutOrders();

    /**
     * 分页查询订单列表 (用户端)
     *
     * @param queryDTO 查询参数
     * @param userId   用户ID
     * @return 分页结果
     */
    IPage<Order> pageList(OrderQueryDTO queryDTO, Long userId);

    /**
     * 分页查询订单列表 (商家端)
     *
     * @param queryDTO 查询参数
     * @param sellerId 商家ID
     * @return 分页结果
     */
    IPage<Order> pageListSeller(OrderQueryDTO queryDTO, Long sellerId);

    /**
     * 获取订单详情
     * @param id 订单ID
     * @param userId 用户ID
     * @return 订单详情
     */
    Order getDetail(Long id, Long userId);

    /**
     * 支付订单 (模拟)
     * @param id 订单ID
     * @param userId 用户ID
     * @return 是否成功
     */
    boolean payOrder(Long id, Long userId);

    /**
     * 订单退款
     * @param orderId 订单ID
     * @param amount 退款金额
     * @param reason 退款原因
     * @return 是否成功
     */
    boolean refundOrder(Long orderId, BigDecimal amount, String reason);

    /**
     * 评价订单
     * @param orderId 订单ID
     * @param star 评分
     * @param content 内容
     * @param images 图片
     * @param userId 用户ID
     * @return 是否成功
     */
    boolean commentOrder(Long orderId, Integer star, String content, String images, Long userId);

    /**
     * 获取热销商品
     * @param limit 数量限制
     * @return 热销商品列表
     */
    List<ProductSalesDTO> getTopSellingProducts(int limit);

    /**
     * 发货 (商家)
     * @param id 订单ID
     * @param sellerId 商家ID
     * @return 是否成功
     */
    boolean shipOrder(Long id, Long sellerId);

    /**
     * 确认收货 (用户)
     * @param id 订单ID
     * @param userId 用户ID
     * @return 是否成功
     */
    boolean receiveOrder(Long id, Long userId);

    /**
     * 审核订单 (药师)
     * @param orderId 订单ID
     * @param pass 是否通过
     * @param reason 审核意见
     * @return 是否成功
     */
    boolean auditOrder(Long orderId, boolean pass, String reason);

    /**
     * 取消订单 (用户)
     * @param orderId 订单ID
     * @return 是否成功
     */
    boolean cancelOrder(Long orderId);

    /**
     * 申请退款 (用户)
     * @param orderId 订单ID
     * @param reason 原因
     * @return 是否成功
     */
    boolean applyRefund(Long orderId, String reason);

    /**
     * 处理退款 (商家)
     * @param orderId 订单ID
     * @param agree 是否同意
     * @param remark 备注
     * @return 是否成功
     */
    boolean processRefund(Long orderId, boolean agree, String remark);

    /**
     * 分页查询审核订单 (药师)
     * @param queryDTO 查询参数
     * @return 订单分页列表
     */
    IPage<Order> pageAuditList(OrderQueryDTO queryDTO);

    /**
     * 分页查询所有订单 (管理员)
     * @param queryDTO 查询参数
     * @return 订单分页列表
     */
    IPage<Order> pageListAdmin(OrderQueryDTO queryDTO);

    /**
     * 获取平台管理端统计数据
     * @return 统计数据
     */
    DashboardDataVO getAdminStatistics();

    /**
     * 获取商家端统计数据
     * @param sellerId 商家ID
     * @return 统计数据
     */
    DashboardDataVO getMerchantStatistics(Long sellerId);
}

