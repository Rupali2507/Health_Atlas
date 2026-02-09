from services.gemini_ocr import extract_providers_from_pdf, GeminiOCRError


def run_ocr(file_path: str):
    try:
        result = extract_providers_from_pdf(file_path)
        providers = result.get("providers", [])

        if not providers:
            raise GeminiOCRError("No providers extracted")

        return providers

    except Exception as e:
        return [{
            "error": str(e),
            "method": "gemini_ocr"
        }]
