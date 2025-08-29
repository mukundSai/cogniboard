from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from database import get_db
from dependencies import (
    get_current_user, 
    get_project_member, 
    get_project_owner,
    get_task_access,
    get_task_owner_or_assignee,
    get_comment_author
)
from crud import (
    get_project_by_id, get_user_projects, create_project, update_project, delete_project,
    get_project_members, add_project_member, update_project_member_role, remove_project_member,
    get_project_tasks, create_task, get_task_by_id, update_task, delete_task,
    get_task_comments, create_comment, update_comment, delete_comment, get_tasks_with_filters,
    create_user, authenticate_user, get_users, get_user_by_email
)
from schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectMemberCreate, ProjectMemberUpdate, ProjectMemberResponse,
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse, TaskFilter,
    CommentCreate, CommentUpdate, CommentResponse, CommentListResponse,
    UserCreate, UserLogin, Token, UserResponse, UserListResponse
)
from models import User
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

# Create routers
auth_router = APIRouter()
projects_router = APIRouter(prefix="/projects", tags=["projects"])
tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])
comments_router = APIRouter(prefix="/comments", tags=["comments"])

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@auth_router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check if user already exists
    existing_user = get_user_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return create_user(db, user)

@auth_router.post("/login", response_model=Token)
def login_user(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user and return access token."""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return current_user

@auth_router.get("/users", response_model=UserListResponse)
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (for project member selection)."""
    users = get_users(db)
    return UserListResponse(users=users)

# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================

@projects_router.post("/", response_model=ProjectResponse)
def create_new_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project (user becomes owner)."""
    return create_project(db, project, current_user.id)

@projects_router.get("/", response_model=ProjectListResponse)
def list_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects where user is a member or owner."""
    projects = get_user_projects(db, current_user.id)
    return ProjectListResponse(projects=projects)

@projects_router.get("/{project_id}", response_model=ProjectResponse)
def get_project_details(
    project_id: int,
    current_user: User = Depends(get_project_member),  # Must be a member
    db: Session = Depends(get_db)
):
    """Get project details (only if you're a member)."""
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@projects_router.patch("/{project_id}", response_model=ProjectResponse)
def update_project_details(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_project_owner),  # Must be an owner
    db: Session = Depends(get_db)
):
    """Update project details (only owners can do this)."""
    project = update_project(db, project_id, project_update)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@projects_router.delete("/{project_id}")
def delete_project_endpoint(
    project_id: int,
    current_user: User = Depends(get_project_owner),  # Must be an owner
    db: Session = Depends(get_db)
):
    """Delete project (only owners can do this)."""
    success = delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# ============================================================================
# PROJECT MEMBER ENDPOINTS
# ============================================================================

@projects_router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def list_project_members(
    project_id: int,
    current_user: User = Depends(get_project_member),  # Must be a member
    db: Session = Depends(get_db)
):
    """Get all project members (only members can see this)."""
    return get_project_members(db, project_id)

@projects_router.post("/{project_id}/members", response_model=ProjectMemberResponse)
def add_project_member_endpoint(
    project_id: int,
    member: ProjectMemberCreate,
    current_user: User = Depends(get_project_owner),  # Must be an owner
    db: Session = Depends(get_db)
):
    """Add a member to the project (only owners can do this)."""
    new_member = add_project_member(db, project_id, member)
    if not new_member:
        raise HTTPException(status_code=400, detail="Failed to add member")
    return new_member

@projects_router.patch("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
def update_member_role(
    project_id: int,
    user_id: int,
    role_update: ProjectMemberUpdate,
    current_user: User = Depends(get_project_owner),  # Must be an owner
    db: Session = Depends(get_db)
):
    """Update member role (only owners can do this)."""
    member = update_project_member_role(db, project_id, user_id, role_update.role)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

@projects_router.delete("/{project_id}/members/{user_id}")
def remove_project_member_endpoint(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_project_owner),  # Must be an owner
    db: Session = Depends(get_db)
):
    """Remove a member from the project (only owners can do this)."""
    success = remove_project_member(db, project_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to remove member")
    return {"message": "Member removed successfully"}

# ============================================================================
# TASK ENDPOINTS
# ============================================================================

@projects_router.get("/{project_id}/tasks", response_model=TaskListResponse)
def list_project_tasks(
    project_id: int,
    current_user: User = Depends(get_project_member),  # Must be a member
    db: Session = Depends(get_db)
):
    """Get all tasks for a project (only members can see this)."""
    tasks = get_project_tasks(db, project_id)
    return TaskListResponse(tasks=tasks)

@projects_router.post("/{project_id}/tasks", response_model=TaskResponse)
def create_project_task(
    project_id: int,
    task: TaskCreate,
    current_user: User = Depends(get_project_member),  # Must be a member
    db: Session = Depends(get_db)
):
    """Create a new task in the project (any member can do this)."""
    return create_task(db, project_id, task)

@tasks_router.get("/", response_model=TaskListResponse)
def list_tasks_with_filters(
    filters: TaskFilter = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks with various filters (user can only see tasks from projects they're members of)."""
    # Convert TaskFilter to function parameters
    tasks = get_tasks_with_filters(
        db=db,
        project_id=filters.project_id,
        assignee_id=filters.assignee_id,
        status=filters.status,
        priority=filters.priority,
        due_date_from=filters.due_date_from,
        due_date_to=filters.due_date_to,
        skip=filters.skip,
        limit=filters.limit
    )
    return TaskListResponse(tasks=tasks)

@tasks_router.get("/{task_id}", response_model=TaskResponse)
def get_task_details(
    task_id: int,
    current_user: User = Depends(get_task_access),  # Must be member of project
    db: Session = Depends(get_db)
):
    """Get task details (must be member of the project)."""
    task = get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@tasks_router.patch("/{task_id}", response_model=TaskResponse)
def update_task_details(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_task_access),  # must be member of project
    db: Session = Depends(get_db)
):
    """Update task (project owner or task assignee can do this)."""
    task = update_task(db, task_id, task_update)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@tasks_router.delete("/{task_id}")
def delete_task_endpoint(
    task_id: int,
    current_user: User = Depends(get_task_owner_or_assignee),  # Owner or assignee
    db: Session = Depends(get_db)
):
    """Delete task (project owner or task assignee can do this)."""
    success = delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ============================================================================
# COMMENT ENDPOINTS
# ============================================================================

@tasks_router.get("/{task_id}/comments", response_model=CommentListResponse)
def list_task_comments(
    task_id: int,
    current_user: User = Depends(get_task_access),  # Must be member of project
    db: Session = Depends(get_db)
):
    """Get all comments for a task (must be member of the project)."""
    comments = get_task_comments(db, task_id)
    return CommentListResponse(comments=comments)

@tasks_router.post("/{task_id}/comments", response_model=CommentResponse)
def create_task_comment(
    task_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_task_access),  # Must be member of project
    db: Session = Depends(get_db)
):
    """Create a comment on a task (any project member can do this)."""
    return create_comment(db, task_id, current_user.id, comment)

@comments_router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment_details(
    comment_id: int,
    comment_update: CommentUpdate,
    current_user: User = Depends(get_comment_author),  # Author
    db: Session = Depends(get_db)
):
    """Update comment (comment author or project member can do this)."""
    comment = update_comment(db, comment_id, comment_update)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment

@comments_router.delete("/{comment_id}")
def delete_comment_endpoint(
    comment_id: int,
    current_user: User = Depends(get_comment_author),  # Author
    db: Session = Depends(get_db)
):
    """Delete comment (comment author or project member can do this)."""
    success = delete_comment(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}
