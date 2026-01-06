package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.PatientService;
import com.zhijian.common.context.UserContext;
import com.zhijian.domain.user.entity.Patient;
import com.zhijian.infrastructure.persistence.mapper.PatientMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 就诊人服务实现类
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class PatientServiceImpl extends ServiceImpl<PatientMapper, Patient> implements PatientService {

    @Override
    public List<Patient> listMyPatients() {
        Long userId = UserContext.getUserId();
        return list(new LambdaQueryWrapper<Patient>()
                .eq(Patient::getUserId, userId)
                .orderByDesc(Patient::getIsDefault)
                .orderByDesc(Patient::getCreateTime));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean addPatient(Patient patient) {
        Long userId = UserContext.getUserId();
        patient.setUserId(userId);
        patient.setCreateTime(LocalDateTime.now());
        patient.setUpdateTime(LocalDateTime.now());

        // 如果设置为默认，取消其他默认
        if (Integer.valueOf(1).equals(patient.getIsDefault())) {
            clearDefault(userId);
        } else {
            // 如果是第一个就诊人，强制设为默认
            long count = count(new LambdaQueryWrapper<Patient>().eq(Patient::getUserId, userId));
            if (count == 0) {
                patient.setIsDefault(1);
            } else {
                patient.setIsDefault(0);
            }
        }

        return save(patient);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updatePatient(Patient patient) {
        Long userId = UserContext.getUserId();
        Patient exist = getById(patient.getId());
        if (exist == null || !exist.getUserId().equals(userId)) {
            throw new RuntimeException("就诊人不存在或无权操作");
        }

        patient.setUpdateTime(LocalDateTime.now());
        patient.setUserId(userId); // 确保userId不被修改

        // 如果设置为默认，取消其他默认
        if (Integer.valueOf(1).equals(patient.getIsDefault()) && !Integer.valueOf(1).equals(exist.getIsDefault())) {
            clearDefault(userId);
        }

        return updateById(patient);
    }

    @Override
    public boolean deletePatient(Long id) {
        Long userId = UserContext.getUserId();
        return remove(new LambdaQueryWrapper<Patient>()
                .eq(Patient::getId, id)
                .eq(Patient::getUserId, userId));
    }

    @Override
    public Patient getPatientById(Long id) {
        Long userId = UserContext.getUserId();
        Patient patient = getById(id);
        if (patient != null && patient.getUserId().equals(userId)) {
            return patient;
        }
        return null;
    }

    private void clearDefault(Long userId) {
        update(new LambdaUpdateWrapper<Patient>()
                .eq(Patient::getUserId, userId)
                .set(Patient::getIsDefault, 0));
    }
}
