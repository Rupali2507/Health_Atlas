package com.healthatlas.spring.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.healthatlas.spring.model.DataModel;

public interface ModelRepository extends JpaRepository<DataModel, Long>{

}
