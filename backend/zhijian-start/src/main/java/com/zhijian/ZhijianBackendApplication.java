package com.zhijian;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.zhijian.user.config.OcrProperties;

/**
 * 智健优选后端启动类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@EnableScheduling
@SpringBootApplication
@EnableConfigurationProperties(OcrProperties.class)
public class ZhijianBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZhijianBackendApplication.class, args);
        System.out.println("启动成功");
    }


}
