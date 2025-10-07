import pandas as pd
import numpy as np
import random
from faker import Faker

# --- CONFIGURATION ---
# The clean "answer key" file we just created
GROUND_TRUTH_INPUT_FILE = 'ground_truth.csv'

# The final "dirty" file that our AI will use as input
TEST_DATA_OUTPUT_FILE = 'input_test_data.csv'

# How much of the existing data should we corrupt?
CORRUPTION_PERCENTAGE = 0.3

# How many completely new, fake records should we add?
NUM_FAKE_RECORDS = 100
# --- END CONFIGURATION ---

# Initialize Faker to generate realistic fake data
fake = Faker()

def corrupt_phone_number(phone):
    """Randomly alters a phone number in a few common ways."""
    if pd.isna(phone):
        return phone
    phone_str = str(phone).split('.')[0] # Clean up if it's a float
    actions = ['swap', 'remove', 'add', 'format']
    action = random.choice(actions)

    if len(phone_str) < 2:
        return phone_str + str(random.randint(0,9))

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
        digit = str(random.randint(0,9))
        return phone_str[:idx] + digit + phone_str[idx:]
    elif action == 'format':
         return f"({phone_str[:3]}) {phone_str[3:6]}-{phone_str[6:]}"
    return phone_str

def corrupt_address(address):
    """Randomly alters an address in a few common ways."""
    if pd.isna(address):
        return address
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
        return address_str.split(' ', 1)[1] # Remove first part (e.g., number)
    elif action == 'add_junk':
        return f"STE {random.randint(1,500)} {address_str}"
    elif action == 'remove_street_type':
        return address_str.replace(' St', '').replace(' Ave', '').replace(' Rd', '').replace(' Dr', '')
    return address_str


def create_dirty_test_set():
    """
    Reads the clean ground_truth.csv and creates a corrupted version
    for the AI to validate.
    """
    print(f"Reading clean data from '{GROUND_TRUTH_INPUT_FILE}'...")
    try:
        df = pd.read_csv(GROUND_TRUTH_INPUT_FILE, dtype=str)
    except FileNotFoundError:
        print(f"ERROR: The file '{GROUND_TRUTH_INPUT_FILE}' was not found.")
        print("Please run the 'create_ground_truth.py' script first.")
        return

    df_dirty = df.copy()

    num_rows_to_corrupt = int(len(df_dirty) * CORRUPTION_PERCENTAGE)
    indices_to_corrupt = np.random.choice(df_dirty.index, num_rows_to_corrupt, replace=False)

    print(f"Corrupting phone numbers and addresses for {num_rows_to_corrupt} records...")

    # Apply corruptions to a subset of rows
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

    # Shuffle the final dataset so the fake records aren't all at the end
    df_final = df_final.sample(frac=1, random_state=42).reset_index(drop=True)

    df_final.to_csv(TEST_DATA_OUTPUT_FILE, index=False)
    print(f"\nSuccessfully created '{TEST_DATA_OUTPUT_FILE}' with {len(df_final)} records.")


if __name__ == "__main__":
    create_dirty_test_set()
