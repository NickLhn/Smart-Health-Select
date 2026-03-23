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
 * 全局异常处理器。
 * <p>
 * 统一处理控制器抛出的异常，并返回标准响应结果。
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 处理全局异常。
     *
     * @param e 捕获到的异常
     * @return 标准错误响应
     */
    @ResponseBody
    @ExceptionHandler(value = Exception.class)
    public Result handle(Exception e) {
        // @Valid 校验失败优先返回用户可直接理解的字段错误。
        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            String msg = buildValidationMessage(ex.getBindingResult());
            return Result.validateFailed(msg);
        } else if (e instanceof BindException) {
            // 表单或查询参数绑定失败也按参数错误处理。
            BindException ex = (BindException) e;
            String msg = buildValidationMessage(ex.getBindingResult());
            return Result.validateFailed(msg);
        } else if (e instanceof RuntimeException) {
            // 业务异常直接透传消息，便于前端展示明确提示。
            log.error("业务异常:", e);
            return Result.failed(e.getMessage());
        }

        // 其他异常按系统异常兜底，避免把不可控错误静默吞掉。
        log.error("系统异常:", e);
        return Result.failed("系统内部错误: " + e.toString());
    }

    /**
     * 构建参数校验失败提示信息。
     *
     * @param bindingResult 验证结果
     * @return 错误信息字符串
     */
    private String buildValidationMessage(BindingResult bindingResult) {
        StringBuilder sb = new StringBuilder();
        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            // 多个字段错误合并返回，前端不需要逐个再请求一次。
            sb.append(fieldError.getDefaultMessage()).append("; ");
        }
        return sb.toString();
    }
}
