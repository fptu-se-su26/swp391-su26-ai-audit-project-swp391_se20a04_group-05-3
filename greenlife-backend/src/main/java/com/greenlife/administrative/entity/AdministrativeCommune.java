package com.greenlife.administrative.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "administrative_communes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdministrativeCommune {

    @Id
    @Column(name = "code", nullable = false, length = 5)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id", nullable = false)
    private AdministrativeProvince province;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "old_province_name", length = 100)
    private String oldProvinceName;

    @Column(name = "old_district_name", length = 150)
    private String oldDistrictName;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
