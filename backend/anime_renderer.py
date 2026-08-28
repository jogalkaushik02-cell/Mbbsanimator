"""
Anime-Style Video Renderer - 2D and 3D animated medical videos
Creates anime-aesthetic visuals with smooth animations, bold outlines, vibrant colors
"""

from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json


class RenderDimension(Enum):
    TWO_D = "2d"
    THREE_D = "3d"


class AnimeStyle(Enum):
    SHONEN = "shonen"        # Action-packed, bold (for pathology, surgery)
    SHOUJO = "shoujo"        # Soft, elegant (for anatomy, physiology)
    CHIBI = "chibi"          # Cute, simplified (for quick overviews)
    REALISTIC = "realistic"  # Semi-realistic (for clinical topics)
    DEFAULT = "default"      # Balanced anime style


@dataclass
class AnimeConfig:
    """Anime rendering configuration"""
    dimension: RenderDimension = RenderDimension.TWO_D
    style: AnimeStyle = AnimeStyle.DEFAULT
    width: int = 1920
    height: int = 1080
    fps: int = 30
    # Anime color palette
    bg_color: str = "#1a1a2e"         # Dark navy background
    accent_color: str = "#e94560"     # Vibrant red accent
    text_color: str = "#ffffff"       # White text
    highlight_color: str = "#0f3460"  # Deep blue highlight
    skin_tone: str = "#fce4d6"        # Light skin
    # Anime aesthetic
    outline_width: float = 3.0        # Bold outlines (anime signature)
    glow_enabled: bool = True         # Neon glow effects
    particle_effects: bool = True     # Sparkle/energy particles
    speed_lines: bool = True          # Motion speed lines
    sakuga_frames: bool = True        # High-quality key animation frames
    # Timing
    scene_duration: float = 4.0       # Seconds per scene
    transition_duration: float = 0.5  # Transition time between scenes


# ============================================================
# Manim Scene Templates - Anime Style
# ============================================================

