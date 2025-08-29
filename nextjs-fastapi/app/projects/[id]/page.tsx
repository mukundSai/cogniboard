'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { projectsAPI, tasksAPI, authAPI } from '../../../lib/api';
import { Project, Task, User } from '../../../types/api';
import DashboardLayout from '../../../components/DashboardLayout';
import { 
  Plus, 
  Users, 
  Calendar, 
  Edit, 
  Trash2, 
  UserPlus,
  MoreVertical,
  CheckSquare,
  X
} from 'lucide-react';
import { formatDate, getPriorityColor, getStatusColor, getPriorityIcon, getStatusIcon } from '../../../lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CreateTaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_id?: number;
  due_date?: string;
}

interface AddMemberForm {
  user_id: number;
  role: 'owner' | 'member';
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMemberRole, setEditingMemberRole] = useState<number | null>(null);
  const [memberRoleForm, setMemberRoleForm] = useState<{ role: 'owner' | 'member' }>({ role: 'member' });
  const [updatingRole, setUpdatingRole] = useState(false);

  const [taskForm, setTaskForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    priority: 'medium'
  });

  const [memberForm, setMemberForm] = useState<AddMemberForm>({
    user_id: 0,
    role: 'member'
  });

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [projectResponse, tasksResponse, membersResponse, usersResponse] = await Promise.all([
        projectsAPI.getById(projectId),
        projectsAPI.getTasks(projectId),
        projectsAPI.getMembers(projectId),
        authAPI.getUsers()
      ]);
      setProject(projectResponse.data);
      setTasks(tasksResponse.data.tasks);
      setAllUsers(usersResponse.data.users);
      
      // If the project response doesn't include members, use the separate members response
      if (!projectResponse.data.members || projectResponse.data.members.length === 0) {
        console.log('Using separate members response:', membersResponse.data);
        setProject(prev => prev ? { ...prev, members: membersResponse.data } : null);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectsAPI.createTask(projectId, taskForm);
      toast.success('Task created successfully!');
      setShowCreateTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium' });
      loadProjectData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await projectsAPI.addMember(projectId, memberForm);
      toast.success('Member added successfully!');
      setShowAddMemberModal(false);
      setMemberForm({ user_id: 0, role: 'member' });
      loadProjectData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await projectsAPI.delete(projectId);
      toast.success('Project deleted successfully!');
      router.push('/projects');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await projectsAPI.removeMember(projectId, userId);
      toast.success('Member removed successfully!');
      loadProjectData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (userId: number) => {
    setUpdatingRole(true);
    try {
      await projectsAPI.updateMemberRole(projectId, userId, memberRoleForm);
      toast.success('Member role updated successfully!');
      setEditingMemberRole(null);
      setMemberRoleForm({ role: 'member' });
      loadProjectData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update member role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const startEditingRole = (member: any) => {
    setEditingMemberRole(member.user_id);
    setMemberRoleForm({ role: member.role });
  };

  const cancelEditingRole = () => {
    setEditingMemberRole(null);
    setMemberRoleForm({ role: 'member' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <p className="text-gray-600 mt-2">The project you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = project.members.find(m => m.user_id === user?.id)?.role === 'owner';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {isOwner && (
                  <button
                    onClick={handleDeleteProject}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              {project.description && (
                <p className="mt-2 text-gray-600">{project.description}</p>
              )}
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.members.length} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-4 w-4" />
                  <span>{tasks.length} tasks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(project.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddMemberModal(true)}
                disabled={allUsers.filter(u => !project.members.find(m => m.user_id === u.id)).length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={allUsers.filter(u => !project.members.find(m => m.user_id === u.id)).length === 0 ? 'All users are already members' : 'Add a new member'}
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </button>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Members */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {project.members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-xs text-gray-500">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingMemberRole === member.user_id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={memberRoleForm.role}
                              onChange={(e) => setMemberRoleForm({ role: e.target.value as any })}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="member">Member</option>
                              <option value="owner">Owner</option>
                            </select>
                            <button
                              onClick={() => handleUpdateMemberRole(member.user_id)}
                              disabled={updatingRole}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Save role"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={cancelEditingRole}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              member.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role}
                            </span>
                            {isOwner && member.user_id !== user?.id && (
                              <>
                                <button
                                  onClick={() => startEditingRole(member)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Edit role"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(member.user_id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              </div>
              <div className="p-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowCreateTaskModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        New Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                            {task.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)} {task.status}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {getPriorityIcon(task.priority)} {task.priority}
                              </span>
                              {task.overdue && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ⚠️ Overdue
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {task.assignee && (
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-xs font-medium text-white">
                                    {task.assignee.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="ml-2">{task.assignee.name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span className={task.overdue ? 'text-red-600 font-medium' : ''}>
                                  {formatDate(task.due_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select
                    value={taskForm.assignee_id || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team Member</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <select
                    value={memberForm.user_id}
                    onChange={(e) => setMemberForm({ ...memberForm, user_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>
                      {allUsers.filter(u => !project.members.find(m => m.user_id === u.id)).length === 0 
                        ? 'All users are already members' 
                        : 'Select a user'
                      }
                    </option>
                    {allUsers
                      .filter(u => !project.members.find(m => m.user_id === u.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
