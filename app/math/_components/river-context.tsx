"use client";

import { describeHand, OPPONENT_READS, type OpponentRead, type RiverRead } from "../_lib/poker";

export function PlayerPositions({ read }: { read: RiverRead }) {
  return <div className="poker-positions" aria-label="Players and positions">
    <div><span>YOU · CARDS KNOWN</span><strong>{read.heroPosition}</strong><p>{read.heroPosition === "Button" ? "Dealer position · act last after the flop" : "Big blind position · act first after the flop"}</p></div>
    <div><span>OPPONENT · CARDS HIDDEN</span><strong>{read.opponentPosition}</strong><p>{read.opponentPosition === "Button" ? "Dealer position · act last after the flop" : "Big blind position · act first after the flop"}</p></div>
  </div>;
}

export default function RiverContext({ read, onRead }: { read: RiverRead; onRead?: (assumption: OpponentRead) => void }) {
  const profile = OPPONENT_READS.find(option => option.id === read.assumption)!;
  return <div className="river-read">
    <h3>1. What happened in this hand?</h3><p>{read.history}</p>
    <details className="your-range-help"><summary>What is my own range in this spot?</summary>
      <p>{read.yourRange}</p>
      <p>These are examples, not a complete strategy chart. Your range changes with your position, stack sizes, and which hands you choose to bet, call, or raise. The opponent can form an estimate of your range, too.</p>
      <p>Your two cards stay fixed in this exercise. The controls below change your estimate of the opponent. A complete strategy considers how you play every hand in your own range; this exercise checks the decision for the hand shown.</p>
      <a href="https://www.pokerstars.com/poker/learn/lesson/position/" target="_blank" rel="noreferrer">Learn how position affects ranges</a>
    </details>
    <h3>2. What might the opponent have?</h3>
    <p className="opponent-range-label"><strong>Both groups below belong to the opponent.</strong> They are suggested possibilities based on the story, not known cards.</p>
    <div className="opponent-range-groups">
      <div><h4>Their hands betting for value</h4><p>They hope a worse hand calls. Some of these hands might still lose to yours.</p></div>
      <div><h4>Their possible bluffing hands</h4><p>They missed a draw and may bet to make you fold a better hand.</p></div>
    </div>
    <details className="opponent-hand-list"><summary>See the suggested hands for this opponent</summary>
      <h4>Opponent’s value-betting hands</h4><ul className="range-value-hands">{read.value.map(hand => <li key={hand} data-hand-notation={hand}><span>{describeHand(hand)}</span><small>{hand}</small></li>)}</ul>
      <h4>Opponent’s possible bluffing hands</h4><ul className="range-bluff-hands">{read.bluffs.map(hand => <li key={hand} data-hand-notation={hand}><span>{describeHand(hand)}</span><small>{hand}</small></li>)}</ul>
      <p>Your cards and the board remove impossible combinations. These lists stay fixed for the drill; real opponents can have other hands or bet them at different frequencies.</p>
    </details>
    <h3>3. What is your read of this opponent?</h3>
    {onRead ? <><p>Pick an assumption to practice, or keep “I don’t know yet.” Choosing a read is not scored.</p>
      <div className="opponent-read-options" role="group" aria-label="Your read of the opponent">{OPPONENT_READS.map(option => <button key={option.id} type="button" data-read={option.id} aria-pressed={read.assumption === option.id} onClick={() => onRead(option.id)}><strong>{option.label}</strong><span>{option.description}</span></button>)}</div>
    </> : <p className="chosen-opponent-read"><strong>Your chosen read:</strong> {profile.label}</p>}
    <p className="read-scoring-note">{read.assumption === "unknown" ? "With no read, consider a range of bluff frequencies. If the best move changes, choose “It depends on their bluffing.”" : `Your answer will be checked using “${profile.label}.” That is your assumption for this attempt, not a fact about their cards.`}</p>
    <details className="range-model-help"><summary>What do these assumptions mean?</summary>
      <p>For this simplified example, each legal hand combination starts with equal weight. Every listed value-betting hand bets. “Rarely” uses 1 in 4 of each listed bluff candidate; “sometimes” uses 1 in 2; “often” uses all of them.</p>
      <p>“I don’t know yet” tests the whole range from no listed bluffs betting to all of them betting. These are learning models, not measured player statistics. Position and the betting story help you judge the assumptions; they cannot prove them.</p>
    </details>
  </div>;
}
