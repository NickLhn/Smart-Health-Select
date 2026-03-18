package com.zhijian.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * JWT 工具类
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public class JwtUtil {

    // 仅用于本地开发兜底，正式环境必须显式配置 ZHIJIAN_JWT_SECRET。
    private static final String DEFAULT_SECRET_STRING = "ZhijianDevOnlyJwtSecretChangeMeBeforeProduction2026";
    // 密钥 (必须大于等于 256 位)
    private static final String SECRET_STRING = resolveSecret();
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));
    
    // 过期时间: 24小时
    private static final long EXPIRE_TIME = 24 * 60 * 60 * 1000L;

    private static String resolveSecret() {
        String secret = System.getProperty("zhijian.jwt.secret");
        if (secret == null || secret.isBlank()) {
            secret = System.getenv("ZHIJIAN_JWT_SECRET");
        }
        if (secret == null || secret.isBlank()) {
            secret = DEFAULT_SECRET_STRING;
        }
        return secret;
    }

    /**
     * 生成 Token
     *
     * @param userId 用户ID
     * @param role   用户角色
     * @return Token 字符串
     */
    public static String generateToken(Long userId, String role) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE_TIME))
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 解析 Token
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
     * 验证 Token 是否有效
     */
    public static boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
