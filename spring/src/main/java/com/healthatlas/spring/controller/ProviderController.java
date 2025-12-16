package com.healthatlas.spring.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.healthatlas.spring.model.Provider;
import com.healthatlas.spring.service.ProviderService;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin
public class ProviderController {

    private final ProviderService providerService;

    public ProviderController(ProviderService providerService) {
        this.providerService = providerService;
    }

    // ✅ CREATE provider (stores in DB)
    @PostMapping("/apply")
    public ResponseEntity<?> applyProvider(
            @RequestParam("fullName") String fullName,
            @RequestParam String email,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam String speciality,
            @RequestParam String licenseNumber,
            @RequestParam String npiId,
            @RequestParam String practiceAddress,
            @RequestParam("aiRawResult") String aiRawResult,
            @RequestParam("aiParsedResult") String aiParsedResult,
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        // Save file
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get("uploads/" + fileName);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());

        Provider provider = new Provider();
        provider.setFullName(fullName);
        provider.setEmail(email);
        provider.setPhoneNumber(phoneNumber);
        provider.setSpeciality(speciality);
        provider.setLicenseNumber(licenseNumber);
        provider.setNpiId(npiId);
        provider.setPracticeAddress(practiceAddress);
        provider.setAiRawResult(aiRawResult);
        provider.setAiParsedResult(aiParsedResult);
        provider.setCredentialFilePath(path.toString());

        providerService.saveProvider(provider);

        return ResponseEntity.ok("Provider stored successfully");
    }

    // ✅ READ providers (for frontend rendering)
    @GetMapping
    public ResponseEntity<?> getProviders() {
        return ResponseEntity.ok(providerService.getAllProviders());
    }
}
