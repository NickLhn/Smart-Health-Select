package com.zhijian.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.dto.delivery.DeliveryCreateDTO;
import com.zhijian.pojo.delivery.entity.Delivery;

/**
 * 配送服务接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface DeliveryService extends IService<Delivery> {

    /**
     * 创建配送单 (商家发货时调用)
     * @param createDTO 创建参数
     * @return 配送单ID
     */
    Long createDelivery(DeliveryCreateDTO createDTO);

    /**
     * 骑手接单
     * @param deliveryId 配送单ID
     * @param courierId 骑手ID
     * @return 成功/失败
     */
    boolean acceptDelivery(Long deliveryId, Long courierId);

    /**
     * 确认送达 (骑手)
     * @param deliveryId 配送单ID
     * @param courierId 骑手ID
     * @param proofImage 送达凭证URL (可选)
     * @param verifyCode 签收验证码 (必填)
     * @return 成功/失败
     */
    boolean completeDelivery(Long deliveryId, Long courierId, String proofImage, String verifyCode);

    /**
     * 异常上报 (骑手)
     * @param deliveryId 配送单ID
     * @param courierId 骑手ID
     * @param reason 异常原因
     * @return 成功/失败
     */
    boolean reportException(Long deliveryId, Long courierId, String reason);

    /**
     * 获取骑手统计数据
     * @param courierId 骑手ID
     * @return 统计Map
     */
    java.util.Map<String, Object> getRiderStats(Long courierId);

    /**
     * 查询可接单列表 (骑手)
     * @param page 页码
     * @param size 每页数量
     * @return 分页结果
     */
    IPage<Delivery> listPendingDeliveries(int page, int size);

    /**
     * 查询我的配送单 (骑手)
     * @param courierId 骑手ID
     * @param status 状态 (可选)
     * @param page 页码
     * @param size 每页数量
     * @return 分页结果
     */
    IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size);
}

