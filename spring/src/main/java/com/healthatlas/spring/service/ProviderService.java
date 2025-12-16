package com.healthatlas.spring.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.healthatlas.spring.model.Provider;
import com.healthatlas.spring.repository.ProviderRepository;

@Service
public class ProviderService {

    private final ProviderRepository providerRepository;

    public ProviderService(ProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
    }

    public Provider saveProvider(Provider provider) {
        return providerRepository.save(provider);
    }

    public List<Provider> getAllProviders() {
        return providerRepository.findAll();
    }
}
