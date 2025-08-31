import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, Filter, Clock, CheckCircle, XCircle, Loader, RotateCcw, GitBranch } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistanceToNow } from '../../utils/dateUtils';

export default function Executions() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredExecutions = [...state.executions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .filter(execution => {
      const matchesSearch = execution.flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           execution.triggeredBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'running':
        return <Loader className="h-5 w-5 text-cyan-400 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/50 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-900/50 text-red-400 border-red-500/30';
      case 'running':
        return 'bg-cyan-900/50 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
    }
  };

  const getDuration = (execution: any) => {
    if (!execution.endTime) {
      const now = new Date();
      const start = new Date(execution.startTime);
      const duration = Math.round((now.getTime() - start.getTime()) / 1000 / 60);
      return `${duration}m (running)`;
    }
    const start = new Date(execution.startTime);
    const end = new Date(execution.endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration}m`;
  };

  const getProgressPercentage = (execution: any) => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed') return 100;
    
    const completedPipelines = execution.pipelineExecutions.filter(p => 
      p.status === 'passed' || p.status === 'failed'
    ).length;
    const totalSteps = execution.flow.steps.length;
    return totalSteps > 0 ? (completedPipelines / totalSteps) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Executions
        </h1>
        <div className="text-sm text-gray-400">
          {filteredExecutions.length} executions
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50 border-b border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Flow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Triggered By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredExecutions.map((execution, index) => (
                <tr
                  key={execution.id}
                  className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/executions/${execution.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 text-purple-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-white">{execution.flow.name}</div>
                        <div className="text-xs text-gray-400">{execution.pipelineExecutions.length} pipelines</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      <span className={`px-2 py-1 rounded-full border text-xs font-medium capitalize ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          execution.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                          execution.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                          'bg-gradient-to-r from-cyan-500 to-purple-500'
                        }`}
                        style={{ width: `${getProgressPercentage(execution)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.round(getProgressPercentage(execution))}%
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {getDuration(execution)}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {execution.triggeredBy}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDistanceToNow(execution.startTime)} ago
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Replay execution
                      }}
                      className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                      title="Replay Execution"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredExecutions.length === 0 && (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No executions found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Execute a flow to see execution history here'
            }
          </p>
        </div>
      )}
    </div>
  );
}