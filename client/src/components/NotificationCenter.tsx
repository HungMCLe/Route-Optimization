import React, { useState } from 'react';
import { X, Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../hooks/useWebSocket';

interface NotificationCenterProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  alerts,
  onDismiss,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColor = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <>
      {/* Bell Icon with Badge */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {alerts.length} unread
                  </p>
                </div>
                {alerts.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No notifications
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-3 rounded-lg border ${getBgColor(alert.type)} relative`}
                      >
                        <button
                          onClick={() => onDismiss(alert.id)}
                          className="absolute top-2 right-2 p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <div className="flex items-start space-x-3 pr-6">
                          <div className={`${getColor(alert.type)} text-white p-2 rounded-lg`}>
                            {getIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              {alert.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {alert.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notifications (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {alerts.slice(0, 3).map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`${getBgColor(alert.type)} p-4 rounded-xl shadow-2xl border`}
            >
              <div className="flex items-start space-x-3">
                <div className={`${getColor(alert.type)} text-white p-2 rounded-lg flex-shrink-0`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {alert.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {alert.message}
                  </p>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="flex-shrink-0 p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
