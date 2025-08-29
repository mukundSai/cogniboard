from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
from models import User, Project, ProjectMember, Task, Comment, ProjectRole, TaskStatus
from schemas import UserCreate, ProjectCreate, TaskCreate, CommentCreate, ProjectMemberCreate, ProjectUpdate, TaskUpdate, CommentUpdate
from auth import get_password_hash, verify_password

# User CRUD operations
def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user."""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

# Project CRUD operations
def create_project(db: Session, project: ProjectCreate, owner_id: int) -> Project:
    """Create a new project and add the creator as owner."""
    db_project = Project(
        name=project.name,
        description=project.description
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Add creator as owner
    db_member = ProjectMember(
        project_id=db_project.id,
        user_id=owner_id,
        role=ProjectRole.owner
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    
    return db_project

def get_project_by_id(db: Session, project_id: int) -> Optional[Project]:
    """Get project by ID."""
    return db.query(Project).filter(Project.id == project_id).first()

def get_user_projects(db: Session, user_id: int) -> List[Project]:
    """Get all projects where user is a member or owner."""
    return db.query(Project).join(ProjectMember).filter(
        ProjectMember.user_id == user_id
    ).all()

def update_project(db: Session, project_id: int, project_update: ProjectUpdate) -> Optional[Project]:
    """Update project details."""
    db_project = get_project_by_id(db, project_id)
    if not db_project:
        return None
    
    # Update only the fields that are provided (not None)
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(db_project, key):
            setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int) -> bool:
    """Delete a project."""
    db_project = get_project_by_id(db, project_id)
    if not db_project:
        return False
    
    db.delete(db_project)
    db.commit()
    return True

# Project Member CRUD operations
def add_project_member(db: Session, project_id: int, member: ProjectMemberCreate) -> Optional[ProjectMember]:
    """Add a member to a project."""
    # Check if user exists
    user = get_user_by_id(db, member.user_id)
    if not user:
        return None
    
    # Check if already a member
    existing_member = db.query(ProjectMember).filter(
        and_(ProjectMember.project_id == project_id, ProjectMember.user_id == member.user_id)
    ).first()
    if existing_member:
        return None
    
    db_member = ProjectMember(
        project_id=project_id,
        user_id=member.user_id,
        role=member.role
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def get_project_members(db: Session, project_id: int) -> List[ProjectMember]:
    """Get all members of a project."""
    return db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()

def update_project_member_role(db: Session, project_id: int, user_id: int, role: ProjectRole) -> Optional[ProjectMember]:
    """Update a project member's role."""
    db_member = db.query(ProjectMember).filter(
        and_(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    ).first()
    if not db_member:
        return None
    
    db_member.role = role
    db.commit()
    db.refresh(db_member)
    return db_member

def remove_project_member(db: Session, project_id: int, user_id: int) -> bool:
    """Remove a member from a project."""
    db_member = db.query(ProjectMember).filter(
        and_(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    ).first()
    if not db_member:
        return False
    
    # Ensure at least one owner remains
    if db_member.role == ProjectRole.owner:
        owner_count = db.query(ProjectMember).filter(
            and_(ProjectMember.project_id == project_id, ProjectMember.role == ProjectRole.owner)
        ).count()
        if owner_count <= 1:
            return False
    
    db.delete(db_member)
    db.commit()
    return True

def is_project_member(db: Session, project_id: int, user_id: int) -> bool:
    """Check if user is a member of the project."""
    member = db.query(ProjectMember).filter(
        and_(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    ).first()
    return member is not None

def is_project_owner(db: Session, project_id: int, user_id: int) -> bool:
    """Check if user is an owner of the project."""
    member = db.query(ProjectMember).filter(
        and_(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
            ProjectMember.role == ProjectRole.owner
        )
    ).first()
    return member is not None

# Task CRUD operations
def create_task(db: Session, project_id: int, task: TaskCreate) -> Task:
    """Create a new task."""
    db_task = Task(
        project_id=project_id,
        title=task.title,
        description=task.description,
        assignee_id=task.assignee_id,
        priority=task.priority,
        status=TaskStatus.todo,
        due_date=task.due_date
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Get task by ID."""
    return db.query(Task).filter(Task.id == task_id).first()

def get_project_tasks(db: Session, project_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
    """Get all tasks for a project."""
    return db.query(Task).filter(Task.project_id == project_id).offset(skip).limit(limit).all()

def get_tasks_with_filters(
    db: Session,
    project_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[str] = None,
    due_date_from: Optional[datetime] = None,
    due_date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Task]:
    """Get tasks with various filters including date filters."""
    query = db.query(Task)
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    
    # Date filters
    if due_date_from:
        query = query.filter(Task.due_date >= due_date_from)
    if due_date_to:
        query = query.filter(Task.due_date <= due_date_to)
    
    return query.offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
    """Update task details."""
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return None
    
    # Update only the fields that are provided (not None)
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(db_task, key):
            setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task."""
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True

# Comment CRUD operations
def create_comment(db: Session, task_id: int, author_id: int, comment: CommentCreate) -> Comment:
    """Create a new comment."""
    db_comment = Comment(
        task_id=task_id,
        author_id=author_id,
        body=comment.body
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def get_task_comments(db: Session, task_id: int, skip: int = 0, limit: int = 100) -> List[Comment]:
    """Get all comments for a task."""
    return db.query(Comment).filter(Comment.task_id == task_id).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

def get_comment_by_id(db: Session, comment_id: int) -> Optional[Comment]:
    """Get comment by ID."""
    return db.query(Comment).filter(Comment.id == comment_id).first()

def update_comment(db: Session, comment_id: int, comment_update: CommentUpdate) -> Optional[Comment]:
    """Update comment details."""
    db_comment = get_comment_by_id(db, comment_id)
    if not db_comment:
        return None
    
    # Update only the fields that are provided (not None)
    update_data = comment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(db_comment, key):
            setattr(db_comment, key, value)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

def delete_comment(db: Session, comment_id: int) -> bool:
    """Delete a comment."""
    db_comment = get_comment_by_id(db, comment_id)
    if not db_comment:
        return False
    
    db.delete(db_comment)
    db.commit()
    return True
