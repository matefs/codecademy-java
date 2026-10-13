package com.codecademyjava;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CodecademyJavaApplication {

    public static void main(String[] args) {
        SpringApplication.run(CodecademyJavaApplication.class, args);
    }
}
