package com.zhijian.user.controller;

import com.zhijian.user.service.PatientService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.Patient;
import com.zhijian.dto.user.PatientAddDTO;
import com.zhijian.dto.user.PatientUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        // DTO 转实体后统一交给 service 处理默认就诊人等规则。
        Patient patient = new Patient();
        BeanUtils.copyProperties(patientAddDTO, patient);
        return Result.success(patientService.addPatient(patient));
    }

    @Operation(summary = "修改就诊人")
    @PutMapping("/update")
    public Result<Boolean> update(@RequestBody PatientUpdateDTO patientUpdateDTO) {
        // 就诊人更新同样先做 DTO -> 实体转换，再由 service 校验归属关系。
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
