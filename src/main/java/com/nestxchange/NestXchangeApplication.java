package com.nestxchange;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // <-- Add this to activate your background cron jobs
public class NestXchangeApplication {

    public static void main(String[] args) {
        SpringApplication.run(NestXchangeApplication.class, args);
    }
}
