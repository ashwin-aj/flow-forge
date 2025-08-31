import React, { useState, useEffect } from 'react';
import { X, Server } from 'lucide-react';
import { Application } from '../../types';

interface ApplicationModalProps {
  application?: Application | null;
  onSave: (application: Application) => void;
  onClose: () => void;
}

export default function ApplicationModal({ application, onSave, onClose }: ApplicationModalProps) {
  const [formData, setFormData] = useState({
    name: application?.name || '',
    gitlabProjectId: application?.gitlabProjectId || '',
    personalAccessToken: application?.personalAccessToken || '',
    description: application?.description || '',
    status: application?.status || 'active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Application name is required';
    if (!formData.gitlabProjectId.trim()) newErrors.gitlabProjectId = 'GitLab project ID is required';
    if (!formData.personalAccessToken.trim()) newErrors.personalAccessToken = 'Personal access token is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const applicationData: Application = {
      id: application?.id || `app-${Date.now()}`,
      name: formData.name.trim(),
      gitlabProjectId: formData.gitlabProjectId.trim(),
      personalAccessToken: formData.personalAccessToken.trim(),
      description: formData.description.trim(),
      status: formData.status
    };

    onSave(applicationData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Server className="h-5 w-5 mr-2 text-cyan-400" />
            {application ? 'Edit Application' : 'Add Application'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Application Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Enter application name..."
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              GitLab Project ID *
            </label>
            <input
              type="text"
              value={formData.gitlabProjectId}
              onChange={(e) => setFormData(prev => ({ ...prev, gitlabProjectId: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="e.g., orkestra/frontend-app"
            />
            {errors.gitlabProjectId && <p className="text-red-400 text-xs mt-1">{errors.gitlabProjectId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Personal Access Token *
            </label>
            <input
              type="password"
              value={formData.personalAccessToken}
              onChange={(e) => setFormData(prev => ({ ...prev, personalAccessToken: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="glpat-xxxxxxxxxxxx"
            />
            {errors.personalAccessToken && <p className="text-red-400 text-xs mt-1">{errors.personalAccessToken}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
              placeholder="Describe what this application does..."
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
            >
              {application ? 'Update Application' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}