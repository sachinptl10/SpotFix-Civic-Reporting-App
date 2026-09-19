import { CheckCircle2, XCircle } from 'lucide-react';

export default function QueryHistory({ history, loading, onSelect }) {
  if (loading) return <div className="p-4 text-slate-500 text-sm animate-pulse">Loading history...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 text-sm">
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!history || history.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">No recent queries</div>
        ) : (
          history.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="w-full text-left p-3 hover:bg-slate-800 rounded-lg transition-colors group flex gap-3 items-start"
            >
              <div className="mt-0.5">
                {item.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-300 truncate font-medium">{item.question}</div>
                <div className="text-slate-500 text-xs mt-1">{new Date(item.timestamp || Date.now()).toLocaleTimeString()}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
