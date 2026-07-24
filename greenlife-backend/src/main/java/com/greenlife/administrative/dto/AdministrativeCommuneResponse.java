package com.greenlife.administrative.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdministrativeCommuneResponse {
    private String code;
    private String type;
    private String name;
    private String displayName;
}
