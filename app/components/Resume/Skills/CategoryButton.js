export default function CategoryButton({ handleClick, active, label }) {
  return (
    <button className={`skillbutton ${active ? 'skillbutton-active' : ''}`}
      type="button" aria-pressed={active} onClick={handleClick}>
      {label}
    </button>
  );
}
