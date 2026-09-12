import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import Sumday from "../app/math/_components/sumday";
import TimedRound from "../app/math/_components/timed-round";
import LabRound from "../app/math/_components/lab-round";
import { LESSONS } from "../app/math/_lib/lessons";
import { type Session } from "../app/math/_lib/game";

let dom:JSDOM, root:Root, container:HTMLDivElement, now:number;
let originalNow:typeof performance.now;
beforeEach(()=>{
  dom=new JSDOM("<!doctype html><html><body></body></html>",{url:"http://localhost:3006"});
  Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
  container=document.createElement("div");document.body.appendChild(container);root=createRoot(container);
  now=0;originalNow=performance.now;performance.now=()=>now;
});
afterEach(async()=>{await act(async()=>root.unmount());performance.now=originalNow;dom.window.close();});
async function render(ui:ReactNode){await act(async()=>root.render(ui));}
async function click(element:Element|null|undefined){assert.ok(element,"Expected an element to click");await act(async()=>{(element as HTMLButtonElement).click();});}
function button(text:string){return [...container.querySelectorAll("button")].find(b=>b.textContent?.includes(text));}
function answerButton(correct:boolean){
  const match=container.querySelector(".math-question")!.textContent!.match(/(\d+)\s([+−×÷])\s(\d+)/)!;
  const a=Number(match[1]),b=Number(match[3]);
  const value=match[2]==="+"?a+b:match[2]==="−"?a-b:match[2]==="×"?a*b:a/b;
  return [...container.querySelectorAll(".answer-button")].find(el=>(Number(el.querySelector("span")!.textContent)===value)===correct);
}

