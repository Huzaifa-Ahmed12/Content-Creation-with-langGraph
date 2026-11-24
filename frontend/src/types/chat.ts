export type Route = "academic" | "fee" | "general";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  route?: Route; // which LangGraph path answered (bot messages only)
}

export interface ChatResponse {
  answer: string;
  route: Route;
}