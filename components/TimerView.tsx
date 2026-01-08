import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Routine, TimerStep } from '../types';
import { audioService } from '../services/audioService';
import { Play, Pause, X, SkipForward, Check } from 'lucide-react';

interface TimerViewProps {
  routine: Routine;
  onExit: () => void;
}

const TimerView: React.FC<TimerViewProps> = ({ routine, onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(routine.steps[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  const currentStep = routine.steps[currentStepIndex];
  const nextStep = routine.steps[currentStepIndex + 1];

  // Initialize sound on mount
  useEffect(() => {
    // Play the starting gong
    audioService.playGong(currentStep.gongType);
    setIsRunning(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0 && !isCompleted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isCompleted) {
      // Step finished
      if (currentStepIndex < routine.steps.length - 1) {
        // Next step
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        const next = routine.steps[nextIndex];
        setTimeLeft(next.duration);
        audioService.playGong(next.gongType);
      } else {
        // Routine finished
        setIsRunning(false);
        audioService.playGong(currentStep.gongType); // Final gong
        setIsCompleted(true); // Trigger Success View
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentStepIndex, routine.steps, currentStep.gongType, isCompleted]);

  // D3 Visualization for Progress Circle
  useEffect(() => {
    if (!svgRef.current || isCompleted) return;

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    // Clear previous
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Background Circle
    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#e7e5e4') // stone-200
      .attr('stroke-width', 12);

    // Progress Arc
    const totalDuration = currentStep.duration;
    const progress = (totalDuration - timeLeft) / totalDuration;
    
    const arc = d3.arc()
      .innerRadius(radius - 12)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI * progress)
      .cornerRadius(6);

    g.append('path')
      .attr('d', arc as any)
      .attr('fill', '#78716c'); // stone-500
      
  }, [timeLeft, currentStep.duration, isCompleted]);

  const togglePause = () => {
    setIsRunning(!isRunning);
    audioService.resume();
  };

  const skipStep = () => {
    setTimeLeft(0); // Triggers useEffect to go next
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- GEOMETRY GENERATION ---
  // Generates paths that look like vibrating strings with sharp peaks (non-differentiable points)
  const generateStringWave = (radius: number, peaks: number, amplitude: number) => {
    const points = [];
    const steps = 500; 
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      // Formula: r = R + A * (1 - |sin(k*theta)|)
      // This creates the "bouncing" wave effect with sharp cusps
      const r = radius + amplitude * (1 - Math.abs(Math.sin(theta * (peaks / 2)))); 
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  // Memoize geometry to prevent recalculation
  const sacredGeometry = useMemo(() => {
    return {
      // The sharp wave strings
      stringWave1: generateStringWave(60, 12, 10),
      stringWave2: generateStringWave(60, 8, 15),
      stringWave3: generateStringWave(60, 6, 5),
    };
  }, []);

  // --- SUCCESS VIEW ---
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#fafaf9]">
        
        {/* 1. BACKGROUND LAYER - Subtle Breathing */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-stone-100 to-orange-50/20 animate-[breathe_8s_ease-in-out_infinite]" />

        {/* 2. ANIMATION LAYER - Expanding from Center */}
        {/* Centered exactly where the timer was */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <g transform="translate(100, 100)">
              
              {/* SUBLIMINAL GEOMETRY (Fixed rotation, subtle) */}
              <g className="opacity-[0.05] animate-[spinSlow_60s_linear_infinite]">
                 {/* Hexagonal Lattice representation */}
                 <path d="M0 -80 L69 -40 L69 40 L0 80 L-69 40 L-69 -40 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                 <circle r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                 <path d="M0 -80 L0 80 M69 -40 L-69 40 M69 40 L-69 -40" stroke="currentColor" strokeWidth="0.5" />
              </g>

              {/* EXPANDING WAVES (The "Strings") */}
              {/* These start small and expand outward to infinity while fading */}
              
              {[0, 1, 2, 3].map((i) => (
                <path 
                  key={i}
                  d={sacredGeometry.stringWave1} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5" 
                  className="text-stone-400 opacity-0 animate-[expandAndFade_5s_cubic-bezier(0,0,0.2,1)_infinite]"
                  style={{ animationDelay: `${i * 1.2}s` }}
                />
              ))}

              {[0, 1, 2].map((i) => (
                <path 
                  key={`b-${i}`}
                  d={sacredGeometry.stringWave2} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.3" 
                  className="text-stone-500 opacity-0 animate-[expandAndFade_7s_cubic-bezier(0,0,0.2,1)_infinite]"
                  style={{ animationDelay: `${0.5 + i * 2}s` }}
                />
              ))}

            </g>
          </svg>
        </div>

        {/* 3. STATIC UI LAYER - Fixed Content */}
        {/* These elements do not move with the waves, providing the anchor */}
        <div className="z-10 flex flex-col items-center justify-center relative">
           
           {/* Static Central Icon */}
           <div className="mb-10 p-8 rounded-full bg-white/80 backdrop-blur-sm border border-stone-100 shadow-xl">
             <Check size={48} className="text-stone-800" strokeWidth={2} />
           </div>
           
           {/* Static Text */}
           <h1 className="text-6xl md:text-8xl font-serif text-stone-800 tracking-[0.2em] mb-4 font-bold drop-shadow-sm">
             ¡Exito!
           </h1>
           
           <div className="w-12 h-px bg-stone-400 mb-6"></div>

           <p className="text-stone-500 text-sm tracking-[0.4em] uppercase mb-16">
             Routine Complete
           </p>

           {/* Static Button */}
           <button 
             onClick={onExit}
             className="px-12 py-4 bg-stone-800 text-stone-50 text-lg font-serif rounded hover:bg-stone-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-300"
           >
             Finish
           </button>
        </div>

        {/* ANIMATIONS */}
        <style>{`
          @keyframes breathe {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes expandAndFade {
            0% { 
              transform: scale(0.8); 
              opacity: 0; 
              stroke-width: 1;
            }
            15% {
              opacity: 0.6;
            }
            100% { 
              transform: scale(8); /* Expands way off screen */
              opacity: 0; 
              stroke-width: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // --- ACTIVE TIMER VIEW ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 text-stone-800 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/white-marble.png')` }}>
      </div>

      <button 
        onClick={onExit} 
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-200 transition-colors"
      >
        <X size={24} className="text-stone-600" />
      </button>

      <div className="z-10 text-center mb-8">
        <h2 className="text-3xl font-serif text-stone-700 mb-2 tracking-wide">{routine.name}</h2>
        <p className="text-stone-500 italic">Step {currentStepIndex + 1} of {routine.steps.length}</p>
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <svg ref={svgRef} className="transform -rotate-90 shadow-2xl rounded-full bg-stone-50 border-4 border-stone-100" />
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-light text-stone-800 tabular-nums">
            {formatTime(timeLeft)}
          </span>
          <span className="text-stone-500 mt-2 font-serif text-lg tracking-wider uppercase">
            {currentStep.name}
          </span>
        </div>
      </div>

      <div className="z-10 mt-12 flex gap-8 items-center">
        <button 
          onClick={togglePause}
          className="w-20 h-20 flex items-center justify-center bg-stone-800 text-stone-100 rounded-full shadow-lg hover:bg-stone-700 transition-all hover:scale-105 active:scale-95"
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        
        <button 
          onClick={skipStep}
          className="w-14 h-14 flex items-center justify-center bg-stone-200 text-stone-600 rounded-full hover:bg-stone-300 transition-colors"
        >
          <SkipForward size={24} />
        </button>
      </div>

      <div className="z-10 mt-8 h-12">
        {nextStep && (
          <div className="text-stone-400 text-sm animate-pulse">
            Up Next: <span className="font-semibold text-stone-600">{nextStep.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerView;