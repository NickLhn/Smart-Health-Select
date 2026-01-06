package com.zhijian.common.aspect;

import com.zhijian.common.context.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * 管理员权限校验切面
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Aspect
@Component
@Slf4j
public class AdminCheckAspect {

    @Before("@annotation(com.zhijian.common.annotation.AdminCheck) || @within(com.zhijian.common.annotation.AdminCheck)")
    public void checkAdmin(JoinPoint joinPoint) {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role)) {
            log.warn("Access denied: User {} with role {} tried to access {}", UserContext.getUserId(), role, joinPoint.getSignature());
            throw new RuntimeException("无权操作：需要管理员权限");
        }
    }
}
