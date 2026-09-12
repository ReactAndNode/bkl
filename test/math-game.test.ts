import test from "node:test";
import assert from "node:assert/strict";
import { localDay, makeMathQuestion, makeTipQuestion, OPERATIONS, practiceStreak, readSessions, secondsRemaining, tipCents, TIP_PERCENTAGES, type Level, type Session } from "../app/math/_lib/game";
import { LESSONS } from "../app/math/_lib/lessons";

test("all arithmetic levels produce four unique choices and valid, gentle questions",()=>{
  for(const level of [1,2,3] as Level[])for(const operation of OPERATIONS)for(let i=0;i<500;i++){
    const q=makeMathQuestion(level,[operation.id]);
    assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);
    assert.equal(q.choices.filter(c=>c===q.answer).length,1);
    assert.ok(q.choices.every(c=>Number.isInteger(c)&&c>=0));
    assert.equal(q.operation,operation.id);
    const a=q.a!, b=q.b!, max=[10,15,25][level-1];
    if(operation.id==="divide"){
      assert.ok(b>0&&b<=(level===3?15:10));
      assert.equal(a%b,0);assert.equal(a/b,q.answer);
      assert.ok(q.answer<=max&&q.answer>=0);
    }else{
      assert.ok(a>=0&&a<=max);assert.ok(b>=0&&b<=max);
      if(operation.id==="add")assert.equal(q.answer,a+b);
      if(operation.id==="subtract"){assert.ok(a>=b);assert.equal(q.answer,a-b);}
      if(operation.id==="multiply"){assert.equal(q.answer,a*b);assert.ok(b<=(level===3?15:10));}
    }
  }
});
test("higher levels include the newly available range",()=>{
  for(const level of [2,3] as Level[]){const lower=level===2?10:15;assert.ok(Array.from({length:200},()=>makeMathQuestion(level,["multiply"])).some(q=>q.a!>lower));}
});
test("tipping uses requested percentages, correct integer-cent rounding, and easy bills",()=>{
  for(const level of [1,2,3] as Level[])for(const percent of TIP_PERCENTAGES)for(let i=0;i<100;i++){
    const q=makeTipQuestion(level,[percent]);
    assert.equal(q.percent,percent);assert.equal(q.answer,Math.floor((q.billCents!*percent+50)/100));
    assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.choices.includes(q.answer));
    assert.ok(q.choices.every(c=>Number.isInteger(c)&&c>=0));
    if(level===1){assert.equal(q.billCents!%500,0);assert.ok(q.billCents!>=1000&&q.billCents!<=8000);}
    if(level===2){assert.equal(q.billCents!%100,0);assert.ok(q.billCents!>=1200&&q.billCents!<=12000);}
    if(level===3)assert.ok(q.billCents!>=1250&&q.billCents!<=15000);
  }
  assert.equal(tipCents(1250,15),188);
  assert.equal(tipCents(4000,20),800);
  assert.equal(tipCents(1999,18),360);
});
test("timer follows elapsed time, including a backgrounded or delayed tab",()=>{
  assert.equal(secondsRemaining(60000,0),60);
  assert.equal(secondsRemaining(60000,1001),59);
  assert.equal(secondsRemaining(60000,59999),1);
  assert.equal(secondsRemaining(60000,60000),0);
  assert.equal(secondsRemaining(60000,120000),0);
});
function session(date:Date,id=String(date.getTime())):Session{return{id,mode:"math",date:date.toISOString(),correct:4,total:5,level:1};}
test("practice streaks use local calendar days and allow yesterday’s ongoing streak",()=>{
  const now=new Date(2026,8,7,12);
  assert.equal(localDay(now),"2026-09-07");
  assert.equal(practiceStreak([],now),0);
  assert.equal(practiceStreak([session(new Date(2026,8,6,23)),session(new Date(2026,8,5,9))],now),2);
  assert.equal(practiceStreak([session(now),session(new Date(2026,8,6,23)),session(new Date(2026,8,5,9))],now),3);
  assert.equal(practiceStreak([session(new Date(2026,8,5,9))],now),0);
  assert.equal(practiceStreak([session(now,"one"),session(now,"two")],now),1);
  assert.equal(practiceStreak([session(new Date(2026,2,9,12)),session(new Date(2026,2,8,12)),session(new Date(2026,2,7,12))],new Date(2026,2,9,15)),3);
});
test("stored progress ignores corruption, impossible scores, and duplicate records",()=>{
  const valid=session(new Date(2026,8,7,12));
  assert.deepEqual(readSessions("broken"),[]);assert.deepEqual(readSessions("{}"),[]);
  assert.deepEqual(readSessions(JSON.stringify([valid,valid,{...valid,id:"bad",correct:6},{...valid,id:"date",date:"nonsense"},null])),[valid]);
});
test("study plan has twelve complete lessons, four chapters, and 36 unambiguous choices",()=>{
  assert.equal(LESSONS.length,12);assert.equal(new Set(LESSONS.map(l=>l.id)).size,12);
  for(const week of [1,2,3,4])assert.equal(LESSONS.filter(l=>l.week===week).length,3);
  for(const lesson of LESSONS){assert.equal(lesson.questions.length,3);assert.ok(lesson.mission);assert.ok(lesson.example.text);for(const q of lesson.questions){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.explanation);}}
});
