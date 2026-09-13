import test from "node:test";
import assert from "node:assert/strict";
import { LAB_POOLS, expectedValue, makeLabQuestion, variance, wilsonInterval, type Card } from "../app/math/_lib/labs";
import { callDecision, rangeTotals } from "../app/math/_lib/poker";
import { readSessions, type LabMode } from "../app/math/_lib/game";

test("every lab game generates four unique answers with one correct choice", () => {
  for (const mode of ["poker", "stocks"] as LabMode[]) for (const game of LAB_POOLS[mode]) for (let i = 0; i < 150; i++) {
    const q = makeLabQuestion(mode, game);
    assert.equal(q.game, game);
    assert.equal(q.choices.length, 4); assert.equal(new Set(q.choices).size, 4);
    assert.ok(q.answer >= 0 && q.answer < 4); assert.ok(q.explanation); assert.ok(q.rules); assert.ok(q.takeaway);
  }
  assert.throws(() => makeLabQuestion("stocks", "outs"));
  assert.throws(() => makeLabQuestion("poker", "basket"));
});

test("river decisions derive equity from legal weighted hands instead of displaying a win chance", () => {
  for (let i = 0; i < 100; i++) {
    const q = makeLabQuestion("poker", "call-fold");
    assert.equal(q.cards!.board.length, 5);
    assert.ok(q.river!.rows.some(row => row.possible > row.combos));
    assert.ok(q.facts.every(fact => !fact.label.includes("CHANCE")));
    const { pot, call } = q.metrics;
    const totals = rangeTotals(q.river!.rows, q.river!.bluffFrequency);
    assert.equal(q.choices[q.answer], callDecision(totals.equity, pot, call));
    assert.ok(Math.abs(q.metrics.ev - (totals.winProbability * pot - totals.losses / totals.total * call + totals.tieProbability * (pot - call) / 2)) < 1e-8);
    assert.equal(q.simulation!.probability, totals.winProbability);
    assert.equal(q.simulation!.tieProbability, totals.tieProbability);
  }
});

function hasStraight(cards: Card[]) {
  const ranks = new Set(cards.map(c => c.rank));
  if (ranks.has(14)) ranks.add(1);
  for (let start = 1; start <= 10; start++) if ([0, 1, 2, 3, 4].every(n => ranks.has(start + n))) return true;
  return false;
}
function hasFlush(cards: Card[]) {
  return ["♠", "♥", "♦", "♣"].some(suit => cards.filter(c => c.suit === suit).length >= 5);
}
test("outs match exhaustive enumeration of the actual visible cards and unseen deck", () => {
  const variants = new Set<string>();
  for (let i = 0; i < 250; i++) {
    const q = makeLabQuestion("poker", "outs");
    const shown = [...q.cards!.hand, ...q.cards!.board];
    const key = (c: Card) => `${c.rank}${c.suit}`;
    const known = new Set(shown.map(key));
    assert.equal(known.size, shown.length);
    assert.equal(q.cards!.hand.length, 2);
    assert.ok(q.cards!.board.length === 3 || q.cards!.board.length === 4);
    let outs = 0;
    const completes = q.cards!.target === "flush" ? hasFlush : hasStraight;
    assert.equal(completes(shown), false);
    for (const suit of ["♠", "♥", "♦", "♣"] as Card["suit"][]) for (let rank = 2; rank <= 14; rank++) {
      const card = { rank, suit };
      if (!known.has(key(card)) && completes([...shown, card])) outs++;
    }
    assert.equal(q.metrics.outs, outs, JSON.stringify(q.cards));
    assert.equal(q.metrics.unseen, 52 - known.size);
    assert.equal(q.choices[q.answer], `${outs} outs · ${(outs / (52 - known.size) * 100).toFixed(1)}%`);
    variants.add(q.variant!);
  }
  assert.deepEqual([...variants].sort(), ["flush", "gutshot", "open-ended"]);
});

test("expected value includes both net gains and net losses", () => {
  assert.ok(Math.abs(expectedValue(.4, 30, 15) - 3) < 1e-10);
  assert.equal(expectedValue(.25, 60, 20), 0);
  assert.equal(expectedValue(.2, 20, 10), -4);
  for (let i = 0; i < 200; i++) {
    const q = makeLabQuestion("stocks", "edge");
    const { chance, gain, loss } = q.metrics;
    const value = (chance * gain - (100 - chance) * loss) / 100;
    assert.equal(q.choices[q.answer], `${value < 0 ? "−" : "+"}$${Math.abs(value).toFixed(2)}`);
  }
});

test("return puzzles compound sequentially and use the post-loss recovery baseline", () => {
  const variants = new Set<string>();
  for (let i = 0; i < 250; i++) {
    const q = makeLabQuestion("stocks", "returns");
    variants.add(q.variant!);
    if (q.variant === "recovery") {
      const growth = 100 / (100 - q.metrics.drop) - 1;
      assert.equal(q.choices[q.answer], `${(growth * 100).toFixed(1)}%`);
    } else {
      const { start, gain, decline } = q.metrics;
      const final = Math.round(start * (100 + gain) * (100 - decline) / 100) / 100;
      assert.equal(q.choices[q.answer], `$${final.toFixed(2)}`);
    }
  }
  assert.deepEqual([...variants].sort(), ["compound", "fee", "recovery"]);
});

test("uncertainty distinguishes a tiny winning sample from stronger evidence", () => {
  const small = wilsonInterval(7, 10), large = wilsonInterval(70, 100);
  assert.ok(small.lower < .5 && small.upper > .5);
  assert.ok(Math.abs(small.lower - .39677) < .001);
  assert.ok(large.lower > .5);
  assert.ok(large.upper - large.lower < small.upper - small.lower);
  assert.ok(wilsonInterval(0, 10).lower < .001);
  assert.ok(wilsonInterval(10, 10).upper > .999);
  for (let i = 0; i < 150; i++) {
    const q = makeLabQuestion("stocks", "noise");
    const { lower, upper } = q.interval!;
    assert.equal(q.choices[q.answer], lower > .5 ? "Evidence of a win rate above 50%" : upper < .5 ? "Evidence of a win rate below 50%" : "Not enough evidence to distinguish it from 50%");
  }
});

test("balanced baskets identify the unique lowest-variance equal-weight pair", () => {
  for (let i = 0; i < 100; i++) {
    const q = makeLabQuestion("stocks", "basket"), series = q.series!;
    const pairs = [];
    for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
      pairs.push({ names: [series[a].name, series[b].name], spread: variance(series[a].values.map((value, n) => (value + series[b].values[n]) / 2)) });
    }
    pairs.sort((a, b) => a.spread - b.spread);
    assert.ok(pairs[0].spread < pairs[1].spread);
    assert.deepEqual(q.choices[q.answer].split(" + ").sort(), pairs[0].names.sort());
  }
});

test("lab progress coexists with old records and rejects invalid game/format combinations", () => {
  const base = { date: new Date().toISOString(), correct: 3, total: 5 };
  const records = [{ ...base, id: "old", mode: "math", level: 1 }, { ...base, id: "new", mode: "poker", labGame: "outs", format: "learn" }];
  const invalid = [{ ...records[1], id: "bad-game", labGame: "basket" }, { ...records[1], id: "bad-format", format: "random" }, { ...records[1], id: "incomplete", total: 4 }];
  assert.deepEqual(readSessions(JSON.stringify([...records, ...invalid])), records);
});
