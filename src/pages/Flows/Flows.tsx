import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, GitBranch, Play, Edit, Trash2, TestTube, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistanceToNow } from '../../utils/dateUtils';
import SquashTreeView from '../../components/SquashTreeView/SquashTreeView';
import { SquashTreeNode } from '../../types/squash';
import { useSquashIntegration } from '../../hooks/useSquashIntegration';
import TestCaseTable from '../../components/TestCaseTable/TestCaseTable';

export default function Flows() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSquashTreeOpen, setIsSquashTreeOpen] = useState(false);
  const { selectedTestCase, setSelectedTestCase, createFlowFromTestCase } = useSquashIntegration();

  const filteredFlows = state.flows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || flow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/50 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
      case 'draft':
        return 'bg-amber-900/50 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
    }
  };

  const handleDeleteFlow = (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this flow?')) {
      dispatch({ type: 'DELETE_FLOW', payload: flowId });
    }
  };

  const handleTestCaseSelect = (testCase: SquashTreeNode) => {
    setSelectedTestCase(testCase);
    setIsSquashTreeOpen(false);
    
    // Check if test case is already configured
    const existingFlow = state.flows.find(flow => flow.squashTestCaseId === testCase.squashId);
    
    if (existingFlow) {
      // Navigate to existing flow with pre-filled data
      navigate(`/flows/builder/${existingFlow.id}`);
    } else {
      // Create new flow from test case
      handleCreateFlowFromTestCase();
    }
  };

  const handleCreateFlowFromTestCase = () => {
    if (selectedTestCase) {
      try {
        const flowData = createFlowFromTestCase(selectedTestCase);
        // Navigate to flow builder with pre-filled data
        navigate('/flows/builder', { state: { flowData, testCase: selectedTestCase } });
      } catch (error) {
        console.error('Error creating flow from test case:', error);
      }
    }
  };

  const handleTableTestCaseSelect = (flow: Flow) => {
    // Navigate to flow builder for editing
    navigate(`/flows/builder/${flow.id}`);
  };

  const toggleSquashTree = () => {
    setIsSquashTreeOpen(!isSquashTreeOpen);
  };

  return (
    <div className="flex h-full">
      {/* SquashTM Tree View Overlay */}
      <SquashTreeView
        isOpen={isSquashTreeOpen}
        onClose={() => setIsSquashTreeOpen(false)}
        onTestCaseSelect={handleTestCaseSelect}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Test Cases
            </h1>
          </div>
          <button
            onClick={toggleSquashTree}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            Configure Testcase
          </button>
        </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search flows..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <TestCaseTable 
        flows={filteredFlows}
        onDeleteFlow={(flowId) => dispatch({ type: 'DELETE_FLOW', payload: flowId })}
        onTestCaseSelect={handleTableTestCaseSelect}
      />

        {/* Selected Test Case Info */}
        {selectedTestCase && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TestTube className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Selected Test Case:</span>
                <span className="text-sm text-white">{selectedTestCase.name}</span>
              </div>
              <button
                onClick={() => setSelectedTestCase(null)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedTestCase.testCase && (
              <div className="space-y-2">
                <div className="text-xs text-blue-200">
                  Path: {selectedTestCase.path} | Importance: {selectedTestCase.testCase.importance} | Status: {selectedTestCase.testCase.status}
                </div>
                {selectedTestCase.testCase.description && (
                  <div className="text-xs text-gray-300">
                    {selectedTestCase.testCase.description}
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={handleCreateFlowFromTestCase}
                    className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Flow
                  </button>
                  <span className="text-xs text-gray-400">
                    {selectedTestCase.testCase.steps?.length || 0} steps
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}