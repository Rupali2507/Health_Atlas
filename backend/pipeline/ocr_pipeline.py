import json
from services.gemini_ocr import extract_providers_from_pdf, GeminiOCRError


def run_ocr(file_path: str):
    try:
        result = extract_providers_from_pdf(file_path)

        # 🔥 DEBUG: see what Gemini REALLY returned
        print("🔥 GEMINI OCR RAW RESULT:", result)

        # CASE 1: Gemini already returned a list
        if isinstance(result, list):
            providers = result

        # CASE 2: Gemini returned dict with providers
        elif isinstance(result, dict) and "providers" in result:
            providers = result["providers"]

        # CASE 3: Gemini returned raw JSON string
        elif isinstance(result, str):
            providers = json.loads(result)

        else:
            raise GeminiOCRError(f"Unexpected Gemini OCR output type: {type(result)}")

        if not isinstance(providers, list):
            raise GeminiOCRError("Parsed OCR output is not a list")

        if len(providers) == 0:
            raise GeminiOCRError("Gemini returned empty provider list")

        return providers

    except Exception as e:
        # ❗ DO NOT hide errors anymore
        raise RuntimeError(f"Gemini OCR failed: {e}")
