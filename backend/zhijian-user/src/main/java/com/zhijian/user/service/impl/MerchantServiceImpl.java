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

@Service
@RequiredArgsConstructor
public class MerchantServiceImpl extends ServiceImpl<MerchantMapper, Merchant> implements MerchantService {

    private final SysUserMapper userMapper;

    @Override
    public IPage<Merchant> pageList(MerchantQueryDTO query) {
        // 管理端按店铺名和审核状态分页查询商家。
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
        // 入驻和资料补交共用同一个入口。
        Merchant merchant = getByUserId(userId);
        boolean isUpdate = merchant != null;

        if (merchant == null) {
            merchant = new Merchant();
            merchant.setUserId(userId);
            merchant.setAuditStatus(0);
        } else {
            // 已审核过的店铺重新提交后重新进入待审核状态。
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
        // 审核会同步更新商家记录，并在通过时恢复用户账号状态。
        Merchant merchant = this.getById(auditDTO.getId());
        if (merchant == null) {
            return Result.failed("商家不存在");
        }

        merchant.setAuditStatus(auditDTO.getAuditStatus());
        merchant.setAuditRemark(auditDTO.getAuditRemark());
        this.updateById(merchant);

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
        // 商家运营设置直接落到商家资料表中。
        Merchant merchant = getByUserId(userId);
        if (merchant == null) {
            return Result.failed("商家不存在");
        }
        
        BeanUtils.copyProperties(settingDTO, merchant);
        this.updateById(merchant);
        
        return Result.success(null, "设置已更新");
    }
}
