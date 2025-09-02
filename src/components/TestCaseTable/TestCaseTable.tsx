import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Edit, Trash2, ChevronLeft, ChevronRight, GitBranch } from 'lucide-react';
import { Flow } from '../../types';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface TestCaseTableProps {
  flows: Flow[];
  onDeleteFlow: (flowId: string) => void;
  onTestCaseSelect?: (flow: Flow) => void;
}

const ITEMS_PER_PAGE = 20;

export default function TestCaseTable({ flows, onDeleteFlow, onTestCaseSelect }: TestCaseTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(flows.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFlows = flows.slice(startIndex, endIndex);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (flow: Flow) => {
    if (onTestCaseSelect) {
      onTestCaseSelect(flow);
    } else {
      router.push(`/flows/builder/${flow.id}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50 border-b border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Test Case Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Steps
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentFlows.map((flow) => (
                <tr
                  key={flow.id}
                  className="hover:bg-gray-700/30 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(flow)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 text-purple-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-white">{flow.name}</div>
                        {flow.squashTestCaseId && (
                          <div className="text-xs text-blue-400">
                            SquashTM ID: {flow.squashTestCaseId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 max-w-xs truncate" title={flow.description}>
                      {flow.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full border text-xs font-medium capitalize ${getStatusColor(flow.status)}`}>
                      {flow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-cyan-400 font-medium">{flow.steps.length}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">{formatDistanceToNow(flow.updatedAt)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/flows/builder/${flow.id}`);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Trigger execution
                        }}
                        className="text-green-400 hover:text-green-300 transition-colors p-1"
                        title="Run"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this test case?')) {
                            onDeleteFlow(flow.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentFlows.length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No test cases found</h3>
            <p className="text-gray-500">
              Configure your first test case from SquashTM to get started
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, flows.length)} of {flows.length} test cases
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}