"""
Base Medical Animation Classes - Reusable components for medical videos
"""

from manim import *
from typing import List, Optional, Dict, Any
import numpy as np


class MedicalScene(Scene):
    """Base scene with medical-themed styling"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.medical_colors = {
            "artery": "#E74C3C",      # Red
            "vein": "#3498DB",        # Blue
            "nerve": "#F39C12",       # Orange
            "muscle": "#E67E22",      # Dark orange
            "bone": "#ECF0F1",        # Light gray
            "organ": "#E74C3C",       # Red
            "cell_membrane": "#2C3E50",
            "nucleus": "#8E44AD",
            "mitochondria": "#E67E22",
            "dna": "#3498DB",
            "protein": "#9B59B6",
            "drug": "#1ABC9C",
            "pathogen": "#C0392B",
            "antibody": "#27AE60",
            "background": "#1A1A2E",
            "text_primary": "#ECF0F1",
            "text_secondary": "#BDC3C7",
        }

    def setup(self):
        self.camera.background_color = self.medical_colors["background"]


class CellMembrane(VGroup):
    """Phospholipid bilayer representation"""

    def __init__(self, width=6, height=3, **kwargs):
        super().__init__(**kwargs)
        self.width = width
        self.height = height
        self.create_membrane()

    def create_membrane(self):
        # Outer leaflet
        outer_heads = VGroup()
        outer_tails = VGroup()
        # Inner leaflet
        inner_heads = VGroup()
        inner_tails = VGroup()

        num_lipids = 30
        spacing = self.width / num_lipids

        for i in range(num_lipids):
            x = -self.width/2 + i * spacing + spacing/2

            # Outer leaflet (top)
            outer_head = Circle(radius=0.12, color=BLUE, fill_opacity=0.8).move_to([x, self.height/4, 0])
            outer_tail = Rectangle(width=0.15, height=0.5, color=YELLOW, fill_opacity=0.6).move_to([x, self.height/4 - 0.3, 0])

            # Inner leaflet (bottom)
            inner_head = Circle(radius=0.12, color=BLUE, fill_opacity=0.8).move_to([x, -self.height/4, 0])
            inner_tail = Rectangle(width=0.15, height=0.5, color=YELLOW, fill_opacity=0.6).move_to([x, -self.height/4 + 0.3, 0])

            outer_heads.add(outer_head)
            outer_tails.add(outer_tail)
            inner_heads.add(inner_head)
            inner_tails.add(inner_tail)

        self.add(outer_heads, outer_tails, inner_heads, inner_tails)


class DNAHelix(VGroup):
    """Double helix DNA structure"""

    def __init__(self, turns=3, radius=0.8, height=4, **kwargs):
        super().__init__(**kwargs)
        self.turns = turns
        self.radius = radius
        self.height = height
        self.create_helix()

    def create_helix(self):
        # Two strands
        strand1 = ParametricFunction(
            lambda t: np.array([
                self.radius * np.cos(TAU * self.turns * t),
                self.radius * np.sin(TAU * self.turns * t),
                self.height * (t - 0.5)
            ]),
            t_range=[0, 1],
            color=BLUE,
            stroke_width=6
        )

        strand2 = ParametricFunction(
            lambda t: np.array([
                self.radius * np.cos(TAU * self.turns * t + PI),
                self.radius * np.sin(TAU * self.turns * t + PI),
                self.height * (t - 0.5)
            ]),
            t_range=[0, 1],
            color=RED,
            stroke_width=6
        )

        # Base pairs
        base_pairs = VGroup()
        num_pairs = int(self.turns * 10)
        for i in range(num_pairs):
            t = i / num_pairs
            angle = TAU * self.turns * t
            z = self.height * (t - 0.5)

            x1 = self.radius * np.cos(angle)
            y1 = self.radius * np.sin(angle)
            x2 = self.radius * np.cos(angle + PI)
            y2 = self.radius * np.sin(angle + PI)

            pair = Line([x1, y1, z], [x2, y2, z], color=WHITE, stroke_width=2)
            base_pairs.add(pair)

        self.add(strand1, strand2, base_pairs)


class ProteinRibbon(VGroup):
    """Protein secondary structure ribbon"""

    def __init__(self, structure_type="alpha", length=4, **kwargs):
        super().__init__(**kwargs)
        self.structure_type = structure_type
        self.length = length
        self.create_structure()

    def create_structure(self):
        if self.structure_type == "alpha":
            # Alpha helix ribbon
            helix = ParametricFunction(
                lambda t: np.array([
                    0.5 * np.cos(TAU * 3 * t),
                    0.5 * np.sin(TAU * 3 * t),
                    self.length * (t - 0.5)
                ]),
                t_range=[0, 1],
                color=PURPLE,
                stroke_width=0,
                fill_opacity=0.8
            )
            # Create ribbon surface
            self.add(helix)

        elif self.structure_type == "beta":
            # Beta sheet
            strands = VGroup()
            for i in range(5):
                y_pos = (i - 2) * 0.4
                strand = Rectangle(width=self.length, height=0.3, color=BLUE, fill_opacity=0.6)
                strand.move_to([0, y_pos, 0])
                if i % 2 == 0:
                    strand.rotate(PI/6, axis=UP)
                strands.add(strand)
            self.add(strands)


class ReceptorLigand(VGroup):
    """Receptor with ligand binding visualization"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.create_receptor_ligand()

    def create_receptor_ligand(self):
        # Receptor (7TM protein)
        receptor = VGroup()
        for i in range(7):
            tm = Rectangle(width=0.4, height=1.5, color=BLUE, fill_opacity=0.7)
            tm.move_to([(i - 3) * 0.6, 0, 0])
            receptor.add(tm)

        # Extracellular domain
        ecd = Ellipse(width=2, height=0.8, color=BLUE, fill_opacity=0.5)
        ecd.move_to([0, 1.5, 0])
        receptor.add(ecd)

        # Ligand
        ligand = Circle(radius=0.3, color=GREEN, fill_opacity=0.9)
        ligand.move_to([0, 2.5, 0])

        # Binding site indicator
        binding_site = Circle(radius=0.5, color=YELLOW, fill_opacity=0.2)
        binding_site.move_to([0, 1.5, 0])

        self.receptor = receptor
        self.ligand = ligand
        self.binding_site = binding_site
        self.add(receptor, ligand, binding_site)

    def bind_animation(self):
        """Animation of ligand binding"""
        return self.ligand.animate.move_to([0, 1.5, 0]).scale(0.8)


