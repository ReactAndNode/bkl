import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRange, callDecision, cardKey, expandHand, handRank, makeRiverRead, parseCards, rangeTotals, RIVER_SPOTS } from "../app/math/_lib/poker";
import { simulateOutcome, type LabQuestion } from "../app/math/_lib/labs";

test("best-five evaluation orders every hand class and handles wheel, two trips, and three pairs", () => {
  const ordered = [
    "A♠J♥9♦6♣3♣2♦7♠", "A♠A♥9♦6♣3♣2♦7♠", "A♠A♥9♦9♣3♣2♦7♠", "A♠A♥A♦9♣3♣2♦7♠",
    "A♠2♥3♦4♣5♣9♦7♠", "A♠J♠9♠6♠3♠2♦7♥", "A♠A♥A♦9♣9♥2♦7♠", "A♠A♥A♦A♣9♥2♦7♠", "9♠T♠J♠Q♠K♠2♦7♥",
  ].map(text => handRank(parseCards(text)));
  for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i] > ordered[i - 1]);
  assert.ok(handRank(parseCards("2♠3♥4♦5♣6♣J♦T♠")) > handRank(parseCards("A♠2♥3♦4♣5♣J♦T♠")));
  assert.equal(handRank(parseCards("A♠A♥A♦K♣K♥K♦7♠")), handRank(parseCards("A♠A♥A♦K♣K♥")));
  assert.equal(handRank(parseCards("A♠A♥K♦K♣Q♥Q♦2♠")), handRank(parseCards("A♠A♥K♦K♣Q♥")));
  assert.equal(handRank(parseCards("A♠K♠Q♠J♠T♠2♦3♥")), handRank(parseCards("A♠K♠Q♠J♠T♠4♦5♥")));
  assert.ok(handRank(parseCards("A♠A♥K♦J♣9♥4♦2♠")) > handRank(parseCards("A♠A♥Q♦J♣9♥4♦2♠")));
});

test("range combinations respect suitedness, exact suits, and hero/board blockers", () => {
  assert.equal(expandHand("AK").length, 16);
  assert.equal(expandHand("AKs").length, 4);
  assert.equal(expandHand("AKo").length, 12);
  assert.equal(expandHand("QQ").length, 6);
  assert.equal(expandHand("QQ", parseCards("Q♠Q♦")).length, 1);
  assert.equal(expandHand("AK", parseCards("A♠K♦")).length, 9);
  assert.equal(expandHand("A♥J♥", parseCards("A♥Q♦")).length, 0);
  assert.equal(expandHand("A♥J♥", parseCards("A♠Q♦")).length, 1);
});

test("the flush blocker removes bluffs and can turn the same price from call to fold", () => {
  const spot = RIVER_SPOTS[0], board = parseCards(spot.board);
  const open = rangeTotals(analyzeRange(parseCards("A♠Q♦"), board, spot.value, spot.bluffs), .5);
  const blocked = rangeTotals(analyzeRange(parseCards("A♥Q♦"), board, spot.value, spot.bluffs), .5);
  assert.equal(open.wins, 4); assert.equal(open.losses, 8); assert.equal(open.equity, 1 / 3);
  assert.equal(blocked.wins, 3); assert.equal(blocked.losses, 8); assert.equal(blocked.equity, 3 / 11);
  assert.equal(callDecision(open.equity, 120, 50), "Call — positive EV");
  assert.equal(callDecision(blocked.equity, 120, 50), "Fold — negative EV");
  assert.equal(callDecision(open.equity, 100, 50), "Either — break-even");
});

test("river evaluation includes thin value wins and split pots, not only bluff counts", () => {
  const thin = RIVER_SPOTS[2];
  const rows = analyzeRange(parseCards(thin.hands[0]), parseCards(thin.board), thin.value, thin.bluffs);
  assert.ok(rows.find(row => row.notation === "AT")!.wins > 0);
  assert.ok(rows.find(row => row.notation === "TT")!.losses > 0);
  const twoPair = RIVER_SPOTS[3];
  const tied = analyzeRange(parseCards(twoPair.hands[0]), parseCards(twoPair.board), twoPair.value, twoPair.bluffs);
  assert.equal(tied.find(row => row.notation === "A9")!.ties, 4);
  assert.equal(tied.find(row => row.notation === "66")!.losses, 3);
  const totals = rangeTotals(tied, .5);
  assert.equal(totals.equity, (totals.wins + totals.ties / 2) / totals.total);
});

test("all scenario variants have unique cards and disjoint legal ranges; suit shuffles retain valid results", () => {
  for (const spot of RIVER_SPOTS) for (const holding of spot.hands) {
    const shown = parseCards(holding + spot.board);
    assert.equal(new Set(shown.map(cardKey)).size, 7);
    const combinations = [...spot.value, ...spot.bluffs].flatMap(hand => expandHand(hand, shown)).map(hand => hand.map(cardKey).sort().join(""));
    assert.equal(new Set(combinations).size, combinations.length);
  }
  for (let i = 0; i < 80; i++) {
    const { hand, board, read } = makeRiverRead();
    assert.equal(new Set([...hand, ...board].map(cardKey)).size, 7);
    assert.deepEqual(read.rows, analyzeRange(hand, board, read.value, read.bluffs));
    const totals = rangeTotals(read.rows, read.bluffFrequency);
    assert.ok(totals.equity > 0 && totals.equity < 1);
    assert.ok(totals.losses > 0);
  }
});

test("a split-pot simulation returns half of the final pot minus the call", context => {
  context.mock.method(Math, "random", () => .3);
  const question = { game: "call-fold", simulation: { probability: .2, tieProbability: .3, gain: 120, loss: 20 } } as LabQuestion;
  assert.match(simulateOutcome(question)!, /\+\$50\.00 \(split pot\)/);
});
