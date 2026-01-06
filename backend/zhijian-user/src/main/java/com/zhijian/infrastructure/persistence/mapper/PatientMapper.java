package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.user.entity.Patient;
import org.apache.ibatis.annotations.Mapper;

/**
 * 就诊人 Mapper 接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface PatientMapper extends BaseMapper<Patient> {
}
