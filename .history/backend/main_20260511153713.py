from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt
import requests
from datetime import datetime

from database import engine, Base, SessionLocal
import models
import schemas
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

app = FastAPI()

# ✅ CORS (مهم ل React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# Get Domains
@app.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    domains = db.query(models.Domain).all()
    return domains


# Add Domain (مع منع التكرار)
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

    # ❗ منع التكرار
    existing_domain = db.query(models.Domain).filter(
        models.Domain.domain_name == domain.domain_name,
        models.Domain.user_id == current_user.id
    ).first()

    if existing_domain:
        raise HTTPException(status_code=400, detail="Domain already exists")

    new_domain = models.Domain(
        domain_name=domain.domain_name,
        user_id=current_user.id
    )

    db.add(new_domain)
    db.commit()
    db.refresh(new_domain)

    return new_domain


# Check Website
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


# Check Domain
@app.post("/check/{domain_id}")
def check_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(models.Domain).filter(models.Domain.id == domain_id).first()

    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    result = check_website(domain.domain_name)

    domain.current_status = result["status"]
    domain.last_check = datetime.utcnow()

    new_check = models.Check(
        domain_id=domain.id,
        status=result["status"],
        status_code=result["status_code"],
        response_time=result["response_time"]
    )

    db.add(new_check)
    db.commit()

    return result

@app.delete("/domains/{domain_id}")
def delete_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(models.Domain).filter(models.Domain.id == domain_id).first()

    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    db.delete(domain)
    db.commit()

    return {"message": "Domain deleted"}