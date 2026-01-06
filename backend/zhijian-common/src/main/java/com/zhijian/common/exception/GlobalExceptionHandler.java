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
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ResponseBody
    @ExceptionHandler(value = Exception.class)
    public Result handle(Exception e) {
        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            BindingResult bindingResult = ex.getBindingResult();
            StringBuilder sb = new StringBuilder();
            for (FieldError fieldError : bindingResult.getFieldErrors()) {
                sb.append(fieldError.getDefaultMessage()).append("; ");
            }
            String msg = sb.toString();
            return Result.validateFailed(msg);
        } else if (e instanceof BindException) {
            BindException ex = (BindException) e;
            BindingResult bindingResult = ex.getBindingResult();
            StringBuilder sb = new StringBuilder();
            for (FieldError fieldError : bindingResult.getFieldErrors()) {
                sb.append(fieldError.getDefaultMessage()).append("; ");
            }
            String msg = sb.toString();
            return Result.validateFailed(msg);
        } else if (e instanceof RuntimeException) {
            log.error("业务异常:", e);
            return Result.failed(e.getMessage());
        }
        log.error("系统异常:", e);
        // 开发环境为了排查问题，暂时返回具体错误信息
        return Result.failed("系统内部错误: " + e.toString());
    }
}
