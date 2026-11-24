import os
from typing import TypedDict,Annotated,Literal
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph,START,END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
import pdfplumber
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
load_dotenv()

embeddings=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
def clean(text) -> str:
    """Remove line breaks and extra spaces inside a table cell."""
    return " ".join((text or "").split())


def extract_table_docs(pdf_path: str) -> list:
    """Read every table in the PDF and turn each row into a labelled sentence."""
    table_docs = []
    last_header = None   # remember header in case a table continues on next page

    with pdfplumber.open(pdf_path) as pdf:
        for page_no, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables()

            for table in tables:
                if not table or len(table) < 2:
                    continue

                first_row = [clean(c) for c in table[0]]

                # Is the first row a header (text) or a data row (continuing table)?
                looks_like_header = not any("Rs." in c for c in first_row)

                if looks_like_header:
                    header = first_row
                    rows = table[1:]
                    last_header = header
                elif last_header and len(last_header) == len(first_row):
                    header = last_header          # table continued from previous page
                    rows = table
                else:
                    continue

                for row in rows:
                    cells = [clean(c) for c in row]
                    sentence = ". ".join(
                        f"{h}: {c}" for h, c in zip(header, cells) if h and c
                    )
                    if sentence:
                        table_docs.append(Document(
                            page_content=sentence + ".",
                            metadata={"source": pdf_path, "page": page_no, "type": "table"}
                        ))

    return table_docs
def build_retriever(pdf_path: str):
    # 1. Normal text (paragraphs)
    loader = PyPDFLoader(pdf_path)
    document = loader.load()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    text_chunks = splitter.split_documents(document)

    # 2. Tables (each row as one labelled sentence)
    table_docs = extract_table_docs(pdf_path)
    print(f"{pdf_path}: {len(text_chunks)} text chunks + {len(table_docs)} table rows")

    # 3. Put both into the same vector store
    vector_store = FAISS.from_documents(text_chunks + table_docs, embeddings)
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 6}
    )
    return retriever

academics_retriever=build_retriever("academics_handbook.pdf")
fee_retriever=build_retriever("fee_structure.pdf")

llm=ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite")

# FIX: Gemini 3.x can return content as a list of parts, so read the text safely
def get_text(message)->str:
    content=message.content
    if isinstance(content,str):
        return content
    return "".join(
        part.get("text","") if isinstance(part,dict) else str(part)
        for part in content
    )


# State
class State(TypedDict):
    programme:str
    messages:Annotated[list,add_messages]
    query_type:str
    retrieved_context:str

