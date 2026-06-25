import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv, find_dotenv
from typing import List, Dict, Any, AsyncGenerator
from google.api_core import exceptions as google_exceptions

load_dotenv(find_dotenv(usecwd=True))

logger = logging.getLogger('nexa.gemini')


class GeminiError(Exception):
    def __init__(self, error_code: str, message: str):
        self.error_code = error_code
        self.message = message
        super().__init__(message)


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiError("config_error", "AI service is not configured. Please check server configuration.")
        os.environ["GOOGLE_API_KEY"] = api_key
        genai.configure(api_key=api_key)

    async def stream_chat(
        self, messages: List[Dict[str, Any]], temperature: float = 0.7, model_name: str = "gemini-2.5-flash"
    ) -> AsyncGenerator[str, None]:
        try:
            model = genai.GenerativeModel(model_name=model_name)
            chat = model.start_chat(history=messages[:-1])
            response = await chat.send_message_async(messages[-1]["parts"][0]["text"], stream=True)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except google_exceptions.ResourceExhausted as e:
            logger.error(f"Rate limit exceeded: {e}")
            raise GeminiError("rate_limit", "Too many requests were sent to the AI service.")
        except google_exceptions.ServiceUnavailable as e:
            logger.error(f"Gemini service unavailable: {e}")
            raise GeminiError("service_unavailable", "AI service is temporarily unavailable.")
        except google_exceptions.DeadlineExceeded as e:
            logger.error(f"Gemini deadline exceeded: {e}")
            raise GeminiError("service_unavailable", "AI service is temporarily unavailable.")
        except google_exceptions.GoogleAPICallError as e:
            logger.error(f"Gemini API error: {e}")
            raise GeminiError("service_unavailable", "AI service is temporarily unavailable.")
        except (ConnectionError, TimeoutError, OSError) as e:
            logger.error(f"Network error contacting Gemini: {e}")
            raise GeminiError("network_error", "Unable to connect to the AI service.")
