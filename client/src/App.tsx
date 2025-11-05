import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { RoutePlanner } from './components/RoutePlanner';
import { NetworkMap } from './components/NetworkMap';
import { ScenarioComparison } from './components/ScenarioComparison';
import { GraphEditor } from './components/GraphEditor';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;

      case 'routes':
        return <RoutePlanner />;

      case 'map':
        return <NetworkMap />;

      case 'scenarios':
        return <ScenarioComparison />;

      case 'network':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-[calc(100vh-12rem)]">
            <GraphEditor />
          </div>
        );

      case 'analytics':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Advanced Analytics
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Advanced analytics and reporting features coming soon...
            </p>
          </div>
        );

      case 'incidents':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Incident Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time incident tracking and management coming soon...
            </p>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Settings
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Application settings and preferences coming soon...
            </p>
          </div>
        );

      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
