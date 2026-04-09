import React, { useMemo } from 'react';
import OccupancyCard from '../components/OccupancyCard';
import RevenueCard from '../components/RevenueCard';
import ActivityFeed from '../components/ActivityFeed';
import AnomalyTable from '../components/AnomalyTable';
import Heatmap from '../components/Heatmap';
import Revenue from '../components/Revenue';
import Churn from '../components/Churn';
import SimulatorControls from '../components/SimulatorControls';
import useAnalytics from '../hooks/useAnalytics';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function Dashboard({ gymId, live, feed, anomalies, connected }) {
  const analytics = useAnalytics(gymId, '30d');

  const localFeed = useMemo(() => safeArray(feed), [feed]);
  const recentEvents = useMemo(() => safeArray(live?.recent_events), [live]);
  const activeAnomalies = useMemo(() => safeArray(anomalies), [anomalies]);
  const heatmap = useMemo(() => safeArray(analytics?.heatmap), [analytics]);
  const revenue = useMemo(() => safeArray(analytics?.revenue), [analytics]);
  const churn = useMemo(() => safeArray(analytics?.churn), [analytics]);

  return (
    <div className="container dashboard">

      {/* ===== TOP BAR ===== */}
      <div className="dashboard-top">

        <div className="card">
          <OccupancyCard occupancy={live?.occupancy || null} />
        </div>

        <div className="card">
          <RevenueCard amount={live?.today_revenue ?? null} />
        </div>

        <div className="card socket-card">
          <div className="muted">Live Status</div>
          <div className="socket-row">
            <span className={`live-dot ${connected ? 'active' : 'off'}`} />
            <span className="socket-text">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="dashboard-grid">

        {/* LEFT */}
        <div className="dashboard-main">

          <div className="card">
            <ActivityFeed items={localFeed} />
          </div>

          <div className="card anomaly-section">
            <AnomalyTable anomalies={activeAnomalies} />
          </div>

          <div className="analytics-grid">
            <div className="card analytics-card">
              <Heatmap data={heatmap} />
            </div>

            <div className="card analytics-card">
              <Revenue data={revenue} />
            </div>

            <div className="card analytics-card">
              <Churn data={churn} />
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="dashboard-side">
          <div className="card side-card">
            <h3 className="title">Recent Events</h3>

            {recentEvents.length === 0 ? (
              <div className="muted empty">No events</div>
            ) : (
              <div className="event-list">
                {recentEvents.slice(0, 20).map((e, i) => (
                  <div key={`${e.ts || e.timestamp || i}-${i}`} className="event">

                    <div className="event-time">
                      {new Date(e.ts || e.timestamp || Date.now()).toLocaleString()}
                    </div>

                    <div className="event-title">
                      {String(e.type || 'EVENT').replace(/_/g, ' ')}
                    </div>

                    <div className="event-member">
                      {e.member_name || e.member || 'Guest'}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card side-card">
            <SimulatorControls />
          </div>
        </div>

      </div>
    </div>
  );
}