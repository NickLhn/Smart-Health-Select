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
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public class AuthenticationInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 放行 OPTIONS 请求 (CORS 预检)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 获取 Token
        String token = request.getHeader("Authorization");
        
        if (StrUtil.isNotBlank(token)) {
            // 支持 Bearer Token
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            try {
                Claims claims = JwtUtil.parseToken(token);
                String userIdStr = claims.getSubject();
                String role = claims.get("role", String.class);
                
                if (userIdStr != null) {
                    UserContext.setUserId(Long.parseLong(userIdStr));
                }
                if (role != null) {
                    UserContext.setRole(role);
                }
            } catch (Exception e) {
                // Token 无效或过期，返回 401
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }
        }
        
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 清理 ThreadLocal
        UserContext.remove();
    }
}