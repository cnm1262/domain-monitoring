from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class DomainCreate(BaseModel):
    domain_name: str


class DomainResponse(BaseModel):
    id: int
    domain_name: str
    current_status: str

    class Config:
        from_attributes = True 