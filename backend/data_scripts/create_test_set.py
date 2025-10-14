import pandas as pd
import numpy as np
import random
from faker import Faker

# --- Configuration ---
GROUND_TRUTH_INPUT_FILE = '../Sample_Data/ground_truth.csv'
TEST_DATA_OUTPUT_FILE = '../Sample_Data/input_test_data.csv'

CORRUPTION_PERCENTAGE = 0.4  # Increased to create more errors
NUM_FAKE_RECORDS = 50       # Reduced for a more focused test syet
NEGATIVE_TEST_PERCENTAGE = 0.05 # Percentage of rows to add blank critical data to

fake = Faker()

# --- Corruption Functions (largely unchanged) ---
def corrupt_phone_number(phone):
    if pd.isna(phone): return phone
    phone_str = str(phone).split('.')[0]
    actions = ['swap', 'remove', 'add', 'format']
    action = random.choice(actions)
    if len(phone_str) < 2: return phone_str + str(random.randint(0, 9))
    if action == 'swap':
        idx = random.randrange(len(phone_str) - 1)
        phone_list = list(phone_str)
        phone_list[idx], phone_list[idx+1] = phone_list[idx+1], phone_list[idx]
        return "".join(phone_list)
    elif action == 'remove':
        idx = random.randrange(len(phone_str))
        return phone_str[:idx] + phone_str[idx+1:]
    elif action == 'add':
        idx = random.randrange(len(phone_str))
        digit = str(random.randint(0, 9))
        return phone_str[:idx] + digit + phone_str[idx:]
    elif action == 'format' and len(phone_str) >= 10:
        return f"({phone_str[:3]}) {phone_str[3:6]}-{phone_str[6:10]}"
    return phone_str

def corrupt_address(address):
    if pd.isna(address): return address
    address_str = str(address)
    actions = ['typo', 'shorten', 'add_junk', 'remove_street_type']
    action = random.choice(actions)
    if action == 'typo' and len(address_str) > 1:
        idx = random.randrange(len(address_str) - 1)
        address_list = list(address_str)
        if address_list[idx].isalnum() and address_list[idx+1].isalnum():
            address_list[idx], address_list[idx+1] = address_list[idx+1], address_list[idx]
            return "".join(address_list)
    elif action == 'shorten' and ' ' in address_str:
        return address_str.split(' ', 1)[1]
    elif action == 'add_junk':
        return f"APT {random.randint(1, 99)}"
    elif action == 'remove_street_type':
        return address_str.replace(' St', '').replace(' Ave', '').replace(' Rd', '').replace(' Dr', '')
    return address_str

# --- Main Script ---
def create_dirty_test_set():
    print(f"Reading clean data from '{GROUND_TRUTH_INPUT_FILE}'...")
    try:
        df = pd.read_csv(GROUND_TRUTH_INPUT_FILE, dtype=str)
    except FileNotFoundError:
        print(f"ERROR: The file '{GROUND_TRUTH_INPUT_FILE}' was not found.")
        return

    df_dirty = df.copy()
    num_rows_to_corrupt = int(len(df_dirty) * CORRUPTION_PERCENTAGE)
    indices_to_corrupt = np.random.choice(df_dirty.index, num_rows_to_corrupt, replace=False)
    print(f"Corrupting {num_rows_to_corrupt} existing records...")

    df_dirty.loc[indices_to_corrupt, 'phone_number'] = df_dirty.loc[indices_to_corrupt, 'phone_number'].apply(corrupt_phone_number)
    df_dirty.loc[indices_to_corrupt, 'address'] = df_dirty.loc[indices_to_corrupt, 'address'].apply(corrupt_address)

    print(f"Adding {NUM_FAKE_RECORDS} new fake records...")
    fake_records = []
    for _ in range(NUM_FAKE_RECORDS):
        record = {
            'NPI': str(fake.unique.random_number(digits=10, fix_len=True)),
            'full_name': fake.name(),
            'address': fake.street_address(),
            'city': fake.city(),
            'state': fake.state_abbr(),
            'zip_code': fake.zipcode(),
            'phone_number': fake.msisdn()[:10]
        }
        fake_records.append(record)

    df_fake = pd.DataFrame(fake_records)
    df_final = pd.concat([df_dirty, df_fake], ignore_index=True)

    # --- NEW: Member Impact Simulation ---
    print("Simulating member impact counts...")
    min_members, max_members = 50, 2000
    df_final['member_count'] = np.random.randint(min_members, max_members, size=len(df_final))

    # --- NEW: Mocked License Data Generation ---
    print("Generating mocked license data...")
    licenses = []
    for state in df_final['state']:
        if random.random() < 0.1: # 10% chance of an issue
            licenses.append(random.choice([np.nan, "SUSPENDED"]))
        else:
            licenses.append(f"{state}{fake.random_number(digits=5, fix_len=True)}")
    df_final['license_number'] = licenses

    # --- NEW: Strong Negative Testing (Blank critical data) ---
    print("Injecting blank values for negative testing...")
    num_to_blank = int(len(df_final) * NEGATIVE_TEST_PERCENTAGE)
    blank_npi_indices = np.random.choice(df_final.index, num_to_blank, replace=False)
    blank_addr_indices = np.random.choice(df_final.index, num_to_blank, replace=False)
    df_final.loc[blank_npi_indices, 'NPI'] = np.nan
    df_final.loc[blank_addr_indices, 'address'] = np.nan
    
    # --- Final Shuffle and Save ---
    df_final = df_final.sample(frac=1, random_state=42).reset_index(drop=True)
    df_final.to_csv(TEST_DATA_OUTPUT_FILE, index=False)
    print(f"\nSuccessfully created '{TEST_DATA_OUTPUT_FILE}' with {len(df_final)} records.")
    print("Test data now includes member counts, license numbers, and blank values.")

if __name__ == "__main__":
    create_dirty_test_set()