import React, { useEffect, useRef } from 'react';

interface Props {
  visibility: number; // 0.0 to 1.0 (opacity of dining room)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  text?: string;
}

export const LivingDiningSpirits: React.FC<Props> = ({ visibility }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visRef = useRef(visibility);
  visRef.current = visibility;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pools for spirits (pure black, grey, white palette)
    const radiumParticles: Particle[] = [];
    const teslaSparks: Particle[] = [];
    const einsteinSymbols = ['E=mc²', 'λ', 'ℏ', 'g_μν', 'c', 'dt'];
    const einsteinParticles: Particle[] = [];
    const poetryParticles: Particle[] = [];

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const alpha = visRef.current;
      if (alpha < 0.1) {
        animId = requestAnimationFrame(render);
        return;
      }

      /* ========================================================
         1. MARIE CURIE'S RADIANT FLASK (Pure Silver-White)
         ======================================================== */
      const curieFlaskX = width * 0.735;
      const curieFlaskY = height * 0.585;

      const flaskPulse = 0.85 + 0.15 * Math.sin(time * 3.8);
      const curieGrad = ctx.createRadialGradient(
        curieFlaskX,
        curieFlaskY,
        2,
        curieFlaskX,
        curieFlaskY,
        42 * flaskPulse
      );
      curieGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * alpha})`);
      curieGrad.addColorStop(0.35, `rgba(210, 215, 225, ${0.4 * alpha})`);
      curieGrad.addColorStop(1, 'rgba(210, 215, 225, 0)');

      ctx.fillStyle = curieGrad;
      ctx.beginPath();
      ctx.arc(curieFlaskX, curieFlaskY, 42 * flaskPulse, 0, Math.PI * 2);
      ctx.fill();

      // Silver motes rising
      if (Math.random() < 0.45) {
        radiumParticles.push({
          x: curieFlaskX + (Math.random() - 0.5) * 14,
          y: curieFlaskY - 4,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.8 - Math.random() * 1.3,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.9 * alpha,
        });
      }
      for (let i = radiumParticles.length - 1; i >= 0; i--) {
        const p = radiumParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.96;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.alpha < 0.02) radiumParticles.splice(i, 1);
      }

      /* ========================================================
         2. NIKOLA TESLA'S WHITE ELECTRIC ARCS & SPARKS
         ======================================================== */
      const teslaX = width * 0.875;
      const teslaY = height * 0.64;

      // Pure brilliant white electrical arcs
      if (Math.random() < 0.3) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
        ctx.lineWidth = 1.3;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        let cx = teslaX - 25 + Math.random() * 10;
        let cy = teslaY - 10 + Math.random() * 10;
        ctx.moveTo(cx, cy);
        for (let j = 0; j < 4; j++) {
          cx += (Math.random() - 0.5) * 18;
          cy += (Math.random() - 0.5) * 18;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Pure white spark motes
      if (Math.random() < 0.32) {
        teslaSparks.push({
          x: teslaX + (Math.random() - 0.5) * 35,
          y: teslaY + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2,
          size: 1.2 + Math.random() * 1.8,
          alpha: 1.0 * alpha,
        });
      }
      for (let i = teslaSparks.length - 1; i >= 0; i--) {
        const s = teslaSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha *= 0.91;
        ctx.fillStyle = `rgba(240, 245, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (s.alpha < 0.02) teslaSparks.splice(i, 1);
      }

      /* ========================================================
         3. ALBERT EINSTEIN'S EQUATION PARTICLES (Monochrome Silver)
         ======================================================== */
      const einX = width * 0.395;
      const einY = height * 0.63;

      if (Math.random() < 0.08) {
        einsteinParticles.push({
          x: einX + (Math.random() - 0.5) * 35,
          y: einY - 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6 - Math.random() * 0.8,
          text: einsteinSymbols[Math.floor(Math.random() * einsteinSymbols.length)],
          size: 13,
          alpha: 0.85 * alpha,
        });
      }
      ctx.save();
      ctx.font = '13px "Cormorant Garamond", Georgia, serif';
      for (let i = einsteinParticles.length - 1; i >= 0; i--) {
        const ep = einsteinParticles[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.alpha *= 0.97;
        ctx.fillStyle = `rgba(240, 240, 245, ${ep.alpha})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 6;
        if (ep.text) ctx.fillText(ep.text, ep.x, ep.y);
        if (ep.alpha < 0.02) einsteinParticles.splice(i, 1);
      }
      ctx.restore();

      /* ========================================================
         4. WILLIAM SHAKESPEARE'S SILVER POETIC INK
         ======================================================== */
      const shakX = width * 0.605;
      const shakY = height * 0.63;

      if (Math.random() < 0.35) {
        poetryParticles.push({
          x: shakX + (Math.random() - 0.5) * 22,
          y: shakY + 14 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.4 - Math.random() * 0.7,
          size: 1.2 + Math.random() * 2,
          alpha: 0.8 * alpha,
        });
      }
      for (let i = poetryParticles.length - 1; i >= 0; i--) {
        const pp = poetryParticles[i];
        pp.x += pp.vx;
        pp.y += pp.vy;
        pp.alpha *= 0.96;
        ctx.fillStyle = `rgba(225, 230, 240, ${pp.alpha})`;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, pp.size, 0, Math.PI * 2);
        ctx.fill();
        if (pp.alpha < 0.02) poetryParticles.splice(i, 1);
      }

      /* ========================================================
         5. CLEOPATRA'S SILVER-WHITE AURA
         ======================================================== */
      const cleoX = width * 0.165;
      const cleoY = height * 0.62;
      const cleoPulse = 0.85 + 0.15 * Math.sin(time * 2.3);
      const cleoGrad = ctx.createRadialGradient(
        cleoX,
        cleoY,
        4,
        cleoX,
        cleoY,
        45 * cleoPulse
      );
      cleoGrad.addColorStop(0, `rgba(255, 255, 255, ${0.45 * alpha})`);
      cleoGrad.addColorStop(0.5, `rgba(200, 205, 215, ${0.2 * alpha})`);
      cleoGrad.addColorStop(1, 'rgba(200, 205, 215, 0)');
      ctx.fillStyle = cleoGrad;
      ctx.beginPath();
      ctx.arc(cleoX, cleoY, 45 * cleoPulse, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-25"
      aria-hidden="true"
    />
  );
};
