import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { squashApiService } from '../../services/squashApiService';
import { tokenManager } from '../../utils/tokenManager';

interface SquashConnectionStatusProps {
  className?: string;
}

export default function SquashConnectionStatus({ className = '' }: SquashConnectionStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'token-expired'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkConnection = async () => {
    setStatus('checking');
    
    try {
      // Check token expiration first
      if (tokenManager.isTokenExpired()) {
        setStatus('token-expired');
        return;
      }

      // Check API connectivity
      const isHealthy = await squashApiService.healthCheck();
      setStatus(isHealthy ? 'connected' : 'disconnected');
      setLastChecked(new Date());
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('disconnected');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'disconnected':
      case 'token-expired':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'SquashTM Connected';
      case 'disconnected':
        return 'SquashTM Disconnected';
      case 'token-expired':
        return 'Token Expired';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'disconnected':
      case 'token-expired':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const circuitBreakerStatus = squashApiService.getCircuitBreakerStatus();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">SquashTM Connection</h3>
              <button
                onClick={checkConnection}
                disabled={status === 'checking'}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={getStatusColor()}>{getStatusText()}</span>
              </div>
              
              {lastChecked && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Checked:</span>
                  <span className="text-gray-300">{lastChecked.toLocaleTimeString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Circuit Breaker:</span>
                <span className={circuitBreakerStatus.isOpen ? 'text-red-400' : 'text-green-400'}>
                  {circuitBreakerStatus.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              {circuitBreakerStatus.failures > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Failures:</span>
                  <span className="text-red-400">{circuitBreakerStatus.failures}</span>
                </div>
              )}

              {status === 'token-expired' && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-red-400 text-xs">
                    Your SquashTM token has expired. Please update it in settings.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-700">
              <button className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors">
                <Settings className="h-3 w-3" />
                <span>Configure SquashTM</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}