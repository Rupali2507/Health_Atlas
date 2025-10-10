package com.healthatlas.spring.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.healthatlas.spring.helper.CSVHelper;
import com.healthatlas.spring.model.DataModel;
import com.healthatlas.spring.repository.ModelRepository;

@Service
public class CSVService {
  @Autowired
  ModelRepository repository;

  public void save(MultipartFile file) {
    try {
      List<DataModel> datamodels = CSVHelper.csvToDataModels(file.getInputStream());
      repository.saveAll(datamodels);
    } catch (IOException e) {
      throw new RuntimeException("fail to store csv data: " + e.getMessage());
    }
  }

  public List<DataModel> getAllDataModels() {
    return repository.findAll();
  }
}