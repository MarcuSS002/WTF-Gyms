import useAnalytics from '../hooks/useAnalytics';
import Heatmap from '../components/Heatmap';
import Revenue from '../components/Revenue';
import Churn from '../components/Churn';

export default function AnalyticsPage({ gymId }) {
  const { heatmap, revenue, churn } = useAnalytics(gymId);

  return (
    <div className="container dashboard" style={{ paddingTop: 0 }}>
      <div className="analytics-grid">
        <Heatmap data={heatmap} />
        <Revenue data={revenue} />
        <Churn data={churn} />
      </div>
    </div>
  );
}
