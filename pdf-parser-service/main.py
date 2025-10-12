from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import uuid
import shutil
import glob
from datetime import datetime

app = FastAPI(title="PDF VLM Parser Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_processing"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/parse-pdf/")
async def parse_pdf_endpoint(file: UploadFile = File(...)):
    """
    Accepts a PDF file, parses it using marker-pdf, and returns the text.
    """
    request_id = str(uuid.uuid4())
    temp_pdf_path = os.path.join(TEMP_DIR, f"{request_id}_{file.filename}")
    output_dir = os.path.join(TEMP_DIR, request_id)
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Save uploaded file
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Use absolute paths
        abs_pdf_path = os.path.abspath(temp_pdf_path)
        abs_output_dir = os.path.abspath(output_dir)
        
        file_size_mb = os.path.getsize(abs_pdf_path) / (1024 * 1024)
        
        print(f"\n{'='*60}")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing: {file.filename}")
        print(f"Size: {file_size_mb:.2f} MB")
        print(f"PDF: {abs_pdf_path}")
        print(f"Output: {abs_output_dir}")
        print(f"{'='*60}")
        
        command = [
            "marker_single", 
            abs_pdf_path, 
            "--output_dir", abs_output_dir,
        ]
        
        print(f"Running: {' '.join(command)}\n")
        
        result = subprocess.run(
            command, 
            check=True, 
            capture_output=True, 
            text=True, 
            timeout=180  # 3 minutes
        )
        
        # Print marker output for debugging
        if result.stdout:
            print("Marker stdout:")
            print(result.stdout)
        if result.stderr:
            print("Marker stderr:")
            print(result.stderr)
        
        # Find markdown files in the output directory (recursively)
        md_files = glob.glob(os.path.join(abs_output_dir, "**", "*.md"), recursive=True)
        
        print(f"\nLooking for .md files in: {abs_output_dir}")
        print(f"Top-level items: {os.listdir(abs_output_dir)}")
        print(f"Markdown files found: {md_files}")
        
        if md_files:
            # Use the first markdown file found
            output_md_path = md_files[0]
            print(f"Reading from: {output_md_path}")
            
            with open(output_md_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"✅ Success! Extracted {len(content)} characters")
            print(f"{'='*60}\n")
            
            return {
                "text": content,
                "metadata": {
                    "filename": file.filename,
                    "size_mb": round(file_size_mb, 2),
                    "output_file": os.path.basename(output_md_path)
                }
            }
        else:
            # No markdown file found - check what files exist
            all_files = os.listdir(abs_output_dir)
            error_msg = f"No .md file found. Files in output dir: {all_files}"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        print(f"❌ Marker failed: {error_msg}")
        raise HTTPException(
            status_code=500, 
            detail=f"Marker processing failed: {error_msg}"
        )
    except subprocess.TimeoutExpired:
        print(f"❌ Timeout after 180 seconds")
        raise HTTPException(
            status_code=504,
            detail="PDF processing timed out after 3 minutes"
        )
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        )
    finally:
        # Cleanup
        try:
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)
                print(f"Cleaned up: {temp_pdf_path}")
            if os.path.exists(output_dir):
                shutil.rmtree(output_dir)
                print(f"Cleaned up: {output_dir}")
        except Exception as e:
            print(f"Warning: Cleanup failed: {e}")

@app.get("/")
def read_root():
    return {"status": "PDF Parser Service is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "PDF VLM Parser"}