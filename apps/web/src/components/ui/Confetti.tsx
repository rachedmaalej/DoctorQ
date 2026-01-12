import { useEffect, useState } from 'react';

const CONFETTI_COLORS = [
  '#f44336', // red
  '#e91e63', // pink
  '#9c27b0', // purple
  '#2196f3', // blue
  '#4caf50', // green
  '#ffeb3b', // yellow
  '#ff9800', // orange
  '#00bcd4', // cyan
];

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  color: string;
  rotation: number;
}

interface ConfettiProps {
  duration?: number; // How long confetti shows (ms)
  pieces?: number; // Number of confetti pieces
}

export default function Confetti({ duration = 3000, pieces = 50 }: ConfettiProps) {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate random confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: pieces }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (%)
      delay: Math.random() * 1, // Random start delay (0-1s)
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360, // Random initial rotation
    }));
    setConfettiPieces(newPieces);

    // Hide confetti after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, pieces]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
