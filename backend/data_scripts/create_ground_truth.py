import pandas as pd
import requests
import zipfile
from bs4 import BeautifulSoup
from pathlib import Path
import io
from urllib.parse import urljoin


# ================= CONFIG =================
CMS_INDEX_URL = "https://download.cms.gov/nppes/NPI_Files.html"

DATA_DIR = Path("../Sample_Data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

ZIP_PATH = DATA_DIR / "nppes_latest.zip"
CSV_PATH = DATA_DIR / "nppes_full.csv"
GROUND_TRUTH_OUTPUT_FILE = DATA_DIR / "ground_truth.csv"

SAMPLE_SIZE = 300  # start small

COLUMNS_TO_READ = [
    'NPI',
    'Provider First Name',
    'Provider Last Name (Legal Name)',
    'Provider First Line Business Practice Location Address',
    'Provider Business Practice Location Address City Name',
    'Provider Business Practice Location Address State Name',
    'Provider Business Practice Location Address Postal Code',
    'Provider Business Practice Location Address Telephone Number',
    'Healthcare Provider Taxonomy Code_1',
    'Last Update Date'
]

# ============== FIND LATEST ZIP =================
def find_latest_nppes_zip():
    print("🔎 Discovering latest NPPES ZIP from CMS...")

    resp = requests.get(CMS_INDEX_URL, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    zip_links = []

    for link in soup.find_all("a", href=True):
        href = link["href"].strip()
        href_lower = href.lower()

        if (
            href_lower.endswith(".zip")
            and "data_dissemination" in href_lower
            and "v2" in href_lower
            and "weekly" not in href_lower
            and "deactivation" not in href_lower
        ):
            full_url = urljoin(CMS_INDEX_URL, href)
            zip_links.append(full_url)

    if not zip_links:
        raise RuntimeError("❌ No suitable NPPES monthly V2 ZIP found on CMS page")

    chosen = zip_links[0]
    print(f"✅ Found NPPES ZIP: {chosen}")
    return chosen



# ============== DOWNLOAD + EXTRACT ==============
def download_and_extract_if_needed():
    if CSV_PATH.exists():
        print(f"✅ Using cached CSV: {CSV_PATH}")
        return

    zip_url = find_latest_nppes_zip()
    print("⬇️ Downloading NPPES ZIP (large file, be patient)...")

    r = requests.get(zip_url, stream=True, timeout=60)
    r.raise_for_status()

    with open(ZIP_PATH, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

    print("📦 Extracting CSV from ZIP...")

    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        csv_files = [f for f in z.namelist() if f.endswith(".csv") and "npidata_pfile" in f]

        if not csv_files:
            raise RuntimeError("❌ No npidata_pfile CSV found inside ZIP")

        with z.open(csv_files[0]) as csv_file:
            with open(CSV_PATH, "wb") as out:
                out.write(csv_file.read())

    print("✅ Extraction complete")

# ============== MAIN LOGIC ======================
def create_ground_truth_sample():
    download_and_extract_if_needed()

    print("📖 Reading NPPES CSV in chunks...")
    chunk_iter = pd.read_csv(
        CSV_PATH,
        usecols=COLUMNS_TO_READ,
        dtype=str,
        chunksize=200_000,
        low_memory=False
    )

    valid = []

    for chunk in chunk_iter:
        chunk = chunk.dropna(subset=[
            'NPI',
            'Provider First Name',
            'Provider Last Name (Legal Name)',
            'Provider First Line Business Practice Location Address'
        ])
        valid.append(chunk)

        if sum(len(c) for c in valid) >= SAMPLE_SIZE * 5:
            break

    df = pd.concat(valid, ignore_index=True)
    df = df.sample(n=SAMPLE_SIZE, random_state=42)

    df['fullName'] = (
        df['Provider First Name'].str.strip() + " " +
        df['Provider Last Name (Legal Name)'].str.strip()
    )

    df = df.rename(columns={
        'NPI': 'npi',
        'Provider First Line Business Practice Location Address': 'address',
        'Provider Business Practice Location Address City Name': 'city',
        'Provider Business Practice Location Address State Name': 'state',
        'Provider Business Practice Location Address Postal Code': 'zipCode',
        'Provider Business Practice Location Address Telephone Number': 'phone',
        'Healthcare Provider Taxonomy Code_1': 'specialty',
        'Last Update Date': 'lastUpdated'
    })

    df['zipCode'] = df['zipCode'].str[:5]
    df['website'] = ""
    df['license'] = ""

    final_cols = [
        'fullName','npi','address','city','state',
        'zipCode','website','specialty',
        'phone','license','lastUpdated'
    ]

    df[final_cols].to_csv(GROUND_TRUTH_OUTPUT_FILE, index=False)

    print("\n✅ Ground truth CSV created")
    print(f"📄 {GROUND_TRUTH_OUTPUT_FILE}")
    print(f"📊 Records: {len(df)}")

# ============== RUN =============================
if __name__ == "__main__":
    create_ground_truth_sample()
