// Google Material Symbols 아이콘 (이름 목록: https://fonts.google.com/icons)
export default function Icon({ name, className = '', filled = false }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
