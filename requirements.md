# Health Atlas - System Requirements Specification

**Version:** 2.1  
**Date:** February 14, 2026  
**Document Type:** EARS (Easy Approach to Requirements Syntax)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for Health Atlas, an autonomous AI-powered healthcare provider validation system. Requirements are expressed using EARS notation for clarity and testability.

### 1.2 Scope
Health Atlas validates healthcare provider data through a 7-stage AI pipeline, processing scanned PDFs, CSV files, and images to verify provider credentials, detect fraud, and maintain a validated provider database.

### 1.3 EARS Notation Guide
- **Ubiquitous:** System-wide properties (The system shall...)
- **Event-driven:** Triggered by specific events (When... the system shall...)
- **Unwanted Behaviors:** Error handling (If... then the system shall...)
- **State-driven:** Behavior in specific modes (While... the system shall...)
- **Optional:** Features that may be included (Where... the system shall...)

---

## 2. Ubiquitous Requirements

### 2.1 Technology Stack

**REQ-UBI-001:** The backend validation engine shall be written in Python 3.10 or higher.

**REQ-UBI-002:** The authentication service shall be implemented using Spring Boot 3.2 with Java 17 or higher.

**REQ-UBI-003:** The frontend application shall be built using React 18 with Vite as the build tool.

**REQ-UBI-004:** The system shall use PostgreSQL (Neon) as the primary database for storing validated provider records.

**REQ-UBI-005:** The system shall use FastAPI for the Python backend REST API implementation.

### 2.2 Architecture

**REQ-UBI-006:** The system shall implement a microservices architecture with separate services for authentication, validation, and frontend presentation.

**REQ-UBI-007:** The validation engine shall use LangGraph for multi-agent orchestration.

**REQ-UBI-008:** The system shall support concurrent processing of up to 5 provider validations simultaneously.

**REQ-UBI-009:** The system shall communicate validation progress using Server-Sent Events (SSE) for real-time streaming.

**REQ-UBI-010:** The system shall implement CORS middleware to allow cross-origin requests from the frontend.

### 2.3 Security

**REQ-UBI-011:** The system shall implement JWT-based authentication for all API endpoints.

**REQ-UBI-012:** The system shall encrypt all data in transit using TLS 1.3.

**REQ-UBI-013:** The system shall store passwords using BCrypt hashing with a minimum work factor of 10.

**REQ-UBI-014:** The system shall validate and sanitize all user inputs to prevent injection attacks.

**REQ-UBI-015:** The system shall implement role-based access control (RBAC) for user permissions.

### 2.4 Data Standards

**REQ-UBI-016:** The system shall validate NPI numbers as exactly 10 digits.

**REQ-UBI-017:** The system shall format phone numbers in the pattern XXX-XXX-XXXX.

**REQ-UBI-018:** The system shall represent state codes using 2-letter abbreviations.

**REQ-UBI-019:** The system shall store dates in ISO 8601 format (YYYY-MM-DD).

**REQ-UBI-020:** The system shall maintain confidence scores as floating-point values between 0.0 and 1.0.

---

## 3. Event-Driven Requirements

### 3.1 File Upload Events

**REQ-EVT-001:** When a user uploads a CSV file, the system shall parse the file and extract provider records using pandas DataFrame operations.

**REQ-EVT-002:** When a user uploads a PDF file, the system shall convert the PDF to images at 300 DPI resolution.

**REQ-EVT-003:** When a PDF is converted to images, the system shall extract provider data using Google Gemini Flash 2.0 as the primary Vision Language Model.

**REQ-EVT-004:** When a user uploads an Excel file, the system shall process all sheets and extract provider records from each sheet.

**REQ-EVT-005:** When a file upload fails, the system shall return an error message via SSE stream indicating the failure reason.

### 3.2 Validation Pipeline Events

**REQ-EVT-006:** When provider data enters the validation pipeline, the system shall normalize field names to match the AgentState schema.

**REQ-EVT-007:** When NPPES verification begins, the system shall query the NPPES API using NPI number if available, otherwise using name and state.

**REQ-EVT-008:** When OIG LEIE check begins, the system shall search the local CSV database for provider exclusions.

**REQ-EVT-009:** When state license verification begins, the system shall invoke the appropriate state-specific scraper based on the provider's state code.

