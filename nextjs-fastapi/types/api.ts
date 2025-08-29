// API Types matching the FastAPI schemas

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  members: ProjectMember[];
}

export interface ProjectMember {
  user_id: number;
  role: 'owner' | 'member';
  created_at: string;
  user: User;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  assignee_id?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in progress' | 'review' | 'done';
  due_date?: string;
  overdue: boolean;
  created_at: string;
  updated_at: string;
  assignee?: User;
  comments: Comment[];
}

export interface Comment {
  id: number;
  task_id: number;
  author_id?: number;
  body: string;
  created_at: string;
  author?: User;
}

// Request/Response types
export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

export interface ProjectMemberCreate {
  user_id: number;
  role: 'owner' | 'member';
}

export interface ProjectMemberUpdate {
  role: 'owner' | 'member';
}

export interface TaskCreate {
  title: string;
  description?: string;
  assignee_id?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  assignee_id?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'todo' | 'in progress' | 'review' | 'done';
  due_date?: string;
}

export interface TaskFilter {
  project_id?: number;
  assignee_id?: number;
  status?: 'todo' | 'in progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date_from?: string;
  due_date_to?: string;
  skip?: number;
  limit?: number;
}

export interface CommentCreate {
  body: string;
}

export interface CommentUpdate {
  body?: string;
}

// List response types
export interface UserListResponse {
  users: User[];
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface TaskListResponse {
  tasks: Task[];
}

export interface CommentListResponse {
  comments: Comment[];
}
