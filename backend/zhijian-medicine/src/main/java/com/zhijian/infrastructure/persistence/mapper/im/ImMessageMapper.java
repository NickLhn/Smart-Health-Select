package com.zhijian.infrastructure.persistence.mapper.im;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.im.entity.ImMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ImMessageMapper extends BaseMapper<ImMessage> {
}
