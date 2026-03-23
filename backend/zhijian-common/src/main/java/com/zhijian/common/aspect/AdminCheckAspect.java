package com.zhijian.common.aspect;

import com.zhijian.common.context.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * 管理员权限校验切面。
 * <p>
 * 使用 Spring AOP 对标注管理员权限注解的方法或类执行权限检查。
 */
@Aspect
@Component
@Slf4j
public class AdminCheckAspect {

    /**
     * 执行管理员权限检查。
     * <p>
     * 在目标方法执行前校验当前用户是否具有管理员角色。
     *
     * @param joinPoint 连接点信息
     */
    @Before("@annotation(com.zhijian.common.annotation.AdminCheck) || @within(com.zhijian.common.annotation.AdminCheck)")
    public void checkAdmin(JoinPoint joinPoint) {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role)) {
            log.warn("Access denied: User {} with role {} tried to access {}",
                    UserContext.getUserId(),
                    role,
                    joinPoint.getSignature());
            throw new RuntimeException("无权操作：需要管理员权限");
        }

        log.debug("Admin access granted for user: {}", UserContext.getUserId());
    }
}
