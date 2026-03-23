package com.zhijian.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Knife4j 接口文档配置类。
 */
@Configuration
public class Knife4jConfig {

    /**
     * 构建 OpenAPI 文档配置。
     *
     * @return OpenAPI 配置对象
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("智健优选 API 接口文档")
                        .version("1.0")
                        .description("基于 DDD 架构的医药电商平台后端接口")
                        .contact(new Contact().name("Liuhaonan-ZhiJianYouXuan").email("support@zhijian.com")));
    }
}
