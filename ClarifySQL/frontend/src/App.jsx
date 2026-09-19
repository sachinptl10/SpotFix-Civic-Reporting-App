import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import SchemaExplorer from './components/SchemaExplorer';
import QueryHistory from './components/QueryHistory';
import { useSchema } from './hooks/useSchema';
import { useHistory } from './hooks/useHistory';

export default function App() {
  const { tables, loading: schemaLoading } = useSchema();
  const { history, loading: historyLoading } = useHistory();
  const [sidebarTab, setSidebarTab] = useState('schema');

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Left Sidebar */}
      <div className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-10">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-bold text-lg tracking-tight">ClarifySQL</span>
        </div>
        
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setSidebarTab('schema')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'schema' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'}`}
          >
            Schema
          </button>
          <button 
            onClick={() => setSidebarTab('history')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'}`}
          >
            History
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className={`absolute inset-0 transition-opacity duration-300 ${sidebarTab === 'schema' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <SchemaExplorer tables={tables} loading={schemaLoading} />
          </div>
          <div className={`absolute inset-0 transition-opacity duration-300 ${sidebarTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <QueryHistory history={history} loading={historyLoading} onSelect={() => {}} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <Dashboard />
      </div>
    </div>
  );
}
