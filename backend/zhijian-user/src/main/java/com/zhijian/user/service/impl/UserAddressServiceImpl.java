package com.zhijian.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.user.service.UserAddressService;
import com.zhijian.pojo.user.entity.UserAddress;
import com.zhijian.user.mapper.UserAddressMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 收货地址服务实现类。
 */
@Service
public class UserAddressServiceImpl extends ServiceImpl<UserAddressMapper, UserAddress> implements UserAddressService {

    @Override
    public List<UserAddress> myList(Long userId) {
        // 默认地址排在最前面，便于前端直接默认选中。
        return this.list(new LambdaQueryWrapper<UserAddress>()
                .eq(UserAddress::getUserId, userId)
                .orderByDesc(UserAddress::getIsDefault)
                .orderByDesc(UserAddress::getCreateTime));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean addAddress(UserAddress address) {
        // 第一个地址自动设为默认地址。
        long count = this.count(new LambdaQueryWrapper<UserAddress>().eq(UserAddress::getUserId, address.getUserId()));
        if (count == 0) {
            address.setIsDefault(1);
        } else if (address.getIsDefault() != null && address.getIsDefault() == 1) {
            // 新增默认地址时，先把其他默认地址取消掉。
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
            // 修改为默认地址时，同样先清理其他默认标记。
            this.update(new LambdaUpdateWrapper<UserAddress>()
                    .eq(UserAddress::getUserId, address.getUserId())
                    .set(UserAddress::getIsDefault, 0));
        }
        return this.updateById(address);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean setDefault(Long id, Long userId) {
        // 先校验地址归属关系。
        UserAddress address = this.getById(id);
        if (address == null || !address.getUserId().equals(userId)) {
            throw new RuntimeException("地址不存在或无权操作");
        }

        // 取消该用户现有默认地址。
        this.update(new LambdaUpdateWrapper<UserAddress>()
                .eq(UserAddress::getUserId, userId)
                .set(UserAddress::getIsDefault, 0));

        // 再把当前地址设为默认。
        address.setIsDefault(1);
        return this.updateById(address);
    }
}
