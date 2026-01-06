package com.zhijian.interfaces.web;

import com.zhijian.application.service.PatientService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.user.entity.Patient;
import com.zhijian.interfaces.dto.user.PatientAddDTO;
import com.zhijian.interfaces.dto.user.PatientUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 就诊人管理控制器
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "就诊人管理")
@RestController
@RequestMapping("/user/patient")
public class PatientController {

    @Resource
    private PatientService patientService;

    @Operation(summary = "获取我的就诊人列表")
    @GetMapping("/list")
    public Result<List<Patient>> list() {
        return Result.success(patientService.listMyPatients());
    }

    @Operation(summary = "添加就诊人")
    @PostMapping("/add")
    public Result<Boolean> add(@RequestBody PatientAddDTO patientAddDTO) {
        Patient patient = new Patient();
        BeanUtils.copyProperties(patientAddDTO, patient);
        return Result.success(patientService.addPatient(patient));
    }

    @Operation(summary = "修改就诊人")
    @PutMapping("/update")
    public Result<Boolean> update(@RequestBody PatientUpdateDTO patientUpdateDTO) {
        Patient patient = new Patient();
        BeanUtils.copyProperties(patientUpdateDTO, patient);
        return Result.success(patientService.updatePatient(patient));
    }

    @Operation(summary = "删除就诊人")
    @DeleteMapping("/delete/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(patientService.deletePatient(id));
    }

    @Operation(summary = "获取就诊人详情")
    @GetMapping("/{id}")
    public Result<Patient> getDetail(@PathVariable Long id) {
        return Result.success(patientService.getPatientById(id));
    }
}
