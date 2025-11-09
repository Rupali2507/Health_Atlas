package com.healthatlas.spring.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthatlas.spring.model.Provider;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByLicenseNumber(String licenseNumber);
    boolean existsByNpiId(String npiId);
}
