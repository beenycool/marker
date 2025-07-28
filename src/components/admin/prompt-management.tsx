'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AIPrompt {
  id: string;
  name: string;
  version: string;
  content: string;
  description?: string;
  is_active: boolean;
  rollout_percentage: number;
  subject?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  performance_metrics?: {
    total_uses?: number;
    avg_score?: number;
    avg_user_rating?: number;
    success_rate?: number;
  };
}

interface PromptFormData {
  name: string;
  version: string;
  content: string;
  description: string;
  subject: string;
  rollout_percentage: number;
}

export function PromptManagement() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    version: '1.0',
    content: '',
    description: '',
    subject: '',
    rollout_percentage: 0,
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/admin/prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
      } else {
        toast.error('Failed to fetch prompts');
      }
    } catch (error) {
      toast.error('Error fetching prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPrompt
        ? `/api/admin/prompts?id=${editingPrompt.id}`
        : '/api/admin/prompts';

      const method = editingPrompt ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isActive: false, // New prompts start inactive
        }),
      });

      if (response.ok) {
        toast.success(
          `Prompt ${editingPrompt ? 'updated' : 'created'} successfully`
        );
        setShowForm(false);
        setEditingPrompt(null);
        resetForm();
        fetchPrompts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save prompt');
      }
    } catch (error) {
      toast.error('Error saving prompt');
    }
  };

  const handleActivate = async (prompt: AIPrompt) => {
    try {
      const response = await fetch(`/api/admin/prompts?id=${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: true,
          rollout_percentage: 100,
        }),
      });

      if (response.ok) {
        toast.success('Prompt activated successfully');
        fetchPrompts();
      } else {
        toast.error('Failed to activate prompt');
      }
    } catch (error) {
      toast.error('Error activating prompt');
    }
  };

  const handleDeactivate = async (prompt: AIPrompt) => {
    try {
      const response = await fetch(`/api/admin/prompts?id=${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: false,
          rollout_percentage: 0,
        }),
      });

      if (response.ok) {
        toast.success('Prompt deactivated successfully');
        fetchPrompts();
      } else {
        toast.error('Failed to deactivate prompt');
      }
    } catch (error) {
      toast.error('Error deactivating prompt');
    }
  };

  const handleDelete = async (prompt: AIPrompt) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/admin/prompts?id=${prompt.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Prompt deleted successfully');
        fetchPrompts();
      } else {
        toast.error('Failed to delete prompt');
      }
    } catch (error) {
      toast.error('Error deleting prompt');
    }
  };

  const handleEdit = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      version: prompt.version,
      content: prompt.content,
      description: prompt.description || '',
      subject: prompt.subject || '',
      rollout_percentage: prompt.rollout_percentage,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      version: '1.0',
      content: '',
      description: '',
      subject: '',
      rollout_percentage: 0,
    });
  };

  const handleTestPrompt = async (prompt: AIPrompt) => {
    try {
      const response = await fetch('/api/admin/golden-dataset/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id }),
      });

      if (response.ok) {
        toast.success(
          'Prompt test started. Results will be available shortly.'
        );
      } else {
        toast.error('Failed to start prompt test');
      }
    } catch (error) {
      toast.error('Error testing prompt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            AI Prompt Management
          </h2>
          <p className="text-gray-600">
            Manage and A/B test AI prompts for better performance
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPrompt(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Prompt
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., gcse-english-marking"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  required
                  value={formData.version}
                  onChange={e =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 2.1.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., English Literature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rollout % (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.rollout_percentage}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      rollout_percentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Brief description of this prompt version"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Content
              </label>
              <textarea
                required
                rows={8}
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter the complete prompt template..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {editingPrompt ? 'Update' : 'Create'} Prompt
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPrompt(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prompts.map(prompt => (
                <tr key={prompt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {prompt.name} v{prompt.version}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prompt.subject && `${prompt.subject} • `}
                        {prompt.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {prompt.is_active ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">
                            Active ({prompt.rollout_percentage}%)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Inactive
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {prompt.performance_metrics ? (
                      <div className="text-sm text-gray-900">
                        <div>
                          Uses: {prompt.performance_metrics.total_uses || 0}
                        </div>
                        <div>
                          Avg Score:{' '}
                          {prompt.performance_metrics.avg_score?.toFixed(1) ||
                            'N/A'}
                        </div>
                        <div>
                          Success:{' '}
                          {prompt.performance_metrics.success_rate?.toFixed(
                            1
                          ) || 'N/A'}
                          %
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No data</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(prompt)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTestPrompt(prompt)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Test with Golden Dataset"
                      >
                        <BeakerIcon className="h-4 w-4" />
                      </button>
                      {prompt.is_active ? (
                        <button
                          onClick={() => handleDeactivate(prompt)}
                          className="text-orange-600 hover:text-orange-800"
                          title="Deactivate"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(prompt)}
                          className="text-green-600 hover:text-green-800"
                          title="Activate"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(prompt)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {prompts.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No prompts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first AI prompt.
          </p>
        </div>
      )}
    </div>
  );
}
