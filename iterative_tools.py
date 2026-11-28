import os
from typing import TypeDict, Annotated
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph,START,END
from langgraph.prebuilt import ToolNode
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch
from dotenv import load_dotenv
load_dotenv()


# Writer tool for writing the content
writer_llm=ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite",temperature=0.7)
search_tool=TavilySearch(max_results=3)
tools=[search_tool]
writer_llm_with_tools=writer_llm.bind_tools(tools)

# Reviewer tool for reviewing the content
reviewer_llm=ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite",temperature=0.2)


