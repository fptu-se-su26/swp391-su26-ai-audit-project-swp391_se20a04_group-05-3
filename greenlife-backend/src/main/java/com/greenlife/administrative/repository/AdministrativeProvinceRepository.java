package com.greenlife.administrative.repository;

import com.greenlife.administrative.entity.AdministrativeProvince;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdministrativeProvinceRepository extends JpaRepository<AdministrativeProvince, Integer> {
    List<AdministrativeProvince> findAllByOrderByDisplayOrderAscNameAsc();
}
