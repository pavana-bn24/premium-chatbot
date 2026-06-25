import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(usecwd=True))


class Settings:
    PROJECT_NAME: str = "Premium Chatbot API"
    PROJECT_VERSION: str = "1.0.0"

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