test("a timed round advances for right and wrong answers, scores +1 only for right, and persists once",async()=>{
  const saved:(Session|null)[]=[];
  await render(<StrictMode><TimedRound id="round" mode="math" level={1} operations={["add"]} percentages={[20]} personalBest={null} onComplete={s=>saved.push(s)} onReplay={()=>{}} onBack={()=>{}}/></StrictMode>);
  assert.equal(container.querySelector(".timer-display strong")!.textContent,"1:00");
  await click(answerButton(true));assert.equal(container.querySelector(".live-points strong")!.textContent,"1");assert.equal(container.querySelector(".question-number")!.textContent,"QUESTION 2");
  await click(answerButton(false));assert.equal(container.querySelector(".live-points strong")!.textContent,"1");assert.equal(container.querySelector(".question-number")!.textContent,"QUESTION 3");
  now=61000;await act(async()=>document.dispatchEvent(new dom.window.Event("visibilitychange")));
  assert.equal(saved.length,1);assert.equal(saved[0]!.correct,1);assert.equal(saved[0]!.total,2);
  assert.ok(container.textContent!.includes("50%"));assert.ok(container.textContent!.includes("PERSONAL BEST"));
  await click(button("Review 1 missed answer"));assert.equal(container.querySelectorAll(".review-list>div").length,1);
  await act(async()=>window.dispatchEvent(new dom.window.KeyboardEvent("keydown",{key:"1"})));
  assert.equal(saved.length,1);
});
test("an answer arriving at the deadline is rejected even before the timer callback runs",async()=>{
  const saved:(Session|null)[]=[];
  await render(<TimedRound id="late" mode="math" level={1} operations={["add"]} percentages={[20]} personalBest={null} onComplete={s=>saved.push(s)} onReplay={()=>{}} onBack={()=>{}}/>);
  now=60000;await click(answerButton(true));assert.equal(saved[0]!.correct,0);assert.equal(saved[0]!.total,0);
});
test("ending early does not save a partial score or award a daily session",async()=>{
  const saved:(Session|null)[]=[];
  await render(<TimedRound id="early" mode="math" level={1} operations={["add"]} percentages={[20]} personalBest={null} onComplete={s=>saved.push(s)} onReplay={()=>{}} onBack={()=>{}}/>);
  await click(answerButton(true));await click(button("End round"));assert.deepEqual(saved,[null]);assert.ok(container.textContent!.includes("wasn’t saved"));
});
test("keyboard shortcuts answer correctly, ignore held keys, and block two events on one question",async()=>{
  await render(<TimedRound id="keys" mode="math" level={1} operations={["add"]} percentages={[20]} personalBest={null} onComplete={()=>{}} onReplay={()=>{}} onBack={()=>{}}/>);
  const key=answerButton(true)!.querySelector("kbd")!.textContent!;
  await act(async()=>window.dispatchEvent(new dom.window.KeyboardEvent("keydown",{key,repeat:true})));assert.equal(container.querySelector(".question-number")!.textContent,"QUESTION 1");
  await act(async()=>{window.dispatchEvent(new dom.window.KeyboardEvent("keydown",{key}));window.dispatchEvent(new dom.window.KeyboardEvent("keydown",{key}));});
  assert.equal(container.querySelector(".question-number")!.textContent,"QUESTION 2");assert.equal(container.querySelector(".live-points strong")!.textContent,"1");
});
test("all tabs work, a selection cannot be emptied, and tipping uses the selected percentage",async()=>{
  await render(<Sumday/>);
  for(const name of ["Addition","Subtraction","Multiplication","Division"])await click(button(name));
  assert.equal(container.querySelectorAll(".operation[aria-pressed='true']").length,1);assert.ok(container.textContent!.includes("Keep at least one operation"));
  await click(button("Quick tip"));for(const percent of [15,18,22,25])await click(button(`${percent}%`));
  await click(button("Let’s talk tips"));assert.equal(container.querySelector(".receipt-question b")!.textContent,"20%");
  const bill=Number(container.querySelector(".receipt-question>strong")!.textContent!.replace("$",""));
  const correct=(bill*.2).toFixed(2);const choice=[...container.querySelectorAll(".answer-button")].find(el=>el.querySelector("span")!.textContent===`$${correct}`);await click(choice);
  now=61000;await act(async()=>document.dispatchEvent(new dom.window.Event("visibilitychange")));
  const stored=JSON.parse(localStorage.getItem("sumday-sessions-v1")!);assert.equal(stored[0].mode,"tips");assert.equal(stored[0].correct,1);
  await click(button("One more minute"));assert.equal(container.querySelector(".timer-display strong")!.textContent,"1:00");assert.equal(container.querySelector(".live-points strong")!.textContent,"0");
  await click(button("End round"));await click(button("Everyday stats"));assert.equal(container.querySelectorAll(".lesson-row").length,12);
});
test("a full lesson explains answers, awards mastery and XP, and restores progress on remount",async()=>{
  await render(<StrictMode><Sumday/></StrictMode>);await click(button("Everyday stats"));await click(button("Start your first lesson"));await click(button("Let’s make it stick"));
  for(const expected of ["$11","$3","100"]){
    const choice=[...container.querySelectorAll(".quiz-choice")].find(el=>el.children[1]?.textContent===expected);
    await click(choice);assert.ok(container.querySelector(".explanation-box.correct"));
    await click(button(expected==="100"?"See how you did":"Next question"));
  }
  assert.ok(container.textContent!.includes("+30 XP earned"));
  let saved=JSON.parse(localStorage.getItem("sumday-sessions-v1")!);assert.equal(saved.length,1);assert.equal(saved[0].correct,3);
  await click(button("Back to your study path"));assert.equal(container.querySelectorAll(".lesson-row.mastered").length,1);assert.ok(container.querySelector(".study-xp")!.textContent!.includes("30 XP"));
  await act(async()=>root.unmount());root=createRoot(container);await render(<Sumday/>);await click(button("Everyday stats"));assert.equal(container.querySelectorAll(".lesson-row.mastered").length,1);
  await click(button(LESSONS[0].title));await click(button("Let’s make it stick"));
  for(const expected of ["$11","$3","100"]){await click([...container.querySelectorAll(".quiz-choice")].find(el=>el.children[1]?.textContent===expected));await click(button(expected==="100"?"See how you did":"Next question"));}
  assert.ok(container.textContent!.includes("Best score kept"));await click(button("Back to your study path"));assert.ok(container.querySelector(".study-xp")!.textContent!.includes("30 XP"));
  saved=JSON.parse(localStorage.getItem("sumday-sessions-v1")!);assert.equal(saved.length,2);
});

