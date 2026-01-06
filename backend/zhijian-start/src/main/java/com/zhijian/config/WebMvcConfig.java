package com.zhijian.config;

import com.zhijian.common.interceptor.AuthenticationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置类
 * 配置Spring MVC相关组件，包括拦截器、资源处理器等
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 配置拦截器
     * 将自定义的身份认证拦截器添加到拦截器链中
     *
     * @param registry 拦截器注册器，用于注册和管理拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册身份认证拦截器
        registry.addInterceptor(new AuthenticationInterceptor())
                // 设置拦截路径：拦截所有请求
                .addPathPatterns("/**")
                // 设置排除路径：排除认证相关接口和Swagger文档资源
                .excludePathPatterns(
                        "/auth/**",           // 认证相关接口（如登录、注册等）
                        "/doc.html",          // Swagger UI主页面
                        "/webjars/**",        // Swagger依赖的静态资源
                        "/swagger-resources/**", // Swagger资源配置
                        "/v3/api-docs/**"     // OpenAPI文档接口
                );
        System.out.println("配置拦截器已开启。。。");
    }

    /**
     * 配置跨域资源共享 (CORS)
     * 允许所有来源、所有头部、所有方法的跨域请求
     *
     * @param registry CORS注册器
     */
    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}