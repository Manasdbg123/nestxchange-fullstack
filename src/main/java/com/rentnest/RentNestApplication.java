package com.rentnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // <-- Add this to activate your background cron jobs
public class RentNestApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentNestApplication.class, args);
    }
}