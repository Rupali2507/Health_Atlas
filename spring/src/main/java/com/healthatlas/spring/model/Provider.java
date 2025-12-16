package com.healthatlas.spring.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "providers")
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 15)
    private String phoneNumber;

    private String speciality;

    @Column(unique = true)
    private String licenseNumber;

    @Column(unique = true)
    private String npiId;

    private String practiceAddress;

    @Column(columnDefinition = "TEXT")
    private String aiRawResult;     // full AI JSON as String

    @Column(columnDefinition = "TEXT")
    private String aiParsedResult;  // extracted / cleaned result

    // 🔽 FILE STORAGE

    @Column(columnDefinition = "TEXT")
    private String credentialFilePath;

}
