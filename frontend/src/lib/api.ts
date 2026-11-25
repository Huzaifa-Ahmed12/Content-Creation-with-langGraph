import type { ChatResponse } from "@/types/chat";

// Address of the FastAPI backend (set in frontend/.env.local)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Sends the student's message to the FastAPI backend (/chat)
 * and returns the chatbot's answer and the route LangGraph used.
 */
export async function sendMessage(
  message: string,
  programme: string,
  threadId: string
): Promise<ChatResponse> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, programme, thread_id: threadId }),
    });
  } catch {
    throw new Error(
      "Cannot connect to the server. Please make sure the backend is running on port 8000."
    );
  }

  if (!res.ok) {
    let detail = `Server error (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }

  return res.json();
}

/** Returns true if the backend /health endpoint answers. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}