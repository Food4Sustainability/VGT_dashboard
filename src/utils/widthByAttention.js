// widthByAttention.js
export default function widthByAttention(attention, severity) {
  const s =
    severity ??
    ({
      "light-green": 1,
      "dark-green": 2,
      yellow: 3,
      orange: 3,
      red: 4,
    }[attention] || 2);

  return 18 + s * 12; // bar width between 30–66px
}