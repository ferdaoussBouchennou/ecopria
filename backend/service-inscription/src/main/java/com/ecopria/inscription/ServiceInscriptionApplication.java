package com.ecopria.inscription;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServiceInscriptionApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceInscriptionApplication.class, args);
    }
}