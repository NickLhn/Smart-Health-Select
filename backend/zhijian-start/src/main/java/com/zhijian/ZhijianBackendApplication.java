package com.zhijian;

import com.zhijian.user.config.OcrProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 智健优选后端启动类。
 */
@EnableScheduling
@SpringBootApplication
@EnableConfigurationProperties(OcrProperties.class)
public class ZhijianBackendApplication {

    /**
     * 启动应用。
     *
     * @param args 启动参数
     */
    public static void main(String[] args) {
        SpringApplication.run(ZhijianBackendApplication.class, args);
        System.out.println("启动成功");
    }
}
