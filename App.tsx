import React, { useState, useEffect } from 'react';
import { AppView, Routine, GongType } from './types';
import LoadingScreen from './components/LoadingScreen';
import RoutineList from './components/RoutineList';
import RoutineEditor from './components/RoutineEditor';
import TimerView from './components/TimerView';
import { audioService } from './services/audioService';

const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'default-rising',
    name: 'Rising',
    totalDuration: 6360,
    steps: [
      { id: 'r1', name: 'Prepare', duration: 15, gongType: GongType.TIBETAN },
      { id: 'r2', name: 'Grace', duration: 300, gongType: GongType.DORA },
      { id: 'r3', name: 'Movilidad', duration: 300, gongType: GongType.DORA },
      { id: 'r4', name: 'Yoga Flow', duration: 900, gongType: GongType.DORA },
      { id: 'r5', name: 'Visualization', duration: 600, gongType: GongType.DORA },
      { id: 'r6', name: 'Abs Workout', duration: 900, gongType: GongType.DORA },
      { id: 'r7', name: 'Pushup', duration: 900, gongType: GongType.DORA },
      { id: 'r8', name: 'Ten Practice', duration: 900, gongType: GongType.DORA },
      { id: 'r9', name: 'Self Healing', duration: 600, gongType: GongType.DORA },
      { id: 'r10', name: 'Face Expression', duration: 900, gongType: GongType.MANTRA },
      { id: 'r11', name: 'Finish', duration: 45, gongType: GongType.TIBETAN },
    ]
  },
  {
    id: 'default-rest',
    name: 'Rest',
    totalDuration: 7020,
    steps: [
      { id: 'rs1', name: 'Prepararse', duration: 60, gongType: GongType.TIBETAN },
      { id: 'rs2', name: 'Dibujar', duration: 1200, gongType: GongType.DORA },
      { id: 'rs3', name: 'Clean', duration: 900, gongType: GongType.DORA },
      { id: 'rs4', name: 'Taichi', duration: 900, gongType: GongType.DORA },
      { id: 'rs5', name: 'Yoga Flow', duration: 900, gongType: GongType.DORA },
      { id: 'rs6', name: 'Hipnosis', duration: 900, gongType: GongType.DORA },
      { id: 'rs7', name: 'Read', duration: 1800, gongType: GongType.DORA },
      { id: 'rs8', name: 'Grace', duration: 300, gongType: GongType.DORA },
      { id: 'rs9', name: 'End', duration: 60, gongType: GongType.TIBETAN },
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOADING);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(undefined);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gong-timer-routines');
    if (saved) {
      setRoutines(JSON.parse(saved));
    } else {
      setRoutines(DEFAULT_ROUTINES);
    }
  }, []);

  // Save to local storage whenever routines change
  useEffect(() => {
    if (routines.length > 0) {
      localStorage.setItem('gong-timer-routines', JSON.stringify(routines));
    }
  }, [routines]);

  const handleLoadingComplete = () => {
    setView(AppView.DASHBOARD);
  };

  const handleCreateRoutine = () => {
    setEditingRoutine(undefined);
    setView(AppView.EDITOR);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setView(AppView.EDITOR);
  };

  const handleSaveRoutine = (routine: Routine) => {
    if (editingRoutine) {
      setRoutines(routines.map(r => r.id === routine.id ? routine : r));
    } else {
      setRoutines([...routines, routine]);
    }
    setView(AppView.DASHBOARD);
  };

  const handleDeleteRoutine = (id: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      setRoutines(routines.filter(r => r.id !== id));
    }
  };

  const handlePlayRoutine = (routine: Routine) => {
    // Resume audio context on user interaction (Play button click)
    audioService.resume();
    setActiveRoutine(routine);
    setView(AppView.ACTIVE_TIMER);
  };

  const handleExitTimer = () => {
    setActiveRoutine(null);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="antialiased text-stone-800">
      {view === AppView.LOADING && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {view === AppView.DASHBOARD && (
        <RoutineList 
          routines={routines}
          onPlay={handlePlayRoutine}
          onEdit={handleEditRoutine}
          onDelete={handleDeleteRoutine}
          onCreate={handleCreateRoutine}
        />
      )}

      {view === AppView.EDITOR && (
        <RoutineEditor 
          initialRoutine={editingRoutine}
          onSave={handleSaveRoutine}
          onCancel={() => setView(AppView.DASHBOARD)}
        />
      )}

      {view === AppView.ACTIVE_TIMER && activeRoutine && (
        <TimerView 
          routine={activeRoutine}
          onExit={handleExitTimer}
        />
      )}
    </div>
  );
};

export default App;