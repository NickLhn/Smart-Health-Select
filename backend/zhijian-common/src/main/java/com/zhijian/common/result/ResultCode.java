package com.zhijian.common.result;

/**
 * 统一响应状态码枚举
 * 定义系统中所有的HTTP响应状态码和对应的消息
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public enum ResultCode {

    /** 操作成功 */
    SUCCESS(200, "操作成功"),

    /** 服务器内部错误 */
    FAILED(500, "操作失败"),

    /** 参数验证失败 */
    VALIDATE_FAILED(404, "参数检验失败"),

    /** 未授权/Token过期 */
    UNAUTHORIZED(401, "暂无登录或token已经过期"),

    /** 权限不足 */
    FORBIDDEN(403, "没有相关权限");

    /** 状态码 */
    private long code;

    /** 状态消息 */
    private String message;

    ResultCode(long code, String message) {
        this.code = code;
        this.message = message;
    }

    public long getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}