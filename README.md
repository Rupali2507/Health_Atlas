# 🩺 Health Atlas: Autonomous Provider Data Validation Service (Basic Version)

**Health Atlas** is an intelligent, full-stack web application designed to address one of the healthcare industry's most persistent challenges — **inaccurate and outdated provider data**.  
It leverages a **multi-agent AI system** that autonomously verifies, corrects, and enriches provider information from diverse sources, producing a trusted, continuously improving data repository.

---

## ✨ Key Features

- **Real-Time Validation:** Upload a CSV file of provider data and watch as the system validates and enhances each record in real time.  
- **Multi-Agent Workflow:** A deterministic AI pipeline powered by LangGraph and Groq API, where each agent specializes in a distinct cognitive role:
  - 🧠 **Data Validation Agent** – Cross-checks provider information against the official NPI registry and validates physical addresses.
  - 🌐 **Information Enrichment Agent** – Scrapes provider websites and other public records to supplement missing data.
  - 🔍 **Quality Assurance Agent** – Performs source reconciliation, flags inconsistencies, and scores record reliability.
  - 🗂 **Directory Management Agent** – Synthesizes all validated and enriched data into a standardized final profile.
- **Confidence Scoring:** Every record receives a confidence score reflecting the system's certainty in its accuracy.  
- **Dynamic Dashboard:** Visual analytics of processed providers, confidence averages, and anomaly alerts.

---

## 🚀 Tech Stack

**Backend:** Python, FastAPI, LangGraph, Groq API  
**Frontend:** React, Vite, Tailwind CSS  
**Core Tools:** Selenium, Geoapify, Pandas

---

## 🧩 Getting Started

### Prerequisites

- Python 3.10+  
- Node.js and npm  
- Git

---

### ⚙️ 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Health_Atlas
```

### 🖥️ 2. Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Add environment variables in `.env`:

```bash
GROQ_API_KEY="your-groq-api-key-here"
GEOAPIFY_API_KEY="your-geoapify-api-key-here"
```

Start the backend server:

```bash
uvicorn main:app --reload
```

Server URL: http://127.0.0.1:8000

---

### 🔬 Backend Deep Dive: AI Logic & Data Validation Pipeline

The backend of Health Atlas is not just a collection of APIs — it is an autonomous reasoning engine built to think like a human data analyst, but faster, more consistent, and verifiable.  
It follows a multi-agent architecture, where each agent operates within a defined cognitive boundary, communicating through LangGraph to achieve a complete validation cycle.

#### 🧠 System Intelligence Overview

**Data Ingestion:**  
The pipeline begins when a CSV file of provider data is uploaded. Each record is treated as an independent reasoning unit that flows through the AI validation graph.

**Autonomous Validation Cycle:**

- The Data Validation Agent queries the official NPI Registry — the federal database of registered healthcare providers — to establish a baseline "ground truth."
- The Address Validation Submodule then confirms geographical accuracy using the Geoapify API, returning not only a match but also a confidence score, which becomes a core feature in downstream analytics.

**Data Enrichment:**

- Once validation is complete, the Information Enrichment Agent uses Selenium-based scraping to visit provider websites or public directories.
- It extracts metadata like education, certifications, and affiliations — information often missing or inconsistently recorded in payer databases.
- Each enrichment step includes structured exception handling to maintain reliability even in the face of dynamic web content or failed lookups.

**Cross-Source Reconciliation:**

- The Quality Assurance Agent performs cross-source validation, comparing data consistency between the NPI registry, scraped data, and uploaded input.
- It highlights mismatches, computes a discrepancy index, and recommends manual review for uncertain records.

**Synthesis and Standardization:**

- Finally, the Directory Management Agent consolidates all the verified and enriched information into a single structured provider object — a clean, normalized, and truth-aligned dataset.

#### 🧰 The Agent's Toolkit (tools.py)

At the core of the backend lies a specialized toolkit — a library of safeguarded Python utilities that the agents rely upon to act intelligently.

| Function | Description |
|----------|-------------|
| 🔎 `search_npi_registry()` | Connects to the US Government's official NPI database to retrieve verified provider details, handling API limits and network errors gracefully. |
| 📄 `parse_provider_pdf()` | Converts unstructured provider documents into clean, extractable text using PyPDF2, ensuring broad compatibility across file types. |
| 🌐 `scrape_provider_website()` | Uses Selenium to dynamically interact with websites, extracting relevant provider information even from JavaScript-rendered pages. |
| 🗺 `validate_address()` | Uses the Geoapify API to check address accuracy and compute a geographic confidence score — a critical metric for our trust layer. |

Together, these tools form the sensory system of the Health Atlas AI — the eyes and ears through which the agents perceive and interpret the external world.



### 💻 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

---

### 🧠 4. Running the Application

Start both backend and frontend servers.

Visit the frontend URL.

Upload a CSV of provider data and monitor live validation progress — each record will pass through the AI's autonomous validation pipeline, producing structured, reliable, and enriched data in real time.

---

## 🧭 Vision

Health Atlas is a step toward self-healing data ecosystems — systems that not only detect but autonomously repair data drift in critical infrastructures like healthcare.  
This foundation can scale toward enterprise-grade deployments where data reliability becomes an autonomous service.
