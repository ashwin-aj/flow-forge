import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ExecutionChart() {
  const { state } = useApp();
  const { theme } = state;
  
  // Generate daily execution data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const chartData = last7Days.map(date => {
    const dayExecutions = state.executions.filter(exec => {
      const execDate = new Date(exec.startTime);
      return execDate.toDateString() === date.toDateString();
    });
    
    const completed = dayExecutions.filter(e => e.status === 'completed').length;
    const failed = dayExecutions.filter(e => e.status === 'failed').length;
    const total = dayExecutions.length;
    
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completed,
      failed,
      total,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  });

  const maxValue = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className={`border rounded-xl p-6 fade-in ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold flex items-center ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <BarChart3 className="h-5 w-5 mr-2 text-cyan-400" />
          Execution Trends
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end h-32">
          {chartData.map((day, index) => (
            <div key={day.date} className="flex flex-col items-center space-y-2 flex-1">
              <div className={`relative w-8 rounded-t-md overflow-hidden ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                {day.total > 0 && (
                  <>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 transition-all duration-1000 rounded-t-md"
                      style={{ 
                        height: `${(day.completed / maxValue) * 100}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500 to-red-400 transition-all duration-1000"
                      style={{ 
                        height: `${(day.failed / maxValue) * 100}%`,
                        transform: `translateY(${(day.completed / maxValue) * 100}%)`,
                        animationDelay: `${index * 100 + 50}ms`
                      }}
                    />
                  </>
                )}
              </div>
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {day.date}
              </span>
              <span className="text-xs text-cyan-400 font-medium">{day.total}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Completed
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Failed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}