ANIME_2D_TEMPLATES = {
    "intro": '''
from manim import *
import random

class MedVidScene(Scene):
    def construct(self):
        # Anime intro with dramatic reveal
        self.camera.background_color = "{bg_color}"

        # Title with glow effect
        title = Text("{title}", font_size={font_size}, color="{accent_color}", weight=BOLD)
        title.set_stroke(color="{accent_color}", width=2)

        # Japanese-style subtitle line
        subtitle = Text("{subtitle}", font_size=24, color="{text_color}")
        subtitle.set_opacity(0.8)

        # Decorative lines (anime aesthetic)
        line_left = Line(LEFT * 6, LEFT * 1, color="{accent_color}", stroke_width=2)
        line_right = Line(RIGHT * 1, RIGHT * 6, color="{accent_color}", stroke_width=2)
        line_group = VGroup(line_left, line_right).next_to(title, DOWN, buff=0.3)

        # Speed lines background
        speed_lines = VGroup()
        for i in range(20):
            angle = random.uniform(-PI, PI)
            length = random.uniform(2, 6)
            line = Line(ORIGIN, length * np.array([np.cos(angle), np.sin(angle), 0]),
                       color="{accent_color}", stroke_width=1, stroke_opacity=0.3)
            speed_lines.add(line)

        # Animation sequence
        self.play(Create(speed_lines), run_time=0.5)
        self.play(Write(title), run_time=1.5)
        self.play(Create(line_group), run_time=0.5)
        self.play(FadeIn(subtitle, shift=UP * 0.3), run_time=0.8)

        # Sparkle particles
        if {particle_effects}:
            particles = VGroup()
            for _ in range(15):
                dot = Dot(
                    point=title.get_center() + random.uniform(-3, 3) * RIGHT + random.uniform(-1, 1) * UP,
                    radius=0.03,
                    color=random.choice(["{accent_color}", "{text_color}", "#ffeb3b"])
                )
                particles.add(dot)
            self.play(FadeIn(particles, scale=2), run_time=0.5)
            self.wait(0.3)
            self.play(FadeOut(particles), run_time=0.3)

        self.wait(2)
        self.play(FadeOut(title), FadeOut(subtitle), FadeOut(line_group), FadeOut(speed_lines))
''',

    "content": '''
from manim import *
import random

class MedVidScene(Scene):
    def construct(self):
        self.camera.background_color = "{bg_color}"

        # Section title with anime style underline
        section_title = Text("{section_title}", font_size=36, color="{accent_color}", weight=BOLD)
        section_title.to_edge(UP, buff=0.8)

        # Anime-style underline
        underline = Line(
            section_title.get_left() + DOWN * 0.1,
            section_title.get_right() + DOWN * 0.1,
            color="{accent_color}", stroke_width=3
        )

        # Content with bullet points (anime card style)
        content_items = {content_items}

        cards = VGroup()
        for i, item in enumerate(content_items[:4]):
            # Card background
            card_bg = RoundedRectangle(
                corner_radius=0.15, width=11, height=0.9,
                fill_color="{highlight_color}", fill_opacity=0.6,
                stroke_color="{accent_color}", stroke_width=1.5
            )

            # Bullet number (anime style)
            num_circle = Circle(radius=0.2, fill_color="{accent_color}", fill_opacity=1)
            num_text = Text(str(i + 1), font_size=18, color="{text_color}", weight=BOLD)
            num_group = VGroup(num_circle, num_text)

            # Content text
            text = Text(item, font_size=20, color="{text_color}")
            text.next_to(num_group, RIGHT, buff=0.3)

            card = VGroup(card_bg, num_group, text)
            cards.add(card)

        cards.arrange(DOWN, buff=0.15)
        cards.next_to(underline, DOWN, buff=0.4)

        # Speed lines on entrance
        speed_lines = VGroup()
        for _ in range(12):
            angle = random.uniform(-0.3, 0.3)
            line = Line(LEFT * 8, LEFT * 4, color="{accent_color}", stroke_width=1, stroke_opacity=0.4)
            line.rotate(angle)
            speed_lines.add(line)

        # Animation
        self.play(Create(section_title), Create(underline), run_time=1)
        self.play(FadeIn(speed_lines, shift=RIGHT * 2), run_time=0.3)
        self.play(FadeOut(speed_lines), run_time=0.2)

        for card in cards:
            self.play(FadeIn(card, shift=UP * 0.2), run_time=0.4)
            self.wait(0.2)

        self.wait(3)
        self.play(FadeOut(VGroup(section_title, underline, cards)))
''',

    "diagram": '''
from manim import *
import random

class MedVidScene(Scene):
    def construct(self):
        self.camera.background_color = "{bg_color}"

        # Title
        title = Text("{title}", font_size=32, color="{accent_color}", weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.8)

        # Central diagram (anime-styled medical illustration)
        center_circle = Circle(radius=1.5, color="{accent_color}", stroke_width=3)
        center_circle.set_fill("{highlight_color}", opacity=0.3)
        center_label = Text("{center_label}", font_size=20, color="{text_color}")
        center_group = VGroup(center_circle, center_label)

        # Surrounding nodes with connections
        nodes = VGroup()
        node_labels = {node_labels}
        angles = [i * (2 * PI / len(node_labels)) for i in range(len(node_labels))]

        for i, (label, angle) in enumerate(zip(node_labels, angles)):
            pos = 3.2 * np.array([np.cos(angle), np.sin(angle), 0])
            node_circle = Circle(radius=0.5, color="{accent_color}", stroke_width=2)
            node_circle.set_fill("{bg_color}", opacity=0.8)
            node_circle.move_to(pos)
            node_text = Text(label, font_size=14, color="{text_color}")
            node_text.move_to(pos)
            nodes.add(VGroup(node_circle, node_text))

        # Connection lines
        connections = VGroup()
        for node in nodes:
            line = DashedLine(center_circle.get_center(), node[0].get_center(),
                            color="{accent_color}", stroke_width=1, stroke_opacity=0.5)
            connections.add(line)

        # Energy particles along connections
        particles = VGroup()
        for conn in connections:
            for t in [0.2, 0.5, 0.8]:
                point = conn.point_from_proportion(t)
                dot = Dot(point, radius=0.04, color="{accent_color}")
                particles.add(dot)

        # Animation
        self.play(Create(center_group), run_time=1)
        self.play(Create(connections), run_time=1)
        self.play(FadeIn(nodes, scale=0.5), run_time=1)

        if {particle_effects}:
            self.play(FadeIn(particles, scale=2), run_time=0.5)

        # Pulse animation on center
        self.play(
            center_circle.animate.set_fill("{accent_color}", opacity=0.5),
            rate_func=there_and_back,
            run_time=1
        )

        self.wait(3)
        self.play(FadeOut(VGroup(title, center_group, nodes, connections, particles)))
''',

    "outro": '''
from manim import *

class MedVidScene(Scene):
    def construct(self):
        self.camera.background_color = "{bg_color}"

        # Thank you with anime style
        thanks = Text("Thank You", font_size={font_size}, color="{accent_color}", weight=BOLD)
        thanks.set_stroke(color="{accent_color}", width=2)

        # References
        refs = Text("{references}", font_size=16, color="{text_color}")
        refs.set_opacity(0.7)
        refs.next_to(thanks, DOWN, buff=0.8)

        # Channel branding
        brand = Text("MedVid AI", font_size=24, color="{text_color}")
        brand.set_opacity(0.5)
        brand.to_edge(DOWN, buff=0.5)

        # Decorative elements
        star_positions = [
            UP * 2 + LEFT * 4, UP * 2 + RIGHT * 4,
            DOWN * 1 + LEFT * 5, DOWN * 1 + RIGHT * 5,
        ]
        stars = VGroup()
        for pos in star_positions:
            star = Star(n=5, outer_radius=0.15, inner_radius=0.07, fill_color="#ffeb3b", fill_opacity=0.8)
            star.move_to(pos)
            stars.add(star)

        # Animation
        self.play(Write(thanks), run_time=1.5)
        self.play(FadeIn(refs, shift=UP * 0.3), run_time=0.8)
        self.play(FadeIn(brand), run_time=0.5)

        # Twinkling stars
        self.play(
            *[star.animate.set_opacity(0.3).scale(0.8) for star in stars],
            run_time=0.5
        )
        self.play(
            *[star.animate.set_opacity(1).scale(1) for star in stars],
            run_time=0.5
        )

        self.wait(3)
        self.play(*[FadeOut(mob) for mob in self.mobjects])
''',
}


