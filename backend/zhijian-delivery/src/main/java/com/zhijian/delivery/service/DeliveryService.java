package com.zhijian.delivery.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.delivery.dto.DeliveryCreateDTO;
import com.zhijian.delivery.pojo.Delivery;

import java.util.Map;

/**
 * 配送服务接口。
 */
public interface DeliveryService extends IService<Delivery> {

    /**
     * 创建配送单。
     *
     * @param createDTO 创建参数
     * @return 配送单 ID
     */
    Long createDelivery(DeliveryCreateDTO createDTO);

    /**
     * 骑手接单。
     *
     * @param deliveryId 配送单 ID
     * @param courierId 骑手 ID
     * @return 接单结果
     */
    boolean acceptDelivery(Long deliveryId, Long courierId);

    /**
     * 完成配送。
     *
     * @param deliveryId 配送单 ID
     * @param courierId 骑手 ID
     * @param proofImage 配送凭证图片
     * @param verifyCode 核销码
     * @return 完成结果
     */
    boolean completeDelivery(Long deliveryId, Long courierId, String proofImage, String verifyCode);

    /**
     * 上报配送异常。
     *
     * @param deliveryId 配送单 ID
     * @param courierId 骑手 ID
     * @param reason 异常原因
     * @return 上报结果
     */
    boolean reportException(Long deliveryId, Long courierId, String reason);

    /**
     * 获取骑手统计数据。
     *
     * @param courierId 骑手 ID
     * @return 统计数据
     */
    Map<String, Object> getRiderStats(Long courierId);

    /**
     * 分页查询待接单列表。
     *
     * @param page 页码
     * @param size 每页条数
     * @return 配送单分页结果
     */
    IPage<Delivery> listPendingDeliveries(int page, int size);

    /**
     * 分页查询骑手自己的配送单。
     *
     * @param courierId 骑手 ID
     * @param status 配送状态
     * @param page 页码
     * @param size 每页条数
     * @return 配送单分页结果
     */
    IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size);
}
