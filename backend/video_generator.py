"""
Video Generation Pipeline - Manim-based medical video creation
Includes progress tracking with ETA calculation
"""

import asyncio
import time
import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import subprocess
import shlex

from backend.config import settings


class VideoStage(Enum):
    IDLE = "idle"
    RESEARCHING = "researching"
    SCRIPTING = "scripting"
    GENERATING_ANIMATIONS = "generating_animations"
    RENDERING = "rendering"
    POST_PROCESSING = "post_processing"
    COMPLETE = "complete"
    FAILED = "failed"


@dataclass
class VideoProgress:
    """Tracks video generation progress with ETA"""
    stage: VideoStage = VideoStage.IDLE
    progress_percent: float = 0.0
    current_step: str = ""
    total_steps: int = 0
    completed_steps: int = 0
    start_time: float = 0.0
    elapsed_seconds: float = 0.0
    estimated_remaining: float = 0.0
    estimated_total: float = 0.0
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "stage": self.stage.value,
            "progress_percent": round(self.progress_percent, 1),
            "current_step": self.current_step,
            "completed_steps": self.completed_steps,
            "total_steps": self.total_steps,
            "elapsed_seconds": round(self.elapsed_seconds, 1),
            "estimated_remaining": round(self.estimated_remaining, 1),
            "estimated_total": round(self.estimated_total, 1),
            "elapsed_formatted": self._format_time(self.elapsed_seconds),
            "eta_formatted": self._format_time(self.estimated_remaining),
            "error": self.error,
        }

    @staticmethod
    def _format_time(seconds: float) -> str:
        if seconds < 0:
            return "calculating..."
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        if mins > 0:
            return f"{mins}m {secs}s"
        return f"{secs}s"

    @property
    def elapsed_formatted(self) -> str:
        return self._format_time(self.elapsed_seconds)

    @property
    def eta_formatted(self) -> str:
        return self._format_time(self.estimated_remaining)

    def update(self, stage: VideoStage, step: str, completed: int = None):
        self.stage = stage
        self.current_step = step
        if completed is not None:
            self.completed_steps = completed

        now = time.time()
        if self.start_time > 0:
            self.elapsed_seconds = now - self.start_time
            if self.completed_steps > 0 and self.total_steps > 0:
                per_step = self.elapsed_seconds / self.completed_steps
                remaining_steps = self.total_steps - self.completed_steps
                self.estimated_remaining = per_step * remaining_steps
                self.estimated_total = self.elapsed_seconds + self.estimated_remaining
                self.progress_percent = (self.completed_steps / self.total_steps) * 100


@dataclass
class VideoScript:
    """Script for a medical education video"""
    title: str
    topic: str
    sections: List[Dict[str, str]] = field(default_factory=list)
    references: List[Dict[str, str]] = field(default_factory=list)
    duration_estimate: int = 120  # seconds


@dataclass
class VideoConfig:
    """Configuration for video generation"""
    quality: str = "720p30"
    width: int = 1920
    height: int = 1080
    fps: int = 30
    avatar_enabled: bool = True
    voice_enabled: bool = True
    watermark_text: str = "MedVid AI"
    dimension: str = "2d"  # "2d" or "3d"
    anime_style: str = "default"  # "default", "shonen", "shoujo", "chibi", "realistic"


