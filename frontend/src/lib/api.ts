import type { ChatResponse } from "@/types/chat";

/**
 * Sends the student's message to the chatbot.
 *
 * RIGHT NOW: returns a fake (mock) answer, so the frontend works without a backend.
 * LATER: set USE_MOCK = false and the same function will call your FastAPI backend.
 */
const USE_MOCK = true;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function sendMessage(
  message: string,
  programme: string,
  threadId: string
): Promise<ChatResponse> {
  if (USE_MOCK) {
    return mockReply(message, programme);
  }

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, programme, thread_id: threadId }),
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }
  return res.json();
}

// ---------------- Mock (temporary) ----------------
async function mockReply(message: string, programme: string): Promise<ChatResponse> {
  await new Promise((r) => setTimeout(r, 900)); // pretend the server is thinking
  const q = message.toLowerCase();

  if (/(fee|cost|pay|refund|scholarship|fine|challan)/.test(q)) {
    return {
      route: "fee",
      answer: `This is a **demo answer** for **${programme}** fee questions.\n\n| Item | Amount |\n|---|---|\n| Tuition (1st semester) | Rs. xxx,xxx |\n| Misc. charges | Rs. xx,xxx |\n\nReal answers will come from the fee PDF once the backend is connected.`,
    };
  }
  if (/(course|subject|semester|attendance|gpa|cgpa|grade|exam|fyp|internship|credit)/.test(q)) {
    return {
      route: "academic",
      answer: `This is a **demo answer** for **${programme}** academic questions.\n\n- Real answers will come from the academic handbook\n- Connected through LangGraph + RAG`,
    };
  }
  return {
    route: "general",
    answer: `Hi! I'm the Bahria University Islamabad assistant. Ask me anything about **${programme}** academics or fees.`,
  };
}