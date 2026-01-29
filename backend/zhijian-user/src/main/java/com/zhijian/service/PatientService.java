package com.zhijian.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.user.entity.Patient;

import java.util.List;

/**
 * 就诊人服务接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface PatientService extends IService<Patient> {

    /**
     * 获取当前用户的就诊人列表
     * @return 就诊人列表
     */
    List<Patient> listMyPatients();

    /**
     * 添加就诊人
     * @param patient 就诊人信息
     * @return 是否成功
     */
    boolean addPatient(Patient patient);

    /**
     * 修改就诊人
     * @param patient 就诊人信息
     * @return 是否成功
     */
    boolean updatePatient(Patient patient);

    /**
     * 删除就诊人
     * @param id 就诊人ID
     * @return 是否成功
     */
    boolean deletePatient(Long id);

    /**
     * 获取就诊人详情
     * @param id 就诊人ID
     * @return 就诊人信息
     */
    Patient getPatientById(Long id);
}

