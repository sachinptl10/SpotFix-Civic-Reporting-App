import { BrainCircuit } from 'lucide-react';

export default function IntentDisplay({ intent }) {
  if (!intent) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 text-indigo-400">
        <BrainCircuit className="w-5 h-5" />
        <h4 className="font-semibold text-sm uppercase tracking-wider">Parsed Intent</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {Object.entries(intent).map(([key, value]) => {
          if (typeof value === 'object' || Array.isArray(value)) return null;
          return (
            <div key={key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div className="text-slate-500 text-xs uppercase mb-1">{key.replace(/_/g, ' ')}</div>
              <div className="text-slate-200 font-medium truncate" title={String(value)}>{String(value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
