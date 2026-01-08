import React, { useState } from 'react';
import { Routine, TimerStep, GongType } from '../types';
import { generateRoutine } from '../services/geminiService';
import { Plus, Trash, Wand2, ArrowLeft, Save, Loader2, Play } from 'lucide-react';
import { audioService } from '../services/audioService';

interface RoutineEditorProps {
  initialRoutine?: Routine;
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

const RoutineEditor: React.FC<RoutineEditorProps> = ({ initialRoutine, onSave, onCancel }) => {
  const [name, setName] = useState(initialRoutine?.name || '');
  const [steps, setSteps] = useState<TimerStep[]>(initialRoutine?.steps || [
    { id: '1', name: 'Preparation', duration: 10, gongType: GongType.DEEP }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  const addStep = () => {
    setSteps([
      ...steps, 
      { 
        id: Date.now().toString(), 
        name: 'New Step', 
        duration: 60, 
        gongType: GongType.BRIGHT 
      }
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof TimerStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please name your routine.");
      return;
    }
    if (steps.length === 0) {
      alert("Please add at least one step.");
      return;
    }

    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    const routine: Routine = {
      id: initialRoutine?.id || Date.now().toString(),
      name,
      steps,
      totalDuration,
    };
    onSave(routine);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateRoutine(aiPrompt);
      setName(generated.name);
      // Map AI response to our internal structure with IDs
      const mappedSteps = generated.steps.map((s, idx) => ({
        ...s,
        id: `${Date.now()}-${idx}`,
      }));
      setSteps(mappedSteps);
      setShowAiModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate routine. Please check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onCancel} className="text-stone-500 hover:text-stone-800">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-serif text-stone-800">
            {initialRoutine ? 'Edit Routine' : 'Create Routine'}
          </h2>
          <button onClick={() => setShowAiModal(true)} className="text-purple-700 hover:text-purple-900 flex gap-1 items-center text-sm font-semibold">
            <Wand2 size={18} />
            AI Draft
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Routine Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-100 border-none rounded-lg p-4 text-xl font-serif text-stone-800 focus:ring-2 focus:ring-stone-400 outline-none"
              placeholder="e.g. Morning Zen"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-stone-500 uppercase tracking-wider">Timeline</label>
            
            {steps.map((step, index) => (
              <div key={step.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 font-bold text-xs">
                    {index + 1}
                  </div>
                  <input 
                    value={step.name}
                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                    className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-500 outline-none pb-1 font-medium text-stone-700"
                    placeholder="Step Name"
                  />
                  <button onClick={() => removeStep(index)} className="text-stone-300 hover:text-red-400 transition-colors">
                    <Trash size={18} />
                  </button>
                </div>
                
                <div className="flex gap-4 ml-12">
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 block mb-1">Duration (seconds)</label>
                    <input 
                      type="number"
                      value={step.duration}
                      onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-full bg-stone-50 rounded p-2 text-stone-700 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 block mb-1">Sound</label>
                    <div className="flex items-center gap-2">
                      <select 
                        value={step.gongType}
                        onChange={(e) => updateStep(index, 'gongType', e.target.value)}
                        className="w-full bg-stone-50 rounded p-2 text-stone-700 text-sm"
                      >
                        {Object.values(GongType).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => audioService.playGong(step.gongType)}
                        className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 text-stone-600"
                        title="Preview Sound"
                      >
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addStep}
            className="w-full py-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 hover:text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} /> Add Step
          </button>
        </div>

        {/* Floating Save Bar */}
        <div className="fixed bottom-6 left-0 right-0 px-6 max-w-2xl mx-auto">
          <button 
            onClick={handleSave}
            className="w-full bg-stone-800 text-stone-100 py-4 rounded-xl shadow-xl font-bold tracking-wide hover:bg-stone-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} /> Save Routine
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-serif text-stone-800 mb-2">AI Routine Draft</h3>
            <p className="text-stone-500 text-sm mb-4">What kind of session would you like? (e.g., "5 minute focus break", "Deep sleep preparation")</p>
            
            <textarea 
              className="w-full bg-stone-50 rounded-lg p-3 text-stone-800 h-24 mb-4 resize-none border focus:border-stone-400 outline-none"
              placeholder="Describe your desired routine..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineEditor;