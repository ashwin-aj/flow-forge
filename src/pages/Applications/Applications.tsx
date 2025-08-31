import React, { useState } from 'react';
import { Plus, Search, Server, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ApplicationModal from './ApplicationModal';
import { Application } from '../../types';

export default function Applications() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  const filteredApplications = state.applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.gitlabProjectId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/50 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
      default:
        return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
    }
  };

  const handleSaveApplication = (application: Application) => {
    if (editingApplication) {
      dispatch({ type: 'UPDATE_APPLICATION', payload: application });
    } else {
      dispatch({ type: 'ADD_APPLICATION', payload: application });
    }
    setShowModal(false);
    setEditingApplication(null);
  };

  const handleEditApplication = (application: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingApplication(application);
    setShowModal(true);
  };

  const handleDeleteApplication = (applicationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this application?')) {
      dispatch({ type: 'DELETE_APPLICATION', payload: applicationId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Applications
        </h1>
        <button 
          onClick={() => {
            setEditingApplication(null);
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplications.map((app, index) => (
          <div
            key={app.id}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 card-hover"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Server className="h-8 w-8 text-cyan-400 glow-icon" />
                <div>
                  <h3 className="font-semibold text-white">{app.name}</h3>
                  <p className="text-sm text-gray-400">{app.gitlabProjectId}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full border text-xs font-medium capitalize ${getStatusColor(app.status)}`}>
                {app.status}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-4">{app.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <a
                href={`https://gitlab.com/${app.gitlabProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                GitLab
              </a>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={(e) => handleEditApplication(app, e)}
                  className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteApplication(app.id, e)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <Server className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No applications found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Add your first application to start creating flows'
            }
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Application
          </button>
        </div>
      )}

      {showModal && (
        <ApplicationModal
          application={editingApplication}
          onSave={handleSaveApplication}
          onClose={() => {
            setShowModal(false);
            setEditingApplication(null);
          }}
        />
      )}
    </div>
  );
}