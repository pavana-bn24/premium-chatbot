from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.getLogger("nexa").setLevel(logging.DEBUG)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

load_dotenv(find_dotenv(usecwd=True))

app = FastAPI(
    title="Premium Chatbot API",
    description="Backend for a premium AI chatbot application with Gemini integration.",
    version="1.0.0",
)

origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Error-Code"],
)

from app.api import chat
app.include_router(chat.router, prefix="/api/chat")


@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to the Premium Chatbot API!"}
