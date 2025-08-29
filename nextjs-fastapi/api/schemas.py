from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import TaskPriority, TaskStatus, ProjectRole

# Base schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority
    due_date: Optional[datetime] = None

class CommentBase(BaseModel):
    body: str

# Create schemas
class UserCreate(UserBase):
    password: str

class ProjectCreate(ProjectBase):
    pass

class TaskCreate(TaskBase):
    assignee_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class ProjectMemberCreate(BaseModel):
    user_id: int
    role: ProjectRole = ProjectRole.member

# Filter schemas
class TaskFilter(BaseModel):
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date_from: Optional[datetime] = None
    due_date_to: Optional[datetime] = None
    skip: int = 0
    limit: int = 100

# Update schemas
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None

class CommentUpdate(BaseModel):
    body: Optional[str] = None

class ProjectMemberUpdate(BaseModel):
    role: ProjectRole

# Response schemas
class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectMemberResponse(BaseModel):
    user_id: int
    role: ProjectRole
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    project_memberships: List[ProjectMemberResponse] = []

    class Config:
        from_attributes = True

class CommentResponse(CommentBase):
    id: int
    task_id: int
    author_id: Optional[int] = None
    created_at: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    id: int
    project_id: int
    assignee_id: Optional[int] = None
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserResponse] = None
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True
    
    @property
    def overdue(self) -> bool:
        """Calculate if task is overdue based on due_date and current time."""
        if not self.due_date:
            return False
        from datetime import datetime
        return self.due_date < datetime.now(self.due_date.tzinfo)

# List response schemas
class UserListResponse(BaseModel):
    users: List[UserResponse]

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]

class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]

class CommentListResponse(BaseModel):
    comments: List[CommentResponse]

# Authentication schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