ANIME_3D_TEMPLATES = {
    "intro": '''
from manim import *
import random

class MedVidScene(ThreeDScene):
    def construct(self):
        # 3D Anime intro with rotating camera
        axes = ThreeDAxes(x_range=[-4, 4], y_range=[-4, 4], z_range=[-4, 4],
                         x_length=8, y_length=8, z_length=8,
                         axis_config={{'color': GRAY, 'stroke_width': 1}})

        title = Text("{title}", font_size={font_size}, color="{accent_color}")
        title.set_stroke(color="{accent_color}", width=2)

        # 3D sphere (cell/organelle representation)
        sphere = Sphere(radius=1.5, resolution=(32, 32))
        sphere.set_color("{accent_color}")
        sphere.set_opacity(0.7)
        sphere.set_fill("{highlight_color}", opacity=0.5)

        # Set camera for 3D view
        self.set_camera_orientation(phi=75 * DEGREES, theta=30 * DEGREES)

        # Animate
        self.play(Create(axes), run_time=1)
        self.play(Create(sphere), run_time=1.5)
        self.begin_ambient_camera_rotation(rate=0.3)
        self.wait(2)

        # Add title in 3D space
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1)
        self.wait(2)

        self.stop_ambient_camera_rotation()
        self.play(FadeOut(title), FadeOut(sphere), FadeOut(axes))
''',

    "content": '''
from manim import *
import random

class MedVidScene(ThreeDScene):
    def construct(self):
        # 3D content with medical structures
        axes = ThreeDAxes(x_range=[-3, 3], y_range=[-3, 3], z_range=[-3, 3],
                         x_length=6, y_length=6, z_length=6,
                         axis_config={{'color': GRAY, 'stroke_width': 1}})

        title = Text("{section_title}", font_size=32, color="{accent_color}", weight=BOLD)
        self.add_fixed_in_frame_mobjects(title)
        title.to_edge(UP, buff=0.5)

        # 3D objects representing medical concepts
        objects = VGroup()
        labels = {node_labels}

        colors = ["{accent_color}", "{highlight_color}", "#ff6b6b", "#4ecdc4", "#45b7d1"]

        for i, label_text in enumerate(labels[:4]):
            sphere = Sphere(radius=0.5, resolution=(16, 16))
            sphere.set_color(colors[i % len(colors)])
            sphere.set_opacity(0.8)
            sphere.move_to(2.5 * np.array([
                np.cos(i * PI / 2),
                np.sin(i * PI / 2),
                0
            ]))
            objects.add(sphere)

        # Set camera
        self.set_camera_orientation(phi=60 * DEGREES, theta=45 * DEGREES)

        # Animation
        self.play(Write(title), run_time=0.8)

        for obj in objects:
            self.play(Create(obj), run_time=0.5)

        self.begin_ambient_camera_rotation(rate=0.2)
        self.wait(3)

        self.stop_ambient_camera_rotation()
        self.play(FadeOut(VGroup(title, objects, axes)))
''',
}


