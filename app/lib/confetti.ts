import confetti from "canvas-confetti";

export function celebrate() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();

  // Additional burst from center
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });
  }, 250);
}

