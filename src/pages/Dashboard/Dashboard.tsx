import React from 'react';
import { useApp } from '../../context/AppContext';
import MetricsCards from './MetricsCards';
import RecentExecutions from './RecentExecutions';
import ActiveFlows from './ActiveFlows';
import ExecutionChart from './ExecutionChart';

export default function Dashboard() {
  const { state } = useApp();
  const { theme } = state;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <MetricsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExecutionChart />
        <ActiveFlows />
      </div>

      <RecentExecutions />
    </div>
  );
}