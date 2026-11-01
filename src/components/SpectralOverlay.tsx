import React, { useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

interface Props {
  isActive: boolean;
  onToggle: () => void;
}

export const SpectralOverlay: React.FC<Props> = ({ isActive, onToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Occult runes and sacred geometry for spectral vision
    const runes = ['ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛝ', 'ᛟ', 'ᛞ', '∞', '⚯', '⌀', '∆', '∇'];
    const runeNodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      rune: runes[Math.floor(Math.random() * runes.length)],
      alpha: 0.15 + Math.random() * 0.35,
      size: 14 + Math.random() * 12,
    }));

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Spectral Ley-Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      for (let i = 0; i < runeNodes.length; i++) {
        for (let j = i + 1; j < runeNodes.length; j++) {
          const dx = runeNodes[i].x - runeNodes[j].x;
          const dy = runeNodes[i].y - runeNodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 180) {
            ctx.moveTo(runeNodes[i].x, runeNodes[i].y);
            ctx.lineTo(runeNodes[j].x, runeNodes[j].y);
          }
        }
      }
      ctx.stroke();
      ctx.restore();

      // 2. Floating Silver Runes
      ctx.save();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      runeNodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        const pulse = 0.8 + 0.2 * Math.sin(time * 2 + node.x);
        ctx.fillStyle = `rgba(255, 255, 255, ${(node.alpha * pulse).toFixed(3)})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fillText(node.rune, node.x, node.y);
      });
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-42"
        aria-hidden="true"
      />

      {/* Spectral Vision HUD indicator */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/40 bg-black/85 backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.25)] text-white text-[11px] tracking-widest uppercase animate-pulse">
        <Eye className="w-3.5 h-3.5 text-white" />
        <span>Spectral Vision Active · [V] to Toggle</span>
      </div>
    </>
  );
};
