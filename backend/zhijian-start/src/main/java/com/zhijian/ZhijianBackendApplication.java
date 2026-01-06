package com.zhijian;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 智健优选后端启动类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@EnableScheduling
@SpringBootApplication
public class ZhijianBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZhijianBackendApplication.class, args);
        System.out.println("启动成功");
    }


}
