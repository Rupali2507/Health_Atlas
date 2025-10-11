# 🩺 Health Atlas: Autonomous Provider Data Validation Service (Basic Version)

**Health Atlas** is an intelligent, full-stack web application designed to solve the critical problem of inaccurate and outdated healthcare provider data.
It leverages a **multi-agent AI system** to autonomously verify, correct, and enrich provider information from various sources, providing a **reliable source of truth** for the healthcare industry.

This project was developed for **EY Techathon 6.0**, addressing **Problem Statement 6**.

---

## ✨ Key Features

* **Real-Time Validation**: Upload a CSV file of provider data and watch as our AI agent processes each record in real time.
* **Multi-Agent Pipeline**: The system uses a deterministic pipeline that embodies four key agentic roles:

  * 🧠 **Data Validation Agent**: Cross-references provider information against the official NPI registry and validates physical addresses.
  * 🌐 **Information Enrichment Agent**: Scrapes provider websites to extract additional details like education and board certifications.
  * 🔍 **Quality Assurance Agent**: Compares data across sources to identify discrepancies and flags records for manual review.
  * 🗂️ **Directory Management Agent**: Synthesizes all gathered information into a final, clean, and standardized provider profile.
* **Confidence Scoring**: Each validated record receives a confidence score to help operators prioritize low-confidence entries.
* **Dynamic Dashboard**: A comprehensive dashboard displays key metrics including total providers processed, average confidence score, and high-priority alerts.

---

## 🚀 Tech Stack

**Backend:** Python, FastAPI, LangGraph, Groq API
**Frontend:** React, Vite, Tailwind CSS
**Core Tools:** Selenium, Geoapify, Pandas

---

## 📋 Getting Started

Follow these instructions to get the project running on your local machine.

### 🧩 Prerequisites

* Python 3.10+
* Node.js and npm
* Git

---

### ⚙️ 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Health_Atlas
```

---

### 🖥️ 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
# For Windows
python -m venv .venv
.\.venv\Scripts\activate
```

Install all required Python packages:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the backend directory and add your API keys:

```bash
GROQ_API_KEY="your-groq-api-key-here"
GEOAPIFY_API_KEY="your-geoapify-api-key-here"
```

Start the backend server:

```bash
uvicorn main:app --reload
```

The server will be running at:

```
http://127.0.0.1:8000
```

---

### 💻 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install all required Node.js packages:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The application will be accessible at the local URL provided (usually):

```
http://localhost:5173
```

---

### 🧠 4. Running the Application

1. Ensure both the **backend** and **frontend** servers are running.
2. Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
3. Go to the **Upload** page, upload a sample CSV file, and start the validation process.
