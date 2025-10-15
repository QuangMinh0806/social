from openai import OpenAI

async def generate_with_gpt(prompt: str, api_key: str) -> str:
    if not api_key:
        raise ValueError("Thiếu GPT API key")

    client = OpenAI(api_key=api_key)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a creative content generator."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8
    )

    return response.choices[0].message.content.strip()
