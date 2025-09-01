import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RefreshCw, TestTube, AlertCircle, CheckCircle, X, Search } from 'lucide-react';
import { SquashTestCase, SquashProject, SquashFolder } from '../../types/squash';
import { squashApiService } from '../../services/squashApiService';
import { Flow } from '../../types';
import { isTestCaseConfigured } from '../../utils/testCaseHelpers';
import 'primereact/resources/themes/lara-dark-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface SquashGridProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCaseSelect: (testCase: SquashTestCase) => void;
  flows: Flow[];
}

interface TreeNode {
  key: string;
  data: {
    id: number;
    name: string;
    type: 'project' | 'folder' | 'testcase';
    reference?: string;
    description?: string;
    importance?: string;
    status?: string;
    isConfigured?: boolean;
    testCase?: SquashTestCase;
  };
  children?: TreeNode[];
  leaf?: boolean;
  loading?: boolean;
}

export default function SquashGrid({ isOpen, onClose, onTestCaseSelect, flows }: SquashGridProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const dt = useRef<any>(null);

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

  // Load initial projects
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { projects } = await squashApiService.getProjects({ page: 0, size: 10 });
      
      const projectNodes: TreeNode[] = projects.map(project => ({
        key: `project-${project.id}`,
        data: {
          id: project.id,
          name: project.name,
          type: 'project',
          description: project.description
        },
        children: [],
        leaf: false
      }));

      setNodes(projectNodes);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load folders for a project
  const loadProjectFolders = useCallback(async (projectId: number): Promise<TreeNode[]> => {
    try {
      const { folders } = await squashApiService.getProjectFolders(projectId, { page: 0, size: 50 });
      
      return folders.map(folder => ({
        key: `folder-${folder.id}`,
        data: {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          description: folder.description
        },
        children: [],
        leaf: false
      }));
    } catch (err) {
      console.error('Error loading project folders:', err);
      return [];
    }
  }, []);

  // Load folder children (subfolders and test cases)
  const loadFolderChildren = useCallback(async (folderId: number): Promise<TreeNode[]> => {
    try {
      const { folders, testCases } = await squashApiService.getFolderChildren(folderId);
      
      const folderNodes: TreeNode[] = folders.map(folder => ({
        key: `folder-${folder.id}`,
        data: {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          description: folder.description
        },
        children: [],
        leaf: false
      }));

      const testCaseNodes: TreeNode[] = testCases.map(testCase => {
        const configuredFlow = isTestCaseConfigured(flows, testCase.id);
        return {
          key: `testcase-${testCase.id}`,
          data: {
            id: testCase.id,
            name: testCase.name,
            type: 'testcase',
            reference: testCase.reference,
            description: testCase.description,
            importance: testCase.importance,
            status: testCase.status,
            isConfigured: !!configuredFlow,
            testCase
          },
          leaf: true
        };
      });

      return [...folderNodes, ...testCaseNodes];
    } catch (err) {
      console.error('Error loading folder children:', err);
      return [];
    }
  }, [flows]);

  // Handle node expansion (lazy loading)
  const onExpand = useCallback(async (event: any) => {
    const node = event.node;
    const nodeKey = node.key;
    
    if (node.children && node.children.length > 0) {
      return; // Already loaded
    }

    // Set loading state
    setNodes(prevNodes => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(n => {
          if (n.key === nodeKey) {
            return { ...n, loading: true };
          }
          if (n.children) {
            return { ...n, children: updateNode(n.children) };
          }
          return n;
        });
      };
      return updateNode(prevNodes);
    });

    try {
      let children: TreeNode[] = [];

      if (node.data.type === 'project') {
        children = await loadProjectFolders(node.data.id);
      } else if (node.data.type === 'folder') {
        children = await loadFolderChildren(node.data.id);
      }

      // Update node with loaded children
      setNodes(prevNodes => {
        const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
            if (n.key === nodeKey) {
              return { ...n, children, loading: false, leaf: children.length === 0 };
            }
            if (n.children) {
              return { ...n, children: updateNode(n.children) };
            }
            return n;
          });
        };
        return updateNode(prevNodes);
      });

      // Auto-expand the node
      setExpandedKeys(prev => ({ ...prev, [nodeKey]: true }));

    } catch (err) {
      console.error('Error expanding node:', err);
      // Remove loading state on error
      setNodes(prevNodes => {
        const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
            if (n.key === nodeKey) {
              return { ...n, loading: false };
            }
            if (n.children) {
              return { ...n, children: updateNode(n.children) };
            }
            return n;
          });
        };
        return updateNode(prevNodes);
      });
    }
  }, [loadProjectFolders, loadFolderChildren]);

  // Initialize data
  useEffect(() => {
    if (isOpen && connectionStatus === 'connected') {
      loadProjects();
    }
  }, [isOpen, connectionStatus, loadProjects]);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen, checkConnection]);

  // Column templates
  const nameTemplate = (node: any) => {
    const { data } = node;
    const icon = data.type === 'project' ? 'pi pi-folder' :
                 data.type === 'folder' ? 'pi pi-folder-open' :
                 'pi pi-file';
    
    return (
      <div className="flex items-center space-x-2">
        <i className={`${icon} text-cyan-400`}></i>
        <span className="text-white font-medium">{data.name}</span>
        {data.isConfigured && (
          <CheckCircle className="h-4 w-4 text-green-400" title="Configured in Orkestra" />
        )}
      </div>
    );
  };

  const statusTemplate = (node: any) => {
    const { data } = node;
    if (data.type !== 'testcase' || !data.status) return null;
    
    const statusColor = data.status === 'APPROVED' ? 'bg-green-900/50 text-green-400' :
                       data.status === 'UNDER_REVIEW' ? 'bg-amber-900/50 text-amber-400' :
                       data.status === 'WORK_IN_PROGRESS' ? 'bg-blue-900/50 text-blue-400' :
                       'bg-gray-700/50 text-gray-400';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
        {data.status}
      </span>
    );
  };

  const importanceTemplate = (node: any) => {
    const { data } = node;
    if (data.type !== 'testcase' || !data.importance) return null;
    
    const color = data.importance === 'VERY_HIGH' ? 'text-red-400' :
                 data.importance === 'HIGH' ? 'text-orange-400' :
                 data.importance === 'MEDIUM' ? 'text-yellow-400' :
                 'text-gray-400';
    
    return <span className={`font-medium ${color}`}>{data.importance}</span>;
  };

  const actionTemplate = (node: any) => {
    const { data } = node;
    if (data.type !== 'testcase') return null;
    
    return (
      <Button
        label={data.isConfigured ? 'Edit' : 'Configure'}
        size="small"
        className={`p-button-sm ${
          data.isConfigured 
            ? 'p-button-info' 
            : 'p-button-success'
        }`}
        onClick={() => data.testCase && onTestCaseSelect(data.testCase)}
      />
    );
  };

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
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search test cases..."
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <Button
              icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={() => {
                checkConnection();
                if (connectionStatus === 'connected') {
                  loadProjects();
                }
              }}
              disabled={loading || connectionStatus === 'disconnected'}
              className="p-button-outlined p-button-secondary"
              tooltip="Refresh"
            />
            <Button
              icon={<X className="h-4 w-4" />}
              onClick={onClose}
              className="p-button-outlined p-button-secondary"
              tooltip="Close"
            />
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

        {/* TreeTable Container */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-gray-900 rounded-lg border border-gray-700">
            <TreeTable
              ref={dt}
              value={nodes}
              expandedKeys={expandedKeys}
              onToggle={(e) => setExpandedKeys(e.value)}
              onExpand={onExpand}
              loading={loading}
              globalFilter={globalFilter}
              className="p-treetable-sm"
              scrollable
              scrollHeight="100%"
              virtualScrollerOptions={{ itemSize: 46 }}
              emptyMessage={
                <div className="flex flex-col items-center justify-center p-8">
                  <TestTube className="h-12 w-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No test cases found</h3>
                  <p className="text-gray-500 text-center">
                    {connectionStatus === 'disconnected' 
                      ? 'Check your SquashTM connection and try again'
                      : 'Try adjusting your search criteria or expand project folders'
                    }
                  </p>
                </div>
              }
            >
              <Column 
                field="name" 
                header="Name" 
                expander 
                body={nameTemplate}
                style={{ width: '40%' }}
                className="text-white"
              />
              <Column 
                field="reference" 
                header="Reference" 
                style={{ width: '15%' }}
                className="text-purple-400 font-mono"
              />
              <Column 
                field="description" 
                header="Description" 
                style={{ width: '25%' }}
                className="text-gray-300"
              />
              <Column 
                field="importance" 
                header="Importance" 
                body={importanceTemplate}
                style={{ width: '10%' }}
              />
              <Column 
                field="status" 
                header="Status" 
                body={statusTemplate}
                style={{ width: '10%' }}
              />
              <Column 
                header="Actions" 
                body={actionTemplate}
                style={{ width: '10%' }}
                className="text-center"
              />
            </TreeTable>
          </div>
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