# Nodes
def classifier_node(state:State)->dict:
    """Look at user latest message and decide which path to take."""
    last_message=get_text(state['messages'][-1])
    prompt=f"""
    You are a query classifier for the Bahria University Islamabad student chatbot.
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
   - a general knowledge or study question not specific to Bahria University
     (e.g. "what is machine learning?", "tips to prepare for exams")
   - anything not covered by the two documents above

    === RULES FOR TRICKY CASES ===
    - If the question mentions money, cost, payment, refund, fine amount or scholarship -> "fee".
    - "How do I withdraw a course?" -> "academic". "Do I get a refund if I withdraw?" -> "fee".
    - "Semester freeze rules" -> "academic". "Fee refund on semester freeze" -> "fee".
    - Retake exam rules -> "academic". Retake exam charges -> "fee".
    - If the latest message is a follow-up (e.g. "what about LLB?", "and for 2nd semester?"),
    use the conversation history to understand what topic it continues.
    - If the question asks about BOTH academics and fee, choose the one that is the main focus.
    - If the question is about Bahria University but you are unsure, prefer "academic" over "general".

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
    response=llm.invoke(prompt)
    category=get_text(response).strip().lower()   # FIX: was response.content (list -> crash)
    if "academic" in category:
        category="academic"
    elif "fee" in category:
        category="fee"
    else:
        category="general"

    return {"query_type":category}

def academic_node(state:State)->dict:
    """Retrieves relevant chunks from the academic handbook."""
    query=get_text(state['messages'][-1])
    docs=academics_retriever.invoke(query)
    context="\n\n".join(doc.page_content for doc in docs)
    return {"retrieved_context":context}

def fee_node(state:State)->dict:
    """Retrieves relevant chunks from the fee structure handbook."""
    query=get_text(state['messages'][-1])
    docs=fee_retriever.invoke(query)
    context="\n\n".join(doc.page_content for doc in docs)
    return {"retrieved_context":context}

def general_node(state:State)->dict:
    """Answer directly using LLMs own knowledge, no retrieval needed."""
    return{"retrieved_context":"No_retrieval_needed"}


def response_node(state:State)->dict:
    """Generate the final answer personalized using the student program."""
    query=get_text(state["messages"][-1])
    context=state.get("retrieved_context","No_retrieval_needed")   # FIX: safe access
    programme=state.get("programme","Unknown") #state.get is used because if programme is missing in the state or user not enter yet, it will print Unknown

    if context=="No_retrieval_needed":
        prompt=(
            f"""You are a friendly college assistant talking to a {programme} student.
            Answer the student's question using your own general knowledge.
            The question is {query}"""
        )   # FIX: added f so {programme} and {query} are filled in
    else:
        prompt = f"""You are the official student assistant of Bahria University Islamabad.
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
        say that clearly instead of guessing.
        4. Copy all numbers exactly as written in the context (fees in Rs., percentages,
        credit hours, CGPA). Do not round or change them.
        5. If the answer is NOT in the context, reply:
        "I'm sorry, I don't have this information. Please contact the Bahria University
        Islamabad office or visit www.bahria.edu.pk."
        6. Keep the answer short, clear and friendly, in simple English.
        Use bullet points or a small table when listing multiple items
        (for example fee breakdowns or course lists).
        7. Do not mention words like "context" or "document" in your answer.
        Answer naturally, as a university staff member would.

        === CONTEXT ===
        {context}

        === STUDENT'S QUESTION ===
        {query}
        === ANSWER ==="""
    response=llm.invoke(prompt)
    return {"messages":[response]}   # FIX: return the AI message object, not a string


def router_query(state:State)->Literal["academic_rag","fee_rag","general"]:  #this makes langGraph knows all possible paths
    if state['query_type']=='academic':
        return "academic_rag"
    elif state['query_type']=='fee':
        return "fee_rag"
    else:
        return "general"

graph=StateGraph(State)

graph.add_node("classifier",classifier_node)
graph.add_node("academic_rag",academic_node)
graph.add_node("fee_rag",fee_node)
graph.add_node("general",general_node)
graph.add_node("response",response_node)

graph.add_edge(START,"classifier")
graph.add_conditional_edges(
    "classifier",router_query
)
graph.add_edge("academic_rag","response")
graph.add_edge("fee_rag","response")
graph.add_edge("general","response")
graph.add_edge("response",END)

app=graph.compile()


PROGRAMMES = [
    "BBA",
    "BS Accounting & Finance",
    "BS Computer Science",
    "BS Software Engineering",
    "BS Artificial Intelligence",
    "BS Psychology",
    "LLB",
]


def choose_programme() -> str:
    print("\n===== Bahria University Islamabad Chatbot =====")
    print("Please select your programme:\n")
    for i, p in enumerate(PROGRAMMES, start=1):
        print(f"  {i}. {p}")

    while True:
        choice = input("\nEnter number: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(PROGRAMMES):
            programme = PROGRAMMES[int(choice) - 1]
            print(f"\nYou selected: {programme}")
            print("Type your question (type 'change' to switch programme, 'exit' to quit)\n")
            return programme
        print("Invalid choice, please try again.")


def run_chat():
    programme = choose_programme()
    history = []   # keeps the whole conversation

    while True:
        user_input = input("You: ").strip()

        if not user_input:
            continue
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("Bot: Goodbye! Best of luck with your studies.")
            break
        if user_input.lower() == "change":
            programme = choose_programme()
            history = []   # fresh conversation for new programme
            continue

        history.append(HumanMessage(content=user_input))

        result = app.invoke({
            "messages": history,
            "programme": programme,
        })

        answer = get_text(result["messages"][-1])   # FIX: was .content (list)
        print(f"\n[Route: {result['query_type']}]")   # shows which path was taken
        print(f"Bot: {answer}\n")

        history = result["messages"]   # save updated history (question + answer)


if __name__ == "__main__":
    run_chat()