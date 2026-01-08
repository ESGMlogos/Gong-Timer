import React from 'react';
import { Routine } from '../types';
import { Play, Edit2, Trash2, Plus, Clock } from 'lucide-react';

interface RoutineListProps {
  routines: Routine[];
  onPlay: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const RoutineList: React.FC<RoutineListProps> = ({ routines, onPlay, onEdit, onDelete, onCreate }) => {
  
  const formatTotalTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 pt-4">
          <h1 className="text-4xl font-serif text-stone-800 mb-2">My Routines</h1>
          <p className="text-stone-500">Select a sequence to begin your practice.</p>
        </header>

        <div className="space-y-4">
          {routines.map((routine) => (
            <div 
              key={routine.id} 
              className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-stone-200 flex items-center justify-between"
            >
              <div className="flex-1 cursor-pointer" onClick={() => onPlay(routine)}>
                <h3 className="text-xl font-serif text-stone-800 mb-1 group-hover:text-stone-600 transition-colors">
                  {routine.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatTotalTime(routine.totalDuration)}
                  </span>
                  <span>{routine.steps.length} Steps</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onPlay(routine)}
                  className="w-10 h-10 bg-stone-800 text-stone-50 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                >
                  <Play size={18} fill="currentColor" />
                </button>
                <div className="w-px h-8 bg-stone-100 mx-2"></div>
                <button 
                  onClick={() => onEdit(routine)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDelete(routine.id)}
                  className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {routines.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-stone-200">
              <p className="text-stone-400 mb-4">No routines found.</p>
              <button onClick={onCreate} className="text-stone-600 font-bold hover:underline">Create your first routine</button>
            </div>
          )}
        </div>

        <button 
          onClick={onCreate}
          className="fixed bottom-8 right-8 w-16 h-16 bg-stone-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-stone-700 transition-all hover:scale-105 active:scale-95"
          title="Create New Routine"
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
};

export default RoutineList;