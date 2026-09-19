import { useState } from 'react';
import { Table2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ResultTable({ result }) {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  if (!result || !result.columns || !result.rows) return null;

  const totalPages = Math.ceil(result.rows.length / pageSize);
  const paginatedRows = result.rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-300">
          <Table2 className="w-5 h-5" />
          <span className="font-semibold text-sm">Results</span>
        </div>
        <div className="text-xs text-slate-500">
          {result.row_count} rows • {result.execution_time_ms}ms
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
            <tr>
              {result.columns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-medium tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={result.columns.length} className="px-4 py-8 text-center text-slate-500">
                  No results found
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  {result.columns.map((col, j) => (
                    <td key={j} className="px-4 py-2.5 whitespace-nowrap">
                      {row[col] !== null ? String(row[col]) : <span className="text-slate-600 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, result.rows.length)} of {result.rows.length}
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
