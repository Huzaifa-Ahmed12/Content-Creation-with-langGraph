import os
from typing import TypedDict

# Creating State for the Good Script Project

class pipeline_state(TypedDict):
    raw_input:str
    editor_text:str
    script_text:str
    final_output:str

from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv()
llm=ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite",temperature=0.7)