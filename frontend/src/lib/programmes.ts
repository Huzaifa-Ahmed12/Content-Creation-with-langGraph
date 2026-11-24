export interface Programme {
  name: string;
  short: string;
  school: string;
}

export const PROGRAMMES: Programme[] = [
  { name: "BBA", short: "BBA", school: "Bahria Business School" },
  { name: "BS Accounting & Finance", short: "A&F", school: "Bahria Business School" },
  { name: "BS Computer Science", short: "CS", school: "Computer Science" },
  { name: "BS Software Engineering", short: "SE", school: "Software Engineering" },
  { name: "BS Artificial Intelligence", short: "AI", school: "Computer Science" },
  { name: "BS Psychology", short: "PSY", school: "Professional Psychology" },
  { name: "LLB", short: "LLB", school: "Law" },
];

export const SUGGESTIONS = [
  "What is the fee for first semester?",
  "Which subjects will I study in first semester?",
  "What is the minimum attendance required?",
  "How is my GPA calculated?",
];