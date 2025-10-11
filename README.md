# Health Atlas - AI Provider Validator

This repository contains the backend components for the "Health Atlas" project. The work includes scripts for generating realistic healthcare provider datasets and a comprehensive Python library of tools for an AI agent to use for data validation.

This document provides a complete guide to setting up the environment, installing dependencies, configuring API keys, and running all provided scripts.

## Table of Contents
1.  [Core Features](#1-core-features)
2.  [Getting Started: Full Setup Guide](#2-getting-started-full-setup-guide)
    - [Prerequisites](#prerequisites)
    - [Step 1: Clone the Repository](#step-1-clone-the-repository)
    - [Step 2: Create the Conda Environment](#step-2-create-the-conda-environment)
    - [Step 3: Install Python Dependencies](#step-3-install-python-dependencies)
    - [Step 4: Install System Dependencies](#step-4-install-system-dependencies)
    - [Step 5: Configure API Key](#step-5-configure-api-key)
3.  [How to Run the Project](#3-how-to-run-the-project)
    - [Testing the Tool Library (Primary Use)](#testing-the-tool-library-primary-use)
    - [Regenerating the Datasets (Optional)](#regenerating-the-datasets-optional)
4.  [Project Structure](#4-project-structure)

---

## 1. Core Features

This repository provides two main sets of functionalities, both located in the `backend/` directory:

*   **Data Generation Scripts (`backend/data_scripts/`):** A collection of scripts to create a clean "ground truth" dataset, a corrupted "dirty" dataset for testing, and a sample PDF provider directory.
*   **Validation Tool Library (`backend/tools.py`):** A Python module containing four distinct tools that an AI agent can call to perform validation tasks.
    1.  **NPI Registry Search:** Looks up provider data from the official US government NPI database.
    2.  **PDF Text Parser:** Extracts text content from PDF documents.
    3.  **Dynamic Web Scraper:** Scrapes provider websites, correctly handling JavaScript-loaded content.
    4.  **Address Validator:** Verifies physical addresses using the Geoapify Geocoding API.

---

## 2. Getting Started: Full Setup Guide

Follow these steps to set up a working environment on your local machine.

### Prerequisites
*   [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) installed.
*   [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/products/distribution) installed.

### Step 1: Clone the Repository
Open your terminal and clone the project to your local machine.
```bash
git clone https://github.com/Rupali2507/Health_Atlas.git
cd Health_Atlas```

### Step 2: Create the Conda Environment
This project uses a specific Python version for compatibility. Use the following command to create and activate the Conda environment.
```bash
# Create the environment named 'hackathon' with Python 3.11
conda create --name hackathon python=3.11 -y

# Activate the environment (you must do this every time you work on the project)
conda activate hackathon
Step 3: Install Python Dependencies

All required Python libraries are listed in backend/requirements.txt.

code
Bash
download
content_copy
expand_less
# Navigate to the backend directory
cd backend

# Install all libraries using pip
pip install -r requirements.txt
Step 4: Install System Dependencies

The web scraping tool (selenium) requires a browser and a corresponding driver. On Ubuntu/Debian based systems, this can be installed with the following command:

code
Bash
download
content_copy
expand_less
sudo apt-get update && sudo apt-get install chromium-browser chromium-chromedriver -y

For other operating systems, you will need to install a compatible browser (like Chrome or Firefox) and its corresponding WebDriver.

Step 5: Configure API Key

The address validation tool requires a free API key from Geoapify. A credit card is not required for the free tier.

Sign up for a free account at https://www.geoapify.com/.

Create a project in your Geoapify dashboard.

Copy your API key from that project's page.

Set the key as an environment variable in your terminal. This keeps your key secure and out of the source code.

On Linux/macOS:

code
Bash
download
content_copy
expand_less
export GEOAPIFY_API_KEY="PASTE_YOUR_KEY_HERE"

On Windows (Command Prompt):```bash
set GEOAPIFY_API_KEY="PASTE_YOUR_KEY_HERE"

code
Code
download
content_copy
expand_less
**Important:** You must set this environment variable every time you open a new terminal session to work on the project.

---

## 3. How to Run the Project

### Testing the Tool Library (Primary Use)
To verify that your environment is set up correctly and all tools are functional, you can run the `tools.py` script. This will execute a test case for each of the four tools.

```bash
# Make sure your 'ey-hackathon' environment is active
# Make sure you have set your GEOAPIFY_API_KEY environment variable
# Make sure you are in the 'backend' directory

python tools.py

A successful run will show the output of all four test cases without any errors.

Regenerating the Datasets (Optional)

The repository includes the pre-generated data files. If you wish to regenerate them, follow these steps.

Prerequisite: Download the full NPPES Data Dissemination file (the large monthly NPI CSV file) from the official CMS.gov page.

Running the Scripts:
All commands must be run from the backend directory.

Update Script Path: Open backend/data_scripts/create_ground_truth.py and change the NPPES_FULL_FILE variable to the correct file path of the large NPPES file you downloaded.

Run the Scripts in Order:

code
Bash
download
content_copy
expand_less
# 1. Create the clean ground_truth.csv
python data_scripts/create_ground_truth.py

# 2. Create the corrupted input_test_data.csv
python data_scripts/create_test_set.py

# 3. Create the sample provider_directory.pdf
python data_scripts/generate_pdf.py
4. Project Structure
code
Code
download
content_copy
expand_less
Health_Atlas/
├── backend/
│   ├── data_scripts/             # Scripts to generate datasets
│   │   ├── create_ground_truth.py
│   │   ├── create_test_set.py
│   │   └── generate_pdf.py
│   ├── ground_truth.csv          # (Generated) Clean provider data
│   ├── input_test_data.csv       # (Generated) Corrupted provider data
│   ├── provider_directory.pdf    # (Generated) Sample PDF
│   ├── requirements.txt          # List of Python dependencies for pip
│   └── tools.py                  # The main tool library for the AI agent
│
├── .gitignore                    # Specifies files for Git to ignore
└── README.md                     # This instruction file
code
Code
download
content_copy
expand_less
