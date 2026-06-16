package com.greenlife.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreResponse {
    private Integer id;
    private Integer ownerId;
    private String ownerName;
    private String name;
    private String phone;
    private String city;
    private String district;
    private String address;
    private String description;
    private String logoUrl;
    private String verificationDocument;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
