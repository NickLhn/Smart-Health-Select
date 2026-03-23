package com.zhijian.aftersales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.aftersales.dto.RefundApplyDTO;
import com.zhijian.aftersales.dto.RefundAuditDTO;
import com.zhijian.aftersales.pojo.RefundApply;

/**
 * 退款申请服务接口。
 */
public interface RefundService extends IService<RefundApply> {

    /**
     * 提交退款申请。
     *
     * @param applyDTO 退款申请参数
     * @return 申请结果
     */
    boolean applyRefund(RefundApplyDTO applyDTO);

    /**
     * 审核退款申请。
     *
     * @param auditDTO 退款审核参数
     * @return 审核结果
     */
    boolean auditRefund(RefundAuditDTO auditDTO);

    /**
     * 分页查询退款申请详情。
     *
     * @param page 分页参数
     * @param status 申请状态
     * @return 退款申请分页结果
     */
    IPage<RefundApply> pageWithDetail(IPage<RefundApply> page, Integer status);
}
