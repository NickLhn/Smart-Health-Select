package com.zhijian.common.context;

/**
 * 用户上下文工具类
 * 使用ThreadLocal存储当前线程的用户信息，实现线程隔离的用户状态管理
 * @author Liuhaonan
 * @since 1.0.0
 */
public class UserContext {

    /**
     * 线程局部变量：存储当前线程的用户ID
     * ThreadLocal确保每个线程拥有独立的用户ID副本
     */
    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();

    /**
     * 线程局部变量：存储当前线程的用户角色
     * ThreadLocal确保每个线程拥有独立的角色信息副本
     */
    private static final ThreadLocal<String> USER_ROLE_HOLDER = new ThreadLocal<>();

    /**
     * 设置当前线程的用户ID
     *
     * @param userId 用户ID，不能为null
     * @throws NullPointerException 当userId为null时抛出
     */
    public static void setUserId(Long userId) {
        // 建议：在实际使用中可以添加参数校验
        // if (userId == null) {
        //     throw new IllegalArgumentException("用户ID不能为null");
        // }
        USER_ID_HOLDER.set(userId);
    }

    /**
     * 获取当前线程的用户ID
     *
     * @return 当前用户ID，如果未设置则返回null
     * @apiNote 调用前应确保已通过拦截器/过滤器设置用户信息
     */
    public static Long getUserId() {
        return USER_ID_HOLDER.get();
    }

    /**
     * 设置当前线程的用户角色
     *
     * @param role 用户角色，如："ADMIN", "SELLER", "USER"等
     */
    public static void setRole(String role) {
        USER_ROLE_HOLDER.set(role);
    }

    /**
     * 获取当前线程的用户角色
     *
     * @return 当前用户角色，如果未设置则返回null
     */
    public static String getRole() {
        return USER_ROLE_HOLDER.get();
    }

    /**
     * 清理当前线程的用户上下文信息
     *
     * <p>重要：必须在每个请求处理完成后调用此方法，防止内存泄漏</p>
     * <p>通常在拦截器/过滤器的finally块中调用</p>
     */
    public static void remove() {
        // 清理用户ID
        USER_ID_HOLDER.remove();
        // 清理用户角色
        USER_ROLE_HOLDER.remove();
    }

    /**
     * 检查当前线程是否存在用户上下文
     *
     * @return 如果用户ID已设置则返回true，否则返回false
     */
    public static boolean hasUser() {
        return USER_ID_HOLDER.get() != null;
    }

    /**
     * 检查当前用户是否具有指定角色
     *
     * @param expectedRole 期望的角色
     * @return 如果当前用户角色与期望角色匹配则返回true
     */
    public static boolean hasRole(String expectedRole) {
        String currentRole = USER_ROLE_HOLDER.get();
        return currentRole != null && currentRole.equals(expectedRole);
    }

    /**
     * 检查当前用户是否具有管理员角色
     *
     * @return 如果当前用户是管理员则返回true
     */
    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * 检查当前用户是否具有商家角色
     *
     * @return 如果当前用户是商家则返回true
     */
    public static boolean isSeller() {
        return hasRole("SELLER");
    }

    /**
     * 检查当前用户是否具有普通用户角色
     *
     * @return 如果当前用户是普通用户则返回true
     */
    public static boolean isUser() {
        return hasRole("USER");
    }
}