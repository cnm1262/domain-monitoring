from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Domain Monitoring API is running"}