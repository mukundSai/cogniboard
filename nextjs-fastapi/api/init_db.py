from database import engine, SessionLocal
from models import Base
from crud import create_user, create_project
from schemas import UserCreate, ProjectCreate
from models import ProjectRole
from auth import get_password_hash

def init_db():
    """Initialize the database with tables and sample data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if we already have users
        from crud import get_users
        existing_users = get_users(db)
        
        if not existing_users:
            # Create sample users
            user1 = create_user(db, UserCreate(
                name="John Doe",
                email="john@example.com",
                password="password123"
            ))
            
            user2 = create_user(db, UserCreate(
                name="Jane Smith",
                email="jane@example.com",
                password="password123"
            ))
            
            # Create sample project
            project = create_project(db, ProjectCreate(
                name="Sample Project",
                description="A sample project for testing"
            ), user1.id)
            
            print("Database initialized with sample data!")
            print(f"Created users: {user1.email}, {user2.email}")
            print(f"Created project: {project.name}")
        else:
            print("Database already contains data, skipping initialization.")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
