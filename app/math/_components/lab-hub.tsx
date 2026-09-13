"use client";

import { useCallback, useState } from "react";
import { ArrowUpRight, BookOpen, Check, Dices, Layers, MoveRight, Shuffle, Spade, Timer, TrendingUp } from "lucide-react";
import { LAB_GAMES, LAB_POOLS } from "../_lib/labs";
import { type LabFormat, type LabMode, type LabSelection, type Session } from "../_lib/game";
import LabRound from "./lab-round";
import PokerBasics from "./poker-basics";

interface Props { mode: LabMode; sessions: Session[]; ready: boolean; onComplete: (session: Session) => void; onActivity: (active: boolean) => void }
export default function LabHub({ mode, sessions, ready, onComplete, onActivity }: Props) {
  const [selection, setSelection] = useState<LabSelection>("mixed");
  const [format, setFormat] = useState<LabFormat>("learn");
  const [run, setRun] = useState<string | null>(null);
  const finish = useCallback((session: Session | null) => { if (session) onComplete(session); onActivity(false); }, [onComplete, onActivity]);
  const start = () => { setRun(crypto.randomUUID()); onActivity(true); };
  if (run) return <LabRound key={run} id={run} mode={mode} selection={selection} format={format} onComplete={finish} onReplay={start} onBack={() => setRun(null)} />;
  const poker = mode === "poker";
  return <section className={`practice-card lab-hub ${poker ? "poker-theme" : "stocks-theme"}`}>
    <div className="card-heading"><span className="icon-badge">{poker ? <Spade size={22} /> : <TrendingUp size={22} />}</span><span className="soft-tag"><Dices size={13} /> A LITTLE RISK. A LOT TO LEARN.</span></div>
    <h2>{poker ? "Play the odds. Sharpen your instincts." : "A clearer head for a noisy market."}</h2>
    <p className="card-description">{poker ? "Read hands, build ranges, and test your assumptions. Virtual chips, real understanding." : "Play with fictional returns. Get comfortable with probability, growth, and uncertainty."}</p>
    <div className={`lab-intro-art ${poker ? "felt-art" : "market-art"}`} aria-hidden="true">
      {poker ? <><span className="mini-card tilted-left">A<span>♠</span></span><span className="mini-card tilted-right red-card">K<span>♥</span></span><div className="art-caption"><strong>Good decisions add up.</strong><span>Even when the cards don’t cooperate.</span></div><span className="chip-stack">+EV</span></> : <><span className="market-bars">{[20, 36, 27, 50, 39, 62, 55, 74].map((height, i) => <i key={i} style={{ height }} />)}</span><div className="art-caption"><strong>Look past the winning streak.</strong><span>Find the math behind the story.</span></div></>}
    </div>
    {poker && <PokerBasics />}
    <div className="field-heading"><h3>Pick your playground</h3><button className={`mix-button ${selection === "mixed" ? "selected" : ""}`} aria-pressed={selection === "mixed"} onClick={() => setSelection("mixed")}><Shuffle size={12} /> Mix all four</button></div>
    <div className="lab-game-grid">{LAB_POOLS[mode].map((game, i) => <button key={game} className={`lab-game-option ${selection === game ? "selected" : ""}`} aria-pressed={selection === game} onClick={() => setSelection(game)}><span className="lab-game-top"><span>0{i + 1}</span>{selection === game ? <Check size={15} /> : <ArrowUpRight size={15} />}</span><strong>{LAB_GAMES[game].title}</strong><span>{LAB_GAMES[game].subtitle}</span></button>)}</div>
    <div className="field-heading level-heading"><h3>Understanding first. Speed when you’re ready.</h3></div>
    <div className="lab-format-grid" role="group" aria-label="Lab session format">
      <button aria-pressed={format === "learn"} className={`lab-format ${format === "learn" ? "selected" : ""}`} onClick={() => setFormat("learn")}><BookOpen size={17} /><span><strong>Learn</strong><small>5 decisions · No timer</small></span><span className="radio-dot" /></button>
      <button aria-pressed={format === "sprint"} className={`lab-format ${format === "sprint" ? "selected" : ""}`} onClick={() => setFormat("sprint")}><Timer size={17} /><span><strong>Sprint</strong><small>60 seconds · Find your flow</small></span><span className="radio-dot" /></button>
    </div>
    <div className="lab-brief"><Layers size={17} /><p>{selection === "mixed" ? "A little of everything. Mixed learning rounds visit all four games, with fresh numbers each time." : LAB_GAMES[selection].lesson}</p></div>
    <button className="primary-button" disabled={!ready} onClick={start}>{format === "learn" ? "Let’s build some intuition" : "Start a one-minute sprint"}<MoveRight size={19} /></button>
    <p className="session-note"><Check size={13} /> +1 for sound reasoning <span>·</span> {format === "learn" ? "Explanations after every choice" : "Review every decision afterward"}</p>
    {sessions.some(s => s.mode === mode) && <p className="lab-round-count">{sessions.filter(s => s.mode === mode).length} {poker ? "poker" : "stock"} lab sessions completed. Keep that curiosity going.</p>}
    {selection !== "mixed" && <a className="lab-source" href={LAB_GAMES[selection].source} target="_blank" rel="noreferrer">Read more about the idea<ArrowUpRight size={12} /></a>}
  </section>;
}
