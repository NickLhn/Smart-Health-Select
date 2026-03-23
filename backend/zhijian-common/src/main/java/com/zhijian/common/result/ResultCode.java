package com.zhijian.common.result;

/**
 * 统一响应状态码枚举。
 */
public enum ResultCode {

    /**
     * 操作成功。
     */
    SUCCESS(200, "操作成功"),

    /**
     * 服务器内部错误。
     */
    FAILED(500, "操作失败"),

    /**
     * 参数校验失败。
     */
    VALIDATE_FAILED(404, "参数检验失败"),

    /**
     * 未授权或 Token 过期。
     */
    UNAUTHORIZED(401, "暂无登录或token已经过期"),

    /**
     * 权限不足。
     */
    FORBIDDEN(403, "没有相关权限"),

    /**
     * AI 服务网关异常。
     */
    AI_BAD_GATEWAY(502, "AI服务异常，请稍后再试"),

    /**
     * AI 服务不可用。
     */
    AI_UNAVAILABLE(503, "AI服务未启动或不可用"),

    /**
     * AI 服务响应超时。
     */
    AI_TIMEOUT(504, "AI响应超时，请稍后再试");

    /**
     * 状态码。
     */
    private long code;

    /**
     * 状态消息。
     */
    private String message;

    /**
     * 构造状态码枚举。
     *
     * @param code 状态码
     * @param message 状态消息
     */
    ResultCode(long code, String message) {
        this.code = code;
        this.message = message;
    }

    /**
     * 获取状态码。
     *
     * @return 状态码
     */
    public long getCode() {
        return code;
    }

    /**
     * 获取状态消息。
     *
     * @return 状态消息
     */
    public String getMessage() {
        return message;
    }
}
