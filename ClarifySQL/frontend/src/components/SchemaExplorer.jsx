import { useState } from 'react';
import { Database, Table, ChevronRight, ChevronDown, Key } from 'lucide-react';

export default function SchemaExplorer({ tables, loading }) {
  const [expandedTables, setExpandedTables] = useState({});

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  if (loading) return <div className="p-4 text-slate-500 text-sm animate-pulse">Loading schema...</div>;
  if (!tables || tables.length === 0) return <div className="p-4 text-slate-500 text-sm">No tables found</div>;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 text-sm">
      <div className="flex-1 overflow-y-auto p-2">
        {tables.map(table => (
          <div key={table.name || table.table_name} className="mb-1">
            <button 
              onClick={() => toggleTable(table.name || table.table_name)}
              className="w-full flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
            >
              {expandedTables[table.name || table.table_name] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              <Table className="w-4 h-4 text-slate-400" />
              <span className="truncate">{table.name || table.table_name}</span>
            </button>
            
            {expandedTables[table.name || table.table_name] && (
              <div className="ml-8 py-1 space-y-1">
                {table.columns?.map(col => (
                  <div key={col.name} className="flex items-center gap-2 p-1.5 text-xs rounded hover:bg-slate-800/50 group">
                    <span className="text-slate-400 truncate flex-1">{col.name}</span>
                    <span className="text-slate-600 font-mono text-[10px] uppercase">{col.type}</span>
                    {col.primary_key && <Key className="w-3 h-3 text-amber-500" title="Primary Key" />}
                    {col.foreign_key && <Key className="w-3 h-3 text-indigo-500" title="Foreign Key" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
