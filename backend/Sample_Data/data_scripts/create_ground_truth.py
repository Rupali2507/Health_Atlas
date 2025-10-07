import pandas as pd
import numpy as np
import os

# --- CONFIGURATION ---
NPPES_FULL_FILE = '/home/sk/NPPES_Data_Dissemination_September_2025_V2/npidata_pfile_20050523-20250907.csv'

# The final clean CSV file will be saved here.
GROUND_TRUTH_OUTPUT_FILE = 'ground_truth.csv'

# Number of providers to select for our sample dataset.
SAMPLE_SIZE = 1000

# We will read these columns to create the full name and select the practice address.
COLUMNS_TO_READ = [
    'NPI',
    'Provider Last Name (Legal Name)',
    'Provider First Name',
    'Provider Middle Name',
    'Provider First Line Business Practice Location Address',
    'Provider Business Practice Location Address City Name',
    'Provider Business Practice Location Address State Name',
    'Provider Business Practice Location Address Postal Code',
    'Provider Business Practice Location Address Telephone Number',
]
# --- END CONFIGURATION ---

def create_ground_truth_sample():
    """
    Reads the full NPPES data file using the correct column names, combines
    the provider's name, and creates a clean sample CSV.
    """
    print(f"Reading full NPPES data file from: {NPPES_FULL_FILE}")
    
    try:
        # Use chunking to handle the large file size without running out of memory
        chunk_iterator = pd.read_csv(
            NPPES_FULL_FILE,
            usecols=COLUMNS_TO_READ,
            chunksize=100000,
            dtype=str,
            low_memory=False
        )

        # Filter chunks for individual providers with address info
        filtered_chunks = []
        for chunk in chunk_iterator:
            valid_chunk = chunk.dropna(
                subset=[
                    'Provider First Name',
                    'Provider First Line Business Practice Location Address'
                ]
            )
            filtered_chunks.append(valid_chunk)
        
        df_full = pd.concat(filtered_chunks, ignore_index=True)
        print(f"Found {len(df_full)} potential individual providers with practice address info.")

        # Create a random sample
        print(f"Creating a random sample of {SAMPLE_SIZE} providers...")
        df_sample = df_full.sample(n=SAMPLE_SIZE, random_state=42)

        # --- NEW: Combine name fields into a single 'full_name' ---
        # Fill in missing (NaN) middle names with an empty string
        df_sample['Provider Middle Name'] = df_sample['Provider Middle Name'].fillna('')
        
        # Concatenate the name parts
        df_sample['full_name'] = (
            df_sample['Provider First Name'] + ' ' +
            df_sample['Provider Middle Name'] + ' ' +
            df_sample['Provider Last Name (Legal Name)']
        )
        # Clean up any double spaces that might result from an empty middle name
        df_sample['full_name'] = df_sample['full_name'].str.replace(r'\s+', ' ', regex=True).str.strip()


        # --- UPDATED: Rename the practice location columns to simple names ---
        df_sample = df_sample.rename(columns={
            'Provider First Line Business Practice Location Address': 'address',
            'Provider Business Practice Location Address City Name': 'city',
            'Provider Business Practice Location Address State Name': 'state',
            'Provider Business Practice Location Address Postal Code': 'zip_code',
            'Provider Business Practice Location Address Telephone Number': 'phone_number'
        })
        
        # Clean up the ZIP code to keep only the first 5 digits
        df_sample['zip_code'] = df_sample['zip_code'].str.slice(0, 5)

        # --- NEW: Select only the final desired columns for the output file ---
        final_columns = [
            'NPI',
            'full_name',
            'address',
            'city',
            'state',
            'zip_code',
            'phone_number'
        ]
        df_final = df_sample[final_columns]

        # Save the final clean file
        df_final.to_csv(GROUND_TRUTH_OUTPUT_FILE, index=False)
        
        print(f"\nSuccessfully created '{GROUND_TRUTH_OUTPUT_FILE}' with {len(df_final)} records.")
        print(f"Columns in final file: {list(df_final.columns)}")

    except FileNotFoundError:
        print(f"ERROR: The file was not found at '{NPPES_FULL_FILE}'")
        print("Please make sure the path is correct.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    create_ground_truth_sample()
