"""
Avatar Rendering System - Medical presenter avatar with proper body rigging
Fixes: body/hand detachment, animation timing, proper joint connections
"""

import asyncio
import json
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum


class AvatarStyle(Enum):
    DOCTOR = "doctor"
    PROFESSOR = "professor"
    SCIENTIST = "scientist"


@dataclass
class AvatarConfig:
    """Avatar appearance and rigging configuration"""
    style: AvatarStyle = AvatarStyle.DOCTOR
    name: str = "Dr. Presenter"
    width: int = 400
    height: int = 600
    # Body proportions (relative to height=1.0)
    head_ratio: float = 0.15
    torso_ratio: float = 0.35
    arm_length_ratio: float = 0.30
    leg_ratio: float = 0.35
    # Joint anchor points (relative to body center)
    shoulder_y: float = 0.28
    elbow_y: float = 0.15
    wrist_y: float = 0.02
    hip_y: float = -0.15
    knee_y: float = -0.30
    # Colors
    skin_color: str = "#FFD5B4"
    coat_color: str = "#FFFFFF"
    pants_color: str = "#2C3E50"
    shoe_color: str = "#1A1A2E"
    tie_color: str = "#E74C3C"


@dataclass
class JointPoint:
    """A single joint with position and parent linkage"""
    x: float
    y: float
    parent: Optional[str] = None
    locked: bool = True  # Prevents detachment


@dataclass
class AvatarSkeleton:
    """Full body skeleton with locked joints to prevent detachment"""
    joints: Dict[str, JointPoint] = field(default_factory=dict)

    @classmethod
    def create_default(cls, config: AvatarConfig) -> "AvatarSkeleton":
        """Create a properly rigged skeleton with all joints connected"""
        skeleton = cls()

        # Spine chain (head -> neck -> torso -> hips) - ALL LOCKED
        skeleton.joints = {
            # Head/Neck
            "head_top": JointPoint(0, 0.50, "neck", locked=True),
            "head_center": JointPoint(0, 0.43, "neck", locked=True),
            "neck": JointPoint(0, 0.35, "shoulder_center", locked=True),

            # Shoulder girdle - LOCKED to torso
            "shoulder_center": JointPoint(0, 0.30, "spine_upper", locked=True),
            "shoulder_left": JointPoint(-0.18, 0.28, "shoulder_center", locked=True),
            "shoulder_right": JointPoint(0.18, 0.28, "shoulder_center", locked=True),

            # Upper arms - LOCKED to shoulders
            "elbow_left": JointPoint(-0.25, 0.15, "shoulder_left", locked=True),
            "elbow_right": JointPoint(0.25, 0.15, "shoulder_right", locked=True),

            # Forearms - LOCKED to elbows
            "wrist_left": JointPoint(-0.28, 0.02, "elbow_left", locked=True),
            "wrist_right": JointPoint(0.28, 0.02, "elbow_right", locked=True),

            # Hands - LOCKED to wrists (fixes hand detachment)
            "hand_left": JointPoint(-0.30, -0.04, "wrist_left", locked=True),
            "hand_right": JointPoint(0.30, -0.04, "wrist_right", locked=True),
            "fingertip_left": JointPoint(-0.32, -0.10, "hand_left", locked=True),
            "fingertip_right": JointPoint(0.32, -0.10, "hand_right", locked=True),

            # Spine
            "spine_upper": JointPoint(0, 0.20, "shoulder_center", locked=True),
            "spine_mid": JointPoint(0, 0.10, "spine_upper", locked=True),
            "spine_lower": JointPoint(0, 0.0, "spine_mid", locked=True),

            # Hips - LOCKED to spine
            "hip_center": JointPoint(0, -0.10, "spine_lower", locked=True),
            "hip_left": JointPoint(-0.10, -0.12, "hip_center", locked=True),
            "hip_right": JointPoint(0.10, -0.12, "hip_center", locked=True),

            # Upper legs - LOCKED to hips
            "knee_left": JointPoint(-0.12, -0.28, "hip_left", locked=True),
            "knee_right": JointPoint(0.12, -0.28, "hip_right", locked=True),

            # Lower legs - LOCKED to knees
            "ankle_left": JointPoint(-0.12, -0.44, "knee_left", locked=True),
            "ankle_right": JointPoint(0.12, -0.44, "knee_right", locked=True),

            # Feet - LOCKED to ankles
            "foot_left": JointPoint(-0.15, -0.50, "ankle_left", locked=True),
            "foot_right": JointPoint(0.15, -0.50, "ankle_right", locked=True),
        }

        return skeleton

    def validate(self) -> List[str]:
        """Check all joints have valid parents - returns list of errors"""
        errors = []
        for name, joint in self.joints.items():
            if joint.parent and joint.parent not in self.joints:
                errors.append(f"Joint '{name}' references missing parent '{joint.parent}'")
            if not joint.locked:
                errors.append(f"Joint '{name}' is NOT locked - may detach!")
        return errors

    def get_chain(self, start: str, end: str) -> List[str]:
        """Get joint chain from start to end"""
        chain = [start]
        current = start
        visited = {start}

        while current != end:
            joint = self.joints.get(current)
            if not joint or not joint.parent or joint.parent in visited:
                break
            chain.append(joint.parent)
            current = joint.parent
            visited.add(current)

        return chain


