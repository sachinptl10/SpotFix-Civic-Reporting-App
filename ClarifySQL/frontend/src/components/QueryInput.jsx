import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function QueryInput({ onSubmit, isLoading }) {
  const [text, setText] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (text.trim() && !isLoading) onSubmit(text);
    }
  };

  const examples = [
    "Show total sales by month", 
    "Who are the top 5 customers?", 
    "Count of users from New York"
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your data... (Ctrl+Enter to submit)"
          className="w-full h-32 p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm group-hover:shadow-indigo-500/10 resize-none"
          disabled={isLoading}
        />
        <button
          onClick={() => text.trim() && !isLoading && onSubmit(text)}
          disabled={isLoading || !text.trim()}
          className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-slate-400 py-1">Try asking:</span>
        {examples.map((ex, i) => (
          <button key={i} onClick={() => setText(ex)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors border border-slate-700">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
