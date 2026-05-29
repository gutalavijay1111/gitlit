from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, issues, repos

app = FastAPI(
    title="Gitlit",
    description="GitHub issue tracking clone built with FastAPI and SQLAlchemy",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}