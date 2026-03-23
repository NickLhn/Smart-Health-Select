package com.zhijian.common.context;

/**
 * 用户上下文工具类。
 * <p>
 * 使用 ThreadLocal 保存当前线程中的用户信息，实现请求级用户状态隔离。
 */
public class UserContext {

    /**
     * 当前线程的用户 ID。
     */
    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();

    /**
     * 当前线程的用户角色。
     */
    private static final ThreadLocal<String> USER_ROLE_HOLDER = new ThreadLocal<>();

    /**
     * 设置当前线程的用户 ID。
     *
     * @param userId 用户 ID
     */
    public static void setUserId(Long userId) {
        USER_ID_HOLDER.set(userId);
    }

    /**
     * 获取当前线程的用户 ID。
     *
     * @return 用户 ID
     */
    public static Long getUserId() {
        return USER_ID_HOLDER.get();
    }

    /**
     * 设置当前线程的用户角色。
     *
     * @param role 用户角色
     */
    public static void setRole(String role) {
        USER_ROLE_HOLDER.set(role);
    }

    /**
     * 获取当前线程的用户角色。
     *
     * @return 用户角色
     */
    public static String getRole() {
        return USER_ROLE_HOLDER.get();
    }

    /**
     * 清理当前线程的用户上下文信息。
     */
    public static void remove() {
        USER_ID_HOLDER.remove();
        USER_ROLE_HOLDER.remove();
    }

    /**
     * 判断当前线程是否存在用户上下文。
     *
     * @return 是否存在用户信息
     */
    public static boolean hasUser() {
        return USER_ID_HOLDER.get() != null;
    }

    /**
     * 判断当前用户是否具有指定角色。
     *
     * @param expectedRole 期望角色
     * @return 是否匹配指定角色
     */
    public static boolean hasRole(String expectedRole) {
        String currentRole = USER_ROLE_HOLDER.get();
        return currentRole != null && currentRole.equals(expectedRole);
    }

    /**
     * 判断当前用户是否为管理员。
     *
     * @return 是否为管理员
     */
    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * 判断当前用户是否为商家。
     *
     * @return 是否为商家
     */
    public static boolean isSeller() {
        return hasRole("SELLER");
    }

    /**
     * 判断当前用户是否为普通用户。
     *
     * @return 是否为普通用户
     */
    public static boolean isUser() {
        return hasRole("USER");
    }
}
