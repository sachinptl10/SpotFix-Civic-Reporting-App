import { useState, useEffect } from 'react';
import { schemaAPI } from '../services/api';

export const useSchema = () => {
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setLoading(true);
        const [tablesRes, relsRes] = await Promise.all([
          schemaAPI.getTables(),
          schemaAPI.getRelationships()
        ]);
        setTables(tablesRes.data || []);
        setRelationships(relsRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch schema');
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, []);

  return { tables, relationships, loading, error };
};
