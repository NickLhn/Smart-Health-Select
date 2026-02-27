package com.zhijian.aftersales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.aftersales.dto.RefundApplyDTO;
import com.zhijian.aftersales.dto.RefundAuditDTO;
import com.zhijian.aftersales.pojo.RefundApply;

public interface RefundService extends IService<RefundApply> {
    boolean applyRefund(RefundApplyDTO applyDTO);

    boolean auditRefund(RefundAuditDTO auditDTO);

    IPage<RefundApply> pageWithDetail(IPage<RefundApply> page, Integer status);
}
