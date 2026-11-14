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

#Helper Function to extract score safely
import re

def extract_score(response) -> int:
    content = response.content

    # If content is a list of blocks, join the text parts
    if isinstance(content, list):
        text = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    else:
        text = str(content)

    # Pull the first number out of the text
    match = re.search(r"\d+", text)
    return min(int(match.group()), 100) if match else 0


def toxicity_node(state:AnalyzerState)->dict:
    print("Toxicity Node Working.......")
    prompt=(
        """Analyze the following text for profanity, agression, hate speech or toxicity. Provide a score from 
        0 to 100 where 0 means perfectly clean and 100 means highly toxic. Return only the plain integer number, nothing else. \n\n"""
        f"Text:\n {state['raw_text']}"
    )
    response=llm.invoke(prompt)
    score=extract_score(response)
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
    score=extract_score(response)
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
    score=extract_score(response)
    return {"safety_score":{"cultural_insensitivity":score}}

builder=StateGraph(AnalyzerState)
builder.add_node("toxicity_node",toxicity_node)
builder.add_node("copyright_node",copyright_node)
builder.add_node("culture_node",culture_node)

builder.add_edge(START,"toxicity_node")
builder.add_edge(START,"copyright_node")
builder.add_edge(START,"culture_node")

builder.add_edge("toxicity_node",END)
builder.add_edge("copyright_node",END)
builder.add_edge("culture_node",END)

app=builder.compile()

sample_script = """
Yo everyone, welcome to my channel! Today I'm uploading the full album of a famous singer, every song with the original lyrics, and I'm also streaming the whole Netflix series I screen-recorded without permission.
If you're still paying for subscriptions you're a complete fool, and those artists are pathetic clowns.
Also, people from that religion are dirty and their rituals are disgusting. Enjoy the show!
"""

initial_state={
    "raw_text":sample_script,
    "safety_score":{}
}
final_state=app.invoke(initial_state)
print(final_state["safety_score"])
