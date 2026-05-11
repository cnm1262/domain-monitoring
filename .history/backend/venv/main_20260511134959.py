from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import jwt

from database import engine, Base, SessionLocal
import models
import schemas
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)


# DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Home
@app.get("/")
def home():
    return {"message": "Domain Monitoring API is running"}


# Register
@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# Login
@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})

    return {"access_token": token, "token_type": "bearer"}


# Add Domain (Protected)
@app.post("/domains", response_model=schemas.DomainResponse)
def add_domain(
    domain: schemas.DomainCreate,
    token: str,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    current_user = db.query(models.User).filter(models.User.email == email).first()

    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    new_domain = models.Domain(
        domain_name=domain.domain_name,
        user_id=current_user.id
    )

    db.add(new_domain)
    db.commit()
    db.refresh(new_domain)

    return new_domain

import requests
from datetime import datetime

def check_website(url):
    try:
        if not url.startswith("http"):
            url = "http://" + url

        response = requests.get(url, timeout=5)

        return {
            "status": "up" if response.status_code == 200 else "down",
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds()
        }

    except:
        return {
            "status": "down",
            "status_code": None,
            "response_time": None
        }