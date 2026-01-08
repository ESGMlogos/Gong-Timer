import { GongType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private reverbBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      // Create context with Safari support fallback
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.pinkNoiseBuffer) return this.pinkNoiseBuffer;

    const duration = 2; 
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; 
      b6 = white * 0.115926;
    }

    this.pinkNoiseBuffer = buffer;
    return buffer;
  }

  private getReverbBuffer(ctx: AudioContext): AudioBuffer {
    if (this.reverbBuffer) return this.reverbBuffer;

    const duration = 4.5; 
    const decay = 2.0;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const fade = Math.pow(1 - n, decay); 
      left[i] = (Math.random() * 2 - 1) * fade;
      right[i] = (Math.random() * 2 - 1) * fade;
    }

    this.reverbBuffer = impulse;
    return impulse;
  }

  /**
   * MANTRA (OHM) - SOURCE-FILTER THEORY IMPLEMENTATION
   * Gain Reduced to prevent clipping
   */
  private playMantraSound(ctx: AudioContext, t: number, outputNode: AudioNode) {
    const duration = 14.0; 
    const f0 = 70.0; 

    // --- I. THE SOURCE ---
    const glottis = ctx.createOscillator();
    glottis.type = 'sawtooth';
    glottis.frequency.value = f0;

    const glottalFilter = ctx.createBiquadFilter();
    glottalFilter.type = 'lowpass';
    glottalFilter.frequency.value = 1800; 
    glottalFilter.Q.value = 0.5;

    const vocalFry = ctx.createOscillator();
    vocalFry.type = 'square'; 
    vocalFry.frequency.value = f0 / 2; 
    const fryGain = ctx.createGain();
    fryGain.gain.value = 0.08; // Reduced from 0.15

    const breath = ctx.createBufferSource();
    breath.buffer = this.getPinkNoiseBuffer(ctx);
    breath.loop = true;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.02; // Reduced from 0.04

    const jitter = ctx.createOscillator();
    jitter.frequency.value = 5.0; 
    const jitterAmp = ctx.createGain();
    jitterAmp.gain.value = 0.6; 
    jitter.connect(jitterAmp);
    jitterAmp.connect(glottis.frequency);
    jitterAmp.connect(vocalFry.frequency);

    const sourceMix = ctx.createGain();
    glottis.connect(glottalFilter);
    glottalFilter.connect(sourceMix);
    vocalFry.connect(fryGain);
    fryGain.connect(sourceMix);
    breath.connect(breathGain);
    breathGain.connect(sourceMix);

    // --- II. THE FILTER ---
    const attack = 2.0;
    const holdO = 4.0;
    const morphTime = 3.0;

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 3.5; 
    f1.frequency.setValueAtTime(400, t);
    f1.frequency.setValueAtTime(400, t + attack + holdO);
    f1.frequency.exponentialRampToValueAtTime(250, t + attack + holdO + morphTime);
    const f1Gain = ctx.createGain();
    f1Gain.gain.value = 0.5; // Reduced from 1.0

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 4.0;
    f2.frequency.setValueAtTime(800, t);
    f2.frequency.setValueAtTime(800, t + attack + holdO);
    f2.frequency.exponentialRampToValueAtTime(300, t + attack + holdO + morphTime);
    
    const f2Gain = ctx.createGain();
    f2Gain.gain.setValueAtTime(0.4, t); // Reduced from 0.8
    f2Gain.gain.setValueAtTime(0.4, t + attack + holdO);
    f2Gain.gain.linearRampToValueAtTime(0.05, t + attack + holdO + morphTime); 

    const f3 = ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.frequency.value = 2800;
    f3.Q.value = 2.0;
    const f3Gain = ctx.createGain();
    f3Gain.gain.setValueAtTime(0.08, t); // Reduced from 0.15
    f3Gain.gain.linearRampToValueAtTime(0, t + attack + holdO + morphTime); 

    const nasalOcclusion = ctx.createBiquadFilter();
    nasalOcclusion.type = 'lowpass';
    nasalOcclusion.Q.value = 0.6; 
    nasalOcclusion.frequency.setValueAtTime(5000, t); 
    nasalOcclusion.frequency.setValueAtTime(5000, t + attack + holdO);
    nasalOcclusion.frequency.exponentialRampToValueAtTime(300, t + attack + holdO + morphTime);

    sourceMix.connect(f1); f1.connect(f1Gain);
    sourceMix.connect(f2); f2.connect(f2Gain);
    sourceMix.connect(f3); f3.connect(f3Gain);

    const tractOutput = ctx.createGain();
    f1Gain.connect(tractOutput);
    f2Gain.connect(tractOutput);
    f3Gain.connect(tractOutput);

    tractOutput.connect(nasalOcclusion);

    const masterEnv = ctx.createGain();
    masterEnv.gain.setValueAtTime(0, t);
    masterEnv.gain.linearRampToValueAtTime(0.5, t + attack); // Reduced from 0.9
    masterEnv.gain.setValueAtTime(0.5, t + attack + holdO);
    masterEnv.gain.linearRampToValueAtTime(0.4, t + attack + holdO + morphTime);
    masterEnv.gain.exponentialRampToValueAtTime(0.001, t + duration);

    nasalOcclusion.connect(masterEnv);
    masterEnv.connect(outputNode);

    glottis.start(t);
    vocalFry.start(t);
    breath.start(t);
    jitter.start(t);

    glottis.stop(t + duration + 1);
    vocalFry.stop(t + duration + 1);
    breath.stop(t + duration + 1);
    jitter.stop(t + duration + 1);
  }

  /**
   * BONSHO (Buddhist Bell) - REALISTIC SIMULATION
   * Gain Reduced to prevent clipping
   */
  private playBonshoSound(ctx: AudioContext, t: number, outputNode: AudioNode) {
    const f0 = 54.0; 
    const fSchumann = 7.83; 
    const beatDetune = fSchumann / 2.0; 

    // 1. THE STRIKE
    const strikeNoise = ctx.createBufferSource();
    strikeNoise.buffer = this.getPinkNoiseBuffer(ctx);
    const strikeFilter = ctx.createBiquadFilter();
    strikeFilter.type = 'lowpass';
    strikeFilter.frequency.value = 300; 
    strikeFilter.Q.value = 1.0;
    const strikeEnv = ctx.createGain();
    strikeEnv.gain.setValueAtTime(0, t);
    strikeEnv.gain.linearRampToValueAtTime(0.4, t + 0.005); // Reduced from 1.0
    strikeEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    strikeNoise.connect(strikeFilter);
    strikeFilter.connect(strikeEnv);
    strikeEnv.connect(outputNode);
    strikeNoise.start(t);
    strikeNoise.stop(t + 1.0);

    // 2. THE METAL ATTACK
    const metalNoise = ctx.createBufferSource();
    metalNoise.buffer = this.getPinkNoiseBuffer(ctx);
    const metalFilter = ctx.createBiquadFilter();
    metalFilter.type = 'bandpass';
    metalFilter.frequency.value = 600;
    metalFilter.Q.value = 2.0;
    const metalEnv = ctx.createGain();
    metalEnv.gain.setValueAtTime(0, t);
    metalEnv.gain.linearRampToValueAtTime(0.15, t + 0.01); // Reduced from 0.3
    metalEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    metalNoise.connect(metalFilter);
    metalFilter.connect(metalEnv);
    metalEnv.connect(outputNode);
    metalNoise.start(t);
    metalNoise.stop(t + 1.0);

    // 3. THE RESONANCE
    const modes = [
        { r: 1.0, a: 0.8, d: 25.0, spread: true }, 
        { r: 1.25, a: 0.4, d: 18.0, spread: false }, 
        { r: 1.5, a: 0.3, d: 15.0, spread: false }, 
        { r: 2.0, a: 0.2, d: 12.0, spread: false }, 
        { r: 2.6, a: 0.15, d: 8.0, spread: false }, 
        { r: 3.2, a: 0.1, d: 6.0, spread: false }, 
        { r: 4.5, a: 0.05, d: 4.0, spread: false }  
    ];

    modes.forEach((mode, i) => {
        const freq = f0 * mode.r;
        const gainScale = 0.5; // Global scaler for modes

        if (mode.spread) {
            const leftOsc = ctx.createOscillator();
            leftOsc.frequency.value = freq - beatDetune;
            const leftPan = ctx.createStereoPanner();
            leftPan.pan.value = -0.6;
            const leftGain = ctx.createGain();

            const rightOsc = ctx.createOscillator();
            rightOsc.frequency.value = freq + beatDetune;
            const rightPan = ctx.createStereoPanner();
            rightPan.pan.value = 0.6;
            const rightGain = ctx.createGain();

            const attackTime = 0.2; 
            [leftGain, rightGain].forEach(g => {
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime((mode.a * 0.6) * gainScale, t + attackTime);
                g.gain.exponentialRampToValueAtTime(0.001, t + mode.d);
            });

            leftOsc.connect(leftGain); leftGain.connect(leftPan); leftPan.connect(outputNode);
            rightOsc.connect(rightGain); rightGain.connect(rightPan); rightPan.connect(outputNode);
            leftOsc.start(t); rightOsc.start(t);
            leftOsc.stop(t + mode.d + 1); rightOsc.stop(t + mode.d + 1);

        } else {
            const osc = ctx.createOscillator();
            osc.frequency.value = freq;
            osc.frequency.value += (Math.random() * 1.5 - 0.75);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            const attack = 0.05 + (1 / mode.r) * 0.1; 
            gain.gain.linearRampToValueAtTime(mode.a * gainScale, t + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, t + mode.d);
            osc.connect(gain);
            gain.connect(outputNode);
            osc.start(t);
            osc.stop(t + mode.d + 1);
        }
    });
  }

  /**
   * DORA (Traditional Gong) - RE-ENGINEERED FROM SCRATCH
   * Heavy Gain Reduction to prevent clipping
   */
  private playDoraSound(ctx: AudioContext, t: number, outputNode: AudioNode) {
    const f0 = 100; 

    // --- STEP 4.3: CHARACTERISTIC EQ ---
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 80;
    eqLow.gain.value = -3;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 2000;
    eqMid.Q.value = 1.5;
    eqMid.gain.value = 3; // Reduced from 6dB

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'peaking';
    eqHigh.frequency.value = 5000;
    eqHigh.Q.value = 3.0;
    eqHigh.gain.value = -2;

    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(outputNode);
    
    const mixBus = eqLow; 

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1.5; 
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15; 
    lfo.connect(lfoGain);
    lfo.start(t);
    lfo.stop(t + 15);

    // --- FUNDAMENTALS & BEATINGS ---
    const beatings = [f0 * 1.001, f0 * 0.999];
    
    beatings.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        lfoGain.connect(osc.detune); 

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.25, t + 0.005); // Reduced from 0.7
        env.gain.exponentialRampToValueAtTime(0.001, t + 8.0);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + 8.0);
    });

    // --- INHARMONIC PARTIALS ---
    const partialsData = [
        { r: 2.76, decay: 6.5, amp: 0.5 },
        { r: 4.32, decay: 5.0, amp: 0.8 },
        { r: 5.89, decay: 3.5, amp: 0.6 },
        { r: 7.41, decay: 2.0, amp: 0.4 },
        { r: 8.93, decay: 1.0, amp: 0.3 },
        { r: 10.12, decay: 0.5, amp: 0.2 }
    ];

    const partialsScale = 0.3; // Global scale for partials

    partialsData.forEach(p => {
        const osc = ctx.createOscillator();
        osc.frequency.value = f0 * p.r;
        lfoGain.connect(osc.detune);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(p.amp * partialsScale, t + 0.01); 
        env.gain.exponentialRampToValueAtTime(0.001, t + p.decay);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + p.decay);
    });

    // --- METALLIC ATTACK ---
    const noise = ctx.createBufferSource();
    noise.buffer = this.getPinkNoiseBuffer(ctx);
    
    const attackFilter = ctx.createBiquadFilter();
    attackFilter.type = 'bandpass';
    attackFilter.frequency.value = 2000;
    attackFilter.Q.value = 2.0;

    const attackEnv = ctx.createGain();
    attackEnv.gain.setValueAtTime(0, t);
    attackEnv.gain.linearRampToValueAtTime(0.4, t + 0.001); // Reduced from 1.2
    attackEnv.gain.linearRampToValueAtTime(0, t + 0.051);

    noise.connect(attackFilter);
    attackFilter.connect(attackEnv);
    attackEnv.connect(mixBus);
    noise.start(t);
    noise.stop(t + 0.1);

    // --- BLOOM PHASE ---
    const bloomData = [
        { r: 1.58 },
        { r: 3.21 }
    ];
    
    bloomData.forEach(b => {
        const osc = ctx.createOscillator();
        osc.frequency.value = f0 * b.r;
        lfoGain.connect(osc.detune);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.2, t + 0.3); // Reduced from 0.6
        env.gain.exponentialRampToValueAtTime(0.001, t + 6.0);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + 6.0);
    });
  }

  /**
   * TIBETAN SINGING BOWL (Cuenco Tibetano)
   * Gain Reduced
   */
  private playTibetanBowlSound(ctx: AudioContext, t: number, outputNode: AudioNode) {
    const f0 = 262.0; 

    const panner = ctx.createStereoPanner();
    const rotLfo = ctx.createOscillator();
    rotLfo.frequency.value = 0.2; 
    const rotGain = ctx.createGain();
    rotGain.gain.value = 0.5; 
    
    rotLfo.connect(rotGain);
    rotGain.connect(panner.pan);
    rotLfo.start(t);
    rotLfo.stop(t + 30);
    
    panner.connect(outputNode);
    const mixBus = panner;

    // --- MALLET ATTACK ---
    const strikeNoise = ctx.createBufferSource();
    strikeNoise.buffer = this.getPinkNoiseBuffer(ctx);
    
    const strikeFilter = ctx.createBiquadFilter();
    strikeFilter.type = 'lowpass';
    strikeFilter.frequency.value = 800; 
    strikeFilter.Q.value = 1.0;

    const strikeEnv = ctx.createGain();
    strikeEnv.gain.setValueAtTime(0, t);
    strikeEnv.gain.linearRampToValueAtTime(0.25, t + 0.01); // Reduced from 0.6
    strikeEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    strikeNoise.connect(strikeFilter);
    strikeFilter.connect(strikeEnv);
    strikeEnv.connect(mixBus);
    strikeNoise.start(t);
    strikeNoise.stop(t + 0.5);

    // --- HARMONIC MODES ---
    const modes = [
        { r: 1.0, amp: 1.0, decay: 25.0 }, 
        { r: 1.5, amp: 0.7, decay: 20.0 }, 
        { r: 2.0, amp: 0.5, decay: 15.0 }, 
        { r: 2.5, amp: 0.3, decay: 12.0 }, 
        { r: 3.0, amp: 0.2, decay: 10.0 }, 
        { r: 4.0, amp: 0.1, decay: 8.0 }   
    ];

    const modeScale = 0.35; // Global scaler

    modes.forEach(mode => {
        const osc = ctx.createOscillator();
        const detune = 1.0 + (Math.random() - 0.5) * 0.002; 
        osc.frequency.value = f0 * mode.r * detune;

        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 3.5; 
        const vibGain = ctx.createGain();
        vibGain.gain.value = 2; 
        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);
        vibrato.start(t);
        vibrato.stop(t + mode.decay);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);

        const attackTime = 0.05 + (1/mode.r) * 0.1; 
        
        env.gain.linearRampToValueAtTime(mode.amp * modeScale, t + attackTime);
        env.gain.exponentialRampToValueAtTime(0.001, t + mode.decay);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + mode.decay + 1);
    });
  }

  public playGong(type: GongType) {
    const ctx = this.getContext();
    const t = ctx.currentTime;

    // --- OUTPUT LIMITER ---
    // Protects speakers from clipping by soft-clipping high peaks
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1; // Start compressing at -1dB
    limiter.knee.value = 10;      // Soft knee
    limiter.ratio.value = 12;     // High ratio acting like a limiter
    limiter.attack.value = 0.005; 
    limiter.release.value = 0.25;
    limiter.connect(ctx.destination);

    // --- GLOBAL BUS ---
    const masterBus = ctx.createGain();
    masterBus.connect(limiter);
    
    // --- REVERB (Sacred Space) ---
    const convolver = ctx.createConvolver();
    convolver.buffer = this.getReverbBuffer(ctx);
    const reverbMix = ctx.createGain();
    reverbMix.gain.value = (type === GongType.BONSHO || type === GongType.DORA || type === GongType.TIBETAN) ? 0.65 : 0.5;
    masterBus.connect(convolver);
    convolver.connect(reverbMix);
    reverbMix.connect(limiter);

    // --- SOUND GENERATION STRATEGIES ---

    if (type === GongType.MANTRA) {
      this.playMantraSound(ctx, t, masterBus);
      return;
    }

    if (type === GongType.BONSHO) {
      this.playBonshoSound(ctx, t, masterBus);
      return;
    }

    if (type === GongType.DORA) {
      this.playDoraSound(ctx, t, masterBus);
      return;
    }

    if (type === GongType.TIBETAN) {
      this.playTibetanBowlSound(ctx, t, masterBus);
      return;
    }

    // Common Envelope for Standard Gongs
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(0.4, t + 0.05); // Reduced from 0.8

    // Logic for DEEP, BRIGHT, ETHEREAL
    let fundamentals: number[] = [];
    let decayTime = 4;

    switch (type) {
      case GongType.DEEP:
        fundamentals = [54, 136.1]; 
        decayTime = 10;
        envelope.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
        break;
        
      case GongType.BRIGHT:
        fundamentals = [432, 528]; 
        decayTime = 3;
        envelope.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
        break;
        
      case GongType.ETHEREAL:
        fundamentals = [216];
        decayTime = 6;
        envelope.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
        break;
    }

    envelope.connect(masterBus);

    // Synthesis Loop
    fundamentals.forEach(fund => {
      [1, 2, 3, 5].forEach(h => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        const freq = fund * h;
        osc.frequency.value = freq;
        
        if (type === GongType.ETHEREAL && h === 1) {
           // Left Ear
           const oscL = ctx.createOscillator();
           oscL.frequency.value = freq;
           const panL = ctx.createStereoPanner();
           panL.pan.value = -0.5;
           
           // Right Ear
           const oscR = ctx.createOscillator();
           oscR.frequency.value = freq + 40; 
           const panR = ctx.createStereoPanner();
           panR.pan.value = 0.5;

           oscL.connect(oscGain);
           oscR.connect(oscGain);
           oscL.start(t); oscR.start(t);
           oscL.stop(t + decayTime); oscR.stop(t + decayTime);
           
        } else {
           osc.type = h === 1 ? 'sine' : 'triangle';
           osc.connect(oscGain);
           osc.start(t);
           osc.stop(t + decayTime);
        }

        const amplitude = 1 / Math.pow(h, 1.618);
        oscGain.gain.value = amplitude;

        oscGain.connect(envelope);
      });
    });
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioService = new AudioService();