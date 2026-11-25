import type { Route } from "@/types/chat";

export interface Programme {
  name: string;
  short: string;
  school: string;
}

export const PROGRAMMES: Programme[] = [
  { name: "BBA", short: "BBA", school: "Business School" },
  { name: "BS Accounting & Finance", short: "A&F", school: "Business School" },
  { name: "BS Computer Science", short: "CS", school: "Computer Science" },
  { name: "BS Software Engineering", short: "SE", school: "Software Engineering" },
  { name: "BS Artificial Intelligence", short: "AI", school: "Computer Science" },
  { name: "BS Psychology", short: "PSY", school: "Professional Psychology" },
  { name: "LLB", short: "LLB", school: "Law" },
];

export function shortName(programme: string): string {
  return PROGRAMMES.find((p) => p.name === programme)?.short ?? "U";
}

// Shown on an empty chat
export const SUGGESTIONS = [
  "What is the fee for first semester?",
  "Which subjects will I study in first semester?",
  "What is the minimum attendance required?",
  "How is my GPA calculated?",
];

// Shown after each answer, based on which route answered
export const FOLLOW_UPS: Record<Route, string[]> = {
  fee: [
    "Is there any scholarship I can get?",
    "What is the fine for late fee payment?",
    "Is caution money refundable?",
  ],
  academic: [
    "What happens if my CGPA falls below 2.0?",
    "What is the passing percentage?",
    "Can I repeat a course to improve my grade?",
  ],
  general: [
    "What is the fee for first semester?",
    "Which subjects will I study in first semester?",
    "What is the minimum attendance required?",
  ],
};