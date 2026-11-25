from pathlib import Path
from typing import TypedDict, Annotated, Literal
import re
import pdfplumber
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# ---------------- PATHS ----------------
BACKEND_DIR = Path(__file__).resolve().parent      # .../LangGraph/backend
DATA_DIR = BACKEND_DIR / "data"                     # .../LangGraph/backend/data
load_dotenv(BACKEND_DIR.parent / ".env")            # .../LangGraph/.env (GOOGLE_API_KEY)

PROGRAMMES = [
    "BBA",
    "BS Accounting & Finance",
    "BS Computer Science",
    "BS Software Engineering",
    "BS Artificial Intelligence",
    "BS Psychology",
    "LLB",
]

# ---------------- EMBEDDINGS + RETRIEVERS ----------------
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


def clean(text) -> str:
    """Remove line breaks and extra spaces inside a table cell."""
    return " ".join((text or "").split())


def extract_table_docs(pdf_path: Path) -> list:
    """Read every table in the PDF and turn each row into a labelled sentence."""
    table_docs = []
    last_header = None  # remember header in case a table continues on next page

    with pdfplumber.open(pdf_path) as pdf:
        for page_no, page in enumerate(pdf.pages, start=1):
            for table in page.extract_tables():
                if not table or len(table) < 2:
                    continue

                first_row = [clean(c) for c in table[0]]
                looks_like_header = not any("Rs." in c for c in first_row)

                if looks_like_header:
                    header = first_row
                    rows = table[1:]
                    last_header = header
                elif last_header and len(last_header) == len(first_row):
                    header = last_header  # table continued from previous page
                    rows = table
                else:
                    continue

                for row in rows:
                    cells = [clean(c) for c in row]
                    sentence = ". ".join(f"{h}: {c}" for h, c in zip(header, cells) if h and c)
                    if sentence:
                        table_docs.append(Document(
                            page_content=sentence + ".",
                            metadata={"source": pdf_path.name, "page": page_no, "type": "table"},
                        ))
    return table_docs


def build_retriever(pdf_path: Path, use_tables: bool = False):
    # 1. Normal text (paragraphs)
    document = PyPDFLoader(str(pdf_path)).load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    text_chunks = splitter.split_documents(document)

    # 2. Tables (only if asked)
    table_docs = extract_table_docs(pdf_path) if use_tables else []
    print(f"{pdf_path.name}: {len(text_chunks)} text chunks + {len(table_docs)} table rows")

    # 3. Put both into the same vector store
    vector_store = FAISS.from_documents(text_chunks + table_docs, embeddings)
    return vector_store.as_retriever(search_kwargs={"k": 6})


academics_retriever = build_retriever(DATA_DIR / "academics_handbook.pdf", use_tables=False)
fee_retriever = build_retriever(DATA_DIR / "fee_structure.pdf", use_tables=True)

llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite")


def get_text(message) -> str:
    """Gemini 3.x can return content as a list of parts, so read the text safely."""
    content = message.content
    if isinstance(content, str):
        return content
    return "".join(
        part.get("text", "") if isinstance(part, dict) else str(part)
        for part in content
    )


# ---------------- STATE ----------------
class State(TypedDict):
    programme: str
    messages: Annotated[list, add_messages]
    query_type: str
    retrieved_context: str


