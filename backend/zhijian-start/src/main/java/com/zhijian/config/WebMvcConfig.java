package com.zhijian.config;

import com.zhijian.common.interceptor.AuthenticationInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置类。
 */
@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 配置拦截器。
     *
     * @param registry 拦截器注册器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 统一注册认证拦截器，默认拦截全部业务请求。
        registry.addInterceptor(new AuthenticationInterceptor())
                .addPathPatterns("/**")
                // 认证接口、短信接口和文档资源不走业务鉴权。
                .excludePathPatterns(
                        "/auth/**",
                        "/sms/**",
                        "/payments/stripe/webhook",
                        "/doc.html",
                        "/webjars/**",
                        "/swagger-resources/**",
                        "/v3/api-docs/**"
                );
        log.info("配置拦截器已开启。。。");
    }

    /**
     * 配置跨域资源共享。
     *
     * @param registry CORS 注册器
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "https://*.zhijianshangcheng.cn",
                        "https://zhijianshangcheng.cn"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
