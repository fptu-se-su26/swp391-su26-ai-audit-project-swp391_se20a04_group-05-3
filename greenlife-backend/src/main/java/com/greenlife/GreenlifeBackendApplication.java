package com.greenlife;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
public class GreenlifeBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(GreenlifeBackendApplication.class, args);
	}

}