# ---------------- NODES ----------------
def classifier_node(state: State) -> dict:
    """Look at user latest message and decide which path to take."""
    last_message = get_text(state["messages"][-1])
    prompt = f"""
    You are a query classifier for a university student chatbot.
    Your ONLY job is to decide which knowledge source should answer the student's latest message.
    You do NOT answer the question.
    === CATEGORIES ===

    1. "academic" -> Use the ACADEMIC HANDBOOK. Choose this when the question is about:
   - programmes offered, duration, total credit hours, eligibility
   - courses, subjects, road map, semester-wise courses, electives, specializations
   - attendance rules, quizzes, mid-term, final exam, marks distribution
   - grading, GPA, CGPA, pass marks, grades (A, B+, F, etc.)
   - probation, dropping out, course repeat, grade improvement
   - adding, dropping or withdrawing a course, semester freeze, summer semester
   - internship, final year project (FYP), capstone project
   - degree requirements, honours, medals, Rector's list
   - migration, credit transfer, unfair means, cheating penalties
   - library, hostel, transport, campus facilities

    2. "fee" -> Use the FEE STRUCTURE document. Choose this when the question is about:
   - tuition fee, semester fee, per credit hour rate, total programme cost
   - admission fee, caution money / security deposit, degree fee, misc charges
   - how and when to pay, fee challan, bank, instalments, tax on fee
   - late fee fine, penalties for late payment
   - fee refund, refund on withdrawal or freeze
   - scholarships, fee waivers, financial assistance, need-based aid, laptop loan
   - charges for transcripts, retake exams, duplicate degree, fines

    3. "general" -> No document needed. Choose this when the message is:
   - a greeting, thanks, goodbye or small talk ("hi", "thank you", "ok")
   - a question about the chatbot itself ("who are you?", "what can you do?")
   - a general knowledge or study question not specific to the University
     (e.g. "what is machine learning?", "tips to prepare for exams")
   - anything not covered by the two documents above

    === RULES FOR TRICKY CASES ===
    - If the question mentions money, cost, payment, refund, fine amount or scholarship -> "fee".
    - "How do I withdraw a course?" -> "academic". "Do I get a refund if I withdraw?" -> "fee".
    - "Semester freeze rules" -> "academic". "Fee refund on semester freeze" -> "fee".
    - Retake exam rules -> "academic". Retake exam charges -> "fee".
    - If the question asks about BOTH academics and fee, choose the one that is the main focus.
    - If the question is about University but you are unsure, prefer "academic" over "general".

    === EXAMPLES ===
    "What is the minimum attendance required?" -> academic
    "Which courses are in 3rd semester of BS CS?" -> academic
    "What is a passing grade?" -> academic
    "How much is the BBA fee per semester?" -> fee
    "Is caution money refundable?" -> fee
    "Can I get a scholarship if I top my batch?" -> fee
    "What happens if I pay my fee late?" -> fee
    "Hello!" -> general
    "Explain what an API is" -> general
    "Thanks for the help" -> general

    Query: {last_message}

    Reply with EXACTLY one word, in lowercase, and nothing else:
    academic
    fee
    general
    """
    response = llm.invoke(prompt)
    category = get_text(response).strip().lower()
    if "academic" in category:
        category = "academic"
    elif "fee" in category:
        category = "fee"
    else:
        category = "general"
    return {"query_type": category}


def academic_node(state: State) -> dict:
    """Retrieves relevant chunks from the academic handbook."""
    query = get_text(state["messages"][-1])
    programme = state.get("programme", "")
    docs = academics_retriever.invoke(f"{programme} {query}")  # add programme to the search
    context = "\n\n".join(doc.page_content for doc in docs)
    return {"retrieved_context": context}


def fee_node(state: State) -> dict:
    """Retrieves relevant chunks from the fee structure document."""
    query = get_text(state["messages"][-1])
    programme = state.get("programme", "")
    docs = fee_retriever.invoke(f"{programme} {query}")  # add programme to the search
    context = "\n\n".join(doc.page_content for doc in docs)
    return {"retrieved_context": context}


def general_node(state: State) -> dict:
    """Answer directly using LLMs own knowledge, no retrieval needed."""
    return {"retrieved_context": "No_retrieval_needed"}


