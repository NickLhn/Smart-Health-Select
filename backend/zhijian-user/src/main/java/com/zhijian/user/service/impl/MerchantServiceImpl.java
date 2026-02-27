package com.zhijian.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.user.service.MerchantService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.Merchant;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.user.mapper.MerchantMapper;
import com.zhijian.user.mapper.SysUserMapper;
import com.zhijian.dto.merchant.MerchantApplyDTO;
import com.zhijian.dto.merchant.MerchantAuditDTO;
import com.zhijian.dto.merchant.MerchantQueryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 商家服务实现类
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
public class MerchantServiceImpl extends ServiceImpl<MerchantMapper, Merchant> implements MerchantService {

    private final SysUserMapper userMapper;

    @Override
    public IPage<Merchant> pageList(MerchantQueryDTO query) {
        Page<Merchant> page = new Page<>(query.getPage(), query.getSize());
        LambdaQueryWrapper<Merchant> wrapper = new LambdaQueryWrapper<>();
        
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.like(Merchant::getShopName, query.getKeyword());
        }
        if (query.getAuditStatus() != null) {
            wrapper.eq(Merchant::getAuditStatus, query.getAuditStatus());
        }
        
        wrapper.orderByDesc(Merchant::getCreateTime);
        return this.page(page, wrapper);
    }

    @Override
    public Merchant getByUserId(Long userId) {
        return this.getOne(new LambdaQueryWrapper<Merchant>().eq(Merchant::getUserId, userId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result apply(Long userId, MerchantApplyDTO applyDTO) {
        Merchant merchant = getByUserId(userId);
        boolean isUpdate = merchant != null;

        if (merchant == null) {
            merchant = new Merchant();
            merchant.setUserId(userId);
            merchant.setAuditStatus(0); // 默认为待审核
        } else {
            // 如果是已通过状态，重新提交后变为待审核
            if (merchant.getAuditStatus() == 1 || merchant.getAuditStatus() == 2) {
                merchant.setAuditStatus(0);
            }
        }

        BeanUtils.copyProperties(applyDTO, merchant);
        
        if (isUpdate) {
            this.updateById(merchant);
        } else {
            this.save(merchant);
        }

        return Result.success(merchant, "提交成功，请等待审核");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result audit(MerchantAuditDTO auditDTO) {
        Merchant merchant = this.getById(auditDTO.getId());
        if (merchant == null) {
            return Result.failed("商家不存在");
        }

        merchant.setAuditStatus(auditDTO.getAuditStatus());
        merchant.setAuditRemark(auditDTO.getAuditRemark());
        this.updateById(merchant);

        // 如果审核通过，确保用户状态为正常
        if (auditDTO.getAuditStatus() == 1) {
            SysUser user = userMapper.selectById(merchant.getUserId());
            if (user != null && user.getStatus() == 0) {
                user.setStatus(1);
                userMapper.updateById(user);
            }
        }

        return Result.success(null, "审核完成");
    }

    @Override
    public Result updateSettings(Long userId, com.zhijian.dto.merchant.MerchantSettingDTO settingDTO) {
        Merchant merchant = getByUserId(userId);
        if (merchant == null) {
            return Result.failed("商家不存在");
        }
        
        BeanUtils.copyProperties(settingDTO, merchant);
        this.updateById(merchant);
        
        return Result.success(null, "设置已更新");
    }
}

