package com.zhijian.mapper.im;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.im.entity.ImMessage;
import org.apache.ibatis.annotations.Mapper;

/**
 * 即时通讯消息数据访问接口。
 */
@Mapper
public interface ImMessageMapper extends BaseMapper<ImMessage> {
}
