import pandas as pd
import numpy as np
import random

GROUND_TRUTH_INPUT_FILE = '../Sample_Data/ground_truth.csv'
TEST_DATA_OUTPUT_FILE = '../Sample_Data/input_test_data.csv'

CORRUPTION_PERCENTAGE = 0.30          # mild corruption → YELLOW
NEGATIVE_TEST_PERCENTAGE = 0.02       # true failures → RED
LICENSE_WARNING_PERCENTAGE = 0.10     # warning only

# ---------------- Corruption helpers ----------------

def corrupt_phone(phone):
    if pd.isna(phone): 
        return phone
    phone = str(phone)
    if len(phone) < 6: 
        return phone
    i = random.randint(0, len(phone)-2)
    return phone[:i] + phone[i+1] + phone[i] + phone[i+2:]

def corrupt_address(addr):
    if pd.isna(addr): 
        return addr
    addr = str(addr)
    if " " in addr and random.random() < 0.6:
        # realistic truncation
        return addr.split(" ", 1)[1]
    # light typo
    i = random.randint(0, len(addr)-2)
    return addr[:i] + addr[i+1] + addr[i] + addr[i+2:]

# ---------------- Main generator ----------------

def create_dirty_test_set():
    df = pd.read_csv(GROUND_TRUTH_INPUT_FILE, dtype=str)
    df_dirty = df.copy()

    # --- 1. Mild corruption (QA warnings → YELLOW)
    num_corrupt = int(len(df) * CORRUPTION_PERCENTAGE)
    corrupt_indices = np.random.choice(df.index, num_corrupt, replace=False)

    for idx in corrupt_indices:
        if random.random() < 0.5:
            df_dirty.at[idx, 'phone'] = corrupt_phone(df_dirty.at[idx, 'phone'])
        else:
            df_dirty.at[idx, 'address'] = corrupt_address(df_dirty.at[idx, 'address'])

    # --- 2. License uncertainty (NOT suspension)
    license_warn = np.random.choice(
        df_dirty.index,
        int(len(df_dirty) * LICENSE_WARNING_PERCENTAGE),
        replace=False
    )
    df_dirty.loc[license_warn, 'license'] = 'UNKNOWN'

    # --- 3. True negative tests (hard failures)
    blank_npi = np.random.choice(
        df_dirty.index,
        int(len(df) * NEGATIVE_TEST_PERCENTAGE),
        replace=False
    )
    df_dirty.loc[blank_npi, 'npi'] = np.nan

    # --- Final shuffle
    df_dirty = df_dirty.sample(frac=1, random_state=42).reset_index(drop=True)
    df_dirty.to_csv(TEST_DATA_OUTPUT_FILE, index=False)

    print("✅ Dirty test set created")
    print(f"📄 Output: {TEST_DATA_OUTPUT_FILE}")
    print(f"📊 Rows: {len(df_dirty)}")

if __name__ == "__main__":
    create_dirty_test_set()
