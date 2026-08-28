"""
MedVid AI - FastAPI Server
Medical education video generation with real-time progress tracking
"""

import asyncio
import time
import uuid
from pathlib import Path
from typing import Dict, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from backend.config import settings
from backend.internet_access import MedicalWebSearch, search_medical
from backend.video_generator import VideoGenerator, VideoConfig, VideoProgressTracker
from backend.avatar_renderer import AvatarRenderer, AvatarConfig, AvatarStyle


# ============================================================
# Request/Response Models
# ============================================================

class VideoRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500, description="Medical topic to explain (spelling mistakes auto-corrected)")
    quality: str = Field(default="1080p30", description="Video quality: 480p15, 720p30, 1080p30")
    avatar_enabled: bool = Field(default=True, description="Show presenter avatar")
    voice_enabled: bool = Field(default=True, description="Enable voice narration")
    dimension: str = Field(default="2d", description="Video dimension: '2d' for anime 2D, '3d' for 3D anime")
    anime_style: str = Field(default="default", description="Anime style: 'default', 'shonen', 'shoujo', 'chibi', 'realistic'")


class VideoResponse(BaseModel):
    job_id: str
    status: str
    message: str
    estimated_duration_seconds: float = 0


class ProgressUpdate(BaseModel):
    job_id: str
    stage: str
    progress_percent: float
    current_step: str
    elapsed_seconds: float
    estimated_remaining: float
    elapsed_formatted: str
    eta_formatted: str
    error: Optional[str] = None


class JobStatus(BaseModel):
    job_id: str
    status: str
    topic: str
    progress: Dict
    result: Optional[Dict] = None


# ============================================================
# Job Management
# ============================================================

class JobManager:
    """Manages video generation jobs with timeout enforcement"""

    MAX_GENERATION_TIME = 300  # 5 minutes max per video

    def __init__(self):
        self.jobs: Dict[str, Dict] = {}
        self.active_generators: Dict[str, VideoGenerator] = {}

    def create_job(self, topic: str, config: VideoConfig) -> str:
        job_id = str(uuid.uuid4())[:8]
        self.jobs[job_id] = {
            "job_id": job_id,
            "topic": topic,
            "config": config,
            "status": "queued",
            "progress": {},
            "result": None,
            "created_at": time.time(),
            "timeout_at": time.time() + self.MAX_GENERATION_TIME,
        }
        return job_id

    def update_job(self, job_id: str, progress: Dict, status: str = None, result: Dict = None):
        if job_id not in self.jobs:
            return
        self.jobs[job_id]["progress"] = progress
        if status:
            self.jobs[job_id]["status"] = status
        if result:
            self.jobs[job_id]["result"] = result

    def get_job(self, job_id: str) -> Optional[Dict]:
        return self.jobs.get(job_id)

    def is_timeout(self, job_id: str) -> bool:
        job = self.jobs.get(job_id)
        if not job:
            return True
        return time.time() > job["timeout_at"]

    def cleanup_old_jobs(self, max_age: float = 3600):
        now = time.time()
        expired = [jid for jid, j in self.jobs.items() if now - j["created_at"] > max_age]
        for jid in expired:
            del self.jobs[jid]


job_manager = JobManager()


# ============================================================
# Background Video Generation Task
# ============================================================

async def generate_video_task(job_id: str, topic: str, config: VideoConfig):
    """Background task for video generation with timeout enforcement"""
    generator = VideoGenerator(config)
    job_manager.active_generators[job_id] = generator

    def on_progress(progress_dict):
        job_manager.update_job(job_id, progress_dict, status="generating")

    generator.on_progress(on_progress)

    try:
        # Run with timeout
        result = await asyncio.wait_for(
            generator.generate(topic, output_name=f"medvid_{job_id}"),
            timeout=JobManager.MAX_GENERATION_TIME,
        )
        job_manager.update_job(job_id, result.get("progress", {}), status="complete", result=result)

    except asyncio.TimeoutError:
        job_manager.update_job(
            job_id,
            {"error": "Generation timed out after 5 minutes", "stage": "failed"},
            status="timeout",
            result={"success": False, "error": "Video generation timed out after 5 minutes"},
        )
    except Exception as e:
        job_manager.update_job(
            job_id,
            {"error": str(e), "stage": "failed"},
            status="failed",
            result={"success": False, "error": str(e)},
        )
    finally:
        job_manager.active_generators.pop(job_id, None)


# ============================================================
# App Setup
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"MedVid AI starting on {settings.HOST}:{settings.PORT}")
    print(f"Output directory: {settings.OUTPUT_DIR}")
    yield
    # Shutdown
    job_manager.cleanup_old_jobs()


app = FastAPI(
    title="MedVid AI",
    description="Medical education video generator with real-time progress tracking",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API Endpoints
# ============================================================

@app.get("/")
async def root():
    return {
        "name": "MedVid AI",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "Anime-style 2D/3D medical videos",
            "Auto spelling correction",
            "Indian medical references (Park, KDT, Robbins, etc.)",
            "PubMed research integration",
            "Real-time progress with ETA",
        ],
        "endpoints": {
            "POST /api/video/generate": "Generate anime medical video (2D/3D, auto spelling fix)",
            "GET /api/video/options": "Get available 2D/3D and anime style options",
            "GET /api/video/{job_id}/status": "Check job status with ETA timer",
            "WS /ws/progress/{job_id}": "Real-time progress WebSocket",
            "GET /api/search?q=topic": "Search with spelling correction + Indian refs",
            "GET /api/avatar": "Get avatar SVG (properly rigged body)",
        },
    }


