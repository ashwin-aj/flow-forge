import React from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MetricsCards() {
  const { state } = useApp();
  const { theme } = state;
  
  const totalExecutions = state.executions.length;
  const completedExecutions = state.executions.filter(e => e.status === 'completed').length;
  const failedExecutions = state.executions.filter(e => e.status === 'failed').length;
  const runningExecutions = state.executions.filter(e => e.status === 'running').length;
  
  const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
  
  const completedWithTime = state.executions.filter(e => e.endTime && e.status === 'completed');
  const avgDuration = completedWithTime.length > 0 
    ? completedWithTime.reduce((acc, exec) => {
        const duration = new Date(exec.endTime!).getTime() - new Date(exec.startTime).getTime();
        return acc + duration;
      }, 0) / completedWithTime.length / 1000 / 60 // Convert to minutes
    : 0;

  const metrics = [
    {
      title: 'Total Executions',
      value: totalExecutions.toString(),
      icon: TrendingUp,
      color: 'cyan',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'green',
      change: '+5.2%',
      changeType: 'positive'
    },
    {
      title: 'Avg Duration',
      value: `${avgDuration.toFixed(1)}m`,
      icon: Clock,
      color: 'purple',
      change: '-8%',
      changeType: 'positive'
    },
    {
      title: 'Active Executions',
      value: runningExecutions.toString(),
      icon: AlertCircle,
      color: 'amber',
      change: failedExecutions > 0 ? `${failedExecutions} failed` : 'All healthy',
      changeType: failedExecutions > 0 ? 'negative' : 'neutral'
    }
  ];

  const colorClasses = {
    cyan: theme === 'dark' 
      ? 'from-cyan-600/20 to-cyan-400/10 border-cyan-500/30 text-cyan-400 bg-gray-800' 
      : 'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-600 bg-white',
    green: theme === 'dark' 
      ? 'from-green-600/20 to-green-400/10 border-green-500/30 text-green-400 bg-gray-800' 
      : 'from-green-50 to-green-100 border-green-200 text-green-600 bg-white',
    purple: theme === 'dark' 
      ? 'from-purple-600/20 to-purple-400/10 border-purple-500/30 text-purple-400 bg-gray-800' 
      : 'from-purple-50 to-purple-100 border-purple-200 text-purple-600 bg-white',
    amber: theme === 'dark' 
      ? 'from-amber-600/20 to-amber-400/10 border-amber-500/30 text-amber-400 bg-gray-800' 
      : 'from-amber-50 to-amber-100 border-amber-200 text-amber-600 bg-white'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div
          key={metric.title}
          className={`bg-gradient-to-br ${colorClasses[metric.color]} border rounded-xl p-6 card-hover`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {metric.title}
              </p>
              <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {metric.value}
              </p>
            </div>
            <metric.icon className={`h-8 w-8 ${metric.color === 'cyan' ? 'text-cyan-400' : 
              metric.color === 'green' ? 'text-green-400' : 
              metric.color === 'purple' ? 'text-purple-400' : 'text-amber-400'} glow-icon`} />
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className={`${
              metric.changeType === 'positive' ? 'text-green-400' : 
              metric.changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
            } font-medium`}>
              {metric.change}
            </span>
            <span className={`ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              vs last week
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}