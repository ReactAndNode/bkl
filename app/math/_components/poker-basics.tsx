export default function PokerBasics() {
  return <section className="poker-basics" aria-label="Understanding poker hands and ranges">
    <h3>Start here: your hand, your range, their range.</h3>
    <div className="poker-basics-grid">
      <div><strong>Your hand</strong><p>The two cards you actually hold. You know them.</p></div>
      <div><strong>Your range</strong><p>All the hands you would play through this position and betting history. Your actual hand is one member.</p></div>
      <div><strong>The opponent’s range</strong><p>Your estimate of the hands they could hold. Their cards stay hidden.</p></div>
    </div>
    <p>A range is not a fixed personal setting. Position, stack sizes, earlier bets, and the other player all matter. Following a range never guarantees that your hand wins.</p>
    <p>Here, practice with your two known cards. Choose what you think about the opponent, or say “I don’t know yet.” The game checks the decision under that assumption.</p>
  </section>;
}