@app.post("/api/video/generate", response_model=VideoResponse)
async def generate_video(request: VideoRequest):
    """Start anime-style video generation with auto spelling correction"""
    from backend.fuzzy_search import correct_spelling

    # Auto-correct spelling mistakes in topic
    original_topic = request.topic
    corrected_topic = correct_spelling(request.topic)
    spelling_corrected = original_topic.lower() != corrected_topic.lower()

    config = VideoConfig(
        quality=request.quality,
        avatar_enabled=request.avatar_enabled,
        voice_enabled=request.voice_enabled,
        dimension=request.dimension,
        anime_style=request.anime_style,
    )

    # Use corrected topic for generation
    topic_to_use = corrected_topic
    job_id = job_manager.create_job(topic_to_use, config)

    # Store original topic for reference
    job_manager.jobs[job_id]["original_topic"] = original_topic
    job_manager.jobs[job_id]["spelling_corrected"] = spelling_corrected

    # Start background task
    asyncio.create_task(generate_video_task(job_id, topic_to_use, config))

    # Estimate duration
    render_time = 180.0 if request.dimension == "3d" else 120.0
    estimated = render_time

    correction_msg = f" (corrected: '{original_topic}' -> '{corrected_topic}')" if spelling_corrected else ""

    return VideoResponse(
        job_id=job_id,
        status="queued",
        message=f"Anime {request.dimension.upper()} video generation started for '{topic_to_use}'{correction_msg}. Dimension: {request.dimension.upper()}, Style: {request.anime_style}",
        estimated_duration_seconds=estimated,
    )


@app.get("/api/video/{job_id}/status", response_model=JobStatus)
async def get_video_status(job_id: str):
    """Get video generation status with ETA and timer"""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check timeout
    if job_manager.is_timeout(job_id) and job["status"] in ["queued", "generating"]:
        job_manager.update_job(job_id, status="timeout")

    progress = job["progress"]
    return JobStatus(
        job_id=job_id,
        status=job["status"],
        topic=job["topic"],
        progress=progress,
        result=job.get("result"),
    )


@app.get("/api/video/{job_id}/download")
async def download_video(job_id: str):
    """Download generated video"""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != "complete":
        raise HTTPException(status_code=400, detail=f"Job status is '{job['status']}', not ready for download")

    result = job.get("result", {})
    video_path = result.get("video_path")
    if not video_path or not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"{job['topic'][:50]}.mp4",
    )


@app.websocket("/ws/progress/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """Real-time progress updates via WebSocket with timer"""
    await websocket.accept()

    try:
        while True:
            job = job_manager.get_job(job_id)
            if not job:
                await websocket.send_json({"error": "Job not found"})
                break

            progress = job["progress"]
            progress["job_id"] = job_id
            progress["status"] = job["status"]
            progress["topic"] = job["topic"]

            await websocket.send_json(progress)

            if job["status"] in ["complete", "failed", "timeout"]:
                break

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass


@app.get("/api/search")
async def search_medical_sources(
    q: str,
    sources: str = "google,pubmed,wikipedia",
):
    """Search medical sources with spelling correction and Indian references"""
    start = time.time()
    source_list = [s.strip() for s in sources.split(",")]

    try:
        results = await asyncio.wait_for(
            search_medical(q, source_list),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        return {"query": q, "error": "Search timed out after 30 seconds", "results": {}}

    elapsed = time.time() - start

    # Count results
    counts = {}
    for source, data in results.items():
        if isinstance(data, list):
            counts[source] = len(data)
        elif data:
            counts[source] = 1
        else:
            counts[source] = 0

    return {
        "original_query": q,
        "corrected_query": results.get("corrected_query", q),
        "spelling_corrected": q.lower() != results.get("corrected_query", q).lower(),
        "elapsed_seconds": round(elapsed, 2),
        "result_counts": counts,
        "indian_references": results.get("indian_references", []),
        "results": {k: v for k, v in results.items() if k not in ["corrected_query", "original_query", "indian_references"]},
    }


@app.get("/api/avatar")
async def get_avatar(style: str = "doctor", gesture: str = "neutral"):
    """Get avatar SVG with proper body rigging (no detached parts)"""
    try:
        avatar_style = AvatarStyle(style)
    except ValueError:
        avatar_style = AvatarStyle.DOCTOR

    config = AvatarConfig(style=avatar_style)
    renderer = AvatarRenderer(config)

    svg = renderer.render_svg(gesture)
    info = renderer.get_skeleton_info()

    return {
        "svg": svg,
        "skeleton_info": info,
        "gesture": gesture,
        "style": style,
    }


@app.get("/api/video/options")
async def get_video_options():
    """Get available video rendering options (2D/3D, anime styles)"""
    from backend.anime_renderer import get_dimension_info
    return {
        "dimensions": get_dimension_info(),
        "anime_styles": {
            "default": "Balanced anime style - good for most topics",
            "shonen": "Action-packed, bold style - great for pathology, surgery, disease mechanisms",
            "shoujo": "Soft, elegant style - great for anatomy, physiology, gentle topics",
            "chibi": "Cute, simplified style - great for quick overviews, revision",
            "realistic": "Semi-realistic style - great for clinical topics, diagnosis",
        },
        "quality_options": ["480p15", "720p30", "1080p30"],
        "note": "Spelling mistakes in topic are automatically corrected",
    }


@app.get("/api/avatar/validate")
async def validate_avatar():
    """Debug endpoint - validate avatar skeleton integrity"""
    renderer = AvatarRenderer()
    info = renderer.get_skeleton_info()
    return info


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        timeout_keep_alive=30,
    )
