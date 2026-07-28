package com.greenlife.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicStoreResponse {
    private Integer id;
    private String name;
    private String city;
    private String district;
    private String address;
    private String description;
    private String logoUrl;
}