**REQ-EVT-010:** When address validation begins, the system shall call the Geoapify API with the full address string.

**REQ-EVT-011:** When web enrichment begins, the system shall scrape the provider's website using Selenium with headless Edge browser.

**REQ-EVT-012:** When digital footprint analysis begins, the system shall search Google Scholar for recent publications.

### 3.3 Quality Assurance Events

**REQ-EVT-013:** When QA stage begins, the system shall execute 7 automated checks in sequence.

**REQ-EVT-014:** When an OIG exclusion is detected, the system shall immediately flag the provider as CRITICAL and set requires_human_review to true.

**REQ-EVT-015:** When a license status of "Suspended" or "Revoked" is detected, the system shall flag the provider as CRITICAL.

**REQ-EVT-016:** When address validation indicates a non-medical facility, the system shall add a fraud indicator to the provider record.

**REQ-EVT-017:** When digital footprint score is below 0.3, the system shall flag the provider as a potential "zombie" provider.

**REQ-EVT-018:** When address similarity exceeds 85% between sources, the system shall auto-correct to the highest authority source.

### 3.4 Confidence Scoring Events

**REQ-EVT-019:** When confidence scoring begins, the system shall calculate scores across 6 dimensions: primary source verification (35%), address reliability (20%), digital footprint (15%), data completeness (15%), freshness (10%), and fraud risk penalty (5%).

**REQ-EVT-020:** When final confidence score is calculated, the system shall classify the provider into one of three tiers: PLATINUM (90-100%), GOLD (65-89%), or QUESTIONABLE (0-64%).

**REQ-EVT-021:** When confidence score is 90% or above, the system shall auto-approve the provider and save to the validated_providers table.

**REQ-EVT-022:** When confidence score is between 65% and 89%, the system shall auto-approve with monitoring flag.

**REQ-EVT-023:** When confidence score is below 65%, the system shall route the provider to the review_queue table for human review.

### 3.5 Database Events

**REQ-EVT-024:** When a provider is saved to the database, the system shall create a corresponding entry in the verification_history table.

**REQ-EVT-025:** When a provider record is updated, the system shall update the updated_at timestamp to the current UTC time.

**REQ-EVT-026:** When a provider is added to the review queue, the system shall set priority to HIGH if fraud indicators exist, otherwise NORMAL.

### 3.6 Real-Time Streaming Events

**REQ-EVT-027:** When validation begins for a provider, the system shall stream a log message indicating the provider name and position in batch.

**REQ-EVT-028:** When each validation stage completes, the system shall stream a log message with the stage result.

**REQ-EVT-029:** When validation completes for a provider, the system shall stream the complete validation result as a JSON object.

**REQ-EVT-030:** When all providers in a batch are processed, the system shall stream a completion message with total count.

---

## 4. Unwanted Behaviors (Error Handling)

### 4.1 API Failures

**REQ-UNW-001:** If the NPPES API is unavailable, then the system shall set match_confidence to 0.0 and continue validation with degraded confidence.

**REQ-UNW-002:** If the Geoapify API returns an error, then the system shall log the error and set address confidence to 0.0.

**REQ-UNW-003:** If the Gemini Flash API fails, then the system shall automatically fallback to GPT-4o-mini as the secondary VLM.

**REQ-UNW-004:** If GPT-4o-mini fails, then the system shall fallback to Claude Haiku as the tertiary VLM.

**REQ-UNW-005:** If all VLM services fail, then the system shall return an error message indicating extraction failure.

**REQ-UNW-006:** If a state medical board scraper fails, then the system shall log the error and mark license status as "Unknown".

### 4.2 Data Quality Issues

**REQ-UNW-007:** If a provider record is missing the full_name field, then the system shall skip the record and log a warning.

**REQ-UNW-008:** If NPI format validation fails, then the system shall flag the provider for manual review.

**REQ-UNW-009:** If address parsing fails due to complex format, then the system shall flag for manual review with reason "Complex address format failed parsing".

**REQ-UNW-010:** If JSON extraction from LLM response fails, then the system shall attempt to clean the response by removing markdown code blocks and retry parsing.

**REQ-UNW-011:** If a provider has conflicting data that cannot be auto-resolved, then the system shall invoke AI arbitration using the LLM.

### 4.3 Database Errors

