from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from services.auth_service import hash_password, verify_password, create_access_token
from database import get_db
from models import User
from datetime import timedelta
from pydantic import BaseModel
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
