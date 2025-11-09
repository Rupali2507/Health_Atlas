package com.healthatlas.spring.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthatlas.spring.model.Provider;
import com.healthatlas.spring.repository.ProviderRepository;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = "*")  // allow requests from frontend
public class ProviderController {

    @Autowired
    private ProviderRepository providerRepository;

    // ➤ Add new provider
    @PostMapping("/add")
    public ResponseEntity<?> addProvider(@RequestBody Provider provider) {

        if (providerRepository.existsByEmail(provider.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email already exists");
        }

        if (providerRepository.existsByLicenseNumber(provider.getLicenseNumber())) {
            return ResponseEntity.badRequest().body("Error: License number already exists");
        }

        if (providerRepository.existsByPhoneNumber(provider.getPhoneNumber())) {
            return ResponseEntity.badRequest().body("Error: Phone number already exists");
        }

        if (providerRepository.existsByNpiId(provider.getNpiId())) {
            return ResponseEntity.badRequest().body("Error: NPI ID already exists");
        }

        Provider savedProvider = providerRepository.save(provider);
        return ResponseEntity.ok(savedProvider);
    }

    // ➤ Get all providers
    @GetMapping("/all")
    public List<Provider> getAllProviders() {
        return providerRepository.findAll();
    }

    // ➤ (Optional) Get provider by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getProviderById(@PathVariable Long id) {
        return providerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