**REQ-UNW-012:** If database connection fails during initialization, then the system shall display troubleshooting steps and exit gracefully.

**REQ-UNW-013:** If a duplicate NPI is detected during save, then the system shall update the existing record instead of creating a new one.

**REQ-UNW-014:** If database save operation fails, then the system shall rollback the transaction and return null.

**REQ-UNW-015:** If the review queue save fails, then the system shall log the error and continue processing without blocking.

### 4.4 File Processing Errors

**REQ-UNW-016:** If file upload size exceeds limits, then the system shall reject the upload with an appropriate error message.

**REQ-UNW-017:** If CSV encoding cannot be detected, then the system shall try UTF-8, Latin-1, ISO-8859-1, and CP1252 in sequence.

**REQ-UNW-018:** If PDF conversion to images fails, then the system shall return an error indicating PDF processing failure.

**REQ-UNW-019:** If Excel file contains no valid provider data, then the system shall return an error message "No provider records found in file".

**REQ-UNW-020:** If temporary file cleanup fails, then the system shall log a warning but continue operation.

### 4.5 Authentication Errors

**REQ-UNW-021:** If JWT token is expired, then the system shall return HTTP 401 Unauthorized status.

**REQ-UNW-022:** If JWT token signature is invalid, then the system shall reject the request and log a security warning.

**REQ-UNW-023:** If user credentials are incorrect, then the system shall return an authentication failure message without revealing which field was incorrect.

### 4.6 Network Errors

**REQ-UNW-024:** If WebSocket connection is lost, then the system shall remove the connection from the active connections list.

**REQ-UNW-025:** If SSE stream encounters a send error, then the system shall mark the connection as disconnected and continue processing.

**REQ-UNW-026:** If external API request times out, then the system shall retry once with exponential backoff before failing.

---

## 5. State-Driven Requirements

### 5.1 Validation Pipeline States

**REQ-STA-001:** While in "VLM Extraction" state, the system shall preprocess images by resizing to optimal dimensions (1500-3000px) and enhancing sharpness and contrast.

**REQ-STA-002:** While in "NPPES Verification" state, the system shall prioritize NPI-based queries over name-based queries.

**REQ-STA-003:** While in "QA Stage" state, the system shall maintain a flag_severity dictionary categorizing flags as CRITICAL, WARNING, or INFO.

**REQ-STA-004:** While in "AI Arbitration" state, the system shall resolve conflicts using source authority hierarchy where state_medical_board (100) > nppes_api (90) > oig_leie (85) > google_business (70) > provider_website (60) > csv_upload (40).

**REQ-STA-005:** While in "Confidence Scoring" state, the system shall calculate risk_score as (CRITICAL_flags × 10) + (WARNING_flags × 3) + (fraud_indicators × 5).

### 5.2 Review Queue States

**REQ-STA-006:** While a provider is in "PENDING" review status, the system shall display the record in the review queue dashboard.

**REQ-STA-007:** While a provider is in "APPROVED" review status, the system shall move the record from review_queue to validated_providers table.

**REQ-STA-008:** While a provider is in "REJECTED" review status, the system shall archive the record and prevent it from entering the validated database.

### 5.3 Processing States

**REQ-STA-009:** While processing a batch upload, the system shall maintain a semaphore limiting concurrent workers to MAX_CONCURRENT_WORKERS (default: 5).

**REQ-STA-010:** While streaming validation results, the system shall send messages in JSON format with type field indicating "log", "result", or "close".

**REQ-STA-011:** While in testing mode (TESTING_MODE=true), the system shall inject mock data for exclusions, suspensions, and fraud scenarios.

### 5.4 Database Connection States

**REQ-STA-012:** While database connection is active, the system shall use connection pooling with pool_size=10 and max_overflow=20.

**REQ-STA-013:** While database session is open, the system shall automatically close the session in the finally block to prevent connection leaks.

### 5.5 Authentication States

**REQ-STA-014:** While user is authenticated, the system shall include the JWT token in the Authorization header as "Bearer <token>".

**REQ-STA-015:** While JWT token is valid, the system shall extract user_id from the token payload for audit logging.

---

## 6. Optional Requirements

### 6.1 Enhanced Features

**REQ-OPT-001:** Where image enhancement is enabled, the system shall apply sharpness enhancement factor of 1.2 and contrast enhancement factor of 1.1.

