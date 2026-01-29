package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.UserAddressService;
import com.zhijian.pojo.user.entity.UserAddress;
import com.zhijian.mapper.UserAddressMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户收货地址服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class UserAddressServiceImpl extends ServiceImpl<UserAddressMapper, UserAddress> implements UserAddressService {

    @Override
    public List<UserAddress> myList(Long userId) {
        return this.list(new LambdaQueryWrapper<UserAddress>()
                .eq(UserAddress::getUserId, userId)
                .orderByDesc(UserAddress::getIsDefault)
                .orderByDesc(UserAddress::getCreateTime));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean addAddress(UserAddress address) {
        // 如果是第一个地址，默认设为默认地址
        long count = this.count(new LambdaQueryWrapper<UserAddress>().eq(UserAddress::getUserId, address.getUserId()));
        if (count == 0) {
            address.setIsDefault(1);
        } else if (address.getIsDefault() != null && address.getIsDefault() == 1) {
            // 如果新加的是默认地址，取消其他默认
            this.update(new LambdaUpdateWrapper<UserAddress>()
                    .eq(UserAddress::getUserId, address.getUserId())
                    .set(UserAddress::getIsDefault, 0));
        }
        return this.save(address);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateAddress(UserAddress address) {
        if (address.getIsDefault() != null && address.getIsDefault() == 1) {
            // 如果修改为默认地址，取消其他默认
            this.update(new LambdaUpdateWrapper<UserAddress>()
                    .eq(UserAddress::getUserId, address.getUserId())
                    .set(UserAddress::getIsDefault, 0));
        }
        return this.updateById(address);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean setDefault(Long id, Long userId) {
        // 1. 校验地址存在且属于该用户
        UserAddress address = this.getById(id);
        if (address == null || !address.getUserId().equals(userId)) {
            throw new RuntimeException("地址不存在或无权操作");
        }

        // 2. 取消该用户所有默认地址
        this.update(new LambdaUpdateWrapper<UserAddress>()
                .eq(UserAddress::getUserId, userId)
                .set(UserAddress::getIsDefault, 0));

        // 3. 设置当前地址为默认
        address.setIsDefault(1);
        return this.updateById(address);
    }
}

