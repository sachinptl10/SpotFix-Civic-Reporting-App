import { useState } from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';

export default function ClarificationDialog({ clarification, onSubmit }) {
  const [answers, setAnswers] = useState({});

  if (!clarification || !clarification.questions) return null;

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-semibold text-slate-100">Clarification Needed</h3>
      </div>
      
      <div className="p-6 space-y-8">
        {clarification.questions.map((q) => (
          <div key={q.id} className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-slate-200">{q.question}</h4>
              {q.context && <p className="text-sm text-slate-400 mt-1">{q.context}</p>}
            </div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-6 border-t border-slate-800 flex justify-end">
        <button 
          onClick={handleSubmit}
          disabled={Object.keys(answers).length !== clarification.questions.length}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answers
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
