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
    fryGain.gain.value = 0.15; 

    const breath = ctx.createBufferSource();
    breath.buffer = this.getPinkNoiseBuffer(ctx);
    breath.loop = true;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.04;

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
    f1Gain.gain.value = 1.0;

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 4.0;
    f2.frequency.setValueAtTime(800, t);
    f2.frequency.setValueAtTime(800, t + attack + holdO);
    f2.frequency.exponentialRampToValueAtTime(300, t + attack + holdO + morphTime);
    
    const f2Gain = ctx.createGain();
    f2Gain.gain.setValueAtTime(0.8, t);
    f2Gain.gain.setValueAtTime(0.8, t + attack + holdO);
    f2Gain.gain.linearRampToValueAtTime(0.1, t + attack + holdO + morphTime); 

    const f3 = ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.frequency.value = 2800;
    f3.Q.value = 2.0;
    const f3Gain = ctx.createGain();
    f3Gain.gain.setValueAtTime(0.15, t);
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
    masterEnv.gain.linearRampToValueAtTime(0.9, t + attack);
    masterEnv.gain.setValueAtTime(0.9, t + attack + holdO);
    masterEnv.gain.linearRampToValueAtTime(0.7, t + attack + holdO + morphTime);
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
    strikeEnv.gain.linearRampToValueAtTime(1.0, t + 0.005);
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
    metalEnv.gain.linearRampToValueAtTime(0.3, t + 0.01);
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
                g.gain.linearRampToValueAtTime(mode.a * 0.6, t + attackTime);
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
            gain.gain.linearRampToValueAtTime(mode.a, t + attack);
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
   * Follows strict Step-by-Step guide for acoustics.
   * f0 = 100Hz
   */
  private playDoraSound(ctx: AudioContext, t: number, outputNode: AudioNode) {
    const f0 = 100; // Hz - Step 1.1

    // --- STEP 4.3: CHARACTERISTIC EQ ---
    // bands = [(80, -3), (2000, 6, Q1.5), (5000, -2, Q3.0)]
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 80;
    eqLow.gain.value = -3;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 2000;
    eqMid.Q.value = 1.5;
    eqMid.gain.value = 6;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'peaking';
    eqHigh.frequency.value = 5000;
    eqHigh.Q.value = 3.0;
    eqHigh.gain.value = -2;

    // Chain EQ: Source -> Low -> Mid -> High -> Output
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(outputNode);
    
    // All components mix into the start of the EQ chain
    const mixBus = eqLow; 

    // --- STEP 3.2: NATURAL VIBRATO (LFO) ---
    // Frequency: 1.5 Hz
    // Depth: 0.003 (0.3% of f0)
    // Applied via Detune (approx 5-15 cents to match perception)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1.5; 
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15; // Cents
    lfo.connect(lfoGain);
    lfo.start(t);
    lfo.stop(t + 15);

    // --- STEP 1.1 & 4.1: FUNDAMENTALS & BEATINGS ---
    // Osc1: f0 * 1.001 (0.7 amp)
    // Osc2: f0 * 0.999 (0.7 amp - approximates the beating)
    const beatings = [f0 * 1.001, f0 * 0.999];
    
    beatings.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        lfoGain.connect(osc.detune); // Apply Vibrato

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        // Attack 0.001s implied, but we use 0.005 for click prevention
        env.gain.linearRampToValueAtTime(0.7, t + 0.005); 
        // Decay 8.0s
        env.gain.exponentialRampToValueAtTime(0.001, t + 8.0);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + 8.0);
    });

    // --- STEP 1.2 & 3.1: INHARMONIC PARTIALS ---
    const partialsData = [
        { r: 2.76, decay: 6.5, amp: 0.5 },
        { r: 4.32, decay: 5.0, amp: 0.8 },
        { r: 5.89, decay: 3.5, amp: 0.6 },
        { r: 7.41, decay: 2.0, amp: 0.4 },
        { r: 8.93, decay: 1.0, amp: 0.3 },
        { r: 10.12, decay: 0.5, amp: 0.2 }
    ];

    partialsData.forEach(p => {
        const osc = ctx.createOscillator();
        osc.frequency.value = f0 * p.r;
        lfoGain.connect(osc.detune);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        // Attack
        env.gain.linearRampToValueAtTime(p.amp, t + 0.01); 
        // Decay per partial
        env.gain.exponentialRampToValueAtTime(0.001, t + p.decay);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + p.decay);
    });

    // --- STEP 2.1: METALLIC ATTACK (Strike) ---
    // Source: White/Pink Noise
    // Filter: Bandpass 2000Hz, Q=2.0
    // Env: Attack 0.001, Decay 0.05
    const noise = ctx.createBufferSource();
    noise.buffer = this.getPinkNoiseBuffer(ctx);
    
    const attackFilter = ctx.createBiquadFilter();
    attackFilter.type = 'bandpass';
    attackFilter.frequency.value = 2000;
    attackFilter.Q.value = 2.0;

    const attackEnv = ctx.createGain();
    attackEnv.gain.setValueAtTime(0, t);
    // 1.2 Amp (120%)
    attackEnv.gain.linearRampToValueAtTime(1.2, t + 0.001);
    attackEnv.gain.linearRampToValueAtTime(0, t + 0.051);

    noise.connect(attackFilter);
    attackFilter.connect(attackEnv);
    attackEnv.connect(mixBus);
    noise.start(t);
    noise.stop(t + 0.1);

    // --- STEP 2.2: BLOOM PHASE ---
    // Partials that swell in after impact
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
        // Linear Ramp 0 -> 0.6 (60%) in 0.3s
        env.gain.linearRampToValueAtTime(0.6, t + 0.3);
        // Then standard decay
        env.gain.exponentialRampToValueAtTime(0.001, t + 6.0);

        osc.connect(env);
        env.connect(mixBus);
        osc.start(t);
        osc.stop(t + 6.0);
    });
  }

  /**
   * TIBETAN SINGING BOWL (Cuenco Tibetano)
   * Implements Steps 1-5 of the Acoustic Guide.
   * Key Features:
   * - f0 = 262Hz (Middle C)
   * - Sacred Ratios: 1.5 (Fifth), 2.0 (Octave), 2.5 (5th over Oct), 3.0 (Twelfth)
   * - Bloom Attack: Sound swells after impact
   * - Stereo Rotation: Simulates the "Singing" circular movement
   */
  private playTibetanBowlSound(ctx: AudioContext, t: number, outputNode: AudioNode) {
    const f0 = 262.0; // Step 1.1: Fundamental (Medium Bowl)

    // --- STEP 5.1: ROTATION EFFECT (Stereo Panning) ---
    // Creates the circular acoustic field
    const panner = ctx.createStereoPanner();
    const rotLfo = ctx.createOscillator();
    rotLfo.frequency.value = 0.2; // 0.2 Hz Rotation speed
    const rotGain = ctx.createGain();
    rotGain.gain.value = 0.5; // Depth of rotation
    
    rotLfo.connect(rotGain);
    rotGain.connect(panner.pan);
    rotLfo.start(t);
    rotLfo.stop(t + 30);
    
    panner.connect(outputNode);
    const mixBus = panner;

    // --- STEP 3.1: MALLET ATTACK (Soft Impact) ---
    // Filtered noise for the initial "thud" of the mallet
    const strikeNoise = ctx.createBufferSource();
    strikeNoise.buffer = this.getPinkNoiseBuffer(ctx);
    
    const strikeFilter = ctx.createBiquadFilter();
    strikeFilter.type = 'lowpass';
    strikeFilter.frequency.value = 800; // Softer than metal gong
    strikeFilter.Q.value = 1.0;

    const strikeEnv = ctx.createGain();
    strikeEnv.gain.setValueAtTime(0, t);
    strikeEnv.gain.linearRampToValueAtTime(0.6, t + 0.01);
    strikeEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    strikeNoise.connect(strikeFilter);
    strikeFilter.connect(strikeEnv);
    strikeEnv.connect(mixBus);
    strikeNoise.start(t);
    strikeNoise.stop(t + 0.5);

    // --- STEP 1.2 & 2.2: HARMONIC MODES ---
    // Based on guide: [Fund, 5th, Octave, 5th+Oct, 12th, Double Oct]
    const modes = [
        { r: 1.0, amp: 1.0, decay: 25.0 }, // Fundamental (Do4)
        { r: 1.5, amp: 0.7, decay: 20.0 }, // Fifth (Sol4)
        { r: 2.0, amp: 0.5, decay: 15.0 }, // Octave (Do5)
        { r: 2.5, amp: 0.3, decay: 12.0 }, // Fifth over Octave (Mi5)
        { r: 3.0, amp: 0.2, decay: 10.0 }, // Twelfth (Sol5)
        { r: 4.0, amp: 0.1, decay: 8.0 }   // Double Octave (Do6)
    ];

    modes.forEach(mode => {
        const osc = ctx.createOscillator();
        // Slight random detune for naturalness (Step 4.2)
        const detune = 1.0 + (Math.random() - 0.5) * 0.002; 
        osc.frequency.value = f0 * mode.r * detune;

        // Subtle Vibrato (Singing Effect - Step 7.3)
        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 3.5; // 3.5Hz wobble
        const vibGain = ctx.createGain();
        vibGain.gain.value = 2; // Subtle pitch shift
        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);
        vibrato.start(t);
        vibrato.stop(t + mode.decay);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);

        // --- STEP 3.2: ENVELOPE (Bloom) ---
        // Attack is slower than a gong, it "blooms"
        // Higher frequencies bloom slightly faster
        const attackTime = 0.05 + (1/mode.r) * 0.1; 
        
        env.gain.linearRampToValueAtTime(mode.amp, t + attackTime);
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

    // --- GLOBAL BUS ---
    const masterBus = ctx.createGain();
    masterBus.connect(ctx.destination);
    
    // --- REVERB (Sacred Space) ---
    const convolver = ctx.createConvolver();
    convolver.buffer = this.getReverbBuffer(ctx);
    const reverbMix = ctx.createGain();
    // Bonsho, Dora, and Tibetan need more reverb to simulate the temple
    reverbMix.gain.value = (type === GongType.BONSHO || type === GongType.DORA || type === GongType.TIBETAN) ? 0.65 : 0.5;
    masterBus.connect(convolver);
    convolver.connect(reverbMix);
    reverbMix.connect(ctx.destination);

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
    envelope.gain.linearRampToValueAtTime(0.8, t + 0.05); // Fast attack

    // Logic for DEEP, BRIGHT, ETHEREAL
    let fundamentals: number[] = [];
    let decayTime = 4;

    switch (type) {
      case GongType.DEEP:
        // Grounding: 54Hz (Root) + 136.1Hz (Earth Year/Om)
        fundamentals = [54, 136.1]; 
        decayTime = 10;
        envelope.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
        break;
        
      case GongType.BRIGHT:
        // Cognition/Focus: 432Hz (Clarity) + 528Hz (Transformation/DNA)
        fundamentals = [432, 528]; 
        decayTime = 3;
        // Sharper decay for alertness
        envelope.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
        break;
        
      case GongType.ETHEREAL:
        // Intuition: 432Hz harmonics + Binaural Detuning for Gamma (Insight)
        // 216Hz base
        fundamentals = [216];
        decayTime = 6;
        envelope.gain.exponentialRampToValueAtTime(0.001, t + decayTime);
        break;
    }

    envelope.connect(masterBus);

    // Synthesis Loop
    fundamentals.forEach(fund => {
      // Create 3 harmonics for each fundamental using Phi decay
      [1, 2, 3, 5].forEach(h => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        const freq = fund * h;
        osc.frequency.value = freq;
        
        // Ethereal Special: Add Binaural Beat for Gamma (40Hz)
        if (type === GongType.ETHEREAL && h === 1) {
           // Left Ear (Via stereo panning simulation)
           const oscL = ctx.createOscillator();
           oscL.frequency.value = freq;
           const panL = ctx.createStereoPanner();
           panL.pan.value = -0.5;
           
           // Right Ear (Freq + 40Hz)
           const oscR = ctx.createOscillator();
           oscR.frequency.value = freq + 40; // 40Hz Gamma difference
           const panR = ctx.createStereoPanner();
           panR.pan.value = 0.5;

           oscL.connect(oscGain);
           oscR.connect(oscGain);
           oscL.start(t); oscR.start(t);
           oscL.stop(t + decayTime); oscR.stop(t + decayTime);
           
           // Don't use the main osc for this iteration
        } else {
           osc.type = h === 1 ? 'sine' : 'triangle';
           osc.connect(oscGain);
           osc.start(t);
           osc.stop(t + decayTime);
        }

        // Apply Golden Ratio Decay: A = 1 / n^1.618
        // We modify slightly to keep fundamental loud
        const amplitude = 1 / Math.pow(h, 1.618);
        oscGain.gain.value = amplitude;

        // Connect to main envelope
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