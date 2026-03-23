package com.zhijian.common.result;

import lombok.Data;

/**
 * 统一响应结果对象。
 *
 * @param <T> 数据类型
 */
@Data
public class Result<T> {

    /**
     * 响应状态码。
     */
    private long code;

    /**
     * 响应消息。
     */
    private String message;

    /**
     * 响应数据。
     */
    private T data;

    /**
     * 构造空响应结果。
     */
    protected Result() {
    }

    /**
     * 构造响应结果。
     *
     * @param code 响应状态码
     * @param message 响应消息
     * @param data 响应数据
     */
    protected Result(long code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 返回成功响应。
     *
     * @param <T> 数据类型
     * @return 成功响应
     */
    public static <T> Result<T> success() {
        return success(null);
    }

    /**
     * 返回成功响应。
     *
     * @param data 响应数据
     * @param <T> 数据类型
     * @return 成功响应
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    /**
     * 返回成功响应。
     *
     * @param data 响应数据
     * @param message 响应消息
     * @param <T> 数据类型
     * @return 成功响应
     */
    public static <T> Result<T> success(T data, String message) {
        return new Result<>(ResultCode.SUCCESS.getCode(), message, data);
    }

    /**
     * 返回失败响应。
     *
     * @param errorCode 错误码
     * @param <T> 数据类型
     * @return 失败响应
     */
    public static <T> Result<T> failed(ResultCode errorCode) {
        return new Result<>(errorCode.getCode(), errorCode.getMessage(), null);
    }

    /**
     * 返回失败响应。
     *
     * @param message 错误消息
     * @param <T> 数据类型
     * @return 失败响应
     */
    public static <T> Result<T> failed(String message) {
        return new Result<>(ResultCode.FAILED.getCode(), message, null);
    }

    /**
     * 返回默认失败响应。
     *
     * @param <T> 数据类型
     * @return 失败响应
     */
    public static <T> Result<T> failed() {
        return failed(ResultCode.FAILED);
    }

    /**
     * 返回参数校验失败响应。
     *
     * @param <T> 数据类型
     * @return 参数校验失败响应
     */
    public static <T> Result<T> validateFailed() {
        return failed(ResultCode.VALIDATE_FAILED);
    }

    /**
     * 返回参数校验失败响应。
     *
     * @param message 错误消息
     * @param <T> 数据类型
     * @return 参数校验失败响应
     */
    public static <T> Result<T> validateFailed(String message) {
        return new Result<>(ResultCode.VALIDATE_FAILED.getCode(), message, null);
    }

    /**
     * 返回未登录响应。
     *
     * @param data 响应数据
     * @param <T> 数据类型
     * @return 未登录响应
     */
    public static <T> Result<T> unauthorized(T data) {
        return new Result<>(ResultCode.UNAUTHORIZED.getCode(), ResultCode.UNAUTHORIZED.getMessage(), data);
    }

    /**
     * 返回无权限响应。
     *
     * @param data 响应数据
     * @param <T> 数据类型
     * @return 无权限响应
     */
    public static <T> Result<T> forbidden(T data) {
        return new Result<>(ResultCode.FORBIDDEN.getCode(), ResultCode.FORBIDDEN.getMessage(), data);
    }
}