**REQ-OPT-002:** Where Excel files contain multiple sheets, the system shall process all sheets and aggregate provider records.

**REQ-OPT-003:** Where provider has a website URL, the system shall scrape the website for education, certifications, languages, and insurance information.

**REQ-OPT-004:** Where Google Scholar API is available, the system shall search for provider publications from the last 2 years.

**REQ-OPT-005:** Where address auto-healing is enabled, the system shall use fuzzy matching with 85% similarity threshold.

### 6.2 Analytics and Reporting

**REQ-OPT-006:** Where analytics dashboard is enabled, the system shall provide geolocation data for 3D globe visualization.

**REQ-OPT-007:** Where validation heatmap is requested, the system shall return stage-by-stage status for the last 50 validations.

**REQ-OPT-008:** Where confidence breakdown is requested, the system shall return 6-dimensional radar chart data for the last 10 providers.

**REQ-OPT-009:** Where PDF report generation is enabled, the system shall generate executive summary reports using jsPDF.

### 6.3 Advanced Validation

**REQ-OPT-010:** Where specialty verification is enabled, the system shall cross-reference input specialty against NPPES taxonomy codes.

**REQ-OPT-011:** Where license-address alignment check is enabled, the system shall flag providers where license state differs from practice state.

**REQ-OPT-012:** Where data freshness scoring is enabled, the system shall calculate freshness as 1.0 - (days_old / 365) with minimum of 0.1.

---

## 7. Performance Requirements

### 7.1 Response Time

**REQ-PERF-001:** The system shall complete NPPES API verification within 2 seconds average response time.

**REQ-PERF-002:** The system shall complete OIG LEIE CSV lookup within 0.5 seconds average response time.

**REQ-PERF-003:** The system shall complete state license verification within 5 seconds average response time.

**REQ-PERF-004:** The system shall complete address validation within 2 seconds average response time.

**REQ-PERF-005:** The system shall complete VLM extraction at 3-5 seconds per page for Gemini Flash.

### 7.2 Throughput

**REQ-PERF-006:** The system shall process a minimum of 500 providers per hour.

**REQ-PERF-007:** The system shall support batch uploads of up to 1000 providers.

**REQ-PERF-008:** The system shall maintain 5 concurrent validation workers without performance degradation.

### 7.3 Accuracy

**REQ-PERF-009:** The system shall achieve 95% or higher accuracy for VLM extraction from scanned PDFs.

**REQ-PERF-010:** The system shall achieve 88.89% or higher overall validation accuracy.

**REQ-PERF-011:** The system shall maintain false positive rate below 5%.

**REQ-PERF-012:** The system shall achieve 85% or higher auto-approval rate.

---

## 8. Data Requirements

### 8.1 Provider Data Model

**REQ-DATA-001:** The system shall store provider records with fields: full_name, NPI, specialty, address, city, state, zip_code, phone, license_number, website, last_updated.

**REQ-DATA-002:** The system shall maintain validation metadata including execution_metadata, quality_metrics, and data_provenance.

**REQ-DATA-003:** The system shall store QA flags as JSON array with severity classification.

**REQ-DATA-004:** The system shall store fraud indicators as JSON array.

**REQ-DATA-005:** The system shall maintain confidence breakdown with 6 dimensions: identity, address, completeness, freshness, enrichment, risk.

### 8.2 Database Schema

**REQ-DATA-006:** The system shall implement validated_providers table with unique constraint on NPI field.

**REQ-DATA-007:** The system shall implement review_queue table with status field (PENDING, APPROVED, REJECTED).

**REQ-DATA-008:** The system shall implement verification_history table with foreign key to validated_providers.

**REQ-DATA-009:** The system shall implement data_source_logs table for API usage tracking.

**REQ-DATA-010:** The system shall create indexes on frequently queried fields: npi, provider_name, state, confidence_score.

### 8.3 Data Retention

**REQ-DATA-011:** The system shall maintain verification history for audit trail purposes.

**REQ-DATA-012:** The system shall update the updated_at timestamp on every record modification.

**REQ-DATA-013:** The system shall store last_verified timestamp for re-validation scheduling.

---

## 9. Integration Requirements

### 9.1 External APIs

