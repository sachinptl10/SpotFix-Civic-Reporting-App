import { Lightbulb } from 'lucide-react';

export default function ExplanationCard({ explanation }) {
  if (!explanation) return null;

  return (
    <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 flex gap-3">
      <Lightbulb className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-semibold text-indigo-300 mb-1">Explanation</h4>
        <p className="text-slate-300 text-sm leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
}
