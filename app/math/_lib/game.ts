export type Mode = "math" | "stats" | "tips";
export type TimedMode = Exclude<Mode, "stats">;
export type Operation = "add" | "subtract" | "multiply" | "divide";
export type Level = 1 | 2 | 3;
export const ROUND_SECONDS = 60;
export const OPERATIONS: { id: Operation; label: string; symbol: string }[] = [
  { id: "add", label: "Addition", symbol: "+" },
  { id: "subtract", label: "Subtraction", symbol: "−" },
  { id: "multiply", label: "Multiplication", symbol: "×" },
  { id: "divide", label: "Division", symbol: "÷" },
];
export const TIP_PERCENTAGES = [15, 18, 20, 22, 25] as const;
export interface Question {
  prompt: string;
  answer: number;
  choices: number[];
  explanation: string;
  a?: number;
  b?: number;
  operation?: Operation;
  billCents?: number;
  percent?: number;
}
export interface Attempt { question: Question; selected: number; correct: boolean }
export interface Session {
  id: string;
  mode: Mode;
  date: string;
  correct: number;
  total: number;
  level?: Level;
  lessonId?: string;
}
export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function makeChoices(answer: number, offsets: number[]): number[] {
  const choices = new Set([answer]);
  for (const offset of shuffle(offsets)) {
    const choice = answer + offset;
    if (choice >= 0) choices.add(choice);
    if (choices.size === 4) break;
  }
  for (let offset = 1; choices.size < 4; offset++) choices.add(answer + offset);
  return shuffle([...choices]);
}
export function makeMathQuestion(level: Level, operations: Operation[], previous?: string): Question {
  const max = [10, 15, 25][level - 1];
  const smallerMax = level === 3 ? 15 : 10;
  const pool = operations.length ? operations : OPERATIONS.map(op => op.id);
  let question!: Question;
  for (let retry = 0; retry < 10; retry++) {
    const operation = pool[randomInt(0, pool.length - 1)];
    let a = randomInt(0, max);
    let b = randomInt(0, operation === "multiply" || operation === "divide" ? smallerMax : max);
    let answer: number;
    if (operation === "subtract") {
      [a, b] = [Math.max(a, b), Math.min(a, b)];
      answer = a - b;
    } else if (operation === "multiply") answer = a * b;
    else if (operation === "divide") {
      const quotient = a;
      b = randomInt(1, smallerMax);
      a = quotient * b;
      answer = quotient;
    } else answer = a + b;
    const symbol = OPERATIONS.find(op => op.id === operation)!.symbol;
    const prompt = `${a} ${symbol} ${b}`;
    const explanation = operation === "divide" ? `${b} × ${answer} = ${a}, so ${prompt} = ${answer}.` : `${prompt} = ${answer}.`;
    question = { a, b, operation, prompt, answer, choices: makeChoices(answer, [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10]), explanation };
    if (prompt !== previous) break;
  }
  return question;
}
export function tipCents(billCents: number, percent: number): number {
  // Integer cents keep rounding predictable, including half-cent cases.
  return Math.floor((billCents * percent + 50) / 100);
}
export function money(cents: number): string { return `$${(cents / 100).toFixed(2)}`; }
export function makeTipQuestion(level: Level, percentages: number[], previous?: string): Question {
  const pool = percentages.length ? percentages : [...TIP_PERCENTAGES];
  let question!: Question;
  for (let retry = 0; retry < 10; retry++) {
    const billCents = level === 1 ? randomInt(2, 16) * 500 : level === 2 ? randomInt(12, 120) * 100 : randomInt(1250, 15000);
    const percent = pool[randomInt(0, pool.length - 1)];
    const answer = tipCents(billCents, percent);
    const prompt = `${percent}% of ${money(billCents)}`;
    const strategy = ({15: "Find 10%, then add half of it (5%).",18: "Find 20%, then subtract 2%.",20: "Find 10% and double it.",22: "Find 20%, then add 2%.",25: "Divide the bill by 4."} as Record<number, string>)[percent];
    question = { prompt, billCents, percent, answer, choices: makeChoices(answer, [-300, -200, -150, -100, -50, -25, 25, 50, 100, 150, 200, 300]), explanation: `${strategy} ${prompt} = ${money(answer)}, rounded to the nearest cent.` };
    if (prompt !== previous) break;
  }
  return question;
}
export function secondsRemaining(deadline: number, now: number): number { return Math.max(0, Math.min(ROUND_SECONDS, Math.ceil((deadline - now) / 1000))); }
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function practiceStreak(sessions: Session[], now = new Date()): number {
  const days = new Set(sessions.map(session => localDay(new Date(session.date))));
  const cursor = new Date(now);
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}
export function readSessions(raw: string | null): Session[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.filter((item): item is Session => {
      if (!item || typeof item !== "object") return false;
      const s = item as Session;
      const valid = typeof s.id === "string" && !seen.has(s.id) && ["math","tips","stats"].includes(s.mode) && typeof s.date === "string" && Number.isFinite(Date.parse(s.date)) && Number.isInteger(s.correct) && Number.isInteger(s.total) && s.correct >= 0 && s.total >= s.correct && (s.mode === "stats" ? typeof s.lessonId === "string" && s.total === 3 : [1,2,3].includes(s.level ?? 0));
      if (valid) seen.add(s.id);
      return valid;
    });
  } catch { return []; }
}