class PathwayDiagram(VGroup):
    """Metabolic/signaling pathway diagram"""

    def __init__(self, steps: List[Dict], **kwargs):
        super().__init__(**kwargs)
        self.steps = steps  # [{"name": "Glucose", "type": "metabolite"}, ...]
        self.create_pathway()

    def create_pathway(self):
        nodes = VGroup()
        edges = VGroup()
        labels = VGroup()

        num_steps = len(self.steps)
        spacing = 10 / max(num_steps, 1)

        for i, step in enumerate(self.steps):
            x = -5 + i * spacing
            y = 0

            # Node shape based on type
            if step.get("type") == "enzyme":
                node = Square(side_length=0.8, color=ORANGE, fill_opacity=0.8)
            elif step.get("type") == "metabolite":
                node = Circle(radius=0.4, color=GREEN, fill_opacity=0.8)
            elif step.get("type") == "drug":
                node = Star(5, outer_radius=0.5, color=RED, fill_opacity=0.9)
            else:
                node = RoundedRectangle(width=1.2, height=0.6, color=BLUE, fill_opacity=0.7)

            node.move_to([x, y, 0])
            nodes.add(node)

            # Label
            label = Text(step["name"], font_size=16, color=WHITE)
            label.next_to(node, DOWN, buff=0.3)
            labels.add(label)

            # Arrow to next
            if i < num_steps - 1:
                arrow = Arrow(
                    node.get_right(),
                    [x + spacing, y, 0],
                    color=WHITE,
                    stroke_width=2,
                    max_tip_length_to_length_ratio=0.15
                )
                edges.add(arrow)

        self.add(nodes, edges, labels)


class OrganSystem(VGroup):
    """Simplified organ system representation"""

    ORGAN_SHAPES = {
        "heart": lambda: SVGMobject("heart").scale(0.5) if False else
                         Polygon([-0.5, 0, 0], [0, 0.8, 0], [0.5, 0, 0], [0, -0.8, 0], color=RED, fill_opacity=0.8),
        "lung": lambda: Ellipse(width=1.2, height=1.5, color=PINK, fill_opacity=0.6),
        "liver": lambda: Ellipse(width=1.8, height=1.2, color=MAROON, fill_opacity=0.7),
        "kidney": lambda: RoundedRectangle(width=0.8, height=1.4, corner_radius=0.4, color=ORANGE, fill_opacity=0.7),
        "brain": lambda: Ellipse(width=1.5, height=1.0, color=GRAY, fill_opacity=0.6),
        "stomach": lambda: Arc(radius=0.8, start_angle=PI/4, angle=3*PI/2, color=YELLOW, fill_opacity=0.5),
        "intestine": lambda: VGroup(*[
            Arc(radius=0.3 + i*0.1, start_angle=0, angle=PI, color=GREEN, fill_opacity=0.3)
            for i in range(5)
        ]),
    }

    def __init__(self, organs: List[str], **kwargs):
        super().__init__(**kwargs)
        self.organs = organs
        self.create_organs()

    def create_organs(self):
        positions = {
            "brain": [0, 3, 0],
            "heart": [-1, 1, 0],
            "lung": [1, 1, 0],
            "liver": [-1.5, -0.5, 0],
            "stomach": [0, -0.5, 0],
            "kidney": [-2, -2, 0],
            "intestine": [1.5, -2, 0],
        }

        for organ_name in self.organs:
            if organ_name in self.ORGAN_SHAPES:
                organ = self.ORGAN_SHAPES[organ_name]()
                organ.move_to(positions.get(organ_name, [0, 0, 0]))

                label = Text(organ_name.capitalize(), font_size=14, color=WHITE)
                label.next_to(organ, DOWN, buff=0.2)

                self.add(organ, label)


