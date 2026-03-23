package com.zhijian.user.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.Merchant;
import com.zhijian.dto.merchant.MerchantApplyDTO;
import com.zhijian.dto.merchant.MerchantAuditDTO;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.dto.merchant.MerchantQueryDTO;

/**
 * 商家服务接口
 */
public interface MerchantService extends IService<Merchant> {

    /**
     * 分页查询商家
     *
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<Merchant> pageList(MerchantQueryDTO query);

    /**
     * 获取当前登录用户的商家信息
     *
     * @param userId 用户ID
     * @return 商家信息
     */
    Merchant getByUserId(Long userId);

    /**
     * 商家入驻申请/更新
     *
     * @param userId   用户ID
     * @param applyDTO 申请信息
     * @return 结果
     */
    Result apply(Long userId, MerchantApplyDTO applyDTO);

    /**
     * 商家审核
     *
     * @param auditDTO 审核信息
     * @return 结果
     */
    Result audit(MerchantAuditDTO auditDTO);

    /**
     * 更新商家运营设置
     *
     * @param userId 用户ID
     * @param settingDTO 设置信息
     * @return 结果
     */
    Result updateSettings(Long userId, com.zhijian.dto.merchant.MerchantSettingDTO settingDTO);
}