def get_anime_template(
    scene_type: str,
    dimension: RenderDimension = RenderDimension.TWO_D,
    **kwargs
) -> str:
    """Get Manim scene template with anime styling"""
    templates = ANIME_2D_TEMPLATES if dimension == RenderDimension.TWO_D else ANIME_3D_TEMPLATES
    template = templates.get(scene_type, ANIME_2D_TEMPLATES.get("content", ""))

    # Fill in template variables with defaults
    defaults = {
        "bg_color": "#1a1a2e",
        "accent_color": "#e94560",
        "text_color": "#ffffff",
        "highlight_color": "#0f3460",
        "title": "Medical Topic",
        "subtitle": "Medical Education",
        "section_title": "Section",
        "center_label": "Core Concept",
        "font_size": "48",
        "references": "MedVid AI",
        "content_items": '["Point 1", "Point 2", "Point 3"]',
        'node_labels': '["Node 1", "Node 2", "Node 3", "Node 4"]',
        "particle_effects": "True",
    }
    defaults.update(kwargs)

    try:
        return template.format(**defaults)
    except KeyError:
        # Return template with safe defaults if some keys are missing
        for key, val in defaults.items():
            template = template.replace("{" + key + "}", str(val))
        return template


def get_dimension_info() -> Dict[str, Any]:
    """Get info about available rendering options"""
    return {
        "2d": {
            "name": "2D Anime",
            "description": "Flat anime style with bold outlines, vibrant colors, speed lines",
            "styles": [s.value for s in AnimeStyle],
            "best_for": ["Quick overviews", "Concept explanations", "Pathology mechanisms"],
            "resolution": "1920x1080",
            "render_time": "~2-4 minutes",
        },
        "3d": {
            "name": "3D Anime",
            "description": "Three-dimensional with rotating camera, depth effects",
            "styles": ["default", "realistic"],
            "best_for": ["Anatomy", "Organ systems", "Spatial relationships"],
            "resolution": "1920x1080",
            "render_time": "~4-6 minutes",
        },
    }
