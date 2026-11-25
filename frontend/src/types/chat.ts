export type Route = "academic" | "fee" | "general";
export type Feedback = "up" | "down";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  route?: Route; // which LangGraph path answered (bot messages only)
  feedback?: Feedback; // student's thumbs up / down (bot messages only)
  isError?: boolean; // true when the message is an error notice
  createdAt: number;
}

export interface Conversation {
  id: string; // also used as LangGraph thread_id
  title: string;
  programme: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatResponse {
  answer: string;
  route: Route;
}