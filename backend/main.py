import os
import json
import uuid
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from agent import app as validation_agent_app
from tools import parse_provider_pdf

app = FastAPI(title="Health Atlas Provider Validator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/validate-file")
async def validate_file(file: UploadFile = File(...)):
    """
    API endpoint to handle file uploads and stream back the results.
    """
    temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"

    async def file_processor_stream():
        try:
            # Save the uploaded file temporarily
            with open(temp_filename, "wb") as buffer:
                buffer.write(await file.read())

            provider_list = []

            if file.filename.endswith('.csv'):
                yield f"data: {json.dumps({'type': 'log', 'content': 'Reading CSV file...'})}\n\n"
                df = pd.read_csv(temp_filename, dtype=str).fillna("")
                provider_list = df.to_dict(orient='records')
            
            # (PDF logic remains the same)
            elif file.filename.endswith('.pdf'):
                yield f"data: {json.dumps({'type': 'log', 'content': 'Parsing PDF file...'})}\n\n"
                extracted_text = parse_provider_pdf(temp_filename)
                provider_list = [{"full_name": "Data from PDF", "unstructured_text": extracted_text}]

            total_records = len(provider_list)
            yield f"data: {json.dumps({'type': 'log', 'content': f'Found {total_records} records to process.'})}\n\n"

            # Process each provider record one by one
            for i, provider_info in enumerate(provider_list):
                yield f"data: {json.dumps({'type': 'log', 'content': f'--- Processing Record {i+1}/{total_records}: {provider_info.get("full_name", "PDF Record")} ---'})}\n\n"
                
                initial_state = {"initial_data": provider_info, "log": []}
                final_result = validation_agent_app.invoke(initial_state)

                for log_entry in final_result.get('log', []):
                    yield f"data: {json.dumps({'type': 'log', 'content': log_entry})}\n\n"
                
                result_payload = {
                    "type": "result",
                    "data": {
                        "original_data": provider_info,
                        "final_profile": final_result.get("final_profile"),
                        "confidence_score": final_result.get("confidence_score"),
                        "qa_flags": final_result.get("qa_flags", [])
                    }
                }
                yield f"data: {json.dumps(result_payload)}\n\n"

        finally:
            # ✅ FIX: This 'finally' block GUARANTEES this code will run at the end.
            print("--- Processing finished. Cleaning up and sending close signal. ---")
            
            # Clean up the temporary file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            
            # Send the final "close" message to the frontend
            yield f"data: {json.dumps({'type': 'close', 'content': 'Processing complete.'})}\n\n"

    return StreamingResponse(file_processor_stream(), media_type="text/event-stream")

