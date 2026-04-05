package com.zhijian.common.util;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Redis 工具类。
 */
@Component
public class RedisUtil {

    /**
     * Redis 字符串操作模板。
     */
    private final StringRedisTemplate stringRedisTemplate;

    public RedisUtil(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * 设置键值对。
     *
     * @param key 键
     * @param value 值
     */
    public void set(String key, String value) {
        try {
            stringRedisTemplate.opsForValue().set(key, value);
        } catch (Exception ignored) {
        }
    }

    /**
     * 设置带过期时间的键值对。
     *
     * @param key 键
     * @param value 值
     * @param timeout 过期时间
     * @param unit 时间单位
     */
    public void set(String key, String value, long timeout, TimeUnit unit) {
        try {
            stringRedisTemplate.opsForValue().set(key, value, timeout, unit);
        } catch (Exception ignored) {
        }
    }

    /**
     * 获取字符串值。
     *
     * @param key 键
     * @return 值
     */
    public String get(String key) {
        try {
            return stringRedisTemplate.opsForValue().get(key);
        } catch (Exception ignored) {
            return null;
        }
    }

    /**
     * 删除键。
     *
     * @param key 键
     * @return 是否成功
     */
    public Boolean delete(String key) {
        try {
            return stringRedisTemplate.delete(key);
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * 判断键是否存在。
     *
     * @param key 键
     * @return 是否存在
     */
    public Boolean hasKey(String key) {
        try {
            return stringRedisTemplate.hasKey(key);
        } catch (Exception ignored) {
            return false;
        }
    }
}
