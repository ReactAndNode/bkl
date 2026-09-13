import { randomInt, shuffle } from "./game";
import type { Card } from "./labs";

const SUITS: Card["suit"][] = ["♠", "♥", "♦", "♣"];
const RANKS = "23456789TJQKA";
export const cardKey = (card: Card) => `${RANKS[card.rank - 2]}${card.suit}`;
export function parseCards(text: string): Card[] {
  return [...text.matchAll(/([2-9TJQKA])([♠♥♦♣])/g)].map(([, rank, suit]) => ({ rank: RANKS.indexOf(rank) + 2, suit: suit as Card["suit"] }));
}

export function describeHand(notation: string): string {
  const names: Record<string, string> = { A: "ace", K: "king", Q: "queen", J: "jack", T: "ten", "9": "nine", "8": "eight", "7": "seven", "6": "six", "5": "five", "4": "four", "3": "three", "2": "two" };
  const suits = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
  const cards = parseCards(notation);
  if (cards.length === 2) return cards.map(card => `${names[RANKS[card.rank - 2]]} of ${suits[card.suit]}`).join(" + ");
  if (notation[0] === notation[1]) return `Pair of ${names[notation[0]]}${notation[0] === "6" ? "es" : "s"}`;
  return `${names[notation[0]]} + ${names[notation[1]]} (${notation[2] === "s" ? "same suit" : notation[2] === "o" ? "different suits" : "any suits"})`;
}

// Compare the best five cards out of five to seven; a larger score wins.
export function handRank(cards: Card[]): number {
  const score = (category: number, ranks: number[]) => [category, ...ranks, ...Array(5).fill(0)].slice(0, 6).reduce((value, rank) => value * 15 + rank, 0);
  const ranks = [...new Set(cards.map(card => card.rank))].sort((a, b) => b - a);
  const straight = (values: number[]) => {
    const present = new Set(values);
    if (present.has(14)) present.add(1);
    for (let high = 14; high >= 5; high--) if ([0, 1, 2, 3, 4].every(offset => present.has(high - offset))) return high;
    return 0;
  };
  const groups = ranks.map(rank => ({ rank, count: cards.filter(card => card.rank === rank).length })).sort((a, b) => b.count - a.count || b.rank - a.rank);
  const flush = SUITS.map(suit => cards.filter(card => card.suit === suit).map(card => card.rank).sort((a, b) => b - a)).find(values => values.length >= 5);
  if (flush && straight(flush)) return score(8, [straight(flush)]);
  if (groups[0].count === 4) return score(7, [groups[0].rank, ranks.find(rank => rank !== groups[0].rank)!]);
  if (groups[0].count === 3 && groups[1].count >= 2) return score(6, [groups[0].rank, groups[1].rank]);
  if (flush) return score(5, flush.slice(0, 5));
  if (straight(ranks)) return score(4, [straight(ranks)]);
  if (groups[0].count === 3) return score(3, [groups[0].rank, ...ranks.filter(rank => rank !== groups[0].rank).slice(0, 2)]);
  const pairs = groups.filter(group => group.count === 2).map(group => group.rank);
  if (pairs.length >= 2) return score(2, [pairs[0], pairs[1], ranks.find(rank => !pairs.slice(0, 2).includes(rank))!]);
  if (pairs.length === 1) return score(1, [pairs[0], ...ranks.filter(rank => rank !== pairs[0]).slice(0, 3)]);
  return score(0, ranks.slice(0, 5));
}

export function expandHand(notation: string, known: Card[] = []): Card[][] {
  const explicit = parseCards(notation);
  let combinations: Card[][] = [];
  if (explicit.length === 2) combinations = [explicit];
  else {
    const [first, second, suited] = notation;
    const a = RANKS.indexOf(first) + 2, b = RANKS.indexOf(second) + 2;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if (a === b && i >= j || suited === "s" && i !== j || suited === "o" && i === j) continue;
      combinations.push([{ rank: a, suit: SUITS[i] }, { rank: b, suit: SUITS[j] }]);
    }
  }
  const blocked = new Set(known.map(cardKey));
  return combinations.filter(cards => cards.every(card => !blocked.has(cardKey(card))));
}