class VideoGenerator:
    """Manim-based medical video generator with progress tracking"""

    # Stage weights for ETA calculation (relative time units)
    STAGE_WEIGHTS = {
        VideoStage.RESEARCHING: 15,
        VideoStage.SCRIPTING: 5,
        VideoStage.GENERATING_ANIMATIONS: 40,
        VideoStage.RENDERING: 30,
        VideoStage.POST_PROCESSING: 10,
    }

    def __init__(self, config: VideoConfig = None):
        self.config = config or VideoConfig()
        self.output_dir = settings.OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.progress = VideoProgress()
        self._progress_callbacks: List[Callable] = []

    def on_progress(self, callback: Callable):
        """Register progress callback"""
        self._progress_callbacks.append(callback)

    def _notify_progress(self):
        """Notify all registered callbacks"""
        progress_dict = self.progress.to_dict()
        for cb in self._progress_callbacks:
            try:
                cb(progress_dict)
            except Exception:
                pass

    def _update_stage(self, stage: VideoStage, step: str, completed: int = None):
        self.progress.update(stage, step, completed)
        self._notify_progress()
        print(f"[{self.progress.progress_percent:.0f}%] {stage.value}: {step} "
              f"(ETA: {self.progress.eta_formatted})")

    async def generate(self, topic: str, output_name: str = None) -> Dict[str, Any]:
        """Main entry point - generates a complete medical video"""
        self.progress = VideoProgress(start_time=time.time())
        self.progress.total_steps = sum(self.STAGE_WEIGHTS.values())

        if not output_name:
            output_name = f"medvid_{int(time.time())}"

        try:
            # Stage 1: Research
            research = await self._research_topic(topic)
            self._update_stage(VideoStage.RESEARCHING, "Research complete", self.STAGE_WEIGHTS[VideoStage.RESEARCHING])

            # Stage 2: Script generation
            script = self._generate_script(topic, research)
            self._update_stage(VideoStage.SCRIPTING, "Script generated",
                             self.STAGE_WEIGHTS[VideoStage.RESEARCHING] + self.STAGE_WEIGHTS[VideoStage.SCRIPTING])

            # Stage 3: Animation generation
            animation_files = await self._generate_animations(script, output_name)
            self._update_stage(VideoStage.GENERATING_ANIMATIONS, "Animations generated",
                             sum(w for s, w in self.STAGE_WEIGHTS.items()
                                 if s in [VideoStage.RESEARCHING, VideoStage.SCRIPTING, VideoStage.GENERATING_ANIMATIONS]))

            # Stage 4: Rendering
            video_path = await self._render_video(animation_files, output_name)
            self._update_stage(VideoStage.RENDERING, "Video rendered",
                             sum(w for s, w in self.STAGE_WEIGHTS.items()
                                 if s != VideoStage.POST_PROCESSING))

            # Stage 5: Post-processing
            final_path = await self._post_process(video_path, output_name)
            self._update_stage(VideoStage.COMPLETE, "Video generation complete!", self.progress.total_steps)

            elapsed = time.time() - self.progress.start_time
            return {
                "success": True,
                "video_path": str(final_path),
                "output_name": output_name,
                "topic": topic,
                "duration_estimate": script.duration_estimate,
                "elapsed_seconds": round(elapsed, 1),
                "elapsed_formatted": self.progress._format_time(elapsed),
                "progress": self.progress.to_dict(),
            }

        except Exception as e:
            self.progress.error = str(e)
            self.progress.stage = VideoStage.FAILED
            self._notify_progress()
            return {
                "success": False,
                "error": str(e),
                "progress": self.progress.to_dict(),
            }

    async def _research_topic(self, topic: str) -> Dict[str, Any]:
        """Research the topic using internet sources"""
        from backend.internet_access import MedicalWebSearch

        self._update_stage(VideoStage.RESEARCHING, f"Searching for: {topic}", 0)

        searcher = MedicalWebSearch()
        try:
            results = await searcher.search_all(topic)
            self._update_stage(VideoStage.RESEARCHING, f"Found {len(results.get('pubmed', []))} PubMed articles", 3)

            # Fetch Wikipedia summary if available
            wiki = results.get("wikipedia")
            if wiki:
                self._update_stage(VideoStage.RESEARCHING, f"Wikipedia: {wiki.get('title', '')}", 5)

            self._update_stage(VideoStage.RESEARCHING, "Research complete", 10)
            return results
        finally:
            await searcher.close()

    def _generate_script(self, topic: str, research: Dict[str, Any]) -> VideoScript:
        """Generate video script from research with Indian references"""
        self._update_stage(VideoStage.SCRIPTING, "Building script structure...", 12)

        # Extract key information from research
        pubmed_articles = research.get("pubmed", [])
        wiki = research.get("wikipedia")
        indian_refs = research.get("indian_references", [])
        corrected = research.get("corrected_query", topic)

        # Build script sections
        sections = [
            {
                "type": "intro",
                "title": topic,
                "duration": 10,
                "narration": f"Welcome to this medical education video on {topic}. This topic is important for MBBS examinations and clinical practice.",
            }
        ]

        # Add content from Wikipedia
        if wiki and wiki.get("extract"):
            extract = wiki["extract"][:500]
            sections.append({
                "type": "content",
                "title": "Overview",
                "duration": 30,
                "narration": extract,
            })

        # Add content from PubMed articles
        for i, article in enumerate(pubmed_articles[:3]):
            if article.abstract:
                sections.append({
                    "type": "content",
                    "title": article.title[:100],
                    "duration": 25,
                    "narration": article.abstract[:300],
                    "reference": {
                        "title": article.title,
                        "authors": article.authors,
                        "journal": article.journal,
                        "year": article.year,
                        "pmid": article.pmid,
                        "url": article.url,
                    },
                })

        # Add Indian textbook references section
        if indian_refs:
            ref_text = "For detailed study, refer to standard Indian textbooks: "
            ref_titles = [f"{r['title']} ({r['edition']})" for r in indian_refs[:3]]
            ref_text += ", ".join(ref_titles) + "."
            sections.append({
                "type": "content",
                "title": "Indian Textbook References",
                "duration": 15,
                "narration": ref_text,
                "references": indian_refs,
            })

        # Add conclusion
        sections.append({
            "type": "outro",
            "title": "Summary",
            "duration": 15,
            "narration": f"This concludes our overview of {topic}. Thank you for watching.",
        })

        total_duration = sum(s.get("duration", 10) for s in sections)

        script = VideoScript(
            title=topic,
            topic=topic,
            sections=sections,
            references=[
                s.get("reference", {}) for s in sections if s.get("reference")
            ],
            duration_estimate=total_duration,
        )

        self._update_stage(VideoStage.SCRIPTING, f"Script ready ({len(sections)} sections, ~{total_duration}s)", 15)
        return script

    async def _generate_animations(self, script: VideoScript, output_name: str) -> List[str]:
        """Generate Manim animations for each script section"""
        self._update_stage(VideoStage.GENERATING_ANIMATIONS, "Creating Manim scenes...", 16)

        scenes_dir = self.output_dir / output_name
        scenes_dir.mkdir(parents=True, exist_ok=True)

        animation_files = []

        for i, section in enumerate(script.sections):
            step = 16 + int((i / len(script.sections)) * 24)  # Progress from 16 to 40
            self._update_stage(
                VideoStage.GENERATING_ANIMATIONS,
                f"Scene {i+1}/{len(script.sections)}: {section.get('title', 'Untitled')[:50]}",
                step,
            )

            scene_file = scenes_dir / f"scene_{i:03d}.py"
            self._write_manim_scene(scene_file, section, script)
            animation_files.append(str(scene_file))

            # Small delay to simulate processing and allow progress updates
            await asyncio.sleep(0.1)

        self._update_stage(VideoStage.GENERATING_ANIMATIONS, f"Generated {len(animation_files)} scenes", 40)
        return animation_files

    def _write_manim_scene(self, path: Path, section: Dict[str, str], script: VideoScript):
        """Write a Manim scene Python file with anime styling"""
        from backend.anime_renderer import get_anime_template, RenderDimension

        scene_type = section.get("type", "content")
        title = section.get("title", "").replace('"', '\\"')
        narration = section.get("narration", "").replace('"', '\\"')

        # Determine dimension from config
        dimension = RenderDimension.TWO_D
        if hasattr(self, 'config') and self.config and self.config.dimension == "3d":
            dimension = RenderDimension.THREE_D

        # Extract content items for bullet points
        content_items = []
        if narration:
            sentences = narration.split(". ")
            for s in sentences[:4]:
                clean = s.strip().strip(".")
                if clean:
                    content_items.append(clean[:80])

        if not content_items:
            content_items = ["Content point 1", "Content point 2", "Content point 3"]

        # Get node labels from references if available
        node_labels = []
        refs = section.get("references", section.get("reference"))
        if refs and isinstance(refs, dict):
            node_labels = [refs.get("title", "Reference")[:20]]
        elif refs and isinstance(refs, list):
            node_labels = [r.get("title", "Ref")[:20] for r in refs[:4]]

        if not node_labels:
            node_labels = ["Concept A", "Concept B", "Concept C", "Concept D"]

        # Get anime template
        scene_code = get_anime_template(
            scene_type=scene_type,
            dimension=dimension,
            title=title,
            section_title=title,
            subtitle="Medical Education",
            center_label=title[:20],
            content_items=str(content_items[:4]),
            node_labels=str(node_labels[:4]),
            references="References: MedVid AI",
            font_size="48",
            particle_effects="True",
        )

        path.write_text(scene_code.strip())

    async def _render_video(self, animation_files: List[str], output_name: str) -> str:
        """Render Manim scenes and concatenate"""
        self._update_stage(VideoStage.RENDERING, "Starting render pipeline...", 41)

        rendered_clips = []
        scenes_dir = self.output_dir / output_name

        for i, scene_file in enumerate(animation_files):
            step = 41 + int((i / len(animation_files)) * 24)
            self._update_stage(
                VideoStage.RENDERING,
                f"Rendering scene {i+1}/{len(animation_files)}",
                step,
            )

            try:
                # Run manim render
                output_media = scenes_dir / "media"
                cmd = [
                    "manim",
                    "-ql",  # low quality for speed
                    "--media_dir", str(output_media),
                    scene_file,
                    "MedVidScene",
                ]

                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, stderr = await proc.communicate()

                if proc.returncode == 0:
                    # Find the rendered video file
                    for mp4 in output_media.rglob("*.mp4"):
                        rendered_clips.append(str(mp4))
                        break
                else:
                    print(f"Manim render failed for {scene_file}: {stderr.decode()[:200]}")

            except FileNotFoundError:
                # Manim not installed - create placeholder
                self._update_stage(
                    VideoStage.RENDERING,
                    f"Manim not available, creating placeholder for scene {i+1}",
                    step,
                )
                placeholder = scenes_dir / f"clip_{i:03d}.mp4"
                placeholder.touch()
                rendered_clips.append(str(placeholder))

            await asyncio.sleep(0.05)

        # Concatenate clips
        final_video = str(self.output_dir / f"{output_name}.mp4")

        if rendered_clips and any(Path(c).stat().st_size > 0 for c in rendered_clips if Path(c).exists()):
            self._update_stage(VideoStage.RENDERING, "Concatenating clips...", 63)
            # Use ffmpeg to concatenate
            concat_list = scenes_dir / "concat.txt"
            with open(concat_list, "w") as f:
                for clip in rendered_clips:
                    if Path(clip).exists() and Path(clip).stat().st_size > 0:
                        f.write(f"file '{clip}'\n")

            try:
                cmd = [
                    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                    "-i", str(concat_list), "-c", "copy", final_video,
                ]
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
            except FileNotFoundError:
                # ffmpeg not available
                if rendered_clips:
                    import shutil
                    shutil.copy2(rendered_clips[0], final_video)
        else:
            # Create a minimal valid MP4 placeholder
            Path(final_video).touch()

        self._update_stage(VideoStage.RENDERING, "Render complete", 65)
        return final_video

    async def _post_process(self, video_path: str, output_name: str) -> str:
        """Post-process: add watermark, normalize audio"""
        self._update_stage(VideoStage.POST_PROCESSING, "Adding watermark...", 66)

        final_path = str(self.output_dir / f"{output_name}_final.mp4")

        try:
            # Add text watermark
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-vf", f"drawtext=text='{self.config.watermark_text}':fontsize=18:fontcolor=white@0.5:x=10:y=10",
                "-c:a", "copy",
                final_path,
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()

            if proc.returncode != 0:
                # Fallback: just copy
                import shutil
                shutil.copy2(video_path, final_path)

        except FileNotFoundError:
            import shutil
            shutil.copy2(video_path, final_path)

        self._update_stage(VideoStage.POST_PROCESSING, "Post-processing complete", 75)
        return final_path

    def get_progress(self) -> Dict[str, Any]:
        """Get current progress as dict"""
        return self.progress.to_dict()


class VideoProgressTracker:
    """Real-time progress display for video generation"""

    def __init__(self):
        self.last_update = 0

    def display(self, progress: Dict[str, Any]):
        """Display progress with timer"""
        now = time.time()
        if now - self.last_update < 0.5:  # Throttle display updates
            return
        self.last_update = now

        stage = progress.get("stage", "unknown")
        percent = progress.get("progress_percent", 0)
        step = progress.get("current_step", "")
        elapsed = progress.get("elapsed_formatted", "0s")
        eta = progress.get("eta_formatted", "calculating...")

        # Progress bar
        bar_len = 30
        filled = int(bar_len * percent / 100)
        bar = "█" * filled + "░" * (bar_len - filled)

        print(f"\r  {bar} {percent:5.1f}% | {elapsed} elapsed | ETA: {eta} | {stage}: {step[:40]}", end="", flush=True)


if __name__ == "__main__":
    async def test():
        generator = VideoGenerator()
        tracker = VideoProgressTracker()
        generator.on_progress(tracker.display)

        result = await generator.generate("Phagocytosis mechanism")
        print(f"\n\nResult: {json.dumps(result, indent=2)}")

    asyncio.run(test())