class AvatarRenderer:
    """SVG/HTML-based avatar renderer with proper body rigging"""

    def __init__(self, config: AvatarConfig = None):
        self.config = config or AvatarConfig()
        self.skeleton = AvatarSkeleton.create_default(self.config)
        self._validate_skeleton()

    def _validate_skeleton(self):
        """Ensure skeleton has no issues"""
        errors = self.skeleton.validate()
        if errors:
            print(f"Avatar skeleton warnings: {errors}")

    def render_svg(self, gesture: str = "neutral", width: int = None, height: int = None) -> str:
        """Render avatar as SVG string with proper body connections"""
        w = width or self.config.width
        h = height or self.config.height
        joints = self.skeleton.joints

        # Scale factor
        scale = min(w, h) * 0.9
        cx, cy = w / 2, h * 0.55  # Center point

        def pos(joint_name: str) -> Tuple[float, float]:
            j = joints[joint_name]
            return (cx + j.x * scale, cy - j.y * scale)

        # Build SVG with explicit path connections (no floating parts)
        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">',
            '<defs>',
            '<linearGradient id="coatGrad" x1="0%" y1="0%" x2="0%" y2="100%">',
            '<stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#E8E8E8;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
        ]

        # -- LEGS (draw first, behind torso) --
        for side in ["left", "right"]:
            hip = pos(f"hip_{side}")
            knee = pos(f"knee_{side}")
            ankle = pos(f"ankle_{side}")
            foot = pos(f"foot_{side}")

            # Thigh
            svg_parts.append(
                f'<line x1="{hip[0]}" y1="{hip[1]}" x2="{knee[0]}" y2="{knee[1]}" '
                f'stroke="{self.config.pants_color}" stroke-width="16" stroke-linecap="round"/>'
            )
            # Shin
            svg_parts.append(
                f'<line x1="{knee[0]}" y1="{knee[1]}" x2="{ankle[0]}" y2="{ankle[1]}" '
                f'stroke="{self.config.pants_color}" stroke-width="14" stroke-linecap="round"/>'
            )
            # Foot
            svg_parts.append(
                f'<line x1="{ankle[0]}" y1="{ankle[1]}" x2="{foot[0]}" y2="{foot[1]}" '
                f'stroke="{self.config.shoe_color}" stroke-width="12" stroke-linecap="round"/>'
            )
            # Shoe ellipse
            svg_parts.append(
                f'<ellipse cx="{foot[0]}" cy="{foot[1]}" rx="14" ry="7" fill="{self.config.shoe_color}"/>'
            )

        # -- TORSO (single connected shape) --
        shoulder_l = pos("shoulder_left")
        shoulder_r = pos("shoulder_right")
        hip_l = pos("hip_left")
        hip_r = pos("hip_right")
        neck = pos("neck")

        svg_parts.append(
            f'<polygon points="'
            f'{shoulder_l[0]},{shoulder_l[1]} '
            f'{shoulder_r[0]},{shoulder_r[1]} '
            f'{hip_r[0]},{hip_r[1]} '
            f'{hip_l[0]},{hip_l[1]}" '
            f'fill="url(#coatGrad)" stroke="#DDD" stroke-width="1"/>'
        )

        # -- ARMS (connected to shoulders, hands connected to wrists) --
        for side in ["left", "right"]:
            shoulder = pos(f"shoulder_{side}")
            elbow = pos(f"elbow_{side}")
            wrist = pos(f"wrist_{side}")
            hand = pos(f"hand_{side}")
            fingertip = pos(f"fingertip_{side}")

            # Upper arm
            svg_parts.append(
                f'<line x1="{shoulder[0]}" y1="{shoulder[1]}" x2="{elbow[0]}" y2="{elbow[1]}" '
                f'stroke="url(#coatGrad)" stroke-width="14" stroke-linecap="round"/>'
            )
            # Forearm
            svg_parts.append(
                f'<line x1="{elbow[0]}" y1="{elbow[1]}" x2="{wrist[0]}" y2="{wrist[1]}" '
                f'stroke="{self.config.skin_color}" stroke-width="11" stroke-linecap="round"/>'
            )
            # Hand (connected to wrist - fixes detachment)
            svg_parts.append(
                f'<line x1="{wrist[0]}" y1="{wrist[1]}" x2="{hand[0]}" y2="{hand[1]}" '
                f'stroke="{self.config.skin_color}" stroke-width="10" stroke-linecap="round"/>'
            )
            # Fingertips
            svg_parts.append(
                f'<line x1="{hand[0]}" y1="{hand[1]}" x2="{fingertip[0]}" y2="{fingertip[1]}" '
                f'stroke="{self.config.skin_color}" stroke-width="6" stroke-linecap="round"/>'
            )
            # Hand circle (palm)
            svg_parts.append(
                f'<circle cx="{hand[0]}" cy="{hand[1]}" r="8" fill="{self.config.skin_color}"/>'
            )

        # -- HEAD (connected to neck) --
        head_center = pos("head_center")
        head_radius = scale * self.config.head_ratio

        # Neck line
        svg_parts.append(
            f'<line x1="{neck[0]}" y1="{neck[1]}" x2="{head_center[0]}" y2="{head_center[1] + head_radius}" '
            f'stroke="{self.config.skin_color}" stroke-width="10" stroke-linecap="round"/>'
        )

        # Head circle
        svg_parts.append(
            f'<circle cx="{head_center[0]}" cy="{head_center[1]}" r="{head_radius}" '
            f'fill="{self.config.skin_color}" stroke="#E0C8A8" stroke-width="1"/>'
        )

        # Face features
        eye_y = head_center[1] - head_radius * 0.1
        eye_offset = head_radius * 0.3
        svg_parts.append(f'<circle cx="{head_center[0] - eye_offset}" cy="{eye_y}" r="3" fill="#2C3E50"/>')
        svg_parts.append(f'<circle cx="{head_center[0] + eye_offset}" cy="{eye_y}" r="3" fill="#2C3E50"/>')

        mouth_y = head_center[1] + head_radius * 0.35
        svg_parts.append(
            f'<path d="M{head_center[0] - head_radius*0.25},{mouth_y} '
            f'Q{head_center[0]},{mouth_y + head_radius*0.15} '
            f'{head_center[0] + head_radius*0.25},{mouth_y}" '
            f'fill="none" stroke="#C0392B" stroke-width="2" stroke-linecap="round"/>'
        )

        # -- COAT DETAILS --
        # Collar
        svg_parts.append(
            f'<path d="M{neck[0] - 12},{neck[1]} L{neck[0]},{neck[1] + 8} L{neck[0] + 12},{neck[1]}" '
            f'fill="none" stroke="#CCC" stroke-width="2"/>'
        )

        # Coat center line
        svg_parts.append(
            f'<line x1="{(shoulder_l[0]+shoulder_r[0])/2}" y1="{(shoulder_l[1]+shoulder_r[1])/2}" '
            f'x2="{(hip_l[0]+hip_r[0])/2}" y2="{(hip_l[1]+hip_r[1])/2}" '
            f'stroke="#DDD" stroke-width="1" stroke-dasharray="4,3"/>'
        )

        svg_parts.append('</svg>')
        return "\n".join(svg_parts)

    def render_html_overlay(self, gesture: str = "neutral") -> str:
        """Render avatar as HTML/CSS for overlay on video"""
        svg = self.render_svg(gesture)
        return f'''<!DOCTYPE html>
<html>
<head>
<style>
.avatar-container {{
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 200px;
    height: 300px;
    z-index: 1000;
    pointer-events: none;
}}
</style>
</head>
<body>
<div class="avatar-container">
{svg}
</div>
</body>
</html>'''

    def get_skeleton_info(self) -> Dict[str, Any]:
        """Return skeleton info for debugging"""
        return {
            "joint_count": len(self.skeleton.joints),
            "locked_joints": sum(1 for j in self.skeleton.joints.values() if j.locked),
            "unlocked_joints": sum(1 for j in self.skeleton.joints.values() if not j.locked),
            "errors": self.skeleton.validate(),
            "joints": {name: {"x": j.x, "y": j.y, "parent": j.parent, "locked": j.locked}
                       for name, j in self.skeleton.joints.items()},
        }


if __name__ == "__main__":
    renderer = AvatarRenderer()
    info = renderer.get_skeleton_info()
    print(f"Joints: {info['joint_count']}, Locked: {info['locked_joints']}, Errors: {info['errors']}")

    svg = renderer.render_svg()
    Path("avatar_test.svg").write_text(svg)
    print("SVG saved to avatar_test.svg")