**REQ-INT-001:** The system shall integrate with NPPES NPI Registry API version 2.1.

**REQ-INT-002:** The system shall integrate with Geoapify Geocoding API for address validation.

**REQ-INT-003:** The system shall integrate with Google Gemini Flash 2.0 API for vision-based extraction.

**REQ-INT-004:** The system shall integrate with OpenAI GPT-4o-mini API as fallback VLM.

**REQ-INT-005:** The system shall integrate with Anthropic Claude Haiku API as tertiary fallback.

**REQ-INT-006:** The system shall integrate with Google Maps Places API for facility verification.

**REQ-INT-007:** The system shall integrate with Serper API for web search capabilities.

### 9.2 State Medical Board Integration

**REQ-INT-008:** The system shall implement scrapers for California (CA) medical board.

**REQ-INT-009:** The system shall implement scrapers for Texas (TX) medical board.

**REQ-INT-010:** The system shall implement scrapers for Florida (FL) medical board.

**REQ-INT-011:** The system shall implement scrapers for New York (NY) medical board.

**REQ-INT-012:** The system shall implement universal fallback for unsupported states.

### 9.3 Frontend-Backend Integration

**REQ-INT-013:** The system shall expose REST API endpoints at http://localhost:8000 for validation operations.

**REQ-INT-014:** The system shall expose authentication endpoints at http://localhost:8080 for user management.

**REQ-INT-015:** The system shall serve frontend application at http://localhost:5173 during development.

---

## 10. Compliance Requirements

### 10.1 Healthcare Standards

**REQ-COMP-001:** The system shall use official NPPES NPI Registry as the authoritative source for provider identification.

**REQ-COMP-002:** The system shall use official OIG LEIE database for federal exclusion screening.

**REQ-COMP-003:** The system shall verify provider licenses against state medical board databases.

### 10.2 Data Privacy

**REQ-COMP-004:** The system shall treat all provider data as Protected Health Information (PHI) under HIPAA guidelines.

**REQ-COMP-005:** The system shall implement audit trails for all data access and modifications.

**REQ-COMP-006:** The system shall support data export for GDPR right to data portability.

**REQ-COMP-007:** The system shall support data deletion for GDPR right to be forgotten.

### 10.3 Security Standards

**REQ-COMP-008:** The system shall follow OWASP guidelines for password hashing.

**REQ-COMP-009:** The system shall implement rate limiting on external API calls to respect service terms.

**REQ-COMP-010:** The system shall log all security-relevant events for SOC 2 compliance.

---

## 11. Traceability Matrix

| Requirement ID | Category | Priority | Verification Method |
|---------------|----------|----------|---------------------|
| REQ-UBI-001 to REQ-UBI-020 | Ubiquitous | High | Code Review, Static Analysis |
| REQ-EVT-001 to REQ-EVT-030 | Event-Driven | High | Integration Testing, E2E Testing |
| REQ-UNW-001 to REQ-UNW-026 | Error Handling | High | Unit Testing, Fault Injection |
| REQ-STA-001 to REQ-STA-015 | State-Driven | Medium | State Machine Testing |
| REQ-OPT-001 to REQ-OPT-012 | Optional | Low | Feature Testing |
| REQ-PERF-001 to REQ-PERF-012 | Performance | High | Load Testing, Benchmarking |
| REQ-DATA-001 to REQ-DATA-013 | Data | High | Database Testing, Schema Validation |
| REQ-INT-001 to REQ-INT-015 | Integration | High | API Testing, Integration Testing |
| REQ-COMP-001 to REQ-COMP-010 | Compliance | Critical | Compliance Audit, Security Review |

---

## 12. Glossary

- **EARS**: Easy Approach to Requirements Syntax
- **NPI**: National Provider Identifier (10-digit unique identifier)
- **NPPES**: National Plan and Provider Enumeration System
- **OIG LEIE**: Office of Inspector General List of Excluded Individuals/Entities
- **VLM**: Vision Language Model
- **SSE**: Server-Sent Events
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **PHI**: Protected Health Information
- **HIPAA**: Health Insurance Portability and Accountability Act
- **GDPR**: General Data Protection Regulation
- **SOC 2**: Service Organization Control 2

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | Health Atlas Team | Initial requirements specification |

**Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| QA Lead | | | |

---

*End of Requirements Specification*
