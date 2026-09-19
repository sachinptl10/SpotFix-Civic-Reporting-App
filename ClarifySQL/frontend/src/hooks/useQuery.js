import { useState, useEffect, useCallback } from 'react';
import { queryAPI } from '../services/api';

export const useQuery = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // idle, asking, clarifying, generating, executing, done, error
  const [sessionId, setSessionId] = useState(null);
  const [clarification, setClarification] = useState(null);
  const [intent, setIntent] = useState(null);
  const [sqlResult, setSqlResult] = useState(null);
  const [validation, setValidation] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setQuestion('');
    setLoading(false);
    setStep('idle');
    setSessionId(null);
    setClarification(null);
    setIntent(null);
    setSqlResult(null);
    setValidation(null);
    setQueryResult(null);
    setError(null);
  }, []);

  const handleClarifyResponse = (data) => {
    setSessionId(data.session_id);
    setIntent(data.intent);
    setSqlResult(data.sql_result);
    setValidation(data.validation);
    
    if (data.needs_clarification) {
      setClarification(data.clarification);
      setStep('clarifying');
    } else {
      setClarification(null);
      if (data.result) {
        setQueryResult(data.result);
        setStep('done');
      } else {
        setStep('done');
      }
    }
  };

  const askQuestion = async (q, existingSessionId = null) => {
    setLoading(true);
    setStep('asking');
    setError(null);
    try {
      const res = await queryAPI.ask(q, existingSessionId);
      handleClarifyResponse(res.data);
    } catch (err) {
      setError(err.message || 'Error asking question');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const submitClarification = async (answers) => {
    setLoading(true);
    setStep('generating');
    setError(null);
    try {
      const res = await queryAPI.clarify(sessionId, answers);
      handleClarifyResponse(res.data);
    } catch (err) {
      setError(err.message || 'Error submitting clarification');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const executeSQL = async (sql) => {
    setLoading(true);
    setStep('executing');
    setError(null);
    try {
      const res = await queryAPI.execute(sessionId, sql);
      setQueryResult(res.data);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Error executing SQL');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return {
    question, setQuestion,
    loading, step, sessionId,
    clarification, intent, sqlResult, validation, queryResult, error,
    askQuestion, submitClarification, executeSQL, reset
  };
};
