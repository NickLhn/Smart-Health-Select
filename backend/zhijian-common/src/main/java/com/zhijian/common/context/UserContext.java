package com.zhijian.common.context;

/**
 * 用户上下文
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public class UserContext {
    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ROLE_HOLDER = new ThreadLocal<>();

    public static void setUserId(Long userId) {
        USER_ID_HOLDER.set(userId);
    }

    public static Long getUserId() {
        return USER_ID_HOLDER.get();
    }

    public static void setRole(String role) {
        USER_ROLE_HOLDER.set(role);
    }

    public static String getRole() {
        return USER_ROLE_HOLDER.get();
    }

    public static void remove() {
        USER_ID_HOLDER.remove();
        USER_ROLE_HOLDER.remove();
    }
}