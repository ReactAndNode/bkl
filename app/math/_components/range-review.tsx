"use client";

import { useState } from "react";
import { callDecision, rangeTotals, type RiverRead } from "../_lib/poker";

export default function RangeReview({ read, pot, call }: { read: RiverRead; pot: number; call: number }) {
  const [frequency, setFrequency] = useState(read.bluffFrequency);
  const totals = rangeTotals(read.rows, frequency);
  return <div className="range-review">
    <h3>Where the estimate comes from</h3>
    <p>A combination is one possible pair of hole cards. Visible cards remove combinations. These counts compare your actual best five-card hand with each legal opponent hand.</p>
    <div className="range-table-wrap"><table className="range-table">
      <caption>Legal combinations before bluff weighting · Results from your side</caption>
      <thead><tr><th scope="col">Their hand</th><th scope="col">Blocked</th><th scope="col">You win</th><th scope="col">Tie</th><th scope="col">You lose</th></tr></thead>
      <tbody>{read.rows.map(row => <tr key={row.notation}><th scope="row">{row.notation}<small>{row.kind}</small></th><td>{row.possible - row.combos}</td><td>{row.wins}</td><td>{row.ties}</td><td>{row.losses}</td></tr>)}</tbody>
    </table></div>
    <div className="range-explorer">
      <h3>What if your read is wrong?</h3>
      <p>Keep the value range fixed and change how often the listed bluff candidates shove. This explores the decision; your recorded answer stays the same.</p>
      <label>Bluff candidates that become bets: <strong>{Math.round(frequency * 100)}%</strong><input type="range" min="0" max="100" step="5" value={Math.round(frequency * 100)} onInput={event => setFrequency(Number(event.currentTarget.value) / 100)} onChange={event => setFrequency(Number(event.target.value) / 100)} /></label>
      <div className="range-explorer-result" aria-live="polite"><strong>{(totals.equity * 100).toFixed(1)}% estimated equity</strong><span>{callDecision(totals.equity, pot, call)} · need {(call / (pot + call) * 100).toFixed(1)}%</span></div>
      <p>Equity is your estimated share of the pot, counting ties as half a win. It comes from the assumed range, not from knowing their cards.</p>
    </div>
  </div>;
}
