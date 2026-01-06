package com.zhijian.application.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.interfaces.dto.aftersales.RefundApplyDTO;
import com.zhijian.interfaces.dto.aftersales.RefundAuditDTO;
import com.zhijian.domain.aftersales.entity.RefundApply;

import com.baomidou.mybatisplus.core.metadata.IPage;

public interface RefundService extends IService<RefundApply> {
    /**
     * 申请退款
     */
    boolean applyRefund(RefundApplyDTO applyDTO);

    /**
     * 审核退款
     */
    boolean auditRefund(RefundAuditDTO auditDTO);

    /**
     * 分页查询售后申请（包含关联信息）
     */
    IPage<RefundApply> pageWithDetail(IPage<RefundApply> page, Integer status);
}
