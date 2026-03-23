package com.zhijian.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.user.service.PatientService;
import com.zhijian.common.context.UserContext;
import com.zhijian.pojo.user.entity.Patient;
import com.zhijian.user.mapper.PatientMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 就诊人服务实现类。
 */
@Service
public class PatientServiceImpl extends ServiceImpl<PatientMapper, Patient> implements PatientService {

    @Override
    public List<Patient> listMyPatients() {
        // 默认就诊人排在最前面，方便前端直接选中。
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

        // 新增就诊人时，如果指定为默认，就把其他记录的默认标记清掉。
        if (Integer.valueOf(1).equals(patient.getIsDefault())) {
            clearDefault(userId);
        } else {
            // 第一个就诊人默认设为默认就诊人，减少前端额外处理。
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
        // 更新时强制回填当前用户 ID，避免通过请求体篡改归属关系。
        patient.setUserId(userId);

        // 当前记录被设置为默认时，其余记录必须取消默认标记。
        if (Integer.valueOf(1).equals(patient.getIsDefault()) && !Integer.valueOf(1).equals(exist.getIsDefault())) {
            clearDefault(userId);
        }

        return updateById(patient);
    }

    @Override
    public boolean deletePatient(Long id) {
        // 删除时额外带上用户 ID 条件，防止越权删除他人就诊人。
        Long userId = UserContext.getUserId();
        return remove(new LambdaQueryWrapper<Patient>()
                .eq(Patient::getId, id)
                .eq(Patient::getUserId, userId));
    }

    @Override
    public Patient getPatientById(Long id) {
        // 详情接口只返回当前用户自己的就诊人记录。
        Long userId = UserContext.getUserId();
        Patient patient = getById(id);
        if (patient != null && patient.getUserId().equals(userId)) {
            return patient;
        }
        return null;
    }

    // 清除当前用户名下其他就诊人的默认标记。
    private void clearDefault(Long userId) {
        update(new LambdaUpdateWrapper<Patient>()
                .eq(Patient::getUserId, userId)
                .set(Patient::getIsDefault, 0));
    }
}
