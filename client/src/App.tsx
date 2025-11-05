import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { RoutePlanner } from './components/RoutePlanner';
import { NetworkMap } from './components/NetworkMap';

function App() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Dashboard View */}
        <section id="dashboard">
          <Dashboard />
        </section>

        {/* Route Planner Section */}
        <section id="route-planner" className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Route Planning
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Find optimal routes with multi-objective optimization
            </p>
          </div>
          <RoutePlanner />
        </section>

        {/* Network Map Section */}
        <section id="network-map" className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Network Visualization
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Interactive view of your logistics network
            </p>
          </div>
          <NetworkMap />
        </section>
      </div>
    </Layout>
  );
}

export default App;
