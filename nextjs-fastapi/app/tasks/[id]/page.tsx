'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { tasksAPI, commentsAPI, authAPI } from '../../../lib/api';
import { Task, Comment, User } from '../../../types/api';
import DashboardLayout from '../../../components/DashboardLayout';
import { 
  ArrowLeft, 
  Calendar, 
  User as UserIcon,
  Edit, 
  Trash2, 
  MessageSquare,
  Send,
  MoreVertical
} from 'lucide-react';
import { formatDate, formatRelativeTime, getPriorityColor, getStatusColor, getPriorityIcon, getStatusIcon } from '../../../lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CommentForm {
  body: string;
}

interface EditCommentForm {
  body: string;
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = Number(params.id);

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState<CommentForm>({ body: '' });
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditCommentForm>({ body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [taskEditForm, setTaskEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    status: 'todo' as const,
    assignee_id: undefined as number | undefined,
    due_date: ''
  });
  const [updatingTask, setUpdatingTask] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskData();
    }
  }, [taskId]);

  const loadTaskData = async () => {
    try {
      const [taskResponse, commentsResponse, usersResponse] = await Promise.all([
        tasksAPI.getById(taskId),
        tasksAPI.getComments(taskId),
        authAPI.getUsers()
      ]);
      setTask(taskResponse.data);
      setComments(commentsResponse.data.comments);
      setAllUsers(usersResponse.data.users);
    } catch (error) {
      toast.error('Failed to load task data');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.body.trim()) return;

    setSubmitting(true);
    try {
      await tasksAPI.createComment(taskId, commentForm);
      toast.success('Comment added successfully!');
      setCommentForm({ body: '' });
      loadTaskData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editForm.body.trim()) return;

    setUpdating(true);
    try {
      await commentsAPI.update(commentId, editForm);
      toast.success('Comment updated successfully!');
      setEditingComment(null);
      setEditForm({ body: '' });
      loadTaskData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update comment');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsAPI.delete(commentId);
      toast.success('Comment deleted successfully!');
      loadTaskData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete comment');
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditForm({ body: comment.body });
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditForm({ body: '' });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTask(true);
    try {
      await tasksAPI.update(taskId, taskEditForm);
      toast.success('Task updated successfully!');
      setEditingTask(false);
      loadTaskData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update task');
    } finally {
      setUpdatingTask(false);
    }
  };

  const startEditingTask = () => {
    if (task) {
      setTaskEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        assignee_id: task.assignee_id,
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
      setEditingTask(true);
    }
  };

  const cancelEditingTask = () => {
    setEditingTask(false);
    setTaskEditForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      assignee_id: undefined,
      due_date: ''
    });
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

  if (!task) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Task not found</h2>
          <p className="text-gray-600 mt-2">The task you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isCommentAuthor = (comment: Comment) => comment.author_id === user?.id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center">
          <Link
            href="/tasks"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Link>
        </div>

        {/* Task Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingTask ? (
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                    <input
                      type="text"
                      value={taskEditForm.title}
                      onChange={(e) => setTaskEditForm({ ...taskEditForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={taskEditForm.description}
                      onChange={(e) => setTaskEditForm({ ...taskEditForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={taskEditForm.status}
                        onChange={(e) => setTaskEditForm({ ...taskEditForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todo">Todo</option>
                        <option value="in progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={taskEditForm.priority}
                        onChange={(e) => setTaskEditForm({ ...taskEditForm, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        value={taskEditForm.assignee_id || ''}
                        onChange={(e) => setTaskEditForm({ ...taskEditForm, assignee_id: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        value={taskEditForm.due_date}
                        onChange={(e) => setTaskEditForm({ ...taskEditForm, due_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={cancelEditingTask}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingTask ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                    <button
                      onClick={startEditingTask}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Task
                    </button>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-4">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)} {task.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)} {task.priority}
                    </span>
                    {task.overdue && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        ⚠️ Overdue
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Assignee:</span>
                      {task.assignee ? (
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="ml-2 text-gray-900">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </div>

                    {task.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Due Date:</span>
                        <span className={`${task.overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments.length})
            </h2>
          </div>

          <div className="p-6">
            {/* Add Comment Form */}
            <div className="mb-6">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add a comment
                  </label>
                  <textarea
                    value={commentForm.body}
                    onChange={(e) => setCommentForm({ body: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your comment..."
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !commentForm.body.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Be the first to add a comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                    {editingComment === comment.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editForm.body}
                          onChange={(e) => setEditForm({ body: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Edit your comment..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={updating || !editForm.body.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {comment.author?.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(comment.created_at)}
                              </p>
                            </div>
                          </div>
                          {isCommentAuthor(comment) && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditing(comment)}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit comment"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
