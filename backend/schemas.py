"""
schemas.py
Shapes of the data that comes IN to the API and goes OUT of it.
"""

from typing import Literal
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Student's question")
    programme: str = Field(..., description="Selected programme, e.g. 'BBA'")
    thread_id: str = Field(..., min_length=1, description="Conversation id from the frontend")


class ChatResponse(BaseModel):
    answer: str
    route: Literal["academic", "fee", "general"]