export interface RangeRow { notation: string; kind: "value" | "bluff"; possible: number; combos: number; wins: number; ties: number; losses: number }
export const OPPONENT_READS = [
  { id: "unknown", label: "I don’t know yet", frequency: null, description: "Consider anything from no bluffs to all the listed missed draws." },
  { id: "rare", label: "Rarely bluffs", frequency: .25, description: "Try a cautious opponent who gives up with most missed draws." },
  { id: "some", label: "Sometimes bluffs", frequency: .5, description: "Try an opponent who bets some missed draws and gives up with others." },
  { id: "often", label: "Often bluffs", frequency: 1, description: "Try an opponent who bets all the listed missed draws." },
] as const;
export type OpponentRead = typeof OPPONENT_READS[number]["id"];
export const RIVER_CHOICES = ["Call — the price is worth it", "Fold — the price is too high", "Either — they break even", "It depends on their bluffing"] as const;
export interface RiverRead {
  title: string; history: string; lesson: string; value: string[]; bluffs: string[];
  heroPosition: "Button" | "Big blind"; opponentPosition: "Button" | "Big blind";
  yourRange: string; assumption: OpponentRead; rows: RangeRow[];
}
interface Spot {
  title: string; hands: string[]; board: string; history: string; lesson: string; value: string[]; bluffs: string[];
  heroPosition: "Button" | "Big blind"; yourRange: string;
}

export const RIVER_SPOTS: Spot[] = [
  {
    title: "The missed flush", hands: ["A♠Q♦", "A♥Q♦"], board: "Q♠9♥5♥2♣3♦",
    heroPosition: "Big blind",
    yourRange: "You called a button raise from the big blind, then called two bets. Depending on your strategy, you could reach this river with a queen, some stronger made hands, or a missed draw. Your shown ace-queen is one member of that range.",
    history: "You defend the big blind against a button raise. You check-call the flop and turn. The river misses the heart draw; you check and the button shoves.",
    lesson: "Top pair can catch missed draws. Holding the ace of hearts removes two of the listed bluff combinations, so the same top pair can become a worse call.",
    value: ["QQ", "99", "55", "Q9s"], bluffs: ["A♥J♥", "A♥T♥", "K♥J♥", "K♥T♥", "J♥T♥", "J♥8♥", "T♥8♥", "8♥7♥"],
  },
  {
    title: "Top pair, uncertain kicker", hands: ["K♣Q♦", "K♣Q♠"], board: "K♠J♥7♦3♣2♠",
    heroPosition: "Big blind",
    yourRange: "After defending the big blind and calling two bets, your possible hands could include a king, some stronger hands, and missed straight draws. King-queen is the specific hand you hold this time.",
    history: "The button raises and you call from the big blind. You check-call two bets. On a blank river, the button shoves after you check.",
    lesson: "A king is not enough by itself: AK and two pair beat you, while missed straight draws lose. Your queen also blocks some QT bluffs.",
    value: ["AK", "KJ", "JJ", "77"], bluffs: ["QT", "T9s", "98s"],
  },
  {
    title: "An overpair against thin value", hands: ["J♠J♦", "J♥J♦"], board: "T♥7♣4♥4♠2♦",
    heroPosition: "Button",
    yourRange: "You opened from the button, bet the flop, and checked behind on the turn. Your possible hands could include pairs, some stronger hands you checked, and draws. Jacks are one part of that wider strategy.",
    history: "You raise from the button and the big blind calls. They check-call the flop, you both check the paired turn, and they shove the blank river. The suggested opponent range includes some bets with a ten, hoping a worse hand calls.",
    lesson: "You can beat part of a value range as well as bluffs. Jacks beat AT and KT here, but lose to full houses and three fours.",
    value: ["AT", "KT", "TT", "77", "A4s"], bluffs: ["A♥Q♥", "A♥K♥", "K♥Q♥", "Q♥J♥", "9♥8♥", "6♥5♥"],
  },
  {
    title: "Two pair is not the nuts", hands: ["A♣9♦", "A♥9♦"], board: "A♠9♥6♥3♣2♦",
    heroPosition: "Button",
    yourRange: "You opened from the button and bet twice. Your possible hands could include aces, two pair, sets, and draws you chose to bet. Ace-nine is the particular hand you must make this decision with.",
    history: "You raise from the button and the big blind calls. They check-call the flop and turn, then shove when the river misses the heart draw.",
    lesson: "Top two pair beats weaker two pair, ties another A9, and loses to sets. Count split pots as half a win when estimating your share of the pot.",
    value: ["AA", "99", "66", "A9", "A6s"], bluffs: ["K♥Q♥", "K♥J♥", "Q♥T♥", "J♥T♥", "T♥8♥", "8♥7♥"],
  },
];

