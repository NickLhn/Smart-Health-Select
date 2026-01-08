package com.zhijian.common.aspect;

import com.zhijian.common.context.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * 管理员权限校验切面
 * 使用Spring AOP实现权限检查，验证用户是否具有管理员角色
 *
 * 切点表达式说明：
 * 1. @annotation - 匹配带有@AdminCheck注解的方法
 * 2. @within - 匹配带有@AdminCheck注解的类中的所有方法
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Aspect  // 声明这是一个切面类
@Component  // 声明为Spring组件，由Spring容器管理
@Slf4j  // 使用Lombok生成日志记录器
public class AdminCheckAspect {

    /**
     * 管理员权限检查切面方法
     * 在执行目标方法前检查当前用户是否具有管理员角色
     *
     * 执行时机：在目标方法执行之前
     * 匹配规则：
     * 1. 方法上标注了@AdminCheck注解
     * 2. 类上标注了@AdminCheck注解（该类所有方法都需要检查）
     *
     * @param joinPoint 连接点，包含目标方法的信息
     * @throws RuntimeException 当用户不是管理员时抛出权限异常
     */
    @Before("@annotation(com.zhijian.common.annotation.AdminCheck) || @within(com.zhijian.common.annotation.AdminCheck)")
    public void checkAdmin(JoinPoint joinPoint) {
        // 从用户上下文获取当前用户角色
        String role = UserContext.getRole();

        // 检查是否为管理员角色（固定为"ADMIN"）
        if (!"ADMIN".equals(role)) {
            // 记录权限拒绝的警告日志，包含用户ID、角色和访问的方法信息
            log.warn("Access denied: User {} with role {} tried to access {}",
                    UserContext.getUserId(),
                    role,
                    joinPoint.getSignature());

            // 抛出运行时异常，阻止非管理员用户继续执行
            throw new RuntimeException("无权操作：需要管理员权限");
        }

        // 如果是管理员，继续执行目标方法
        log.debug("Admin access granted for user: {}", UserContext.getUserId());
    }
}