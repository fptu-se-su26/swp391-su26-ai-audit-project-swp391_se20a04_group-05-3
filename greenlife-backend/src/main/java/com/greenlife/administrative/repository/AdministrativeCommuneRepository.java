package com.greenlife.administrative.repository;

import com.greenlife.administrative.entity.AdministrativeCommune;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdministrativeCommuneRepository extends JpaRepository<AdministrativeCommune, String> {
    List<AdministrativeCommune> findByProvinceIdOrderByTypeAscNameAsc(Integer provinceId);
}
