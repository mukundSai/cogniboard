'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tasksAPI, projectsAPI, authAPI } from '../../lib/api';
import { Task, Project, TaskFilter, User } from '../../types/api';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Filter, 
  Search, 
  Plus, 
  Calendar,
  User as UserIcon,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  formatDate, 
  getPriorityColor, 
  getStatusColor, 
  getPriorityIcon, 
  getStatusIcon 
} from '../../lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee_id: undefined as number | undefined,
    due_date: '',
    project_id: undefined as number | undefined
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [tasksResponse, projectsResponse, usersResponse] = await Promise.all([
        tasksAPI.getAll(filters),
        projectsAPI.getAll(),
        authAPI.getUsers()
      ]);
      setTasks(tasksResponse.data.tasks);
      setProjects(projectsResponse.data.projects);
      setAllUsers(usersResponse.data.users);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TaskFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await tasksAPI.delete(taskId);
      toast.success('Task deleted successfully!');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.project_id) {
      toast.error('Please select a project');
      return;
    }

    setCreating(true);
    try {
      await projectsAPI.createTask(taskForm.project_id, {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        assignee_id: taskForm.assignee_id,
        due_date: taskForm.due_date || undefined
      });
      toast.success('Task created successfully!');
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: undefined,
        due_date: '',
        project_id: undefined
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    } finally {
      setCreating(false);
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">View and manage all your tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Tasks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={filters.project_id || ''}
                  onChange={(e) => handleFilterChange('project_id', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="todo">Todo</option>
                  <option value="in progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date From</label>
                <input
                  type="date"
                  value={filters.due_date_from || ''}
                  onChange={(e) => handleFilterChange('due_date_from', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Search className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.keys(filters).length > 0 
                ? 'Try adjusting your filters or create new tasks in your projects.'
                : 'Create tasks in your projects to get started.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {projects.find(p => p.id === task.project_id)?.name || 'Unknown Project'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)} {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {task.assignee ? (
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="ml-2 text-sm text-gray-900">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {task.due_date ? (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                              <span className={`text-sm ${task.overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                {formatDate(task.due_date)}
                              </span>
                              {task.overdue && (
                                <span className="ml-2 text-xs text-red-600">Overdue</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No due date</span>
                          )}
                        </div>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex items-center gap-2">
                           <Link
                             href={`/tasks/${task.id}`}
                             className="text-gray-400 hover:text-blue-600 transition-colors"
                             title="View task"
                           >
                             <Edit className="h-4 w-4" />
                           </Link>
                           <button
                             onClick={() => handleDeleteTask(task.id)}
                             className="text-gray-400 hover:text-red-600 transition-colors"
                             title="Delete task"
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
          </div>
                 )}
       </div>

       {/* Create Task Modal */}
       {showCreateModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
               <form onSubmit={handleCreateTask} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                   <select
                     value={taskForm.project_id || ''}
                     onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value ? Number(e.target.value) : undefined })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   >
                     <option value="">Select a project</option>
                     {projects.map((project) => (
                       <option key={project.id} value={project.id}>
                         {project.name}
                       </option>
                     ))}
                   </select>
                 </div>

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
                     value={taskForm.due_date}
                     onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>

                 <div className="flex gap-3 pt-4">
                   <button
                     type="button"
                     onClick={() => setShowCreateModal(false)}
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
     </DashboardLayout>
   );
 }