def response_node(state: State) -> dict:
    """Generate the final answer personalized using the student programme."""
    query = get_text(state["messages"][-1])
    context = state.get("retrieved_context", "No_retrieval_needed")
    programme = state.get("programme", "Unknown")

    if context == "No_retrieval_needed":
        prompt = f"""You are UniAssist, a friendly university chatbot talking to a {programme} student.
    Answer the student's question using your own general knowledge.
    Keep the answer short, clear and in simple Plain English.
    Never mention the name of any specific university; just say "the university".

Student's question: {query}"""
    else:
        prompt = f"""You are the official student assistant of a university.
You are talking to a student of the {programme} programme.

=== YOUR TASK ===
Answer the student's question using ONLY the information in the CONTEXT below.
The context is taken from official university documents.

=== RULES ===
1. Use ONLY the context. Do NOT use outside knowledge or make up any numbers,
   fees, dates, course names or rules.
2. If the answer depends on the programme (fee, courses, credit hours, road map),
   give the answer for {programme}, unless the student clearly asks about
   another programme.
3. If the context has the answer for other programmes but not for {programme},
   say that you don't have the {programme} figure, and share what the context does say.
4. Copy all numbers exactly as written in the context (fees in Rs., percentages,
   credit hours, CGPA). Do not round or change them.
5. Only if the context has NOTHING related to the question, reply:
   "I'm sorry, I don't have this information. If the context has a partial answer, give that partial answer.
6. Keep the answer short, clear and friendly, in simple English.
   Use bullet points or a small table when listing multiple items
   (for example fee breakdowns or course lists).
7. Do not mention words like "context" or "document" in your answer.
   Answer naturally, as a university staff member would.
8. Never mention the name of the university, its campus, or its website.
   Always say "the university" instead.

=== CONTEXT ===
{context}

=== STUDENT'S QUESTION ===
{query}

=== ANSWER ==="""

    response = llm.invoke(prompt)
    return {"messages": [response]}


# ---------------- ROUTER (conditional edge) ----------------
def router_query(state: State) -> Literal["academic_rag", "fee_rag", "general"]:
    if state["query_type"] == "academic":
        return "academic_rag"
    elif state["query_type"] == "fee":
        return "fee_rag"
    else:
        return "general"


# ---------------- GRAPH ----------------
graph = StateGraph(State)

graph.add_node("classifier", classifier_node)
graph.add_node("academic_rag", academic_node)
graph.add_node("fee_rag", fee_node)
graph.add_node("general", general_node)
graph.add_node("response", response_node)

graph.add_edge(START, "classifier")
graph.add_conditional_edges("classifier", router_query)
graph.add_edge("academic_rag", "response")
graph.add_edge("fee_rag", "response")
graph.add_edge("general", "response")
graph.add_edge("response", END)

# MemorySaver remembers each conversation by its thread_id
chatbot = graph.compile(checkpointer=MemorySaver())


# ---------------- REMOVE UNIVERSITY NAME FROM ANSWERS ----------------
NAME_PATTERNS = [
    (re.compile(r"Bahria\s+University(\s+Islamabad)?(\s+Campus)?", re.IGNORECASE), "the university"),
    (re.compile(r"(https?://)?(www\.)?bahria\.edu\.pk\S*", re.IGNORECASE), "the university website"),
    (re.compile(r"\bBahria\b", re.IGNORECASE), "the university"),
]


def hide_university_name(text: str) -> str:
    """Safety net: the PDFs contain the real university name, so replace it in every answer."""
    for pattern, replacement in NAME_PATTERNS:
        text = pattern.sub(replacement, text)
    text = re.sub(r"(^|[.!?]\s+)the university", lambda m: m.group(1) + "The university", text)
    return text


# ---------------- FUNCTION USED BY FASTAPI ----------------
def chat_with_bot(message: str, programme: str, thread_id: str) -> dict:
    """Run one turn of the conversation and return the answer + route."""
    config = {"configurable": {"thread_id": thread_id}}
    result = chatbot.invoke(
        {"messages": [HumanMessage(content=message)], "programme": programme},
        config,
    )
    return {
        "answer": hide_university_name(get_text(result["messages"][-1])),
        "route": result["query_type"],
    }