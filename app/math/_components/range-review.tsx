"use client";

import { useState } from "react";
import { callDecision, OPPONENT_READS, rangeTotals, type RiverRead } from "../_lib/poker";

export default function RangeReview({ read, pot, call }: { read: RiverRead; pot: number; call: number }) {
  const profile = OPPONENT_READS.find(option => option.id === read.assumption)!;
  const [frequency, setFrequency] = useState<number>(profile.frequency ?? .5);
  const totals = rangeTotals(read.rows, frequency);
  const decision = callDecision(totals.equity, pot, call);
  return <div className="range-review">
    <h3>Keep the hand and the assumption separate.</h3>
    <p>{read.lesson}</p>
    <p><strong>Your recorded read: {profile.label}.</strong> A result that fits this model does not prove the opponent has those hands. Your own wider strategy still depends on position and the earlier action.</p>
    <details className="range-explorer">
      <summary>Explore: what if this opponent bluffs more or less?</summary>
      <p>Your hand and their list of possible hands stay the same. Adjust how often the listed missed draws become bluffs. Your recorded answer and score stay the same.</p>
      {read.assumption === "unknown" && <p>You did not choose one bluff frequency. This separate exploration starts halfway between the two extremes.</p>}
      <label>Listed missed draws that become bluffs: <strong>{Math.round(frequency * 100)}%</strong><input type="range" min="0" max="100" step="5" value={Math.round(frequency * 100)} onInput={event => setFrequency(Number(event.currentTarget.value) / 100)} onChange={event => setFrequency(Number(event.target.value) / 100)} /></label>
      <div className="range-explorer-result" aria-live="polite"><strong>{(totals.equity * 100).toFixed(1)}% estimated share of the pot</strong><span>{decision.startsWith("Call") ? "Calling covers the price" : decision.startsWith("Fold") ? "Folding avoids a losing call" : "Calling and folding break even"} · need {(call / (pot + call) * 100).toFixed(1)}%</span></div>
      <p>That share is called equity. It counts ties as half a win. The percentage above the slider describes how often those missed draws bet; it is not the chance their bet is a bluff.</p>
    </details>
    <details className="range-math-details"><summary>Show the exact opponent hand combinations</summary>
      <p>One combination is one possible pair of opponent cards. Your cards and the board remove impossible combinations. “You win” means your actual hand beats that opponent hand.</p>
      <div className="range-table-wrap"><table className="range-table">
        <caption>Opponent combinations before bluff weighting · Results from your side</caption>
        <thead><tr><th scope="col">Opponent hand</th><th scope="col">Blocked</th><th scope="col">You win</th><th scope="col">Tie</th><th scope="col">You lose</th></tr></thead>
        <tbody>{read.rows.map(row => <tr key={row.notation}><th scope="row">{row.notation}<small>{row.kind === "value" ? "Their value bet" : "Their possible bluff"}</small></th><td>{row.possible - row.combos}</td><td>{row.wins}</td><td>{row.ties}</td><td>{row.losses}</td></tr>)}</tbody>
      </table></div>
    </details>
  </div>;
}
