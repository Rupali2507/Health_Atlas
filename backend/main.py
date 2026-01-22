import os
import json
import uuid
import asyncio
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from asyncio import Queue

from agent import app as validation_agent_app
from tools import parse_provider_pdf

app = FastAPI(title="Health Atlas Provider Validator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      
        "http://localhost:5173",     
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8080",      
        "*"                          
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Configuration for parallel processing
MAX_CONCURRENT_WORKERS = 10  # Adjust based on your API rate limits


@app.post("/validate-file")
async def validate_file(file: UploadFile = File(...)):
    """
    API endpoint to handle file uploads and stream back results in parallel.
    Processes multiple providers concurrently for better throughput.
    """
    temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"

    async def file_processor_stream():
        nonlocal temp_filename
        result_queue = Queue()
        
        try:
            # Read file
            with open(temp_filename, "wb") as buffer:
                buffer.write(await file.read())

            provider_list = []
            if file.filename.endswith('.csv'):
                yield f"data: {json.dumps({'type': 'log', 'content': 'Reading CSV file...'})}\n\n"
                df = pd.read_csv(temp_filename, dtype=str).fillna("")
                provider_list = df.to_dict(orient='records')
            
            elif file.filename.endswith('.pdf'):
                yield f"data: {json.dumps({'type': 'log', 'content': 'Parsing PDF with Vision AI... This may take a moment.'})}\n\n"
                provider_list = parse_provider_pdf(temp_filename)
                if provider_list and isinstance(provider_list[0], dict) and provider_list[0].get("error"):
                    error_msg = provider_list[0]["error"]
                    yield f"data: {json.dumps({'type': 'log', 'content': f'PDF Parsing Error: {error_msg}'})}\n\n"
                    provider_list = []

            total_records = len(provider_list)
            yield f"data: {json.dumps({'type': 'log', 'content': f'Found {total_records} records to process in parallel with {MAX_CONCURRENT_WORKERS} workers.'})}\n\n"
            await asyncio.sleep(0)

            # Worker function to process individual providers
            async def worker(provider_info, index):
                """Process a single provider and put result in queue."""
                try:
                    log_msg = f"--- Processing Record {index + 1}/{total_records}: {provider_info.get('full_name', 'PDF Record')} ---"
                    await result_queue.put(('log', log_msg))
                    
                    # Run the blocking LangGraph agent in a thread pool
                    initial_state = {"initial_data": provider_info, "log": []}
                    final_result = await asyncio.to_thread(validation_agent_app.invoke, initial_state)
                    
                    result_payload = {
                        "original_data": provider_info,
                        "final_profile": final_result.get("final_profile"),
                        "confidence_score": final_result.get("confidence_score"),
                        "qa_flags": final_result.get("qa_flags", []),
                        "priority_score": final_result.get("priority_score", 0)
                    }
                    await result_queue.put(('result', result_payload))
                    
                except Exception as e:
                    error_msg = f"Error processing record {index + 1}: {type(e).__name__}: {str(e)}"
                    print(error_msg)
                    await result_queue.put(('log', error_msg))

            # Create all worker tasks with concurrency limit
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_WORKERS)
            
            async def bounded_worker(provider_info, index):
                async with semaphore:
                    await worker(provider_info, index)
            
            # Start all tasks
            tasks = [
                asyncio.create_task(bounded_worker(provider, i))
                for i, provider in enumerate(provider_list)
            ]
            
            # Stream results as they complete
            completed = 0
            while completed < total_records:
                try:
                    # Wait for next result with timeout
                    result_type, result_data = await asyncio.wait_for(
                        result_queue.get(), 
                        timeout=1.0
                    )
                    
                    if result_type == 'log':
                        yield f"data: {json.dumps({'type': 'log', 'content': result_data})}\n\n"
                    elif result_type == 'result':
                        yield f"data: {json.dumps({'type': 'result', 'data': result_data})}\n\n"
                        completed += 1
                        
                except asyncio.TimeoutError:
                    # No results yet, check if any tasks are still running
                    if all(task.done() for task in tasks):
                        break
                    continue
            
            # Wait for all tasks to complete
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Drain any remaining items in queue
            while not result_queue.empty():
                try:
                    result_type, result_data = result_queue.get_nowait()
                    if result_type == 'log':
                        yield f"data: {json.dumps({'type': 'log', 'content': result_data})}\n\n"
                    elif result_type == 'result':
                        yield f"data: {json.dumps({'type': 'result', 'data': result_data})}\n\n"
                except:
                    break

        except Exception as e:
            error_msg = f"Error during top-level processing: {type(e).__name__}: {str(e)}"
            print(error_msg)
            yield f"data: {json.dumps({'type': 'log', 'content': error_msg})}\n\n"
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            yield f"data: {json.dumps({'type': 'close', 'content': 'Processing complete.'})}\n\n"

    return StreamingResponse(file_processor_stream(), media_type="text/event-stream")