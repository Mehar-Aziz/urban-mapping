from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from services.auth_service import hash_password, verify_password, create_access_token, generate_reset_token, verify_reset_token, hash_password
from services.email_service import email_service
from database.database import get_db
from models import User, Project  # Add Project import here
from datetime import timedelta, datetime  # Add datetime import here
from pydantic import BaseModel, EmailStr
import os
from jose import JWTError, jwt

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str

# New Project request models
class ProjectCreate(BaseModel):
    name: str
    description: str = None

# Register user
@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=request.username,
        email=request.email,
        password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()
    return {"msg": "User registered successfully"}

# Login user
@router.post("/token")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # First check if user exists
    print(request)
    
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found. Please check your email or register first.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Then check password
    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If all checks pass, create token
    token = create_access_token({"sub": user.username}, timedelta(minutes=30))
    return {"access_token": token, "token_type": "bearer"}

# Get current user
@router.get("/users/me")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if user:
            return {"username": user.username, "email": user.email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    

@router.post("/password-reset-request")
def request_password_reset(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists to prevent enumeration
        return {"message": "If an account with this email exists, a reset link will be sent"}
    
    # Generate reset token
    reset_token = generate_reset_token(user.email)
    
    # Construct reset link (adjust the frontend URL as needed)
    frontend_reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
    
    # Send reset email
    email_result = email_service.send_password_reset_email(
        to_email=user.email, 
        reset_link=frontend_reset_url
    )
    
    return {"message": "Password reset link sent"}

@router.post("/password-reset-confirm")
def confirm_password_reset(request: ResetPasswordConfirm, db: Session = Depends(get_db)):
    try:
        # Verify the reset token
        email = verify_reset_token(request.token)
        
        # Find the user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Hash the new password
        hashed_password = hash_password(request.new_password)
        
        # Update user's password
        user.password = hashed_password
        db.commit()
        
        return {"message": "Password reset successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

# Get all users
@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": user.id, "username": user.username, "email": user.email} for user in users]

# Delete a user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# === PROJECT API ROUTES ===

# Create a new project
# Modified backend endpoint without token dependency
@router.post("/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    # Use a default user ID (you can adjust as needed)
    user_id = 1
    
    # Create a new project
    new_project = Project(
        name=project.name,
        description=project.description,
        user_id=user_id,
        created_at=datetime.now()
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return {
        "message": "Project created successfully",
        "project": {
            "id": new_project.id,
            "name": new_project.name,
            "description": new_project.description
        }
    }

# Get all projects for the current user
@router.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    # Get all projects without filtering by user
    projects = db.query(Project).all()
    
    return {
        "projects": [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "user_id": project.user_id,
                "created_at": project.created_at
            }
            for project in projects
        ]
    }