from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE_URL loaded:", bool(DATABASE_URL))  # debug

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("✅ DB Connected:", result.scalar())
