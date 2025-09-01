import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-community';
import { RefreshCw, TestTube, AlertCircle, CheckCircle, X } from 'lucide-react';
import { SquashTestCase } from '../../types/squash';
import { squashApiService } from '../../services/squashApiService';
import { Flow } from '../../types';
import { isTestCaseConfigured } from '../../utils/testCaseHelpers';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine-dark.css';

interface SquashGridProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCaseSelect: (testCase: SquashTestCase) => void;
  flows: Flow[];
}

interface GridRowData extends SquashTestCase {
  isConfigured: boolean;
  configuredFlowId?: string;
}

export default function SquashGrid({ isOpen, onClose, onTestCaseSelect, flows }: SquashGridProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check connection status
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const isHealthy = await squashApiService.healthCheck();
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
      if (!isHealthy) {
        setError('Unable to connect to SquashTM API. Please check your connection and token.');
      } else {
        setError(null);
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Connection check failed. Please verify your SquashTM configuration.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen, checkConnection]);

  // Status cell renderer
  const StatusCellRenderer = (params: any) => {
    const { isConfigured, status } = params.data;
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'APPROVED' ? 'bg-green-900/50 text-green-400' :
          status === 'UNDER_REVIEW' ? 'bg-amber-900/50 text-amber-400' :
          status === 'WORK_IN_PROGRESS' ? 'bg-blue-900/50 text-blue-400' :
          'bg-gray-700/50 text-gray-400'
        }`}>
          {status}
        </span>
        {isConfigured && (
          <CheckCircle className="h-4 w-4 text-green-400" title="Configured in Orkestra" />
        )}
      </div>
    );
  };

  // Importance cell renderer
  const ImportanceCellRenderer = (params: any) => {
    const { importance } = params.data;
    const color = importance === 'VERY_HIGH' ? 'text-red-400' :
                 importance === 'HIGH' ? 'text-orange-400' :
                 importance === 'MEDIUM' ? 'text-yellow-400' :
                 'text-gray-400';
    
    return <span className={`font-medium ${color}`}>{importance}</span>;
  };

  // Action cell renderer
  const ActionCellRenderer = (params: any) => {
    const { isConfigured } = params.data;
    
    return (
      <button
        onClick={() => onTestCaseSelect(params.data)}
        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
          isConfigured 
            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
            : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {isConfigured ? 'Edit' : 'Configure'}
      </button>
    );
  };

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'ID',
      field: 'id',
      width: 80,
      pinned: 'left',
      cellClass: 'text-cyan-400 font-mono'
    },
    {
      headerName: 'Reference',
      field: 'reference',
      width: 120,
      cellClass: 'text-purple-400 font-medium'
    },
    {
      headerName: 'Name',
      field: 'name',
      flex: 1,
      minWidth: 200,
      cellClass: 'text-white font-medium',
      tooltipField: 'name'
    },
    {
      headerName: 'Description',
      field: 'description',
      flex: 1,
      minWidth: 250,
      cellClass: 'text-gray-300',
      tooltipField: 'description'
    },
    {
      headerName: 'Importance',
      field: 'importance',
      width: 120,
      cellRenderer: ImportanceCellRenderer
    },
    {
      headerName: 'Type',
      field: 'type.label',
      width: 100,
      cellClass: 'text-gray-300'
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 150,
      cellRenderer: StatusCellRenderer
    },
    {
      headerName: 'Project',
      field: 'project.name',
      width: 150,
      cellClass: 'text-blue-400'
    },
    {
      headerName: 'Actions',
      width: 100,
      pinned: 'right',
      cellRenderer: ActionCellRenderer,
      sortable: false,
      filter: false
    }
  ], []);

  // Server-side datasource
  const datasource: IServerSideDatasource = useMemo(() => ({
    getRows: async (params: IServerSideGetRowsParams) => {
      setLoading(true);
      setError(null);

      try {
        const page = Math.floor(params.startRow / 100);
        const size = params.endRow - params.startRow;

        const { testCases, totalElements } = await squashApiService.getTestCases({
          page,
          size,
          fields: 'name,reference,description,importance,nature,type,status,project'
        });

        // Enhance test cases with configuration status
        const enhancedTestCases: GridRowData[] = testCases.map(testCase => {
          const configuredFlow = isTestCaseConfigured(flows, testCase.id);
          return {
            ...testCase,
            isConfigured: !!configuredFlow,
            configuredFlowId: configuredFlow?.id
          };
        });

        setTotalRows(totalElements);

        params.success({
          rowData: enhancedTestCases,
          rowCount: totalElements
        });

      } catch (err) {
        console.error('Error loading test cases:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load test cases';
        setError(errorMessage);
        params.fail();
      } finally {
        setLoading(false);
      }
    }
  }), [flows]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.setServerSideDatasource(datasource);
  }, [datasource]);

  const handleRefresh = useCallback(() => {
    if (gridApi) {
      gridApi.refreshServerSide({ purge: true });
    }
  }, [gridApi]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to SquashTM';
      case 'disconnected':
        return 'Disconnected from SquashTM';
      default:
        return 'Checking connection...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Grid Panel */}
      <div className="relative bg-gray-800 border-r border-gray-700 flex flex-col w-full max-w-7xl mx-auto m-4 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-3">
            <TestTube className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">SquashTM Test Cases</h2>
              <div className="flex items-center space-x-2 text-sm">
                {getConnectionStatusIcon()}
                <span className={`${
                  connectionStatus === 'connected' ? 'text-green-400' :
                  connectionStatus === 'disconnected' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {getConnectionStatusText()}
                </span>
                {totalRows > 0 && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{totalRows} test cases</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading || connectionStatus === 'disconnected'}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900/20 border-b border-red-500/30">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={checkConnection}
                className="ml-auto text-red-300 hover:text-red-200 text-xs underline"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Grid Container */}
        <div className="flex-1 ag-theme-alpine-dark">
          <AgGridReact
            columnDefs={columnDefs}
            rowModelType="serverSide"
            onGridReady={onGridReady}
            serverSideStoreType="partial"
            cacheBlockSize={100}
            maxBlocksInCache={10}
            animateRows={true}
            enableCellTextSelection={true}
            suppressRowClickSelection={true}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              menuTabs: ['filterMenuTab', 'generalMenuTab']
            }}
            loadingOverlayComponent={() => (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mr-2" />
                <span className="text-gray-400">Loading test cases...</span>
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col items-center justify-center p-8">
                <TestTube className="h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No test cases found</h3>
                <p className="text-gray-500 text-center">
                  {connectionStatus === 'disconnected' 
                    ? 'Check your SquashTM connection and try again'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            )}
            className="h-full"
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Select a test case to configure it in Orkestra</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Configured</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>Circuit Breaker: {squashApiService.getCircuitBreakerStatus().isOpen ? 'Open' : 'Closed'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}