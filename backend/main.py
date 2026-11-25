"""
main.py
FastAPI server. Run from the backend folder with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import ChatRequest, ChatResponse
from graph import chat_with_bot, PROGRAMMES

app = FastAPI(
    title="UniAssist - University Chatbot API",
    description="LangGraph + RAG chatbot for academics and fee questions",
    version="1.0.0",
)

# Allow the Next.js frontend (port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Quick check that the server is running."""
    return {"status": "ok"}


@app.get("/programmes")
def get_programmes():
    """List of programmes the chatbot supports."""
    return {"programmes": PROGRAMMES}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Receive a student's message, run the LangGraph chatbot, return the answer."""
    if request.programme not in PROGRAMMES:
        raise HTTPException(status_code=400, detail=f"Unknown programme: {request.programme}")

    try:
        result = chat_with_bot(
            message=request.message.strip(),
            programme=request.programme,
            thread_id=request.thread_id,
        )
        return ChatResponse(**result)
    except Exception as e:
        print("Chat error:", repr(e))
        raise HTTPException(status_code=500, detail="The chatbot had a problem answering. Please try again.")