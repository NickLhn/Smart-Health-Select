package com.zhijian.common.interceptor;

import cn.hutool.core.util.StrUtil;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 认证拦截器。
 * <p>
 * 用于校验 JWT Token 并写入当前请求的用户上下文信息。
 */
public class AuthenticationInterceptor implements HandlerInterceptor {

    /**
     * 在请求进入控制器前执行认证检查。
     *
     * @param request HTTP 请求对象
     * @param response HTTP 响应对象
     * @param handler 处理器对象
     * @return 是否继续执行后续流程
     * @throws Exception 处理异常
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 预检请求不携带业务鉴权信息，直接放行。
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String token = request.getHeader("Authorization");
        if (StrUtil.isNotBlank(token)) {
            // 兼容前端标准 Bearer Token 传法。
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            try {
                Claims claims = JwtUtil.parseToken(token);
                String userIdStr = claims.getSubject();
                String role = claims.get("role", String.class);

                // 解析出的身份信息统一写入 UserContext，供后续业务层读取。
                if (userIdStr != null) {
                    UserContext.setUserId(Long.parseLong(userIdStr));
                }
                if (role != null) {
                    UserContext.setRole(role);
                }
            } catch (Exception e) {
                // Token 非法或过期时直接拦截，避免带着脏上下文继续执行。
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }
        }

        return true;
    }

    /**
     * 在请求完成后清理用户上下文。
     *
     * @param request HTTP 请求对象
     * @param response HTTP 响应对象
     * @param handler 处理器对象
     * @param ex 异常对象
     * @throws Exception 处理异常
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // ThreadLocal 必须在请求结束后清理，否则线程复用时会串用户。
        UserContext.remove();
    }
}
