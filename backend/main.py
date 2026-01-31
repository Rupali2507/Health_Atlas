import os
import json
import uuid
import asyncio
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from asyncio import Queue
from typing import Dict, Any
from datetime import datetime
import shutil
from pathlib import Path

from agent import app as validation_agent_app
from tools import parse_provider_pdf

app = FastAPI(title="Health Atlas Provider Validator v2.1")

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
    return {"status": "healthy", "version": "2.1"}

# Configuration for parallel processing
MAX_CONCURRENT_WORKERS = 5


def normalize_provider_data(provider_info: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize provider data to match AgentState initial_data schema."""
    return {
        "full_name": provider_info.get("full_name") or provider_info.get("fullName", ""),
        "NPI": provider_info.get("NPI") or provider_info.get("npi", ""),
        "address": provider_info.get("address", ""),
        "city": provider_info.get("city", ""),
        "state": provider_info.get("state", ""),
        "zip_code": provider_info.get("zip_code") or provider_info.get("zipCode", ""),
        "website": provider_info.get("website", ""),
        "specialty": provider_info.get("specialty", ""),
        "phone": provider_info.get("phone", ""),
        "license_number": provider_info.get("license_number") or provider_info.get("license", ""),
        "last_updated": provider_info.get("last_updated") or provider_info.get("lastUpdated", "2024-01-01")
    }


def format_result_for_frontend(final_result: Dict[str, Any], provider_info: Dict[str, Any]) -> Dict[str, Any]:
    """Format agent result to EXACTLY match frontend expectations."""
    quality_metrics = final_result.get("quality_metrics", {})
    score_breakdown = quality_metrics.get("score_breakdown", {})
    dimension_percentages = quality_metrics.get("dimension_percentages", {})

    if not score_breakdown:
        score_breakdown = {
            "identity": 0.0,
            "address": 0.0,
            "completeness": 0.0,
            "freshness": 0.0,
            "enrichment": 0.0,
            "risk": 0.0
        }
    
    if not dimension_percentages:
        dimension_percentages = {
            k: f"{int(v * 100)}%" for k, v in score_breakdown.items()
        }
        dimension_percentages["risk_penalty"] = dimension_percentages.pop("risk", "0%")

    tier = quality_metrics.get("confidence_tier", "UNKNOWN")
    tier_emoji = {
        "PLATINUM": "🟢",
        "GOLD": "🟡",
        "QUESTIONABLE": "🔴"
    }.get(tier, "📊")

    return {
        "original_data": provider_info,
        "final_profile": final_result.get("final_profile")
        or final_result.get("golden_record")
        or {
            "provider_name": provider_info.get("full_name", "Unknown Provider"),
            "npi": provider_info.get("NPI", "N/A"),
            "specialty": provider_info.get("specialty", "N/A"),
        },
        "confidence_score": final_result.get("confidence_score", 0),
        "requires_human_review": final_result.get("requires_human_review", False),
        "review_reason": final_result.get("review_reason", ""),
        "path": quality_metrics.get("path", "UNKNOWN"),
        "qa_flags": final_result.get("qa_flags", []),
        "fraud_indicators": final_result.get("fraud_indicators", []),
        "qa_corrections": final_result.get("qa_corrections", {}),
        "quality_metrics": {
            **quality_metrics,
            "score_breakdown": score_breakdown,
            "dimension_percentages": dimension_percentages,
            "confidence_tier": tier,
            "tier_emoji": tier_emoji,
            "tier_description": quality_metrics.get("tier_description", ""),
            "flag_severity": quality_metrics.get("flag_severity", {}),
            "risk_score": quality_metrics.get("risk_score", 0),
            "fraud_indicator_count": quality_metrics.get("fraud_indicator_count", 0),
            "conflict_count": quality_metrics.get("conflict_count", 0),
        },
        "execution_metadata": final_result.get("execution_metadata", {}),
        "verification_status": {
            "nppes_verified": bool(final_result.get("npi_result", {}).get("result_count", 0)),
            "oig_clear": not final_result.get("oig_leie_result", {}).get("is_excluded", False),
            "license_active": final_result.get("state_board_result", {}).get("status") == "Active",
            "address_validated": final_result.get("address_result", {}).get("is_medical_facility", False),
            "digital_footprint_score": final_result.get("digital_footprint_score", 0),
        }
    }


@app.post("/validate-file")
async def validate_file(file: UploadFile = File(...)):
    """
    Enhanced API endpoint with parallel processing and streaming results.
    Handles CSV, PDF, and image uploads for bulk validation.
    """
    temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"

    async def file_processor_stream():
        nonlocal temp_filename
        result_queue = Queue()
        
        try:
            with open(temp_filename, "wb") as buffer:
                buffer.write(await file.read())

            provider_list = []
            if file.filename.endswith('.csv'):
                yield f"data: {json.dumps({'type': 'log', 'content': '📄 Reading CSV file...'})}\n\n"
                df = pd.read_csv(temp_filename, dtype=str).fillna("")
                provider_list = df.to_dict(orient='records')
            
            elif file.filename.endswith('.pdf'):
                yield f"data: {json.dumps({'type': 'log', 'content': '🔍 Parsing PDF with Vision AI...'})}\n\n"
                provider_list = parse_provider_pdf(temp_filename)
                if provider_list and isinstance(provider_list[0], dict) and provider_list[0].get("error"):
                    error_msg = provider_list[0]["error"]
                    yield f"data: {json.dumps({'type': 'log', 'content': f'❌ PDF Error: {error_msg}'})}\n\n"
                    provider_list = []

            total_records = len(provider_list)
            yield f"data: {json.dumps({'type': 'log', 'content': f'🚀 Found {total_records} records. Processing...'})}\n\n"
            await asyncio.sleep(0)

            async def worker(provider_info, index):
                try:
                    provider_name = provider_info.get('full_name') or provider_info.get('fullName', f'Record {index + 1}')
                    await result_queue.put(('log', f"🔄 [{index + 1}/{total_records}] Processing: {provider_name}"))
                    await result_queue.put(('log', 'npi registry check started'))
                    
                    normalized_data = normalize_provider_data(provider_info)
                    
                    initial_state = {
                        "initial_data": normalized_data,
                        "log": [],
                        "npi_result": {},
                        "oig_leie_result": {},
                        "state_board_result": {},
                        "address_result": {},
                        "web_enrichment_data": {},
                        "digital_footprint_score": 0.0,
                        "qa_flags": [],
                        "qa_corrections": {},
                        "fraud_indicators": [],
                        "conflicting_data": [],
                        "golden_record": {},
                        "confidence_score": 0.0,
                        "confidence_breakdown": {},
                        "requires_human_review": False,
                        "review_reason": "",
                        "final_profile": {},
                        "execution_metadata": {},
                        "data_provenance": {},
                        "quality_metrics": {}
                    }
                    
                    await result_queue.put(('log', 'address validation started'))
                    await result_queue.put(('log', 'web enrichment started'))
                    await result_queue.put(('log', 'quality assurance started'))
                    await result_queue.put(('log', 'synthesis started'))
                    await result_queue.put(('log', 'confidence scoring started'))

                    final_result = await asyncio.to_thread(validation_agent_app.invoke, initial_state)
                    result_payload = format_result_for_frontend(final_result, provider_info)
                    
                    path = result_payload.get("path", "UNKNOWN")
                    path_emoji = "🟢" if path == "GREEN" else "🟡" if path == "YELLOW" else "🔴"
                    confidence = result_payload.get("confidence_score", 0)
                    
                    completion_msg = f"{path_emoji} [{index + 1}/{total_records}] {provider_name} - {path} PATH ({confidence:.1%})"
                    await result_queue.put(('log', completion_msg))
                    await result_queue.put(('result', result_payload))
                    
                except Exception as e:
                    error_msg = f"❌ Error processing record {index + 1}: {str(e)}"
                    await result_queue.put(('log', error_msg))
                    await result_queue.put(('result', {
                        "original_data": provider_info,
                        "error": str(e),
                        "confidence_score": 0,
                        "path": "ERROR",
                        "requires_human_review": True,
                        "review_reason": f"Processing error: {str(e)}"
                    }))

            semaphore = asyncio.Semaphore(MAX_CONCURRENT_WORKERS)
            
            async def bounded_worker(provider_info, index):
                async with semaphore:
                    await worker(provider_info, index)
            
            tasks = [
                asyncio.create_task(bounded_worker(provider, i))
                for i, provider in enumerate(provider_list)
            ]
            
            completed = 0
            while completed < total_records:
                try:
                    result_type, result_data = await asyncio.wait_for(
                        result_queue.get(), 
                        timeout=2.0
                    )
                    
                    if result_type == 'log':
                        yield f"data: {json.dumps({'type': 'log', 'content': result_data})}\n\n"
                    elif result_type == 'result':
                        yield f"data: {json.dumps({'type': 'result', 'data': result_data})}\n\n"
                        completed += 1
                        
                except asyncio.TimeoutError:
                    if all(task.done() for task in tasks):
                        break
                    continue
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
            while not result_queue.empty():
                try:
                    result_type, result_data = result_queue.get_nowait()
                    if result_type == 'log':
                        yield f"data: {json.dumps({'type': 'log', 'content': result_data})}\n\n"
                    elif result_type == 'result':
                        yield f"data: {json.dumps({'type': 'result', 'data': result_data})}\n\n"
                except:
                    break
            
            yield f"data: {json.dumps({'type': 'log', 'content': f'✅ Complete! {total_records} records validated.'})}\n\n"

        except Exception as e:
            error_msg = f"❌ Critical error: {type(e).__name__}: {str(e)}"
            print(error_msg)
            yield f"data: {json.dumps({'type': 'log', 'content': error_msg})}\n\n"
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            yield f"data: {json.dumps({'type': 'close', 'content': 'Stream closed.'})}\n\n"

    return StreamingResponse(file_processor_stream(), media_type="text/event-stream")


@app.post("/validate-single")
async def validate_single_provider(provider_data: Dict[str, Any]):
    """Validate a single provider (useful for testing)."""
    try:
        normalized_data = normalize_provider_data(provider_data)
        
        initial_state = {
            "initial_data": normalized_data,
            "log": [],
            "npi_result": {},
            "oig_leie_result": {},
            "state_board_result": {},
            "address_result": {},
            "web_enrichment_data": {},
            "digital_footprint_score": 0.0,
            "qa_flags": [],
            "qa_corrections": {},
            "fraud_indicators": [],
            "conflicting_data": [],
            "golden_record": {},
            "confidence_score": 0.0,
            "confidence_breakdown": {},
            "requires_human_review": False,
            "review_reason": "",
            "final_profile": {},
            "execution_metadata": {},
            "data_provenance": {},
            "quality_metrics": {}
        }
        
        final_result = validation_agent_app.invoke(initial_state)
        result_payload = format_result_for_frontend(final_result, provider_data)
        
        return {"status": "success", "data": result_payload}
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": {
                "original_data": provider_data,
                "confidence_score": 0,
                "path": "ERROR",
                "requires_human_review": True,
                "review_reason": f"Processing error: {str(e)}"
            }
        }


# ============================================
# NEW ENDPOINT FOR APPLY.JSX
# ============================================

@app.post("/api/providers/apply")
async def apply_provider(
    fullName: str = Form(...),
    email: str = Form(...),
    phoneNumber: str = Form(...),
    speciality: str = Form(...),
    licenseNumber: str = Form(...),
    npiId: str = Form(...),
    practiceAddress: str = Form(...),
    aiRawResult: str = Form(...),
    aiParsedResult: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handle provider application submissions from Apply.jsx
    
    This endpoint receives:
    - Provider information (name, email, phone, specialty, license, NPI, address)
    - AI validation results (raw and parsed)
    - Uploaded credential file (PDF/image)
    
    Returns:
    - Success/error status
    - Application ID
    - Validation summary
    """
    
    try:
        # Create uploads directory if doesn't exist
        UPLOAD_DIR = Path("provider_applications")
        UPLOAD_DIR.mkdir(exist_ok=True)
        
        # Generate unique application ID
        application_id = f"APP_{uuid.uuid4().hex[:8].upper()}"
        
        # Save uploaded file
        file_extension = Path(file.filename).suffix
        saved_filename = f"{application_id}_{fullName.replace(' ', '_')}{file_extension}"
        file_path = UPLOAD_DIR / saved_filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse AI results
        try:
            ai_raw = json.loads(aiRawResult)
            ai_parsed = json.loads(aiParsedResult)
        except json.JSONDecodeError:
            ai_raw = {"raw_data": aiRawResult}
            ai_parsed = {"parsed_data": aiParsedResult}
        
        # Extract validation summary
        confidence_score = ai_parsed.get("confidence_score", 0)
        path = ai_parsed.get("path", "UNKNOWN")
        requires_review = ai_parsed.get("requires_human_review", False)
        fraud_indicators = ai_parsed.get("fraud_indicators", [])
        qa_flags = ai_parsed.get("qa_flags", [])
        
        # Determine application status
        if path == "GREEN" and confidence_score >= 0.7 and not requires_review:
            status = "approved"
        elif path == "YELLOW" or (confidence_score >= 0.4 and confidence_score < 0.7):
            status = "pending_review"
        else:
            status = "flagged_for_review"
        
        # Build application data
        application_data = {
            "application_id": application_id,
            "submission_date": datetime.now().isoformat(),
            "status": status,
            
            # Provider Information
            "provider_info": {
                "full_name": fullName,
                "email": email,
                "phone": phoneNumber,
                "specialty": speciality,
                "license_number": licenseNumber,
                "npi": npiId,
                "practice_address": practiceAddress
            },
            
            # AI Validation Results
            "ai_validation": {
                "confidence_score": confidence_score,
                "path": path,
                "requires_review": requires_review,
                "fraud_indicators": fraud_indicators,
                "qa_flags": qa_flags,
                "raw_result": ai_raw,
                "parsed_result": ai_parsed
            },
            
            # File Information
            "uploaded_file": {
                "original_name": file.filename,
                "saved_name": saved_filename,
                "path": str(file_path),
                "size_bytes": file_path.stat().st_size
            }
        }
        
        # Save application to JSON file (replace with database later)
        applications_file = Path("provider_applications.json")
        applications = []
        
        if applications_file.exists():
            try:
                with applications_file.open("r") as f:
                    applications = json.load(f)
            except json.JSONDecodeError:
                applications = []
        
        applications.append(application_data)
        
        with applications_file.open("w") as f:
            json.dump(applications, f, indent=2)
        
        # Log success
        print(f"✅ Application {application_id} saved for {fullName}")
        print(f"   Status: {status} | Confidence: {confidence_score:.1%} | Path: {path}")
        
        # Return success response
        return {
            "success": True,
            "message": "Application submitted successfully",
            "application_id": application_id,
            "status": status,
            "validation_summary": {
                "confidence_score": confidence_score,
                "path": path,
                "requires_review": requires_review,
                "fraud_indicators_count": len(fraud_indicators),
                "qa_flags_count": len(qa_flags)
            },
            "next_steps": (
                "Your application has been approved and will be added to our network."
                if status == "approved" else
                "Your application is under review. We will contact you within 2-3 business days."
            )
        }
        
    except Exception as e:
        print(f"❌ Error saving application: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "message": f"Failed to save application: {str(e)}",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)