import google.generativeai as genai

async def generate_with_gemini(prompt: str, api_key: str) -> str:
    if not api_key:
        raise ValueError("Thiếu Gemini API key")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash-001")
    response =  model.generate_content(prompt)

    return response.text.strip()
