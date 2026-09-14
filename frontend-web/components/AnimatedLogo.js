import { useState, useEffect } from "react";

export default function AnimatedLogo() {
  const letters = ["S", "H", "O", "P", "Y", "Z"];
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let index = 0;
    let timeoutId;

    const runCycle = () => {
      setVisibleCount(0);
      index = 0;

      const showNext = () => {
        index += 1;
        setVisibleCount(index);
        if (index < letters.length) {
          timeoutId = setTimeout(showNext, 220);
        } else {
          timeoutId = setTimeout(runCycle, 1800);
        }
      };

      timeoutId = setTimeout(showNext, 300);
    };

    runCycle();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
      {letters.map((letter, i) => (
        <span
          key={i}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            opacity: i < visibleCount ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
