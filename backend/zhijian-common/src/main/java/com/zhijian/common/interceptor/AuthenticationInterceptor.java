package com.zhijian.common.interceptor;

import cn.hutool.core.util.StrUtil;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 认证拦截器
 * 用于拦截HTTP请求，验证JWT Token并设置用户上下文信息
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public class AuthenticationInterceptor implements HandlerInterceptor {

    /**
     * 在控制器方法执行前进行拦截
     * 验证Token并设置用户上下文信息
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 1. 放行OPTIONS预检请求（CORS跨域）
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 2. 从请求头获取Token
        String token = request.getHeader("Authorization");

        // 3. 处理Bearer Token格式
        if (StrUtil.isNotBlank(token)) {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7); // 移除"Bearer "前缀
            }

            try {
                // 4. 解析JWT Token
                Claims claims = JwtUtil.parseToken(token);

                // 5. 从Token中提取用户信息
                String userIdStr = claims.getSubject();      // 用户ID
                String role = claims.get("role", String.class); // 用户角色

                // 6. 设置用户上下文信息
                if (userIdStr != null) {
                    UserContext.setUserId(Long.parseLong(userIdStr));
                }
                if (role != null) {
                    UserContext.setRole(role);
                }

            } catch (Exception e) {
                // 7. Token无效或过期，返回401未授权
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }
        }

        // 8. 继续执行后续拦截器或控制器
        return true;
    }

    /**
     * 在请求处理完成后执行（无论是否发生异常）
     * 清理ThreadLocal中的用户上下文，防止内存泄漏
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 清理用户上下文信息
        UserContext.remove();
    }
}