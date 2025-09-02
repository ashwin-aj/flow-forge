import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Flow, FlowStep } from '../../types';
import FlowStepCard from './FlowStepCard';
import StepModal from './StepModal';

export default function FlowBuilder() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id?.[0];
  const { state, dispatch } = useApp();
  
  const [flow, setFlow] = useState<Flow>({
    id: id || `flow-${Date.now()}`,
    name: '',
    description: '',
    steps: [],
    globalVariables: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  });
  
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);

  useEffect(() => {
    if (id) {
      const existingFlow = state.flows.find(f => f.id === id);
      if (existingFlow) {
        setFlow(existingFlow);
      }
    }
  }, [id, state.flows]);

  const handleSave = () => {
    const updatedFlow = {
      ...flow,
      updatedAt: new Date().toISOString(),
      status: flow.steps.length > 0 ? 'active' : 'draft'
    };

    if (id && state.flows.find(f => f.id === id)) {
      dispatch({ type: 'UPDATE_FLOW', payload: updatedFlow });
    } else {
      dispatch({ type: 'ADD_FLOW', payload: updatedFlow });
    }

    router.push('/flows');
  };

  const handleAddStep = (step: FlowStep) => {
    setFlow(prev => ({
      ...prev,
      steps: [...prev.steps, { ...step, order: prev.steps.length + 1 }]
    }));
    setShowStepModal(false);
  };

  const handleUpdateStep = (updatedStep: FlowStep) => {
    setFlow(prev => ({
      ...prev,
      steps: prev.steps.map(step => step.id === updatedStep.id ? updatedStep : step)
    }));
    setEditingStep(null);
    setShowStepModal(false);
  };

  const handleDeleteStep = (stepId: string) => {
    setFlow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 }))
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/flows')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            {id ? 'Edit Flow' : 'Create Flow'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {flow.steps.length > 0 && (
            <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:from-green-500 hover:to-green-400 transition-all duration-200 shadow-lg hover:shadow-green-500/25">
              <Play className="h-4 w-4 mr-2" />
              Execute
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Flow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Flow Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Flow Name
                </label>
                <input
                  type="text"
                  value={flow.name}
                  onChange={(e) => setFlow(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Enter flow name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={flow.description}
                  onChange={(e) => setFlow(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe what this flow does..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Flow Steps</h2>
              <button
                onClick={() => {
                  setEditingStep(null);
                  setShowStepModal(true);
                }}
                className="flex items-center px-3 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </button>
            </div>

            {flow.steps.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                <Play className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No steps configured</h3>
                <p className="text-gray-500 mb-4">Add your first step to start building the flow</p>
                <button
                  onClick={() => setShowStepModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Step
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {flow.steps.map((step, index) => (
                  <FlowStepCard
                    key={step.id}
                    step={step}
                    isLast={index === flow.steps.length - 1}
                    onEdit={() => {
                      setEditingStep(step);
                      setShowStepModal(true);
                    }}
                    onDelete={() => handleDeleteStep(step.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Global Variables</h3>
            
            <div className="space-y-3">
              {Object.entries(flow.globalVariables).length === 0 ? (
                <p className="text-sm text-gray-400">No global variables defined</p>
              ) : (
                Object.entries(flow.globalVariables).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-300">{key}</span>
                    <span className="text-sm text-cyan-400">{String(value)}</span>
                  </div>
                ))
              )}
              
              <button className="w-full px-3 py-2 border-2 border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-all">
                Add Variable
              </button>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Flow Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Steps:</span>
                <span className="text-white font-medium">{flow.steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Applications:</span>
                <span className="text-white font-medium">
                  {new Set(flow.steps.map(s => s.applicationId)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium capitalize ${
                  flow.status === 'active' ? 'text-green-400' :
                  flow.status === 'draft' ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {flow.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStepModal && (
        <StepModal
          step={editingStep}
          applications={state.applications}
          onSave={editingStep ? handleUpdateStep : handleAddStep}
          onClose={() => {
            setShowStepModal(false);
            setEditingStep(null);
          }}
        />
      )}
    </div>
  );
}