import os
import json
import re
from pathlib import Path
from io import BytesIO
from typing import List, Dict

from PIL import Image
from pdf2image import convert_from_path
from google import genai
from google.genai import types


MODEL = "models/gemini-2.5-flash"

PROMPT = """
You are an OCR + structured data extraction engine.

Extract ALL provider records from this document.

For EACH provider extract:
- full_name
- NPI
- specialty
- address
- city
- state
- zip_code
- phone
- license_number
- website
- last_updated

Return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.

JSON format:
{
  "providers": [
    {
      "full_name": "",
      "NPI": "",
      "specialty": "",
      "address": "",
      "city": "",
      "state": "",
      "zip_code": "",
      "phone": "",
      "license_number": "",
      "website": "",
      "last_updated": ""
    }
  ]
}
"""


class GeminiOCRError(Exception):
    pass


def _load_images(path: Path) -> List[Image.Image]:
    if path.suffix.lower() in [".jpg", ".jpeg", ".png"]:
        return [Image.open(path)]
    if path.suffix.lower() == ".pdf":
        return convert_from_path(path, dpi=300)
    raise GeminiOCRError(f"Unsupported file type: {path.suffix}")


def _extract_json_safely(text: str) -> Dict:
    """
    Gemini often returns extra text or fenced JSON.
    This safely extracts the first JSON object.
    """
    if not text:
        raise GeminiOCRError("Empty response from Gemini")

    # Remove markdown fences if present
    text = text.replace("```json", "").replace("```", "").strip()

    # Extract JSON block
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise GeminiOCRError(f"No JSON found in Gemini response:\n{text}")

    return json.loads(match.group())


def extract_providers_from_pdf(file_path: str) -> Dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiOCRError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)
    images = _load_images(Path(file_path))

    all_providers = []

    for image in images:
        # 🔥 FIX RGBA
        if image.mode != "RGB":
            image = image.convert("RGB")

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=95)
        img_bytes = buffer.getvalue()

        response = client.models.generate_content(
            model=MODEL,
            contents=[
                PROMPT,
                types.Part.from_bytes(
                    data=img_bytes,
                    mime_type="image/jpeg"
                )
            ]
        )

        parsed = _extract_json_safely(response.text)
        all_providers.extend(parsed.get("providers", []))

    return {
        "providers": all_providers,
        "method": "gemini_ocr"
    }
