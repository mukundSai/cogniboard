from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db, engine
from models import Base
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from crud import create_user, authenticate_user, get_user_by_email
from schemas import UserCreate, UserLogin, Token, UserResponse
from dependencies import get_current_user

# Create FastAPI instance
app = FastAPI(
    title="CogniBoard API",
    description="AI-centric task/scrum board API",
    version="1.0.0",
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json"
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
from routers import projects_router, tasks_router, comments_router, auth_router

app.include_router(auth_router, prefix="/api/py/auth", tags=["authentication"])
app.include_router(projects_router, prefix="/api/py", tags=["projects"])
app.include_router(tasks_router, prefix="/api/py", tags=["tasks"])
app.include_router(comments_router, prefix="/api/py", tags=["comments"])

@app.get("/api/py/hello")
def hello_fast_api():
    return {"message": "Hello from CogniBoard API"}

@app.get("/api/py/health")
def health_check():
    return {"status": "healthy", "message": "CogniBoard API is running"}
