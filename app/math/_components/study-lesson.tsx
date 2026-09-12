"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, Lightbulb, MoveRight, RotateCcw, Sparkles, Target, Trophy, X } from "lucide-react";
import { shuffle, type Session } from "../_lib/game";
import { type Lesson } from "../_lib/lessons";

interface Props { lesson: Lesson; previousBest: number; onComplete: (session: Session) => void; onBack: () => void; onNext: () => void }
export default function StudyLesson({lesson,previousBest,onComplete,onBack,onNext}:Props){
  const [phase,setPhase]=useState<"learn"|"quiz"|"result">("learn");
  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<number|null>(null);
  const [correct,setCorrect]=useState(0);
  const [order,setOrder]=useState<number[]>(()=>shuffle([0,1,2,3]));
  const [earnedXP,setEarnedXP]=useState(0);
  const locked=useRef(false);
  const saved=useRef(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const nextButton=useRef<HTMLButtonElement>(null);
  const question=lesson.questions[index];
  useEffect(()=>{heading.current?.focus();},[phase,index]);
  useEffect(()=>{if(selected!==null)nextButton.current?.focus();},[selected]);

  function choose(choice:number){if(locked.current||selected!==null)return;locked.current=true;setSelected(choice);if(choice===question.answer)setCorrect(score=>score+1);}
  function advance(){
    if(selected===null)return;
    if(index<lesson.questions.length-1){setIndex(index+1);setSelected(null);setOrder(shuffle([0,1,2,3]));locked.current=false;}
    else if(!saved.current){saved.current=true;setEarnedXP(Math.max(0,correct-previousBest)*10);onComplete({id:crypto.randomUUID(),mode:"stats",lessonId:lesson.id,date:new Date().toISOString(),correct,total:lesson.questions.length});setPhase("result");}
  }
  function restart(){setPhase("learn");setIndex(0);setSelected(null);setCorrect(0);setOrder(shuffle([0,1,2,3]));locked.current=false;saved.current=false;}

  return <section className="practice-card lesson-detail">
    <div className="lesson-topline"><button className="text-button" onClick={onBack}><ArrowLeft size={14}/> Study path</button><span className="soft-tag">WEEK 0{lesson.week} · {phase==="quiz"?"PUT IT INTO PRACTICE":phase==="result"?"LESSON COMPLETE":"LEARN SOMETHING USEFUL"}</span></div>
    {phase==="learn"?<><span className="icon-badge lavender"><BookOpen size={22}/></span><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p className="lesson-concept">{lesson.concept}</p><div className="lesson-rules">{lesson.rules.map((rule,i)=><div key={rule}><span>{i+1}</span><p>{rule}</p></div>)}</div><div className="worked-example"><div><Lightbulb size={16}/><span>{lesson.example.label}</span></div><p>{lesson.example.text}</p></div><button className="primary-button" onClick={()=>setPhase("quiz")}>Let’s make it stick<MoveRight size={20}/></button><p className="study-schedule">3 questions · No timer · A little understanding goes a long way</p></>:
    phase==="quiz"?<><div className="quiz-progress">{lesson.questions.map((_,i)=><span key={i} className={i<index?"done":i===index?"current":""}/>)}</div><span className="question-number">QUESTION {index+1} OF {lesson.questions.length}</span><h2 className="quiz-question" ref={heading} tabIndex={-1}>{question.prompt}</h2><div className="quiz-choices">{order.map((originalIndex,i)=><button disabled={selected!==null} key={originalIndex} onClick={()=>choose(originalIndex)} className={`quiz-choice ${selected!==null&&originalIndex===question.answer?"correct":selected===originalIndex?"incorrect":""}`}><span className="choice-letter">{String.fromCharCode(65+i)}</span><span>{question.choices[originalIndex]}</span>{selected!==null&&originalIndex===question.answer?<Check size={18}/>:selected===originalIndex?<X size={18}/>:null}</button>)}</div>{selected!==null?<div className={`explanation-box ${selected===question.answer?"correct":"incorrect"}`} role="status"><strong>{selected===question.answer?"That’s the idea.":"A useful one to learn from."}</strong><p>{question.explanation}</p></div>:<p className="quiz-gentle-note">Take your time. Understanding comes before speed.</p>}{selected!==null&&<button ref={nextButton} className="primary-button" onClick={advance}>{index===lesson.questions.length-1?"See how you did":"Next question"}<MoveRight size={20}/></button>}</>:
    <><span className="icon-badge lavender">{correct===3?<Trophy size={22}/>:<Sparkles size={22}/>}</span><h2 ref={heading} tabIndex={-1}>{correct===3?"One more idea, made yours.":"Learning is a little practice, repeated."}</h2><p className="card-description">{correct===3?`${lesson.title} — mastered.`:"Your progress is saved. Get all three right to master this lesson."}</p><div className="lesson-result"><strong>{correct}<small> / 3</small></strong><span>questions correct</span><div className="xp-badge"><Sparkles size={14}/>{earnedXP>0?`+${earnedXP} XP earned`:"Good review. Best score kept."}</div></div><div className="daily-mission"><div><Target size={17}/><span>TAKE IT INTO YOUR DAY</span></div><p>{lesson.mission}</p></div><button className="primary-button" onClick={correct===3?onNext:restart}>{correct===3?"Explore the next lesson":<><RotateCcw size={15}/> Give it another go</>}<ChevronRight size={18}/></button><button className="text-button result-back" onClick={onBack}><ArrowLeft size={14}/> Back to your study path</button></>}
  </section>;
}
