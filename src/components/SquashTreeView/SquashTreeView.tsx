import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, X, RefreshCw, TestTube, ArrowLeft, GripVertical } from 'lucide-react';
import { SquashTreeNode } from '../../types/squash';
import { squashApiService } from '../../services/squashApi';
import { squashApiProxyService } from '../../services/squashApiProxy';

interface SquashTreeViewProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCaseSelect?: (testCase: SquashTreeNode) => void;
}

interface TreeNodeProps {
  node: SquashTreeNode;
  level: number;
  onToggle: (nodeId: string) => Promise<void>;
  onTestCaseSelect?: (testCase: SquashTreeNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onToggle, onTestCaseSelect }) => {
  const hasChildren = node.hasChildren || (node.children && node.children.length > 0);
  const isExpanded = node.expanded;
  const isLoading = node.loading;

  const getIcon = () => {
    switch (node.type) {
      case 'project':
        return <TestTube className="h-4 w-4 text-blue-400" />;
      case 'folder':
        return isExpanded ? 
          <FolderOpen className="h-4 w-4 text-yellow-400" /> : 
          <Folder className="h-4 w-4 text-yellow-400" />;
      case 'testcase':
        return <FileText className="h-4 w-4 text-green-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleClick = async () => {
    if (node.type === 'testcase' && onTestCaseSelect) {
      onTestCaseSelect(node);
    } else if (hasChildren) {
      await onToggle(node.id);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer rounded transition-colors ${
          node.type === 'testcase' ? 'hover:bg-green-900/20' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center min-w-0 flex-1">
          {hasChildren && (
            <button
              className="mr-1 p-0.5 hover:bg-gray-600 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 text-gray-400 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-1" />}
          
          <div className="mr-2 flex-shrink-0">
            {getIcon()}
          </div>
          
          <span className="text-sm text-gray-200 truncate" title={node.name}>
            {node.name}
          </span>
          
          {node.type === 'testcase' && node.testCase && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-600 text-gray-300 rounded">
              {node.testCase.importance}
            </span>
          )}
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onTestCaseSelect={onTestCaseSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SquashTreeView({ isOpen, onClose, onTestCaseSelect }: SquashTreeViewProps) {
  const [treeData, setTreeData] = useState<SquashTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const loadTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try main service first, fallback to proxy service
      let projects;
      try {
        projects = await squashApiService.loadRootProjects();
      } catch (mainError) {
        console.warn('Main API service failed, trying proxy service:', mainError);
        projects = await squashApiProxyService.loadRootProjects();
      }
      setTreeData(projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SquashTM projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && treeData.length === 0) {
      loadTreeData();
    }
  }, [isOpen]);

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const toggleNode = async (nodeId: string) => {
    const updateNodeExpansion = (nodes: SquashTreeNode[]): SquashTreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          if (!node.expanded && node.hasChildren && !node.children) {
            // Mark as loading
            return { ...node, loading: true };
          }
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNodeExpansion(node.children) };
        }
        return node;
      });
    };

    // First update to show loading state
    setTreeData(updateNodeExpansion(treeData));

    // Find the node to expand
    const findNode = (nodes: SquashTreeNode[], id: string): SquashTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findNode(treeData, nodeId);
    
    if (targetNode && !targetNode.expanded && targetNode.hasChildren && !targetNode.children) {
      try {
        let children: SquashTreeNode[] = [];
        
        if (targetNode.type === 'project') {
          try {
            children = await squashApiService.loadProjectChildren(targetNode.squashId);
          } catch (mainError) {
            console.warn('Main API service failed for project children, trying proxy:', mainError);
            children = await squashApiProxyService.loadProjectChildren(targetNode.squashId);
          }
        } else if (targetNode.type === 'folder') {
          try {
            children = await squashApiService.loadFolderChildren(targetNode.squashId);
          } catch (mainError) {
            console.warn('Main API service failed for folder children, trying proxy:', mainError);
            children = await squashApiProxyService.loadFolderChildren(targetNode.squashId);
          }
        }

        // Update with loaded children
        const updateWithChildren = (nodes: SquashTreeNode[]): SquashTreeNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { 
                ...node, 
                children, 
                expanded: true, 
                loading: false,
                hasChildren: children.length > 0
              };
            }
            if (node.children) {
              return { ...node, children: updateWithChildren(node.children) };
            }
            return node;
          });
        };

        setTreeData(updateWithChildren(treeData));
      } catch (error) {
        console.error('Error loading children:', error);
        // Remove loading state on error
        const removeLoading = (nodes: SquashTreeNode[]): SquashTreeNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, loading: false };
            }
            if (node.children) {
              return { ...node, children: removeLoading(node.children) };
            }
            return node;
          });
        };
        setTreeData(removeLoading(treeData));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`relative bg-gray-800 border-r border-gray-700 flex flex-col transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: `${width}px`, minWidth: '300px', maxWidth: '800px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <TestTube className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">SquashTM Test Cases</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadTreeData}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mr-2" />
              <span className="text-gray-400">Loading projects...</span>
            </div>
          )}

          {error && (
            <div className="p-4">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={loadTreeData}
                  className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && treeData.length === 0 && (
            <div className="p-4 text-center">
              <TestTube className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No projects found</p>
              <p className="text-gray-500 text-xs mt-1">Check your SquashTM connection</p>
            </div>
          )}

          {!loading && !error && treeData.length > 0 && (
            <div className="p-2">
              {treeData.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  onToggle={toggleNode}
                  onTestCaseSelect={onTestCaseSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            Expand projects → folders → test cases to configure them
          </p>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-600 hover:bg-gray-500 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}