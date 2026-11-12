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

def editor_node(state:pipeline_state)->dict:
    """Stage 1: Clean Up Grammar, remove typos and refines the tone."""
    prompt=(
        """You are an expert copyeditor. Clean up the following raw text.
        Fix any grammatical mistake, smelling mistake and smooth out the transition flow.
        Make sure to keep the content same. While maintaining the core message intact, remove only the edited text.\n\n"""
        f"Text: \n {state['raw_input']}"
    )
    response=llm.invoke(prompt)
    return {'edited_text':response.content.strip()}