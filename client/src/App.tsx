import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { RoutePlanner } from './components/RoutePlanner';
import { NetworkMap } from './components/NetworkMap';
import { ScenarioComparison } from './components/ScenarioComparison';
import { GraphEditor } from './components/GraphEditor';

function App() {
  return (
    <Layout>
      <div className="space-y-12">
        {/* Dashboard View */}
        <section id="dashboard">
          <Dashboard />
        </section>

        {/* Route Planner Section */}
        <section id="route-planner" className="mt-12">
          <RoutePlanner />
        </section>

        {/* Network Map Section */}
        <section id="network-map" className="mt-12">
          <NetworkMap />
        </section>

        {/* Scenario Comparison Section */}
        <section id="scenario-comparison" className="mt-12">
          <ScenarioComparison />
        </section>

        {/* Graph Editor Section */}
        <section id="graph-editor" className="mt-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-[800px]">
            <GraphEditor />
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default App;
