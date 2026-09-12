"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Flame, MoveRight, RotateCcw, Timer, Trophy, Utensils, X, Zap } from "lucide-react";
import { makeMathQuestion, makeTipQuestion, money, ROUND_SECONDS, secondsRemaining, type Attempt, type Level, type Operation, type Question, type Session, type TimedMode } from "../_lib/game";

interface Props { id: string; mode: TimedMode; level: Level; operations: Operation[]; percentages: number[]; personalBest: number | null; onComplete: (session: Session | null) => void; onReplay: () => void; onBack: () => void }
interface Result { attempts: Attempt[]; completed: boolean; correct: number }

export default function TimedRound({id,mode,level,operations,percentages,personalBest,onComplete,onReplay,onBack}: Props) {
  const generate = useCallback((previous?: string) => mode==="math"?makeMathQuestion(level,operations,previous):makeTipQuestion(level,percentages,previous),[mode,level,operations,percentages]);
  const [question, setQuestion] = useState<Question>(()=>generate());
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [feedback, setFeedback] = useState<{correct:boolean; text:string} | null>(null);
  const [review, setReview] = useState(false);
  const deadline = useRef(0);
  const finished = useRef(false);
  const answerLocked = useRef(false);
  const attemptRef = useRef<Attempt[]>([]);
  const [initialBest] = useState(personalBest);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  const finish = useCallback((completed: boolean) => {
    if(finished.current) return;
    finished.current=true;
    const finalAttempts=attemptRef.current;
    const correct=finalAttempts.filter(item=>item.correct).length;
    setResult({attempts:finalAttempts,completed,correct});
    if(completed) setRemaining(0);
    onComplete(completed?{id,mode,level,date:new Date().toISOString(),correct,total:finalAttempts.length}:null);
  },[id,mode,level,onComplete]);

  useEffect(()=>{
    if(result)return;
    deadline.current=performance.now()+ROUND_SECONDS*1000;
    questionRef.current?.focus();
    const tick=()=>{const next=secondsRemaining(deadline.current,performance.now());setRemaining(next);if(next===0)finish(true);};
    const interval=window.setInterval(tick,100);
    document.addEventListener("visibilitychange",tick);
    return()=>{window.clearInterval(interval);document.removeEventListener("visibilitychange",tick);};
  },[finish,result]);
  useEffect(()=>{answerLocked.current=false;},[question]);
  useEffect(()=>{if(result)resultRef.current?.focus();},[result]);
  useEffect(()=>{if(!feedback)return;const timeout=window.setTimeout(()=>setFeedback(null),1600);return()=>window.clearTimeout(timeout);},[feedback]);

  const answer = useCallback((selected: number)=>{
    if(finished.current||answerLocked.current)return;
    if(performance.now()>=deadline.current){finish(true);return;}
    answerLocked.current=true;
    const correct=selected===question.answer;
    const next=[...attemptRef.current,{question,selected,correct}];
    attemptRef.current=next;setAttempts(next);
    setFeedback({correct,text:correct?"Nice one! +1 point":`${question.prompt} = ${mode==="tips"?money(question.answer):question.answer}. Keep going!`});
    setQuestion(generate(question.prompt));
  },[question,mode,generate,finish]);

  useEffect(()=>{
    if(result)return;
    const handleKey=(event:KeyboardEvent)=>{
      if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
      if(/^[1-4]$/.test(event.key)){event.preventDefault();answer(question.choices[Number(event.key)-1]);}
    };
    window.addEventListener("keydown",handleKey);
    return()=>window.removeEventListener("keydown",handleKey);
  },[answer,question,result]);

  const score=attempts.filter(item=>item.correct).length;
  let streak=0;for(let i=attempts.length-1;i>=0&&attempts[i].correct;i--)streak++;
  const format=(value:number)=>mode==="tips"?money(value):String(value);

  if(result){
    const missed=result.attempts.filter(item=>!item.correct);
    const newBest=result.completed&&result.correct>0&&(initialBest===null||result.correct>initialBest);
    return <section className="practice-card result-card">
      <div className="card-heading"><span className="icon-badge"><Trophy size={22}/></span><span className="soft-tag">{result.completed?"ONE MINUTE, WELL SPENT":"ROUND ENDED EARLY"}</span></div>
      <h2 ref={resultRef} tabIndex={-1}>{result.completed?(newBest?"A new personal best. Nice work!":result.correct>0?"A little sharper than a minute ago.":"Showing up is a start."):"Good practice. Come back for more."}</h2>
      <p className="card-description">{result.completed?"Take a breath. Here’s how your workout went.":"This practice round wasn’t saved. Complete a full minute to record your score."}</p>
      <div className="result-score"><span>{result.correct}</span><small>points earned</small>{newBest&&<div className="best-badge"><Trophy size={13}/> PERSONAL BEST</div>}</div>
      <div className="result-metrics"><div><strong>{result.attempts.length}</strong><span>answered</span></div><div><strong>{result.attempts.length?Math.round(result.correct/result.attempts.length*100):0}<small>%</small></strong><span>accuracy</span></div><div><strong>{missed.length}</strong><span>to learn from</span></div></div>
      {missed.length>0&&<><button className="review-toggle" aria-expanded={review} onClick={()=>setReview(!review)}>Review {missed.length} missed {missed.length===1?"answer":"answers"}<ChevronDown size={16} className={review?"rotate":""}/></button>{review&&<div className="review-list">{missed.map((item,i)=><div key={i}><div><strong>{item.question.prompt} = {format(item.question.answer)}</strong><span>Your answer: {format(item.selected)}</span></div><p>{item.question.explanation}</p></div>)}</div>}</>}
      {missed.length===0&&result.attempts.length>0&&<p className="perfect-note"><Check size={15}/> Every answer correct. That’s a lovely bit of focus.</p>}
      <button className="primary-button" onClick={onReplay}><RotateCcw size={16}/> One more minute<MoveRight size={19}/></button><button className="text-button result-back" onClick={onBack}><ArrowLeft size={14}/> Back to setup</button>
    </section>;
  }
  return <section className="practice-card game-card">
    <div className="game-topline"><span className="game-label">{mode==="math"?<Zap size={17}/>:<Utensils size={17}/>} {mode==="math"?"MENTAL MATH":"QUICK TIP"}<span>LEVEL {level}</span></span><button className="text-button end-round" onClick={()=>finish(performance.now()>=deadline.current)}>End round<X size={14}/></button></div>
    <div className="game-status"><div className={`timer-display ${remaining<=10?"time-low":""}`} role="timer" aria-label={`${remaining} seconds remaining`}><Timer size={20}/><strong>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}</strong></div><div className="live-points"><strong>{score}</strong><span>points</span></div></div><div className={`timer-track ${remaining<=10?"time-low":""}`}><span style={{width:`${remaining/ROUND_SECONDS*100}%`}}/></div>
    <div className="question-area" aria-live="polite" aria-atomic="true"><span className="question-number">QUESTION {attempts.length+1}</span>{mode==="math"?<h2 className="math-question" ref={questionRef} tabIndex={-1}>{question.prompt}<span> = ?</span></h2>:<><div className="receipt-question"><span>YOUR CHECK</span><strong>{money(question.billCents!)}</strong><div>Leave a <b>{question.percent}%</b> tip</div></div><h2 className="tip-question" ref={questionRef} tabIndex={-1}>How much is the tip?</h2><p className="rounding-note">Tip amount only · Round to the nearest cent</p></>}</div>
    <div className="answer-grid">{question.choices.map((choice,i)=><button key={i} className="answer-button" onClick={()=>answer(choice)} aria-label={`Option ${i+1}: ${format(choice)}`}><kbd>{i+1}</kbd><span>{format(choice)}</span></button>)}</div>
    <div className={`answer-feedback ${feedback?(feedback.correct?"correct":"incorrect"):""}`} role="status">{feedback?<>{feedback.correct?<Check size={15}/>:<MoveRight size={15}/>}<span>{feedback.text}</span></>:streak>=3?<><Flame size={15}/>{streak} correct in a row. Finding your flow.</>:<span>Trust your head. You’ve got this.</span>}</div><div className="game-bottom"><span>+1 correct · No penalties</span><span>Tap an answer or press <kbd>1</kbd>–<kbd>4</kbd></span></div><span className="sr-only" role="status">{remaining===10?"Ten seconds remaining.":""}</span>
  </section>;
}
