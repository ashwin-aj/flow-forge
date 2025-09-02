import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, TestTube } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SquashGrid from '../../components/SquashGrid/SquashGrid';
import { SquashTestCase } from '../../types/squash';
import { useSquashGrid } from '../../hooks/useSquashGrid';
import TestCaseTable from '../../components/TestCaseTable/TestCaseTable';
import { generateFlowFromSquashTestCase } from '../../utils/testCaseHelpers';

export default function Flows() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    selectedTestCase,
    setSelectedTestCase,
    isGridOpen,
    openGrid,
    closeGrid,
    handleTestCaseSelect,
    getTestCaseStatus
  } = useSquashGrid(state.flows);

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

  const handleSquashTestCaseSelect = (testCase: SquashTestCase) => {
    handleTestCaseSelect(testCase);
    
    // Check if test case is already configured
    const existingFlow = state.flows.find(flow => flow.squashTestCaseId === testCase.id);
    
    if (existingFlow) {
      // Navigate to existing flow with pre-filled data
      router.push(`/flows/builder/${existingFlow.id}`);
    } else {
      // Create new flow from test case
      handleCreateFlowFromTestCase();
    }
  };

  const handleCreateFlowFromTestCase = () => {
    if (selectedTestCase) {
      try {
        const flowData = generateFlowFromSquashTestCase(selectedTestCase);
        // Create new flow and navigate to builder
        const newFlow: Flow = {
          id: `flow-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          steps: [],
          ...flowData
        } as Flow;
        
        dispatch({ type: 'ADD_FLOW', payload: newFlow });
        router.push(`/flows/builder/${newFlow.id}`);
      } catch (error) {
        console.error('Error creating flow from test case:', error);
      }
    }
  };

  const handleTableTestCaseSelect = (flow: Flow) => {
    // Navigate to flow builder for editing
    router.push(`/flows/builder/${flow.id}`);
  };

  return (
    <div className="flex h-full">
      {/* SquashTM Grid Overlay */}
      <SquashGrid
        isOpen={isGridOpen}
        onClose={closeGrid}
        onTestCaseSelect={handleSquashTestCaseSelect}
        flows={state.flows}
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
            onClick={openGrid}
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
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TestTube className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Selected Test Case:</span>
                <span className="text-sm text-white">{selectedTestCase.name}</span>
              </div>
              <button
                onClick={() => setSelectedTestCase(null)}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="text-xs text-green-200">
                  ID: {selectedTestCase.id} | Reference: {selectedTestCase.reference} | Importance: {selectedTestCase.importance} | Status: {selectedTestCase.status}
                </div>
                {selectedTestCase.description && (
                  <div className="text-xs text-gray-300">
                    {selectedTestCase.description}
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={handleCreateFlowFromTestCase}
                    className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Flow
                  </button>
                  <span className="text-xs text-gray-400">
                    {selectedTestCase.steps?.length || 0} steps
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}