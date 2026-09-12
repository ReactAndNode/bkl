"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, BookOpen, Brain, Calculator, ChartNoAxesCombined, Check, ChevronRight, Flame, MoveRight, Sparkles, Target, Timer, Trophy, Utensils, Zap } from "lucide-react";
import { localDay, OPERATIONS, practiceStreak, TIP_PERCENTAGES, type Level, type Mode, type Operation, type Session, type TimedMode } from "../_lib/game";
import { useProgress } from "../_lib/progress";
import { CHAPTERS, LESSONS, type Lesson } from "../_lib/lessons";
import TimedRound from "./timed-round";
import StudyLesson from "./study-lesson";

const TABS = [{ id: "math", label: "Mental math", Icon: Calculator }, { id: "stats", label: "Everyday stats", Icon: ChartNoAxesCombined }, { id: "tips", label: "Quick tip", Icon: Utensils }] as const;
const TIP_HINTS = [{percent:15, text:"10% + half of 10%"},{percent:18,text:"20% − 2%"},{percent:20,text:"10% × 2"},{percent:22,text:"20% + 2%"},{percent:25,text:"The bill ÷ 4"}];

export default function Sumday() {
  const [mode, setMode] = useState<Mode>("math");
  const [mathLevel, setMathLevel] = useState<Level>(1);
  const [tipLevel, setTipLevel] = useState<Level>(1);
  const [operations, setOperations] = useState<Operation[]>(OPERATIONS.map(op => op.id));
  const [percentages, setPercentages] = useState<number[]>([...TIP_PERCENTAGES]);
  const { sessions, ready, storageIssue, recordSession } = useProgress();
  const [run, setRun] = useState<{ id: string; mode: TimedMode } | null>(null);
  const [roundActive, setRoundActive] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [selectionMessage, setSelectionMessage] = useState("");

  const completeRound = useCallback((session: Session | null) => { if (session) recordSession(session); setRoundActive(false); }, [recordSession]);
  const today = localDay();
  const todayCount = sessions.filter(session => localDay(new Date(session.date)) === today).length;
  const streak = practiceStreak(sessions);
  const modeSessions = sessions.filter(session => session.mode === mode);
  const answered = modeSessions.reduce((sum, session) => sum + session.total, 0);
  const correct = modeSessions.reduce((sum, session) => sum + session.correct, 0);
  const best = modeSessions.length ? Math.max(...modeSessions.map(session => session.correct)) : null;
  const lessonScores = Object.fromEntries(LESSONS.map(item => [item.id, Math.max(0, ...sessions.filter(session => session.lessonId === item.id).map(session => session.correct))]));
  const mastered = LESSONS.filter(item => lessonScores[item.id] === 3).length;
  const nextLesson = LESSONS.find(item => lessonScores[item.id] < 3) ?? LESSONS[0];
  const statsXP = Object.values(lessonScores).reduce((sum, score) => sum + score * 10, 0);

  function changeMode(next: Mode) { if (roundActive) return; setMode(next); setRun(null); setLesson(null); setSelectionMessage(""); }
  function startRound() { if (mode === "stats") return; setRun({ id: crypto.randomUUID(), mode }); setRoundActive(true); }
  function toggleOperation(id: Operation) {
    if (operations.includes(id) && operations.length === 1) { setSelectionMessage("Keep at least one operation in your workout."); return; }
    setOperations(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); setSelectionMessage("");
  }
  function togglePercent(percent: number) {
    if (percentages.includes(percent) && percentages.length === 1) { setSelectionMessage("Keep at least one tipping percentage selected."); return; }
    setPercentages(current => current.includes(percent) ? current.filter(item => item !== percent) : [...current, percent]); setSelectionMessage("");
  }

  return <div id="sumday"><div className="app-shell">
    <a href="#practice" className="skip-link">Skip to practice</a>
    <header className="site-header"><Link href="/math/" className="brand" aria-label="Sumday home"><span className="brand-mark" aria-hidden="true">s<span>+</span></span>sumday<span className="brand-dot">.</span></Link><span className="header-tagline">A little math, every day.</span><div className="header-right"><span className="streak-pill"><Flame size={16}/> {streak} day streak</span><span className="avatar">YOU</span></div></header>
    <main>
      <section className="welcome"><div><div className="eyebrow"><span className="little-star" aria-hidden="true">✳</span> YOUR DAILY BRAIN BREAK</div><h1>Small practice.<br/>Sharper thinking<span className="green-dot">.</span></h1><p>Make numbers second nature. One good minute at a time.</p></div><div className="hero-art" aria-hidden="true"><span className="art-orbit"/><span className="math-tile tile-plus">+</span><span className="math-tile tile-times">×</span><span className="math-tile tile-divide">÷</span><span className="art-spark">✳</span><span className="art-dot"/></div></section>
      <div className="mode-tabs" role="tablist" aria-label="Practice mode">
        {TABS.map(({id,label,Icon},i) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={mode===id} aria-controls="practice" tabIndex={mode===id?0:-1} disabled={roundActive && mode !== id} onClick={()=>changeMode(id)} onKeyDown={event=>{
          if (roundActive) return;
          const target = event.key === "ArrowRight" ? (i+1)%3 : event.key === "ArrowLeft" ? (i+2)%3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : -1;
          if(target>=0){event.preventDefault();changeMode(TABS[target].id);document.getElementById(`tab-${TABS[target].id}`)?.focus();}
        }} className={`mode-tab ${mode===id?"active":""}`}><Icon size={18}/>{label}<span>0{i+1}</span></button>)}
      </div>
      <div className="workspace"><div id="practice" role="tabpanel" aria-labelledby={`tab-${mode}`} tabIndex={-1}>
        {run ? <TimedRound key={run.id} id={run.id} mode={run.mode} level={run.mode==="math"?mathLevel:tipLevel} operations={operations} percentages={percentages} personalBest={best} onComplete={completeRound} onReplay={startRound} onBack={()=>setRun(null)}/> :
        lesson ? <StudyLesson key={lesson.id} lesson={lesson} previousBest={lessonScores[lesson.id]} onComplete={recordSession} onBack={()=>setLesson(null)} onNext={()=>setLesson(LESSONS[(LESSONS.findIndex(item=>item.id===lesson.id)+1)%LESSONS.length])}/> :
        mode === "stats" ? <section className="practice-card study-card">
          <div className="card-heading"><span className="icon-badge lavender"><BookOpen size={22}/></span><span className="soft-tag"><BookOpen size={13}/> YOUR 4-WEEK STUDY PATH</span></div><h2>Better questions. Smarter decisions.</h2><p className="card-description">A little theory. A real-life example. Three chances to make it click.</p>
          <div className="study-overview"><span><strong>{mastered}<small> / 12</small></strong> lessons mastered</span><span className="study-xp"><Sparkles size={15}/>{statsXP} XP</span></div><div className="study-progress" role="progressbar" aria-label="Lessons mastered" aria-valuenow={mastered} aria-valuemin={0} aria-valuemax={12}><span style={{width:`${mastered/12*100}%`}}/></div>
          <button className="primary-button" disabled={!ready} onClick={()=>setLesson(nextLesson)}>{mastered===12?"Revisit your first lesson":modeSessions.length?"Continue your learning":"Start your first lesson"}<MoveRight size={20}/></button><p className="study-schedule">3 lessons a week · About 5 minutes each · Learn at your own pace</p>
          <div className="study-path">{CHAPTERS.map((chapter,week)=><section key={chapter.title} className="chapter"><div className="chapter-heading"><span className="week-label">WEEK 0{week+1}</span><div><h3>{chapter.title}</h3><p>{chapter.subtitle}</p></div></div><div className="lesson-list">{LESSONS.filter(item=>item.week===week+1).map((item,i)=><button className={`lesson-row ${lessonScores[item.id]===3?"mastered":""}`} key={item.id} onClick={()=>setLesson(item)}><span className="lesson-number">{lessonScores[item.id]===3?<Check size={14}/>:String(week*3+i+1).padStart(2,"0")}</span><span className="lesson-info"><strong>{item.title}</strong><span>{item.subtitle}</span></span>{lessonScores[item.id]>0?<span className="lesson-score">{lessonScores[item.id]}/3</span>:<span className="lesson-time">5 min</span>}<ChevronRight size={15}/></button>)}</div></section>)}</div><p className="path-footnote"><Sparkles size={13}/> Get all 3 right to master a lesson. Retry anytime; your best score stays.</p>
        </section> : <section className="practice-card">
          <div className="card-heading"><span className={`icon-badge ${mode==="tips"?"peach":""}`}>{mode==="math"?<Zap size={22}/>:<Utensils size={22}/>}</span><span className="soft-tag"><Timer size={13}/> 60-SECOND SESSIONS</span></div><h2>{mode==="math"?"A quick workout for your mind.":"Pick up the check. Skip the calculator."}</h2><p className="card-description">{mode==="math"?"Four answers. One right choice. How many can you get in a minute?":"A bill, a percentage, and a little mental math. Find the tip in your head."}</p>
          <div className="field-heading"><h3>{mode==="math"?"Make it your kind of math":"Your usual tipping percentages"}</h3><span>Mix & match</span></div>
          {mode==="math"?<div className="operation-grid">{OPERATIONS.map(op=><button className={`operation ${operations.includes(op.id)?"selected":""}`} key={op.id} aria-pressed={operations.includes(op.id)} onClick={()=>toggleOperation(op.id)}><span className="operation-symbol" aria-hidden="true">{op.symbol}</span><span>{op.label}</span><Check size={14} style={{visibility:operations.includes(op.id)?"visible":"hidden"}}/></button>)}</div>:<div className="percentage-grid">{TIP_PERCENTAGES.map(percent=><button key={percent} aria-pressed={percentages.includes(percent)} className={`percentage-option ${percentages.includes(percent)?"selected":""}`} onClick={()=>togglePercent(percent)}>{percent}%{percentages.includes(percent)&&<Check size={12}/>}</button>)}</div>}
          {selectionMessage&&<p className="selection-message" role="status">{selectionMessage}</p>}
          <div className="field-heading level-heading"><h3>Choose your pace</h3><span>Start small. Build up.</span></div><div className="level-grid" role="group" aria-label="Difficulty level">{[1,2,3].map(value=>{const level=value as Level, selected=(mode==="math"?mathLevel:tipLevel)===level;return <button className={`level-card ${selected?"selected":""}`} aria-pressed={selected} onClick={()=>mode==="math"?setMathLevel(level):setTipLevel(level)} key={level}><span className="level-top"><span className="level-bars" aria-hidden="true">{[1,2,3].map(n=><i className={n<=level?"filled":""} key={n}/>)}</span><span className="radio-dot"/></span><strong>Level {level}</strong><span>{(mode==="math"?["Warm-up","Finding flow","A little stretch"]:["Easy checks","Everyday bills","Real receipts"])[level-1]}</span><small>{(mode==="math"?["Numbers 0–10","Numbers 0–15","Numbers 0–25"]:["$10–80 · Steps of $5","$12–120 · Whole dollars","$12.50–150 · With cents"])[level-1]}</small></button>;})}</div>
          {mode==="math"?<p className="range-note">Multiplication uses small factors. Division reverses them for whole-number answers.</p>:<div className="tip-example"><span className="receipt-icon"><Utensils size={17}/></span><div><span>A LITTLE WARM-UP</span><p>$40 check <span>×</span> 20% tip <span>=</span> <strong>$8.00</strong></p></div><Check size={17}/></div>}
          <button className="primary-button" disabled={!ready} onClick={startRound}>{mode==="math"?"Let’s do the math":"Let’s talk tips"}<MoveRight size={20}/></button><p className="session-note"><Check size={13}/> +1 for a correct answer <span>·</span> No penalties <span>·</span>{mode==="math"?"4 answer choices":"Tip only, rounded to the cent"}</p>
        </section>}
      </div><aside className="side-column">
        <section className="daily-card"><div className="section-kicker"><span>TODAY’S LITTLE GOAL</span><span className="tiny-icon"><Sparkles size={17}/></span></div><h3>{todayCount>=3?"Look at you showing up.":"Three small wins for you."}</h3><p>{todayCount>=3?"Daily goal complete. Your brain says thanks.":"A small habit. A surprisingly big difference."}</p><div className="goal-steps" aria-label={`${Math.min(todayCount,3)} of 3 daily sessions complete`}>{[1,2,3].map(n=><span key={n} className={todayCount>=n?"done":""}/>)}</div><div className="goal-caption"><span>{Math.min(todayCount,3)} of 3 sessions</span><span>{todayCount>=3?"Nicely done":"You’ve got this"}<ArrowUpRight size={13}/></span></div></section>
        <section className="numbers-card"><div className="section-kicker">{mode==="stats"?"YOUR LEARNING":"YOUR NUMBERS"}<span className="numbers-mode">{mode==="math"?"MATH":mode==="tips"?"TIPS":"STATS"}</span></div><div className="stat-row"><span><Trophy size={17}/>{mode==="stats"?"Lessons mastered":"Personal best"}</span><strong>{mode==="stats"?mastered:best??"—"}<small>{mode==="stats"?"/ 12":"pts"}</small></strong></div><div className="stat-row"><span><Target size={17}/> Accuracy</span><strong>{answered?Math.round(correct/answered*100):"—"}<small>%</small></strong></div><div className="stat-row"><span><Timer size={17}/> Sessions played</span><strong>{modeSessions.length}</strong></div><div className="empty-stats">{modeSessions.length?<><span>{mode==="stats"?`${statsXP} XP earned from your best lesson scores.`:"Your completed rounds, across all levels."}</span><br/>A little more confident, one session at a time.</>:<><span>Every expert starts at zero.</span><br/>Your first session is a great place to begin.</>}</div></section>
        {mode==="tips"&&!roundActive&&<section className="cheat-card"><div className="section-kicker">A FEW MENTAL SHORTCUTS</div>{TIP_HINTS.map(hint=><div className="shortcut-row" key={hint.percent}><strong>{hint.percent}%</strong><span>{hint.text}</span></div>)}<p>Calculate first. Round to cents at the end.</p></section>}
        {mode==="stats"&&!lesson&&<section className="study-note"><BookOpen size={18}/><strong>A plan that fits your life.</strong><p>Try Monday, Wednesday, and Friday. Review any tricky lessons on the weekend. Every lesson is open to explore.</p></section>}
        <section className="note-card"><Brain size={19}/><div><strong>{roundActive?"One question at a time.":"Consistency > intensity."}</strong><p>{roundActive?<>Use keys 1–4 or tap an answer.<br/>Your next question is a fresh start.</>:<>A minute today beats an hour “someday.”<br/>Keep showing up for your brain.</>}</p></div></section>
        {modeSessions.length>0&&!roundActive&&<section className="recent-card"><div className="section-kicker">RECENT SESSIONS</div>{modeSessions.slice(-3).reverse().map(item=><div key={item.id}><span>{new Date(item.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})}<small>{item.mode==="stats"?LESSONS.find(l=>l.id===item.lessonId)?.title:`Level ${item.level}`}</small></span><strong>{item.correct}<small> / {item.total}</small></strong></div>)}</section>}
      </aside></div>
      <div className="bottom-note"><span><span className="status-dot"/>Just you and the numbers.</span><span role={storageIssue?"status":undefined}>{storageIssue?"Browser storage is unavailable. Progress lasts until you close this page.":"No account needed. Progress stays in this browser."}</span></div>
    </main><footer><span>Made for a sharper everyday.</span><span>Small steps add up. <span className="footer-spark" aria-hidden="true">✳</span></span></footer>
  </div></div>;
}
