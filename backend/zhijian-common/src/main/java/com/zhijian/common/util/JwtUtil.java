package com.zhijian.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * JWT 工具类。
 */
public class JwtUtil {

    /**
     * 本地开发默认密钥。
     */
    private static final String DEFAULT_SECRET_STRING = "ZhijianDevOnlyJwtSecretChangeMeBeforeProduction2026";

    /**
     * JWT 密钥字符串。
     */
    private static final String SECRET_STRING = resolveSecret();

    /**
     * JWT 签名密钥。
     */
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    /**
     * Token 过期时间。
     */
    private static final long EXPIRE_TIME = 24 * 60 * 60 * 1000L;

    /**
     * 解析 JWT 密钥配置。
     *
     * @return JWT 密钥字符串
     */
    private static String resolveSecret() {
        // 优先读 JVM 参数，便于容器启动时显式注入。
        String secret = System.getProperty("zhijian.jwt.secret");
        if (secret == null || secret.isBlank()) {
            // 其次读取环境变量，适合部署环境统一配置。
            secret = System.getenv("ZHIJIAN_JWT_SECRET");
        }
        if (secret == null || secret.isBlank()) {
            // 最后才退回本地开发默认值，生产环境不应该走到这里。
            secret = DEFAULT_SECRET_STRING;
        }
        return secret;
    }

    /**
     * 生成 Token。
     *
     * @param userId 用户 ID
     * @param role 用户角色
     * @return Token 字符串
     */
    public static String generateToken(Long userId, String role) {
        // userId 放在 subject，角色放在 claim，便于拦截器快速解析。
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE_TIME))
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 解析 Token。
     *
     * @param token Token 字符串
     * @return Claims 对象
     */
    public static Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 验证 Token 是否有效。
     *
     * @param token Token 字符串
     * @return 是否有效
     */
    public static boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            // 校验方法只关心真假，不向外抛解析细节。
            return false;
        }
    }
}
