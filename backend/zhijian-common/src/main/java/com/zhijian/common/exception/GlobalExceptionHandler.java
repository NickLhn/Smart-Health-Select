package com.zhijian.common.exception;

import com.zhijian.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * 全局异常处理
 * 统一处理Controller层抛出的异常，返回标准格式的错误响应
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@ControllerAdvice  // 声明为全局控制器异常处理器
@Slf4j            // 使用Lombok生成日志记录器
public class GlobalExceptionHandler {

    /**
     * 全局异常处理方法
     * 处理所有类型的异常，根据异常类型返回不同的错误信息
     *
     * @param e 捕获到的异常
     * @return 标准格式的错误响应
     */
    @ResponseBody   // 返回JSON格式响应
    @ExceptionHandler(value = Exception.class)  // 捕获所有Exception类型异常
    public Result handle(Exception e) {
        // 1. 处理参数验证异常（@Valid校验失败）
        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            String msg = buildValidationMessage(ex.getBindingResult());
            return Result.validateFailed(msg);
        }
        // 2. 处理数据绑定异常（如@ModelAttribute参数绑定失败）
        else if (e instanceof BindException) {
            BindException ex = (BindException) e;
            String msg = buildValidationMessage(ex.getBindingResult());
            return Result.validateFailed(msg);
        }
        // 3. 处理业务运行时异常
        else if (e instanceof RuntimeException) {
            log.error("业务异常:", e);
            return Result.failed(e.getMessage());
        }

        // 4. 处理其他系统异常
        log.error("系统异常:", e);
        // 开发环境返回详细错误信息，生产环境应返回通用错误提示
        return Result.failed("系统内部错误: " + e.toString());
    }

    /**
     * 构建参数验证失败的错误信息
     *
     * @param bindingResult 验证结果
     * @return 拼接后的错误信息字符串
     */
    private String buildValidationMessage(BindingResult bindingResult) {
        StringBuilder sb = new StringBuilder();
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            // 获取字段验证失败的错误信息
            sb.append(fieldError.getDefaultMessage()).append("; ");
        }
        return sb.toString();
    }
}