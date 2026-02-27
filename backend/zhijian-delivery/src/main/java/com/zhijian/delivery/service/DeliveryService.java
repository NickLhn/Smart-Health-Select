package com.zhijian.delivery.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.delivery.dto.DeliveryCreateDTO;
import com.zhijian.delivery.pojo.Delivery;

import java.util.Map;

public interface DeliveryService extends IService<Delivery> {
    Long createDelivery(DeliveryCreateDTO createDTO);

    boolean acceptDelivery(Long deliveryId, Long courierId);

    boolean completeDelivery(Long deliveryId, Long courierId, String proofImage, String verifyCode);

    boolean reportException(Long deliveryId, Long courierId, String reason);

    Map<String, Object> getRiderStats(Long courierId);

    IPage<Delivery> listPendingDeliveries(int page, int size);

    IPage<Delivery> listMyDeliveries(Long courierId, Integer status, int page, int size);
}
