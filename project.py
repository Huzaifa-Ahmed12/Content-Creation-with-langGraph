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

# Creating Nodes

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

def scriptwriter_node(state:pipeline_state)->dict:
    """Stage 2: Format the clean text into an engaging video script style."""
    prompt=(
        """You are a charismatic Youtube Content Creator. Take this edited text and transform it into a highly 
        engaging, punchy, conversational video script hook. Make it sound like a real person speaking passionately. Return only the script content.\n\n"""
        f"Edited Text: \n {state['editor_text']}"
    )
    response=llm.invoke(prompt)
    return {"script_text":response.content.strip()}

def translator_node(state:pipeline_state)->dict:
    """Stage 3: Translates the script into natural flowing Hinglish."""
    prompt=(
        """You are an expert content localizer for the indian market. Take the following script and convert it into natural, flowing
        Hinglish. Dont simply translate it sentence by sentence or repeat information. Alternating comfortably between Hindi and English phrases just like 
        an intellectual tech educator would speak naturally on a live stream. Keep the energy high.
        Return only the Hinglish text."""
        f"Script Text: \n {state['script_text']}"
    )
    response=llm.invoke(prompt)
    return {"final_output":response.content.strip()}

# State and Nodes are created, now its time to connect these nodes and create a complete graph and for this we need edges
# Edges

from langgraph.graph import StateGraph, START,END
#Creating Graph
graph=StateGraph(pipeline_state)

#Adding Nodes

graph.add_node("editor",editor_node)
graph.add_node("script_writer",scriptwriter_node)
graph.add_node("translator",translator_node)

# Adding Edges Sequential Workflow - one after the other
graph.add_edge(START,"editor")
graph.add_edge("editor","script_writer")
graph.add_edge("script_writer","translator")
graph.add_edge("translator",END)

# Compile Graph
app=graph.compile()


