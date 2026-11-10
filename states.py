import os
# 1) Typed DICT

from typing import TypeDict

class State(TypeDict):
    topic: str
    summary:str
    score:int

# 2) Pydantic Approach which is good at Data Validation and type checking at Run-time

from pydantic import BaseModel, field_validator

class State(BaseModel):
    topic:str
    summary:str
    score:int

    @field_validator
    def score_positive(cls,v):
        if v<0:
            raise ValueError("Value must be Positive")

# 3) Python Data classes
from dataclasses import dataclass,field
@dataclass
class State:
    topic:str
    summary:str
    messages:list=field(default_factory=field)

# 4) LangGraph Message State
from langgraph.graph import MessagesState

class State(MessagesState):
    user_name:str
    language:str

