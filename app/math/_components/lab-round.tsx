"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Lightbulb, MoveRight, RotateCcw, Sparkles, Timer, Trophy, X } from "lucide-react";
import { LAB_GAMES, LAB_POOLS, makeLabQuestion, signature, simulateOutcome, withOpponentRead, type Card, type LabQuestion } from "../_lib/labs";
import { ROUND_SECONDS, secondsRemaining, shuffle, type LabFormat, type LabMode, type LabSelection, type Session } from "../_lib/game";

import RangeReview from "./range-review";
import RiverContext, { PlayerPositions } from "./river-context";
import type { OpponentRead } from "../_lib/poker";

interface Attempt { question: LabQuestion; selected: number; correct: boolean; outcome: string | null }
interface Result { attempts: Attempt[]; completed: boolean }
interface Props { id: string; mode: LabMode; selection: LabSelection; format: LabFormat; onComplete: (session: Session | null) => void; onReplay: () => void; onBack: () => void }

export default function LabRound({ id, mode, selection, format, onComplete, onReplay, onBack }: Props) {
  const [deck] = useState(() => shuffle(LAB_POOLS[mode]));
  const generate = useCallback((position: number, previous?: string) => makeLabQuestion(mode, selection === "mixed" ? deck[position % deck.length] : selection, previous), [mode, selection, deck]);
  const [question, setQuestion] = useState(() => generate(0));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState<Attempt | null>(null);
  const [hint, setHint] = useState(false);
  const deadline = useRef(0), finished = useRef(false), locked = useRef(false);
  const attemptsRef = useRef<Attempt[]>([]);
  const heading = useRef<HTMLHeadingElement>(null), nextButton = useRef<HTMLButtonElement>(null);
  const sprint = format === "sprint";
  const score = attempts.filter(a => a.correct).length;

  const finish = useCallback((completed: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const finalAttempts = attemptsRef.current;
    setResult({ attempts: finalAttempts, completed });
    onComplete(completed ? { id, mode, format, labGame: selection, date: new Date().toISOString(), correct: finalAttempts.filter(a => a.correct).length, total: finalAttempts.length } : null);
  }, [id, mode, format, selection, onComplete]);

  useEffect(() => {
    if (!sprint || result) return;
    deadline.current = performance.now() + ROUND_SECONDS * 1000;
    const tick = () => { const time = secondsRemaining(deadline.current, performance.now()); setRemaining(time); if (time === 0) finish(true); };
    const interval = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", tick); };
  }, [sprint, result, finish]);
  useEffect(() => { locked.current = false; }, [question]);
  useEffect(() => { heading.current?.focus(); }, [position, result]);
  useEffect(() => { if (selected !== null) nextButton.current?.focus({ preventScroll: true }); }, [selected]);

  const answer = useCallback((choice: number) => {
    if (finished.current || locked.current) return;
    if (sprint && performance.now() >= deadline.current) { finish(true); return; }
    locked.current = true;
    const attempt = { question, selected: choice, correct: choice === question.answer, outcome: simulateOutcome(question) };
    const next = [...attemptsRef.current, attempt];
    attemptsRef.current = next; setAttempts(next); setFeedback(attempt);
    if (sprint) { setQuestion(generate(position + 1, signature(question))); setPosition(position + 1); }
    else setSelected(choice);
  }, [question, position, sprint, finish, generate]);

  useEffect(() => {
    if (result || selected !== null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (/^[1-4]$/.test(event.key)) { event.preventDefault(); answer(Number(event.key) - 1); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer, result, selected]);

  function chooseRead(assumption: OpponentRead) {
    if (finished.current || locked.current || selected !== null) return;
    if (sprint && performance.now() >= deadline.current) { finish(true); return; }
    setQuestion(current => withOpponentRead(current, assumption));
  }

  function next() {
    if (selected === null) return;
    if (attempts.length === 5) { finish(true); return; }
    setQuestion(generate(position + 1, signature(question))); setPosition(position + 1);
    setSelected(null); setFeedback(null); setHint(false);
  }

  if (result) return <section className={`practice-card lab-result ${mode === "poker" ? "poker-theme" : "stocks-theme"}`}>
    <div className="card-heading"><span className="icon-badge"><Trophy size={22} /></span><span className="soft-tag">{result.completed ? "A LITTLE MORE CLEAR-HEADED" : "PRACTICE ENDED EARLY"}</span></div>
    <h2 ref={heading} tabIndex={-1}>{result.completed ? score === result.attempts.length && score > 0 ? "Good thinking. Every single time." : "Another few decisions, a little wiser." : "Pick it up again when you’re ready."}</h2>
    <p className="card-description">{result.completed ? mode === "poker" ? "Poker range decisions are checked under your chosen assumptions. Points reward the reasoning in each exercise." : "Your score rewards your reasoning. Luck doesn’t get a vote." : "This unfinished round wasn’t saved. Finish five learning decisions or the full sprint to record progress."}</p>
    <div className="result-score"><span>{score}</span><small>sound decisions</small></div>
    <div className="result-metrics"><div><strong>{result.attempts.length}</strong><span>decisions made</span></div><div><strong>{result.attempts.length ? Math.round(score / result.attempts.length * 100) : 0}<small>%</small></strong><span>accuracy</span></div><div><strong>{sprint ? "60s" : "Learn"}</strong><span>{result.completed ? "completed" : "unfinished"}</span></div></div>
    {result.attempts.length > 0 && <details className="lab-review"><summary>Review all {result.attempts.length} decisions</summary>{result.attempts.map((attempt, i) => <article key={i} className="lab-review-item"><div className="lab-review-heading">{attempt.correct ? <Check size={15} /> : <X size={15} />}<strong>{i + 1}. {LAB_GAMES[attempt.question.game].title}</strong></div><p>{attempt.question.prompt}</p><QuestionEvidence question={attempt.question} compact /><p><b>{attempt.question.river ? "Best under your assumption:" : "Correct:"}</b> {attempt.question.choices[attempt.question.answer]}{!attempt.correct && <><br /><b>Your choice:</b> {attempt.question.choices[attempt.selected]}</>}</p><p>{attempt.question.explanation}</p><p className="lab-takeaway">{attempt.question.takeaway}</p>{attempt.question.river && <RangeReview read={attempt.question.river} pot={attempt.question.metrics.pot} call={attempt.question.metrics.call} />}{attempt.outcome && <p className="lab-simulation">{attempt.outcome}</p>}</article>)}</details>}
    <button className="primary-button" onClick={onReplay}><RotateCcw size={16} />{sprint ? "One more sprint" : "Try five fresh decisions"}<MoveRight size={18} /></button><button className="text-button result-back" onClick={onBack}><ArrowLeft size={14} /> Back to the lab</button>
  </section>;

  return <section className={`practice-card lab-round ${mode === "poker" ? "poker-theme" : "stocks-theme"}`}>
    <div className="game-topline"><span className="game-label"><Sparkles size={16} />{mode === "poker" ? "POKER LAB" : "STOCK LAB"}<span>{sprint ? "SPRINT" : "LEARN"}</span></span><button className="text-button end-round" onClick={() => finish(sprint && performance.now() >= deadline.current)}>End round<X size={14} /></button></div>
    <div className="lab-status"><span>{sprint ? <span className={`timer-display ${remaining <= 10 ? "time-low" : ""}`} role="timer" aria-label={`${remaining} seconds remaining`}><Timer size={18} /><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong></span> : <span className="lab-step-label">DECISION {position + 1} OF 5</span>}</span><span className="live-points"><strong>{score}</strong><span>points</span></span></div>
    {sprint ? <div className={`timer-track ${remaining <= 10 ? "time-low" : ""}`}><span style={{ width: `${remaining / 60 * 100}%` }} /></div> : <div className="quiz-progress">{[0, 1, 2, 3, 4].map(i => <span className={i < position ? "done" : i === position ? "current" : ""} key={i} />)}</div>}
    <div className="lab-question-heading"><span className="question-number">{LAB_GAMES[question.game].title.toUpperCase()}</span><h2 ref={heading} tabIndex={-1}>{question.prompt}</h2></div>
    <QuestionEvidence question={question} onRead={selected === null ? chooseRead : undefined} />
    <p className="lab-rules">{question.rules}</p>
    {!sprint && selected === null && <><button className="text-button lab-hint-button" aria-expanded={hint} onClick={() => setHint(!hint)}><Lightbulb size={14} />{hint ? "Hide the hint" : "Show a little hint"}</button>{hint && <p className="lab-hint">{LAB_GAMES[question.game].lesson}</p>}</>}
    <div className="quiz-choices lab-choices">{question.choices.map((choice, i) => <button key={i} disabled={selected !== null} className={`quiz-choice ${selected !== null && i === question.answer ? "correct" : selected === i ? "incorrect" : ""}`} onClick={() => answer(i)}><kbd className="choice-letter">{i + 1}</kbd><span>{choice}</span>{selected !== null && i === question.answer ? <Check size={17} /> : selected === i ? <X size={17} /> : null}</button>)}</div>
    {feedback && !sprint && <><div className={`explanation-box ${feedback.correct ? "correct" : "incorrect"}`} role="status"><strong>{feedback.correct ? question.river ? "That fits your assumption. +1" : "That’s sound reasoning. +1" : question.river ? "Let’s check that against your assumption." : "Here’s the useful part."}</strong><p>{question.explanation}</p><p className="lab-takeaway">{question.takeaway}</p></div>{question.river && <RangeReview key={position} read={question.river} pot={question.metrics.pot} call={question.metrics.call} />}{feedback.outcome && <div className="lab-simulation"><Sparkles size={14} /><p>{feedback.outcome}</p></div>}<button className="primary-button" ref={nextButton} onClick={next}>{position === 4 ? "See how you did" : "Next decision"}<ChevronRight size={18} /></button></>}
    {sprint && <div className={`answer-feedback ${feedback ? feedback.correct ? "correct" : "incorrect" : ""}`} role="status">{feedback ? <>{feedback.correct ? <Check size={14} /> : <MoveRight size={14} />}<span>{feedback.correct ? feedback.question.river ? "Fits your assumption. +1" : "Good decision! +1" : `Last answer: ${feedback.question.choices[feedback.question.answer]}`}</span></> : "Four choices. Trust your reasoning."}</div>}
    <p className="lab-keyboard-note">Tap a choice or press 1–4. {sprint ? "Explanations wait for your review." : "Take your time; this round is untimed."}</p>
    <span className="sr-only" role="status">{sprint && remaining === 10 ? "Ten seconds remaining." : ""}</span>
  </section>;
}

function PlayingCard({ card }: { card: Card }) {
  const rank = ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[card.rank] ?? String(card.rank);
  const suitName = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" }[card.suit];
  return <span className={`playing-card ${card.suit === "♥" || card.suit === "♦" ? "red-card" : ""}`} aria-label={`${rank} of ${suitName}`}><b>{rank}</b><span aria-hidden="true">{card.suit}</span></span>;
}
function QuestionEvidence({ question, compact = false, onRead }: { question: LabQuestion; compact?: boolean; onRead?: (assumption: OpponentRead) => void }) {
  return <div className={compact ? "lab-evidence compact" : "lab-evidence"}>
    <div className="lab-facts">{question.facts.map(fact => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>
    {question.river && <PlayerPositions read={question.river} />}
    {question.cards && <div className="poker-table"><div className="card-group"><span>{question.river ? "YOUR TWO CARDS · KNOWN" : "YOUR HAND"}</span><div>{question.cards.hand.map((card, i) => <PlayingCard card={card} key={i} />)}</div></div><div className="card-group"><span>SHARED BOARD</span><div>{question.cards.board.map((card, i) => <PlayingCard card={card} key={i} />)}</div></div></div>}
    {question.river && <RiverContext read={question.river} onRead={onRead} />}
    {question.interval && <div className="interval-panel"><div><span>95% WILSON INTERVAL</span><strong>{(question.interval.lower * 100).toFixed(1)}% – {(question.interval.upper * 100).toFixed(1)}%</strong></div><div className="confidence-track" role="img" aria-label={`Confidence interval ${(question.interval.lower * 100).toFixed(1)} to ${(question.interval.upper * 100).toFixed(1)} percent, compared with a 50 percent reference`}><i className="confidence-baseline" /><span className="confidence-range" style={{ left: `${question.interval.lower * 100}%`, width: `${(question.interval.upper - question.interval.lower) * 100}%` }} /><i className="confidence-estimate" style={{ left: `${question.interval.estimate * 100}%` }} /></div><div className="confidence-labels"><span>0%</span><span>50% reference</span><span>100%</span></div></div>}
    {question.series && <div className="basket-table-wrap"><table className="basket-table"><caption>Monthly returns (%) · Fictional investments</caption><thead><tr><th scope="col">Asset</th>{[1, 2, 3, 4].map(n => <th scope="col" key={n}>M{n}</th>)}</tr></thead><tbody>{question.series.map(series => <tr key={series.name}><th scope="row">{series.name}</th>{series.values.map((value, i) => <td key={i} className={value < 0 ? "negative-return" : "positive-return"}>{value > 0 ? "+" : ""}{value}%</td>)}</tr>)}</tbody></table></div>}
  </div>;
}
