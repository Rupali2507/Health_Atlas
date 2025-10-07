import pandas as pd
from fpdf import FPDF

# --- CONFIGURATION ---
# ✅ PATH CORRECTED: Points up one level and into the Sample_Data folder.
SOURCE_DATA_FILE = '../Sample_Data/ground_truth.csv'
PDF_OUTPUT_FILE = '../Sample_Data/provider_directory.pdf'

NUM_RECORDS_FOR_PDF = 20
# --- END CONFIGURATION ---

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Sunshine Health System - Provider Directory', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def add_provider_record(self, record):
        self.set_font('Arial', 'B', 11)
        self.cell(0, 10, record['full_name'], 0, 1)
        self.set_font('Arial', '', 10)
        self.cell(0, 6, f"   NPI: {record['NPI']}", 0, 1)
        self.cell(0, 6, f"   Phone: {record['phone_number']}", 0, 1)
        self.cell(0, 6, f"   Address: {record['address']}, {record['city']}, {record['state']} {record['zip_code']}", 0, 1)
        self.ln(5)

def generate_provider_pdf():
    print(f"Reading provider data from '{SOURCE_DATA_FILE}'...")
    try:
        df = pd.read_csv(SOURCE_DATA_FILE, dtype=str)
    except FileNotFoundError:
        print(f"ERROR: The file '{SOURCE_DATA_FILE}' was not found.")
        return

    pdf = PDF()
    pdf.add_page()
    pdf_sample = df.head(NUM_RECORDS_FOR_PDF)
    print(f"Generating PDF with {len(pdf_sample)} records...")

    for index, row in pdf_sample.iterrows():
        pdf.add_provider_record(row)
    
    pdf.output(PDF_OUTPUT_FILE)
    print(f"\nSuccessfully created '{PDF_OUTPUT_FILE}'.")

if __name__ == "__main__":
    generate_provider_pdf()