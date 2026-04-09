import React from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import './styles/global.css';
import useGymData from './hooks/useGymData';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown dashboard error' };
  }

  componentDidCatch(error) {
    console.error('Dashboard render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="card">
            <h3 className="title">Dashboard failed to render</h3>
            <div className="muted" style={{ marginTop: 8 }}>
              {this.state.message}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const gym = useGymData();

  return (
    <div>
      <Navbar onSelect={gym.setSelectedGym} selectedGymId={gym.selectedGym} gyms={gym.gyms} />
      <DashboardErrorBoundary>
        <Dashboard
          gymId={gym.selectedGym}
          live={gym.live}
          feed={gym.feed}
          anomalies={gym.anomalies}
          connected={gym.connected}
          onSimulatorReset={gym.refreshAfterReset}
        />
      </DashboardErrorBoundary>
    </div>
  );
}
