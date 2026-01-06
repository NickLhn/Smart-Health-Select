package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.user.entity.Merchant;
import org.apache.ibatis.annotations.Mapper;

/**
 * 商家 Mapper 接口
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Mapper
public interface MerchantMapper extends BaseMapper<Merchant> {
}
