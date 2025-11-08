package com.healthatlas.spring.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
    "https://health-atlas.vercel.app",
    "http://localhost:5173"
}) // Add both prod and dev frontends
public class HealthController {

  @GetMapping("/health")
  public ResponseEntity<String> healthCheck() {
    return ResponseEntity.ok("✅ Server is awake and healthy!");
  }
}
