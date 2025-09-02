import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Clock, CheckCircle, XCircle, Loader, RotateCcw, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistanceToNow } from '../../utils/dateUtils';
import PipelineTimeline from './PipelineTimeline';

export default function ExecutionDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { state } = useApp();
  
  const execution = state.executions.find(e => e.id === id);
  
  if (!execution) {
    return (
      <div className="text-center py-12">
        <Play className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">Execution not found</h3>
        <button
          onClick={() => router.push('/executions')}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Back to executions
        </button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-400" />;
      case 'running':
        return <Loader className="h-6 w-6 text-cyan-400 animate-spin" />;
      default:
        return <Clock className="h-6 w-6 text-gray-400" />;
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

  const getDuration = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/executions')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              {execution.flow.name}
            </h1>
            <p className="text-gray-400">Execution Details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-600 hover:text-white transition-all duration-200">
            <RotateCcw className="h-4 w-4 mr-2" />
            Replay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Execution Overview</h2>
              <div className="flex items-center space-x-2">
                {getStatusIcon(execution.status)}
                <span className={`px-3 py-1 rounded-full border text-sm font-medium capitalize ${getStatusColor(execution.status)}`}>
                  {execution.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-400 mb-1">{execution.pipelineExecutions.length}</div>
                <div className="text-sm text-gray-400">Total Pipelines</div>
              </div>
              
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {execution.pipelineExecutions.filter(p => p.status === 'passed').length}
                </div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">{getDuration()}</div>
                <div className="text-sm text-gray-400">Duration</div>
              </div>
            </div>
          </div>

          <PipelineTimeline execution={execution} />
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Execution Info</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-400">Triggered by:</span>
                <div className="text-white font-medium mt-1">{execution.triggeredBy}</div>
              </div>
              
              <div>
                <span className="text-gray-400">Started:</span>
                <div className="text-white font-medium mt-1">
                  {new Date(execution.startTime).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(execution.startTime)} ago
                </div>
              </div>
              
              {execution.endTime && (
                <div>
                  <span className="text-gray-400">Completed:</span>
                  <div className="text-white font-medium mt-1">
                    {new Date(execution.endTime).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Runtime Variables</h3>
            
            <div className="space-y-2">
              {Object.entries(execution.runtimeVariables).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm">
                  <span className="text-gray-300 font-medium">{key}</span>
                  <span className="text-cyan-400">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}