test("progress updates from another tab and clears when browser storage is cleared", async () => {
  await render(<Sumday/>);
  const record = { id: "another-tab", mode: "math", level: 1, date: new Date().toISOString(), correct: 7, total: 8 };
  const value = JSON.stringify([record]);
  localStorage.setItem("sumday-sessions-v1", value);
  await act(async () => window.dispatchEvent(new dom.window.StorageEvent("storage", { key: "sumday-sessions-v1", newValue: value })));
  assert.equal(container.querySelector(".numbers-card .stat-row strong")!.textContent, "7pts");
  localStorage.clear();
  await act(async () => window.dispatchEvent(new dom.window.StorageEvent("storage", { key: null, newValue: null })));
  assert.equal(container.querySelector(".numbers-card .stat-row strong")!.textContent, "—pts");
});

test("games remain playable with in-memory progress when storage is blocked", async () => {
  Object.defineProperty(dom.window.Storage.prototype, "getItem", { value() { throw new Error("Storage blocked"); } });
  Object.defineProperty(dom.window.Storage.prototype, "setItem", { value() { throw new Error("Storage blocked"); } });
  await render(<Sumday/>);
  assert.ok(container.textContent!.includes("Browser storage is unavailable"));
  await click(button("Let’s do the math"));
  await click(answerButton(true));
  now = 61000;
  await act(async () => document.dispatchEvent(new dom.window.Event("visibilitychange")));
  assert.equal(container.querySelector(".numbers-card .stat-row strong")!.textContent, "1pts");
  assert.ok(container.textContent!.includes("Browser storage is unavailable"));
});

function callFoldChoice(correct = true) {
  const facts = [...container.querySelectorAll(".lab-facts strong")].map(el => Number(el.textContent!.replace(/[$%]/g, "")));
  const [pot, call, chance] = facts;
  const ev = chance * (pot + call) - 100 * call;
  const expected = ev > 0 ? "Call — positive EV" : ev < 0 ? "Fold — negative EV" : "Either — break-even";
  return [...container.querySelectorAll(".lab-choices button")].find(el => (el.children[1].textContent === expected) === correct);
}

