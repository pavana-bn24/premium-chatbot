# Premium Chatbot

Premium Chatbot is a modern AI-powered conversational assistant designed to provide fast, intelligent, and context-aware interactions through a clean and intuitive user interface. Built with a scalable full-stack architecture, the application integrates Google's Gemini Large Language Model (LLM) to deliver accurate, real-time responses while maintaining a seamless user experience.



## Overview

This project demonstrates the integration of modern frontend technologies with a robust backend and a Large Language Model to build an intelligent conversational application. It emphasizes responsive design, secure API integration, and scalable architecture.


## Features

- Intelligent AI-powered conversations
- Context-aware responses using Google Gemini
- Responsive and modern user interface
- Fast and efficient request processing
- Secure API key management using environment variables
- Input validation and safety checks
- Scalable client-server architecture

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Python
- FastAPI
- Uvicorn

### AI Integration

- Google Gemini API
- Large Language Models (LLMs)

### Development Tools

- Git
- GitHub
- Visual Studio Code
- npm


## Installation

### Clone the Repository

```bash
git clone https://github.com/pavana-bn24/premium-chatbot.git
cd premium-chatbot
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

### Backend Setup

Navigate to the server directory:

```bash
cd server
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` and add your Gemini API key.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://localhost:8000
```



## Future Enhancements

- User authentication
- Conversation history
- Long-term conversation memory
- Voice interaction
- Support for multiple AI models
- File upload and document analysis
- Streaming AI responses
- Theme customization


## License

This project is developed for educational and learning purposes.
