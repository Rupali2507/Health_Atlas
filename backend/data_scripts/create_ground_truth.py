import pandas as pd
import numpy as np
import os


NPPES_FULL_FILE = '/home/sk/NPPES_Data_Dissemination_September_2025_V2/npidata_pfile_20050523-20250907.csv'

GROUND_TRUTH_OUTPUT_FILE = '../Sample_Data/ground_truth.csv'

SAMPLE_SIZE = 1000
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

def create_ground_truth_sample():
    """
    Reads the full NPPES data file, combines the provider's name,
    and creates a clean sample CSV.
    """
    print(f"Reading full NPPES data file from: {NPPES_FULL_FILE}")
    
    try:
        chunk_iterator = pd.read_csv(
            NPPES_FULL_FILE,
            usecols=COLUMNS_TO_READ,
            chunksize=100000,
            dtype=str,
            low_memory=False
        )

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
        print(f"Found {len(df_full)} potential providers with address info.")

        print(f"Creating a random sample of {SAMPLE_SIZE} providers...")
        df_sample = df_full.sample(n=SAMPLE_SIZE, random_state=42)

        df_sample['Provider Middle Name'] = df_sample['Provider Middle Name'].fillna('')
        
        df_sample['full_name'] = (
            df_sample['Provider First Name'] + ' ' +
            df_sample['Provider Middle Name'] + ' ' +
            df_sample['Provider Last Name (Legal Name)']
        )
        df_sample['full_name'] = df_sample['full_name'].str.replace(r'\s+', ' ', regex=True).str.strip()

        df_sample = df_sample.rename(columns={
            'Provider First Line Business Practice Location Address': 'address',
            'Provider Business Practice Location Address City Name': 'city',
            'Provider Business Practice Location Address State Name': 'state',
            'Provider Business Practice Location Address Postal Code': 'zip_code',
            'Provider Business Practice Location Address Telephone Number': 'phone_number'
        })
        
        df_sample['zip_code'] = df_sample['zip_code'].str.slice(0, 5)

        final_columns = [
            'NPI', 'full_name', 'address', 'city', 'state', 'zip_code', 'phone_number'
        ]
        df_final = df_sample[final_columns]

        df_final.to_csv(GROUND_TRUTH_OUTPUT_FILE, index=False)
        
        print(f"\nSuccessfully created '{GROUND_TRUTH_OUTPUT_FILE}' with {len(df_final)} records.")
        print(f"Columns in final file: {list(df_final.columns)}")

    except FileNotFoundError:
        print(f"ERROR: The file was not found at '{NPPES_FULL_FILE}'")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    create_ground_truth_sample()