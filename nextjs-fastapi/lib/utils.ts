import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-800';
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'review':
      return 'bg-purple-100 text-purple-800';
    case 'done':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'todo':
      return '📋';
    case 'in progress':
      return '🔄';
    case 'review':
      return '👀';
    case 'done':
      return '✅';
    default:
      return '📋';
  }
}

export function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🟠';
    case 'critical':
      return '🔴';
    default:
      return '⚪';
  }
}
