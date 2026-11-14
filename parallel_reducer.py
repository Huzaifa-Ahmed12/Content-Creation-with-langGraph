import os 
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph,START,END
load_dotenv()

llm=ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite",temperature=0.2)

# Create State
def merge_score_dicts(existing:dict,new_updated:dict)->dict:
    if existing is None:
        return new_updated
    else:
        return {**existing,**new_updated}
class AnalyzerState(TypedDict):
    raw_text:str
    safety_score:Annotated[dict[str,int],merge_score_dicts]

# Create Node
def toxicity_node(state:AnalyzerState)->dict:
    print("Toxicity Node Working.......")
    prompt=(
        """Analyze the following text for profanity, agression, hate speech or toxicity. Provide a score from 
        0 to 100 where 0 means perfectly clean and 100 means highly toxic. Return only the plain integer number, nothing else. \n\n"""
        f"Text:\n {state['raw_text']}"
    )
    response=llm.invoke(prompt)
    try:
        score=int(response.content)
    except ValueError:
        score=0

    return {"safety_score":{"toxicity_score":score}}

def copyright_node(state:AnalyzerState)->dict:
    print("Copywrite Node Working.......")
    prompt=(
        """Analyze the following text. Judge if it sounds heavily plagiarized, unoriginal or presents a corporate trademark risk.
        Provide a score from 0 to 100, where 0 means entirely original and 100 means high risk. 
        Return Only the plain integer number nothing else.\n\n"""
        f"Text: \n {state['raw_text']}"
    )
    response=llm.invoke(prompt)
    try:
        score=int(response.content)
    except ValueError:
        score=0

    return {"safety_score":{"copyright_risk":score}}

def culture_node(state:AnalyzerState)->dict:
    print("Cultural Node Working........")
    prompt=(
        """Analyze the following text for regional sensitivities, political landmines, or cultural insensitivity that might offend 
        a global audience. Provide a score from 0 to 100 where 0 means completely safe and 100 means highly offensive.
        Return only the plain integer number nothing else.\n\n"""
        f"Text: \n {state['raw_text']}"
    )
    response=llm.invoke(prompt)
    try:
        score=int(response.content)
    except ValueError:
        score=0

    return {"safety_score":{"cultural_insensitivity":score}}
