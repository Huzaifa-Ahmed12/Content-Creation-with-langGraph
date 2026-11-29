import os
from typing import TypedDict, Annotated
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

class State(TypedDict):
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
    """Write or rewrites the LinkedIn post. Use Tavily for live searches."""
    topic=state["topic"]
    attempt=state.get("attempt",0)+1
    previous_feedback=state["review_feedback"]

    if attempt==1:
        user_message=(
            """Write a LinkedIn post on the topic {topic}. If you need current or live data use web search using tavily tool."""
        )
    else:
        user_message=(
            """Your previous draft on topic {topic} was rejected.
            Here's the reviewer feedback {previous_feedback}.
            Check the feedback and write improved new draft that fixes the issues mentioned.
            Donot repeat the mistakes."""
        )
    messages=[("system",WRITER_SYSTEM_PROMPT),("human",user_message)]
    response=writer_llm_with_tools.invoke(messages)
    return{
        "messages":[("human",user_message),("ai",response.content)],
        "attempt":attempt
    }

tool_node=ToolNode(tools)

def extract_draft_node(state:State)->dict:
    """After the writer finishes the tool calls, pull the final text out as draft."""
    last_message=state["messages"][-1]
    draft=last_message.content
    print(f"\n\n The draft is {draft} \n")
    return {"draft":draft}


REVIEWER_SYSTEM_PROMPT = """You are a strict but fair LinkedIn content reviewer. You review ONE draft post and decide if it is ready to publish.

Score the draft against this checklist:
1. Hook: Does the first line grab attention in under ~15 words? Is it free of generic openers like "I'm excited to share"?
2. Value: Does the post deliver one clear idea, insight, or lesson that a professional would care about?
3. Accuracy: Are the facts, numbers, and claims believable and specific? Flag anything that looks invented or vague.
4. Structure: Are there short paragraphs (1-2 lines) with blank lines between them? Is there a clear closing question or takeaway?
5. Style: Is it human and conversational, with no buzzwords or clichés ("game-changer", "unlock", "in today's fast-paced world")? Are there at most 2-3 emojis?
6. Length: Is it roughly 150-250 words?
7. Format: Is it plain text only, with no markdown headings or ** bold markers? Are there 3-5 relevant hashtags on the last line?

Decision rules:
- Choose APPROVED only if the draft meets all the points above, or has at most a minor flaw that doesn't hurt quality.
- Choose REJECTED if any important point fails.
- If you reject, give specific, actionable feedback. Point to the exact line that is weak and say how to fix it. List the most important fixes first, with a maximum of 4 points.
- Don't rewrite the post yourself. Don't give vague feedback like "make it better".
- Don't invent problems. If the draft is good, approve it.

Output format (follow EXACTLY, with no extra text before or after):
DECISION: APPROVED or REJECTED
FEEDBACK: <specific fixes if rejected; one short line of praise if approved>
"""

def reviewer_node(state:State)->dict:
    """Review the draft and decides whether to approve or reject with proper feedback."""
    draft=state["draft"]
    prompt=(
        """Review the LinkedIn post Draft given {draft} and give your feedback."""
    )
    messages=[("system",REVIEWER_SYSTEM_PROMPT),("human",prompt)]
    response=reviewer_llm.invoke(messages)
    review_text=response.content
    is_approved="APPROVED" in review_text.upper().split("FEEDBACK")(0)