test("all five tabs are reachable with arrow keys, Home, and End", async () => {
  await render(<Sumday/>);
  assert.equal(container.querySelectorAll("[role='tab']").length, 5);
  await act(async () => document.getElementById("tab-math")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "End", bubbles: true })));
  assert.equal(document.getElementById("tab-stocks")!.getAttribute("aria-selected"), "true");
  assert.equal(container.querySelectorAll(".lab-game-option").length, 4);
  await act(async () => document.getElementById("tab-stocks")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
  assert.equal(document.getElementById("tab-math")!.getAttribute("aria-selected"), "true");
  await act(async () => document.getElementById("tab-math")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
  assert.equal(document.getElementById("tab-stocks")!.getAttribute("aria-selected"), "true");
  await act(async () => document.getElementById("tab-stocks")!.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Home", bubbles: true })));
  assert.equal(document.getElementById("tab-math")!.getAttribute("aria-selected"), "true");
});

test("lab learning explains all five decisions, keeps old progress, and ignores simulated luck", async context => {
  localStorage.setItem("sumday-sessions-v1", JSON.stringify([{ id: "old-math", mode: "math", level: 1, date: new Date().toISOString(), correct: 4, total: 5 }]));
  await render(<StrictMode><Sumday/></StrictMode>);
  await click(button("Poker Lab")); await click(button("Call or Fold?")); await click(button("Let’s build some intuition"));
  assert.equal(document.getElementById("tab-stocks")!.hasAttribute("disabled"), true);
  await click(button("Show a little hint")); assert.ok(container.querySelector(".lab-hint"));
  for (let i = 0; i < 5; i++) {
    assert.equal(container.querySelector(".lab-step-label")!.textContent, `DECISION ${i + 1} OF 5`);
    // Force an unlucky simulated call after the scenario and correct choice already exist.
    const random = context.mock.method(Math, "random", () => .999);
    await click(callFoldChoice(true)); random.mock.restore();
    assert.equal(container.querySelector(".live-points strong")!.textContent, String(i + 1));
    assert.ok(container.querySelector(".explanation-box.correct"));
    assert.ok(container.querySelector(".lab-simulation")!.textContent!.includes("−$"));
    assert.ok([...container.querySelectorAll(".lab-choices button")].every(el => el.hasAttribute("disabled")));
    await click(button(i === 4 ? "See how you did" : "Next decision"));
  }
  const saved = JSON.parse(localStorage.getItem("sumday-sessions-v1")!);
  assert.equal(saved.length, 2); assert.equal(saved[0].id, "old-math");
  assert.equal(saved[1].mode, "poker"); assert.equal(saved[1].format, "learn"); assert.equal(saved[1].correct, 5); assert.equal(saved[1].total, 5);
  assert.equal(container.querySelectorAll(".lab-review-item").length, 5);
  assert.equal(document.getElementById("tab-stocks")!.hasAttribute("disabled"), false);
  await click(button("Try five fresh decisions"));
  assert.equal(container.querySelector(".live-points strong")!.textContent, "0");
  await click(button("End round")); assert.equal(JSON.parse(localStorage.getItem("sumday-sessions-v1")!).length, 2);
});

test("a mixed Stock Lab learning round visits all four games and stores its result", async () => {
  await render(<Sumday/>); await click(button("Stock Lab")); await click(button("Let’s build some intuition"));
  const seen = new Set<string>();
  for (let i = 0; i < 5; i++) {
    seen.add(container.querySelector(".lab-question-heading .question-number")!.textContent!);
    assert.equal(container.querySelectorAll(".lab-choices button").length, 4);
    await click(container.querySelector(".lab-choices button"));
    assert.ok(container.querySelector(".explanation-box"));
    await click(button(i === 4 ? "See how you did" : "Next decision"));
  }
  assert.equal(seen.size, 4);
  const saved = JSON.parse(localStorage.getItem("sumday-sessions-v1")!);
  assert.equal(saved[0].mode, "stocks"); assert.equal(saved[0].labGame, "mixed"); assert.equal(saved[0].total, 5);
  await act(async () => root.unmount()); root = createRoot(container); await render(<Sumday/>); await click(button("Stock Lab"));
  assert.ok(container.querySelector(".lab-round-count")!.textContent!.includes("1 stock lab sessions"));
});

test("lab sprint advances immediately, counts correct choices only, and saves once on expiry", async () => {
  const saved: (Session | null)[] = [];
  await render(<LabRound id="lab-sprint" mode="poker" selection="call-fold" format="sprint" onComplete={s => saved.push(s)} onReplay={() => {}} onBack={() => {}}/>);
  assert.equal(container.querySelector(".timer-display strong")!.textContent, "1:00");
  await click(callFoldChoice(true)); assert.equal(container.querySelector(".live-points strong")!.textContent, "1");
  await click(callFoldChoice(false)); assert.equal(container.querySelector(".live-points strong")!.textContent, "1");
  now = 61000; await act(async () => document.dispatchEvent(new dom.window.Event("visibilitychange")));
  assert.equal(saved.length, 1); assert.equal(saved[0]!.correct, 1); assert.equal(saved[0]!.total, 2); assert.equal(saved[0]!.format, "sprint");
  assert.equal(container.querySelectorAll(".lab-review-item").length, 2);
  await act(async () => window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "1" })));
  assert.equal(saved.length, 1);
});

test("lab sprint rejects answers at its deadline and early learning exits do not save", async () => {
  const saved: (Session | null)[] = [];
  await render(<LabRound id="late-lab" mode="poker" selection="call-fold" format="sprint" onComplete={s => saved.push(s)} onReplay={() => {}} onBack={() => {}}/>);
  now = 60000; await click(callFoldChoice(true)); assert.equal(saved[0]!.total, 0);
  await render(<LabRound key="early-lab" id="early-lab" mode="stocks" selection="returns" format="learn" onComplete={s => saved.push(s)} onReplay={() => {}} onBack={() => {}}/>);
  await click(container.querySelector(".lab-choices button")); await click(button("End round"));
  assert.equal(saved.length, 2); assert.equal(saved[1], null);
});

test("lab keyboard answers ignore held keys and duplicate events on the same question", async () => {
  await render(<LabRound id="lab-keys" mode="poker" selection="call-fold" format="sprint" onComplete={() => {}} onReplay={() => {}} onBack={() => {}}/>);
  const key = callFoldChoice(true)!.querySelector("kbd")!.textContent!;
  await act(async () => window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key, repeat: true })));
  assert.equal(container.querySelector(".live-points strong")!.textContent, "0");
  await act(async () => { window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key })); window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key })); });
  assert.equal(container.querySelector(".live-points strong")!.textContent, "1");
});
