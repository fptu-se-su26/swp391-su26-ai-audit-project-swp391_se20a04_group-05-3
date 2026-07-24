package com.greenlife.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${greenlife.upload.dir:./uploads}")
    private String uploadBaseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
        String uploadPath = uploadDir.toUri().toString();

        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(uploadDir.resolve("products").toUri().toString());
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(uploadDir.resolve("avatars").toUri().toString());
        registry.addResourceHandler("/uploads/stores/**")
                .addResourceLocations(uploadDir.resolve("stores").toUri().toString());
        registry.addResourceHandler("/uploads/diagnoses/**")
                .addResourceLocations(uploadDir.resolve("diagnoses").toUri().toString());
        registry.addResourceHandler("/uploads/returns/**")
                .addResourceLocations(uploadDir.resolve("returns").toUri().toString());
    }
}
