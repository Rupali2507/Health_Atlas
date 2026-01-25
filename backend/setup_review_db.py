import sqlite3

print("📦 Initializing review queue database...")

conn = sqlite3.connect("review_queue.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_name TEXT,
    npi TEXT,
    confidence REAL,
    flags TEXT,
    status TEXT,
    created_at TEXT
)
""")

conn.commit()
conn.close()

print("✅ review_queue.db created successfully")
