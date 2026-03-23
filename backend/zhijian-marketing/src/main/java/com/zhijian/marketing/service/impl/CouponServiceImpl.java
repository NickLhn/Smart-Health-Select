package com.zhijian.marketing.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.CouponCreateDTO;
import com.zhijian.marketing.mapper.CouponMapper;
import com.zhijian.marketing.pojo.Coupon;
import com.zhijian.marketing.service.CouponService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 优惠券服务实现类。
 */
@Service
public class CouponServiceImpl extends ServiceImpl<CouponMapper, Coupon> implements CouponService {

    /**
     * 创建优惠券。
     *
     * @param createDTO 创建参数
     * @return 创建结果
     */
    @Override
    public Result create(CouponCreateDTO createDTO) {
        // 新建优惠券时初始化领取次数、使用次数和默认状态。
        Coupon coupon = new Coupon();
        BeanUtils.copyProperties(createDTO, coupon);
        coupon.setUseCount(0);
        coupon.setReceiveCount(0);
        coupon.setStatus(1);
        this.save(coupon);
        return Result.success();
    }

    /**
     * 查询可领取优惠券列表。
     *
     * @param userId 用户 ID
     * @return 优惠券列表
     */
    @Override
    public List<Coupon> listAvailable(Long userId) {
        // 只返回当前生效且库存未领完的优惠券。
        LambdaQueryWrapper<Coupon> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Coupon::getStatus, 1)
                .ge(Coupon::getEndTime, LocalDateTime.now())
                .le(Coupon::getStartTime, LocalDateTime.now())
                .apply("receive_count < total_count");
        return this.list(wrapper);
    }

    /**
     * 分页查询优惠券。
     *
     * @param page 页码
     * @param size 每页条数
     * @param name 优惠券名称
     * @param type 优惠券类型
     * @param status 优惠券状态
     * @return 分页结果
     */
    @Override
    public IPage<Coupon> pageList(Integer page, Integer size, String name, Integer type, Integer status) {
        // 管理端分页查询支持按名称、类型和状态筛选。
        Page<Coupon> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Coupon> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(name != null && !name.isEmpty(), Coupon::getName, name)
                .eq(type != null, Coupon::getType, type)
                .eq(status != null, Coupon::getStatus, status)
                .orderByDesc(Coupon::getCreateTime);
        return this.page(pageParam, wrapper);
    }

    /**
     * 更新优惠券。
     *
     * @param id 优惠券 ID
     * @param createDTO 更新参数
     * @return 更新结果
     */
    @Override
    public Result update(Long id, CouponCreateDTO createDTO) {
        // 更新前先确认优惠券仍然存在。
        Coupon coupon = this.getById(id);
        if (coupon == null) {
            return Result.failed("优惠券不存在");
        }
        BeanUtils.copyProperties(createDTO, coupon);
        this.updateById(coupon);
        return Result.success();
    }

    /**
     * 删除优惠券。
     *
     * @param id 优惠券 ID
     * @return 删除结果
     */
    @Override
    public Result delete(Long id) {
        this.removeById(id);
        return Result.success();
    }

    /**
     * 更新优惠券状态。
     *
     * @param id 优惠券 ID
     * @param status 优惠券状态
     * @return 更新结果
     */
    @Override
    public Result updateStatus(Long id, Integer status) {
        // 这里只更新状态字段，避免把其他字段用空值覆盖掉。
        Coupon coupon = new Coupon();
        coupon.setId(id);
        coupon.setStatus(status);
        this.updateById(coupon);
        return Result.success();
    }
}
