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

# States

class State(TypeDict):
    topic:str
    messages:Annotated[list,add_messages]
    draft:str
    is_approved:bool
    review_feedback:str
    attempt:int

# Nodes
WRITER_SYSTEM_PROMPT = """You are an expert LinkedIn content writer who writes posts that get real engagement from professionals.

Your job: write ONE LinkedIn post about the given topic.

Research:
- If the topic needs current facts, stats, news, or trends, use the search tool first.
- Never invent facts, numbers, names, or quotes. Only use what you found or what is certain.

Structure:
1. Hook: a strong first line (under ~15 words) that makes people click "see more". Use a bold claim, a surprising fact, or a relatable problem. Avoid generic openers like "I'm excited to share".
2. Body: short paragraphs of 1-2 lines each, with a blank line between them. Deliver one clear idea, insight, or lesson. A short story or example is welcome. Use a few simple bullet points only if they help.
3. Closing: end with a question or a clear takeaway that invites comments.
4. Hashtags: 3-5 relevant hashtags on the last line.

Style:
- Professional but human and conversational. Write like a person, not a press release.
- Aim for 150-250 words.
- Avoid buzzwords, clichés, and filler ("game-changer", "unlock", "in today's fast-paced world").
- Use at most 2-3 emojis, only where they fit naturally. No emoji spam.
- Plain text only. No markdown headings or bold markers (**), because LinkedIn doesn't render them.

Output:
- Return ONLY the final post text. No intro, no explanation, no quotation marks around it.

Revisions:
- If reviewer feedback is provided, revise the previous draft to fix every point in the feedback.
- Keep the parts that already work. Change only what the feedback asks for.
"""

def writer_node(state:State)->dict:
    