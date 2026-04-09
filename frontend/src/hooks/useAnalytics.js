import { useEffect, useState } from 'react';
import { fetchGymAnalytics } from '../services/api';

const EMPTY_ANALYTICS = {
  heatmap: [],
  revenue: [],
  churn: [],
};

export default function useAnalytics(gymId, dateRange = '30d') {
  const [data, setData] = useState(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!gymId) {
      setData(EMPTY_ANALYTICS);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    setError(null);

    fetchGymAnalytics(gymId, dateRange)
      .then((payload) => {
        if (!mounted) return;
        setData({
          heatmap: Array.isArray(payload?.heatmap) ? payload.heatmap : [],
          revenue: Array.isArray(payload?.revenue) ? payload.revenue : [],
          churn: Array.isArray(payload?.churn) ? payload.churn : [],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('useAnalytics failed', err);
        if (!mounted) return;
        setData(EMPTY_ANALYTICS);
        setLoading(false);
        setError(err);
      });

    return () => {
      mounted = false;
    };
  }, [gymId, dateRange]);

  return { ...data, loading, error };
}
