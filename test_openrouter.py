import httpx
import asyncio
import os
from dotenv import load_dotenv

# Load settings from the actual deployment path
env_path = "/home/deploy/zachot/apps/api/.env"
load_dotenv(env_path)

api_key = os.getenv("OPENROUTER_API_KEY")

async def test_models():
    if not api_key:
        print("❌ Error: OPENROUTER_API_KEY not found in .env")
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Models to test
    models_to_test = [
        "openai/gpt-4o-mini",
        "anthropic/claude-3.5-sonnet",
        "deepseek/deepseek-chat",
        "perplexity/sonar-pro"
    ]

    print(f"🔍 Testing OpenRouter API with key: {api_key[:10]}...{api_key[-4:]}")
    
    for model in models_to_test:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "Say 'OK' if you work"}],
            "max_tokens": 10
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    print(f"✅ {model}: SUCCESS")
                else:
                    print(f"❌ {model}: FAILED (Status: {response.status_code}, Body: {response.text[:100]})")
        except Exception as e:
            print(f"⚠️ {model}: ERROR ({str(e)})")

if __name__ == "__main__":
    asyncio.run(test_models())


