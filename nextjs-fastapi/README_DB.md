# Database Setup for CogniBoard

This document explains how to set up and use the PostgreSQL database with SQLAlchemy for the CogniBoard application.

## Prerequisites

1. PostgreSQL installed and running
2. Python 3.8+ with pip
3. Virtual environment (recommended)

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a PostgreSQL database:
```sql
CREATE DATABASE cogniboard;
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your database credentials
```

## Database Configuration

The database configuration is handled in `api/database.py`. Key components:

- **Connection**: Uses SQLAlchemy with PostgreSQL
- **Session Management**: Automatic session creation and cleanup
- **Environment Variables**: Database URL and JWT secret key

## Models

The application includes the following SQLAlchemy models:

### User
- `id`: Primary key
- `name`: User's full name
- `email`: Unique email address
- `password_hash`: Hashed password
- `created_at`, `updated_at`: Timestamps

### Project
- `id`: Primary key
- `name`: Project name
- `description`: Project description
- `created_at`, `updated_at`: Timestamps

### ProjectMember
- `project_id`, `user_id`: Composite primary key
- `role`: Owner or member
- `created_at`: Timestamp

### Task
- `id`: Primary key
- `project_id`: Foreign key to Project
- `title`: Task title
- `description`: Task description
- `assignee_id`: Foreign key to User (nullable)
- `priority`: Low, medium, high, critical
- `status`: Todo, in progress, review, done
- `due_date`: Optional due date
- `overdue`: Boolean flag
- `created_at`, `updated_at`: Timestamps

### Comment
- `id`: Primary key
- `task_id`: Foreign key to Task
- `author_id`: Foreign key to User (nullable)
- `body`: Comment text
- `created_at`: Timestamp

## Database Initialization

### Option 1: Using SQLAlchemy (Development)
```bash
cd api
python init_db.py
```

### Option 2: Using Alembic (Production)
```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## Key Features

### Referential Integrity
- Cascade deletes for project members and tasks when project is deleted
- Set NULL for task assignee and comment author when user is deleted
- Cascade deletes for comments when task is deleted

### Constraints
- At least one owner per project (enforced in application logic)
- Unique email addresses
- Proper foreign key relationships

### Indexes
- Performance indexes on frequently queried fields
- Composite indexes for common query patterns

## CRUD Operations

The `api/crud.py` file contains all database operations:

- **User operations**: Create, read, update, authenticate
- **Project operations**: Create, read, update, delete
- **Member operations**: Add, remove, update roles
- **Task operations**: Create, read, update, delete, filter
- **Comment operations**: Create, read, update, delete

## Authentication

The `api/auth.py` file handles:
- Password hashing with bcrypt
- JWT token creation and verification
- Secure password verification

## Usage Examples

### Creating a User
```python
from api.crud import create_user
from api.schemas import UserCreate

user = create_user(db, UserCreate(
    name="John Doe",
    email="john@example.com",
    password="secure_password"
))
```

### Creating a Project
```python
from api.crud import create_project
from api.schemas import ProjectCreate

project = create_project(db, ProjectCreate(
    name="My Project",
    description="Project description"
), owner_id=user.id)
```

### Adding a Task
```python
from api.crud import create_task
from api.schemas import TaskCreate
from api.models import TaskPriority

task = create_task(db, project_id, TaskCreate(
    title="Implement feature",
    description="Add new functionality",
    priority=TaskPriority.high,
    assignee_id=user.id
))
```

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost/cogniboard
SECRET_KEY=your-secret-key-for-jwt-tokens
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure PostgreSQL is running
2. **Database not found**: Create the database first
3. **Permission denied**: Check database user permissions
4. **Import errors**: Ensure you're in the correct directory

### Migration Issues

If you encounter migration problems:
```bash
# Reset migrations (WARNING: This will delete all data)
alembic downgrade base
alembic upgrade head
```

## Security Considerations

1. **Passwords**: Always hashed with bcrypt
2. **JWT Tokens**: Use strong secret keys
3. **SQL Injection**: Prevented by SQLAlchemy ORM
4. **Environment Variables**: Never commit sensitive data to version control
