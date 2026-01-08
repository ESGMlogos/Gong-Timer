import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';
import { GongType } from '../types';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Attempt to play the Ohm Mantra sound on mount
    // Note: Browser autoplay policies might block this until user interaction.
    // Tapping the screen (handled in the div onClick) can help resume it.
    audioService.playGong(GongType.MANTRA);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Handle resizing
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // --- Animation Configuration ---
    const PHI = (1 + Math.sqrt(5)) / 2; 
    const particleCount = 200; // Increased density for more definition
    const maxRadius = Math.max(width, height) * 0.9; 
    const planetRadius = 85; 
    
    const lines = Array.from({ length: particleCount }).map((_, i) => {
        const theta = 2 * Math.PI * i * (1/PHI); 
        return {
            angle: theta,
            radius: maxRadius + Math.random() * 300, 
            speed: (0.02 + Math.random() * 0.03) * (i % 2 === 0 ? 1 : -1),
            width: Math.random() * 2 + 1, // Thicker lines for stronger look
            length: Math.random() * 0.5 + 0.1,
            hue: 30 + Math.random() * 15 // Bronze/Gold/Brown hues
        };
    });

    let startTime = Date.now();
    const duration = 3500; 
    const holdTime = 1200;

    const render = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Light background fade (Bone color) to create trails
      ctx.fillStyle = 'rgba(250, 250, 249, 0.25)'; 
      ctx.fillRect(0, 0, width, height);

      if (elapsed > duration + holdTime + 1000) return;

      const rawProgress = Math.min(elapsed / duration, 1);
      // Ease Out Expo
      const ease = rawProgress === 1 ? 1 : 1 - Math.pow(2, -10 * rawProgress);
      
      const cx = width / 2;
      const cy = height / 2;

      // Normal blending for "Ink on Paper" look
      ctx.globalCompositeOperation = 'source-over';

      lines.forEach(p => {
        p.angle += p.speed;
        const currentRadius = p.radius - ((p.radius - planetRadius) * ease);
        
        ctx.beginPath();
        const arcLen = p.length + (ease * 0.5); // Lines lengthen as they form the sphere
        ctx.arc(cx, cy, currentRadius, p.angle, p.angle + arcLen);
        
        // Color Physics (Light Theme):
        // Start: Faint/Light (70% lightness)
        // End: Dark/Strong (20% lightness)
        const alpha = 0.3 + (ease * 0.7);
        const lightness = 70 - (ease * 50); 
        
        ctx.strokeStyle = `hsla(${p.hue}, 40%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = p.width;
        ctx.stroke();
      });

      // Stronger Planet Definition (The "More Marked" look)
      if (ease > 0.8) {
          const coreOpacity = (ease - 0.8) * 5; // Fades in quickly at the end
          
          // Outer Ring to define the planet boundary
          ctx.beginPath();
          ctx.arc(cx, cy, planetRadius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(68, 64, 60, ${coreOpacity * 0.6})`; // stone-700
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner subtle solid fill to give it mass
          ctx.beginPath();
          ctx.arc(cx, cy, planetRadius - 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(231, 229, 228, ${coreOpacity * 0.4})`; // stone-200
          ctx.fill();
      }

      if (elapsed < duration + holdTime) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setOpacity(0);
        setTimeout(onComplete, 1200);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  const handleInteraction = () => {
    // Helps unlock audio context on mobile if user taps during load
    audioService.resume();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#fafaf9] transition-opacity duration-1000 flex items-center justify-center overflow-hidden"
      style={{ opacity }}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Title: Darker, Bolder, Stronger */}
      <div 
        className="absolute z-10 text-stone-900 font-serif text-4xl md:text-6xl tracking-[0.3em] uppercase opacity-0 animate-[fadeIn_1.0s_ease-out_2.0s_forwards] font-bold"
        style={{ textShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        Gong Timer
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); filter: blur(2px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;