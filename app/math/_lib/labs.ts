import { randomInt, shuffle, type LabGame, type LabMode, type LabSelection } from "./game";

export const LAB_GAMES: Record<LabGame, { title: string; subtitle: string; lesson: string; source: string }> = {
  "call-fold": { title: "Call or Fold?", subtitle: "Find the price of a good decision", lesson: "Compare your chance to win with call ÷ (pot + call). In these all-in examples, the pot already includes the opponent’s bet. There are no future bets, ties, or fees.", source: "https://www.pokerstars.com/poker/learn/lesson/pot-odds/" },
  outs: { title: "Count Your Outs", subtitle: "See the cards that change the story", lesson: "Count the unseen cards that complete the requested draw. Divide by 47 unseen cards on the flop or 46 on the turn for the chance on the next card. Completing a draw does not guarantee winning.", source: "https://www.pokerstars.com/poker/learn/lesson/calculating-outs/" },
  edge: { title: "Find the Edge", subtitle: "A good bet can still lose", lesson: "Expected net value = win probability × net gain − loss probability × net loss. It describes a long-run average, not what must happen next. All probabilities here are supplied by a fictional model.", source: "https://www.pokerstars.com/poker/learn/lesson/pot-odds/" },
  returns: { title: "Return Rollercoaster", subtitle: "Ride the percentages, keep your balance", lesson: "Multiply successive growth factors instead of adding percentages. A 20% gain followed by a 20% loss leaves 96% of the starting value. Recovering from a loss uses the smaller, new balance as its baseline.", source: "https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator" },
  noise: { title: "Skill or Luck?", subtitle: "A winning streak is just the beginning", lesson: "Look at the uncertainty around a win rate. If the displayed 95% Wilson interval includes 50%, these data do not distinguish the win rate from that baseline at this level. More observations can narrow the interval; they cannot guarantee future results.", source: "https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm" },
  basket: { title: "Build a Balanced Basket", subtitle: "Find the pair that smooths the ride", lesson: "Compare how investments move together. For a portfolio reset to 50/50 each month, average the two returns in each column. Find the pair with the smallest swings in this sample. These are fictional returns, not a promise about future risk.", source: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation" },
};
export const LAB_POOLS: Record<LabMode, LabGame[]> = {
  poker: ["call-fold", "outs", "edge", "noise"],
  stocks: ["returns", "basket", "edge", "noise"],
};
export interface Card { rank: number; suit: "♠" | "♥" | "♦" | "♣" }
export interface LabQuestion {
  game: LabGame;
  prompt: string;
  facts: { label: string; value: string }[];
  choices: string[];
  answer: number;
  explanation: string;
  takeaway: string;
  rules: string;
  metrics: Record<string, number>;
  variant?: string;
  cards?: { hand: Card[]; board: Card[]; target: "flush" | "straight" };
  series?: { name: string; values: number[] }[];
  interval?: { lower: number; upper: number; estimate: number };
  simulation?: { probability: number; gain: number; loss: number };
}
type Draft = Omit<LabQuestion, "choices" | "answer">;
const pick = <T,>(items: readonly T[]) => items[randomInt(0, items.length - 1)];
const cash = (amount: number) => `$${amount.toFixed(2)}`;
const signedCash = (amount: number) => `${amount < 0 ? "−" : "+"}${cash(Math.abs(amount))}`;
const pct = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

function question(draft: Draft, correct: string, alternatives: string[]): LabQuestion {
  const choices = shuffle([correct, ...shuffle([...new Set(alternatives)].filter(item => item !== correct)).slice(0, 3)]);
  if (choices.length !== 4) throw new Error("Each lab question needs four distinct choices.");
  return { ...draft, choices, answer: choices.indexOf(correct) };
}
function numericQuestion(draft: Draft, answer: number, candidates: number[], format: (n: number) => string): LabQuestion {
  return question(draft, format(answer), [...candidates, answer + 1, answer + 2, answer + 5, answer + 10].map(format));
}
export function expectedValue(probability: number, gain: number, loss: number): number {
  return probability * gain - (1 - probability) * loss;
}
export function wilsonInterval(wins: number, total: number) {
  const p = wins / total, z = 1.96, denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
  return { lower: Math.max(0, center - margin), upper: Math.min(1, center + margin), estimate: p };
}
export function variance(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}
export function signature(q: LabQuestion): string { return JSON.stringify([q.game, q.variant, q.metrics, q.cards, q.series]); }

function callFold(): LabQuestion {
  const pot = pick([40, 60, 80, 100, 120, 160]);
  const call = pick([10, 20, 25, 40]);
  const equity = pick([10, 15, 20, 25, 30, 40, 50, 60]);
  const ev = (equity * pot - (100 - equity) * call) / 100;
  const threshold = call / (pot + call);
  const choices = ["Call — positive EV", "Fold — negative EV", "Either — break-even", "Need the original buy-in"];
  return question({
    game: "call-fold", prompt: "Your opponent is all-in. Call or fold?",
    facts: [{ label: "POT NOW · BET INCLUDED", value: cash(pot) }, { label: "COST TO CALL", value: cash(call) }, { label: "CHANCE TO WIN", value: `${equity}%` }],
    metrics: { pot, call, equity, ev, threshold },
    rules: "Practice chips. Given win chance; no future betting, ties, or fees. Folding has zero additional cost.",
    explanation: `Break-even chance = ${cash(call)} ÷ (${cash(pot)} + ${cash(call)}) = ${pct(threshold)}. Your ${equity}% chance is ${ev > 0 ? "above" : ev < 0 ? "below" : "exactly at"} that threshold. Calling has an expected net value of ${signedCash(ev)} relative to folding.`,
    takeaway: "Judge the call using the price and probability available at the time.",
    simulation: { probability: equity / 100, gain: pot, loss: call },
  }, choices[ev > 0 ? 0 : ev < 0 ? 1 : 2], choices);
}

function countOuts(): LabQuestion {
  const suits: Card["suit"][] = ["♠", "♥", "♦", "♣"];
  const ranks = Array.from({ length: 13 }, (_, i) => i + 2);
  const turn = Math.random() < .5;
  const variant = pick(["flush", "open-ended", "gutshot"]);
  let main: Card[], extras: Card[], outs: number;
  if (variant === "flush") {
    const suit = pick(suits);
    main = shuffle(ranks).slice(0, 4).map(rank => ({ rank, suit }));
    extras = shuffle(ranks).slice(0, turn ? 2 : 1).map(rank => ({ rank, suit: pick(suits.filter(s => s !== suit)) }));
    outs = 9;
  } else {
    const start = randomInt(3, 9), gap = randomInt(1, 3);
    const sequence = Array.from({ length: variant === "open-ended" ? 4 : 5 }, (_, i) => start + i).filter((_, i) => variant !== "gutshot" || i !== gap);
    main = sequence.map((rank, i) => ({ rank, suit: suits[i] }));
    // Keep aces out of the filler cards: an ace can create a second wheel draw.
    const safe = ranks.filter(rank => rank !== 14 && (variant === "open-ended" ? rank < start - 1 || rank > start + 4 : rank < start - 2 || rank > start + 6));
    extras = shuffle(safe).slice(0, turn ? 2 : 1).map((rank, i) => ({ rank, suit: suits[i] }));
    outs = variant === "open-ended" ? 8 : 4;
  }
  const hand = main.slice(0, 2), board = shuffle([...main.slice(2), ...extras]);
  const unseen = 52 - hand.length - board.length;
  const target = variant === "flush" ? "flush" : "straight";
  const correct = `${outs} outs · ${pct(outs / unseen)}`;
  const reason = variant === "flush" ? "Four cards of the suit are visible, leaving 13 − 4 = 9 in the unseen deck." : variant === "open-ended" ? "Either end of the four-card run completes the straight: two ranks × four suits = 8 cards." : "Only the missing rank fills this inside straight: one rank × four suits = 4 cards.";
  return question({
    game: "outs", variant, prompt: `How many outs complete your ${target}, and what is the chance on the next card?`,
    facts: [{ label: "STREET", value: turn ? "Turn" : "Flop" }, { label: "UNSEEN CARDS", value: String(unseen) }],
    cards: { hand, board, target }, metrics: { outs, unseen, probability: outs / unseen },
    rules: "Texas Hold’em. All unseen cards are equally likely. Count only the requested draw on the next card.",
    explanation: `${reason} With ${unseen} cards unseen, the probability is ${outs} ÷ ${unseen} = ${pct(outs / unseen)}.`,
    takeaway: "Completing a draw is different from winning the hand; another player can still have a better hand.",
  }, correct, [4, 8, 9, 12, 15].map(n => `${n} outs · ${pct(n / unseen)}`));
}

function findEdge(mode: LabMode): LabQuestion {
  const chance = pick([20, 25, 40, 50, 60, 75, 80]);
  const gain = pick([10, 20, 30, 40, 60, 80]), loss = pick([10, 15, 20, 30, 40]);
  const ev = (chance * gain - (100 - chance) * loss) / 100;
  return numericQuestion({
    game: "edge", prompt: `What is the expected net ${mode === "poker" ? "gain per play" : "result per trial"}?`,
    facts: [{ label: "WIN CHANCE", value: `${chance}%` }, { label: "NET GAIN IF WIN", value: `+${cash(gain)}` }, { label: "NET LOSS OTHERWISE", value: `−${cash(loss)}` }],
    metrics: { chance, gain, loss, ev }, rules: "A fictional two-outcome model. Probabilities are given, and gains/losses already include all costs.",
    explanation: `${chance}% × ${cash(gain)} − ${100 - chance}% × ${cash(loss)} = ${signedCash(ev)} per trial on average. ${ev > 0 ? "This model has positive expected value, but individual trials can lose." : ev < 0 ? "This model has negative expected value, even though some trials will win." : "This model breaks even in expectation, while individual results still vary."}`,
    takeaway: "Win rate alone is not enough. The size of wins and losses matters too.",
    simulation: { probability: chance / 100, gain, loss },
  }, ev, [-ev, gain - loss, gain * chance / 100, (gain - loss) / 2, 0, ev - 5, ev + 5], signedCash);
}

function returnRide(): LabQuestion {
  const variant = pick(["compound", "recovery", "fee"]);
  if (variant === "recovery") {
    const drop = pick([10, 20, 25, 40, 50]), recovery = drop / (100 - drop) * 100;
    return numericQuestion({
      game: "returns", variant, prompt: "What percentage gain gets you back to the starting balance?",
      facts: [{ label: "START", value: "$100.00" }, { label: "DRAWDOWN", value: `−${drop}%` }, { label: "BALANCE NOW", value: cash(100 - drop) }],
      metrics: { drop, recovery }, rules: "One hypothetical loss followed by one gain. Ignore fees and additional deposits.",
      explanation: `You need ${cash(drop)} back on a ${cash(100 - drop)} balance. ${drop} ÷ ${100 - drop} × 100 = ${recovery.toFixed(1)}%. The recovery rate uses the smaller balance as its baseline.`,
      takeaway: "A loss of 50% needs a gain of 100% to recover.",
    }, recovery, [drop, drop * 2, 100 - drop, drop / 2, recovery + 10], n => `${n.toFixed(1)}%`);
  }
  const start = pick([100, 200, 400]), gain = pick([10, 20, 25, 50]);
  const decline = variant === "fee" ? pick([1, 2, 3]) : gain;
  const afterGain = start * (1 + gain / 100);
  const final = Math.round(afterGain * (1 - decline / 100) * 100) / 100;
  return numericQuestion({
    game: "returns", variant, prompt: "Where does your balance finish?",
    facts: [{ label: "START", value: cash(start) }, { label: "FIRST: GROWTH", value: `+${gain}%` }, { label: variant === "fee" ? "THEN: FEE ON NEW BALANCE" : "THEN: DECLINE", value: `−${decline}%` }],
    metrics: { start, gain, decline, final }, rules: variant === "fee" ? "Apply the fee once, after growth, to the new balance. No taxes or other costs." : "Apply the two changes in order. No deposits, withdrawals, or fees.",
    explanation: `${cash(start)} × ${(1 + gain / 100).toFixed(2)} = ${cash(afterGain)}. Then ${cash(afterGain)} × ${(1 - decline / 100).toFixed(2)} = ${cash(final)}. ${variant === "fee" ? "The fee is charged on the balance after growth." : "Equal up and down percentages do not cancel because their baselines differ."}`,
    takeaway: "Multiply growth factors in sequence; adding the rates misses compounding.",
  }, final, [start, afterGain, start * (1 + (gain - decline) / 100), start * (1 - decline / 100), final + 10, final - 10], cash);
}

function skillOrLuck(mode: LabMode): LabQuestion {
  const total = pick([10, 20, 50, 100, 200]), wins = Math.round(total * pick([.35, .4, .5, .6, .65, .7, .8]));
  const interval = wilsonInterval(wins, total);
  const direction = interval.lower > .5 ? 1 : interval.upper < .5 ? -1 : 0;
  const statements = ["Evidence of a win rate above 50%", "Evidence of a win rate below 50%", "Not enough evidence to distinguish it from 50%", "Guaranteed to win the next trial"];
  return question({
    game: "noise", prompt: "Does this interval give evidence that the win rate differs from 50%?",
    facts: [{ label: mode === "poker" ? "SIMULATED PLAYS" : "MODEL TEST TRIALS", value: String(total) }, { label: "WINS", value: String(wins) }, { label: "OBSERVED WIN RATE", value: pct(wins / total) }],
    metrics: { total, wins, lower: interval.lower, upper: interval.upper, direction }, interval,
    rules: "95% Wilson interval. One pre-chosen model, independent new trials, fixed win probability. The reference rate is 50%.",
    explanation: `The interval is ${pct(interval.lower)}–${pct(interval.upper)}. ${direction === 0 ? "It includes 50%, so this sample does not distinguish the underlying win rate from 50% at this confidence level." : `It lies entirely ${direction > 0 ? "above" : "below"} 50%, which supports a ${direction > 0 ? "higher" : "lower"} underlying win rate under these assumptions.`} This does not prove skill or predict the next result.`,
    takeaway: "A 95% confidence method covers the true rate in about 95% of repeated samples under its assumptions. Win rate alone also does not establish profitability.",
  }, statements[direction > 0 ? 0 : direction < 0 ? 1 : 2], statements);
}

function balancedBasket(): LabQuestion {
  const amplitude = pick([1, 2, 3]), mean = pick([0, 1, 2]);
  const wave = shuffle([-2, -1, 1, 2]).map(n => n * amplitude);
  const names = shuffle(["Birch", "Quartz", "Moss"]);
  const series = [
    { name: names[0], values: wave.map(n => mean + n) },
    { name: names[1], values: wave.map(n => mean + 2 * n) },
    { name: names[2], values: wave.map(n => mean - n) },
  ];
  const correct = `${names[0]} + ${names[2]}`;
  return question({
    game: "basket", prompt: "Which 50/50 pair had the smallest return swings in these four months?",
    facts: [{ label: "PORTFOLIO WEIGHTS", value: "50 / 50" }, { label: "COMPARE", value: "Past variation" }],
    series: shuffle(series), metrics: { amplitude, mean }, rules: "Fictional monthly returns (%). Reset weights to 50/50 before each month. Ignore fees.",
    explanation: `${names[0]} and ${names[2]} offset each other in this sample. Averaging their returns in every column gives ${mean}% each month, with zero variation. The other pairs fluctuate.`,
    takeaway: "How assets move together matters. A smooth historical sample does not guarantee a safe future portfolio.",
  }, correct, [`${names[0]} + ${names[1]}`, `${names[1]} + ${names[2]}`, "All three pairs vary equally"]);
}

export function makeLabQuestion(mode: LabMode, selection: LabSelection, previous?: string): LabQuestion {
  const pool = LAB_POOLS[mode];
  if (selection !== "mixed" && !pool.includes(selection)) throw new Error("That game is not available in this lab.");
  let next!: LabQuestion;
  for (let attempt = 0; attempt < 12; attempt++) {
    const game = selection === "mixed" ? pick(pool) : selection;
    next = game === "call-fold" ? callFold() : game === "outs" ? countOuts() : game === "edge" ? findEdge(mode) : game === "returns" ? returnRide() : game === "noise" ? skillOrLuck(mode) : balancedBasket();
    if (signature(next) !== previous) break;
  }
  return next;
}

export function simulateOutcome(q: LabQuestion): string | null {
  if (!q.simulation) return null;
  const { probability, gain, loss } = q.simulation;
  const result = Math.random() < probability ? gain : -loss;
  return `One simulated ${q.game === "call-fold" ? "call" : "trial"}: ${signedCash(result)}. Your score depends on the reasoning, not this outcome.`;
}
