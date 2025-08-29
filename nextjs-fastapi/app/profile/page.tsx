'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, tasksAPI, authAPI } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Mail, Calendar, Edit, Save, X, FolderOpen, CheckSquare, MessageSquare } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    comments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAll()
      ]);

      // Count projects where user is a member
      const userProjects = projectsResponse.data.projects.filter(project => 
        project.project_memberships.some(member => member.user_id === user?.id)
      );

      // Count tasks assigned to user
      const userTasks = tasksResponse.data.tasks.filter(task => 
        task.assignee_id === user?.id
      );

      // Count comments by user (we'll need to fetch comments for all tasks)
      let userComments = 0;
      for (const task of tasksResponse.data.tasks) {
        try {
          const commentsResponse = await tasksAPI.getComments(task.id);
          userComments += commentsResponse.data.comments.filter(
            comment => comment.author_id === user?.id
          ).length;
        } catch (error) {
          console.error(`Failed to fetch comments for task ${task.id}:`, error);
        }
      }

      setStats({
        projects: userProjects.length,
        tasks: userTasks.length,
        comments: userComments
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
      toast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // For now, we'll just show a success message
      // In a real app, you'd make an API call to update the user
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">User not found</h2>
          <p className="text-gray-600 mt-2">Unable to load user profile.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Profile Information */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Name</p>
                          <p className="text-sm text-gray-600">{user.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Member Since</p>
                          <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Updated</p>
                          <p className="text-sm text-gray-600">{formatDate(user.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projects</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comments</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.comments}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