class PharmacokineticsGraph(Axes):
    """PK curve visualization"""

    def __init__(self, drug_name: str, params: Dict, **kwargs):
        super().__init__(
            x_range=[0, params.get("duration", 24), 4],
            y_range=[0, params.get("cmax", 100), 20],
            x_length=8,
            y_length=4,
            axis_config={"color": WHITE},
            **kwargs
        )
        self.drug_name = drug_name
        self.params = params
        self.create_graph()

    def create_graph(self):
        # Concentration-time curve
        ka = self.params.get("ka", 1.0)  # absorption rate
        ke = self.params.get("ke", 0.15)  # elimination rate
        dose = self.params.get("dose", 100)
        Vd = self.params.get("Vd", 50)

        def conc(t):
            if t <= 0:
                return 0
            return (dose * ka / (Vd * (ka - ke))) * (np.exp(-ke * t) - np.exp(-ka * t))

        curve = self.plot(conc, color=GREEN, stroke_width=3)
        self.curve = curve

        # Labels
        x_label = Text("Time (h)", font_size=18).next_to(self.x_axis, RIGHT)
        y_label = Text("Concentration (ng/mL)", font_size=18).next_to(self.y_axis, UP)
        title = Text(f"{self.drug_name} PK Profile", font_size=24, color=WHITE).next_to(self, UP)

        self.add(curve, x_label, y_label, title)

        # Key points
        tmax = np.log(ka / ke) / (ka - ke) if ka > ke else 0
        cmax = conc(tmax)
        dot = Dot(self.c2p(tmax, cmax), color=RED, radius=0.08)
        label = Text(f"Cmax: {cmax:.1f}\nTmax: {tmax:.1f}h", font_size=14).next_to(dot, UP)
        self.add(dot, label)


# Animation presets for common medical explanations
class MedicalAnimations:
    """Pre-built animation sequences"""

    @staticmethod
    def drug_binding_receptor(scene: Scene, receptor_ligand: ReceptorLigand, duration=2):
        """Show drug binding to receptor"""
        scene.play(
            receptor_ligand.ligand.animate.move_to(receptor_ligand.binding_site.get_center()).scale(0.7),
            receptor_ligand.binding_site.animate.set_fill(YELLOW, opacity=0.5),
            run_time=duration
        )
        scene.wait(0.5)

    @staticmethod
    def signal_transduction(scene: Scene, pathway: PathwayDiagram, duration=3):
        """Animate signal flowing through pathway"""
        for i, step in enumerate(pathway.steps):
            if i < len(pathway.submobjects) // 3:  # nodes
                node = pathway.submobjects[i]
                scene.play(node.animate.set_fill(YELLOW, opacity=1), run_time=0.3)
                scene.play(node.animate.set_fill(node.get_fill_color(), opacity=0.8), run_time=0.2)

    @staticmethod
    def cell_division(scene: Scene, cell: VGroup, duration=4):
        """Simple mitosis animation"""
        # Prophase - chromosomes condense
        # Metaphase - align
        # Anaphase - separate
        # Telophase - two nuclei
        pass  # Implement based on needs


# Text utilities for medical content
class MedicalText:
    """Styled text for medical videos"""

    @staticmethod
    def title(text: str, **kwargs) -> Text:
        return Text(text, font_size=48, weight=BOLD, color=WHITE, **kwargs)

    @staticmethod
    def heading(text: str, **kwargs) -> Text:
        return Text(text, font_size=36, weight=SEMI_BOLD, color=WHITE, **kwargs)

    @staticmethod
    def body(text: str, **kwargs) -> Text:
        return Text(text, font_size=24, color=LIGHT_GRAY, **kwargs)

    @staticmethod
    def label(text: str, **kwargs) -> Text:
        return Text(text, font_size=18, color=YELLOW, **kwargs)

    @staticmethod
    def chemical_formula(formula: str, **kwargs) -> MathTex:
        return MathTex(formula, font_size=28, color=WHITE, **kwargs)

    @staticmethod
    def dosage(text: str, **kwargs) -> Text:
        return Text(text, font_size=20, color=GREEN, weight=BOLD, **kwargs)

    @staticmethod
    def warning(text: str, **kwargs) -> Text:
        return Text(text, font_size=20, color=RED, weight=BOLD, **kwargs)


if __name__ == "__main__":
    # Test render
    from manim import config, tempconfig

    with tempconfig({"quality": "low_quality", "preview": True}):
        scene = MedicalScene()
        scene.add(MedicalText.title("Medical Animation Test"))
        scene.render()