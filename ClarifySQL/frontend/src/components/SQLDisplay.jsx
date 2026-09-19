import { useState } from 'react';
import { Code2, Play, Check, Copy, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SQLDisplay({ sqlResult, validation, onExecute, isExecuting }) {
  const [copied, setCopied] = useState(false);

  if (!sqlResult) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlResult.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-300">
          <Code2 className="w-5 h-5" />
          <span className="font-semibold text-sm">Generated SQL</span>
          {sqlResult.confidence && (
            <span className="ml-2 px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs border border-slate-700">
              Confidence: {(sqlResult.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy SQL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => onExecute(sqlResult.sql)}
            disabled={isExecuting || (validation && !validation.is_valid)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            Execute
          </button>
        </div>
      </div>
      
      <div className="relative text-sm">
        <SyntaxHighlighter 
          language="sql" 
          style={atomDark}
          customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
        >
          {sqlResult.sql}
        </SyntaxHighlighter>
      </div>

      {validation && !validation.is_valid && (
        <div className="px-4 py-3 bg-red-950/30 border-t border-red-900/50 flex gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold block mb-1">Validation Errors:</span>
            <ul className="list-disc list-inside">
              {validation.errors?.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