export function analyzeRange(hand: Card[], board: Card[], value: string[], bluffs: string[]): RangeRow[] {
  const hero = handRank([...hand, ...board]);
  return ([...value.map(notation => ({ notation, kind: "value" as const })), ...bluffs.map(notation => ({ notation, kind: "bluff" as const }))]).map(entry => {
    const combinations = expandHand(entry.notation, [...hand, ...board]);
    let wins = 0, ties = 0, losses = 0;
    for (const other of combinations) {
      const villain = handRank([...other, ...board]);
      if (hero > villain) wins++; else if (hero === villain) ties++; else losses++;
    }
    return { ...entry, possible: expandHand(entry.notation).length, combos: combinations.length, wins, ties, losses };
  });
}

export function rangeTotals(rows: RangeRow[], bluffFrequency: number) {
  let wins = 0, ties = 0, losses = 0;
  for (const row of rows) {
    const weight = row.kind === "bluff" ? bluffFrequency : 1;
    wins += row.wins * weight; ties += row.ties * weight; losses += row.losses * weight;
  }
  const total = wins + ties + losses;
  return { wins, ties, losses, total, equity: (wins + ties / 2) / total, winProbability: wins / total, tieProbability: ties / total };
}
export function callDecision(equity: number, pot: number, call: number) {
  const ev = equity * (pot + call) - call;
  return Math.abs(ev) < 1e-8 ? "Either — break-even" : ev > 0 ? "Call — positive EV" : "Fold — negative EV";
}
export function assessRiver(rows: RangeRow[], assumption: OpponentRead, pot: number, call: number) {
  const profile = OPPONENT_READS.find(read => read.id === assumption)!;
  const first = rangeTotals(rows, profile.frequency ?? 0);
  const last = rangeTotals(rows, profile.frequency ?? 1);
  const low = Math.min(first.equity, last.equity), high = Math.max(first.equity, last.equity);
  const evLow = low * (pot + call) - call, evHigh = high * (pot + call) - call;
  // With fixed value weights, equity is monotone in the common bluff weight.
  // The two endpoints therefore bound every intermediate bluff assumption.
  const epsilon = 1e-8;
  const choice = Math.abs(evLow) < epsilon && Math.abs(evHigh) < epsilon ? 2
    : evLow >= -epsilon ? 0 : evHigh <= epsilon ? 1 : 3;
  return { low, high, evLow, evHigh, choice: RIVER_CHOICES[choice], profile, totals: first };
}
export function makeRiverRead() {
  const spot = RIVER_SPOTS[randomInt(0, RIVER_SPOTS.length - 1)];
  const suits = shuffle(SUITS);
  const permute = (text: string) => text.replace(/[♠♥♦♣]/g, suit => suits[SUITS.indexOf(suit as Card["suit"])]);
  const hand = parseCards(permute(spot.hands[randomInt(0, spot.hands.length - 1)]));
  const board = parseCards(permute(spot.board));
  const value = spot.value.map(permute), bluffs = spot.bluffs.map(permute);
  const suitNames = ["spade", "heart", "diamond", "club"];
  const drawSuit = suitNames[SUITS.indexOf(suits[1])];
  const adaptCopy = (text: string) => text.replace(/heart/g, drawSuit);
  const read: RiverRead = {
    title: spot.title, history: adaptCopy(spot.history), lesson: adaptCopy(spot.lesson), value, bluffs,
    heroPosition: spot.heroPosition, opponentPosition: spot.heroPosition === "Button" ? "Big blind" : "Button",
    yourRange: spot.yourRange, assumption: "unknown", rows: analyzeRange(hand, board, value, bluffs),
  };
  return { hand, board, read };
}
