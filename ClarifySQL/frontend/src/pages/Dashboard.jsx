import { useQuery } from '../hooks/useQuery';
import QueryInput from '../components/QueryInput';
import ClarificationDialog from '../components/ClarificationDialog';
import IntentDisplay from '../components/IntentDisplay';
import SQLDisplay from '../components/SQLDisplay';
import ResultTable from '../components/ResultTable';
import ChartView from '../components/ChartView';
import ExplanationCard from '../components/ExplanationCard';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { 
    step, error, 
    clarification, intent, sqlResult, validation, queryResult,
    askQuestion, submitClarification, executeSQL
  } = useQuery();

  const isLoading = step === 'asking' || step === 'generating' || step === 'executing';

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto space-y-8 pb-12">
        
        {/* Header Area */}
        <div className="text-center space-y-2 mb-10 mt-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">ClarifySQL</h1>
          <p className="text-slate-400">Ask questions, clarify intent, get insights.</p>
        </div>

        {/* Input Area */}
        <QueryInput onSubmit={askQuestion} isLoading={isLoading} />

        {/* Error State */}
        {error && (
          <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 flex gap-3 text-red-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Error</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Clarification Step */}
        {step === 'clarifying' && (
          <ClarificationDialog 
            clarification={clarification} 
            onSubmit={submitClarification} 
          />
        )}

        {/* Loading State */}
        {isLoading && step !== 'asking' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p>
              {step === 'generating' && 'Analyzing answers and generating SQL...'}
              {step === 'executing' && 'Executing query...'}
            </p>
          </div>
        )}

        {/* Results Area */}
        {(step === 'done' || sqlResult) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {queryResult && <ExplanationCard explanation={queryResult.explanation} />}
            <IntentDisplay intent={intent} />
            <SQLDisplay 
              sqlResult={sqlResult} 
              validation={validation} 
              onExecute={executeSQL}
              isExecuting={step === 'executing'}
            />
            
            {queryResult && (
              <>
                <ChartView result={queryResult} />
                <ResultTable result={queryResult} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
