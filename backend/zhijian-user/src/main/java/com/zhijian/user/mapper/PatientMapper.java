package com.zhijian.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.user.entity.Patient;
import org.apache.ibatis.annotations.Mapper;

/**
 * 就诊人 Mapper 接口
 */
@Mapper
public interface PatientMapper extends BaseMapper<Patient> {
}
