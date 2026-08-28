"""
Local TTS Module - Piper TTS for offline medical voice generation
Supports multiple voices, medical pronunciation, SSML-like control
"""

import os
import subprocess
import tempfile
import json
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass
import asyncio

from backend.config import settings


@dataclass
class VoiceConfig:
    """Voice configuration for different styles"""
    model_name: str
    speaker_id: int = 0
    speed: float = 1.0
    pitch: float = 0.0
    volume: float = 1.0
    description: str = ""


# Pre-configured voices for medical content
MEDICAL_VOICES = {
    "professor": VoiceConfig(
        model_name="en_US-lessac-medium",
        speaker_id=0,
        speed=0.95,
        pitch=-10,
        description="Professorial, authoritative, clear articulation"
    ),
    "friendly_doctor": VoiceConfig(
        model_name="en_US-libritts_r-medium",
        speaker_id=108,
        speed=1.0,
        pitch=0,
        description="Warm, empathetic, like a caring physician"
    ),
    "animated_explainer": VoiceConfig(
        model_name="en_US-amy-medium",
        speaker_id=0,
        speed=1.1,
        pitch=10,
        description="Energetic, engaging, YouTube explainer style"
    ),
    "calm_narrator": VoiceConfig(
        model_name="en_US-ryan-medium",
        speaker_id=0,
        speed=0.9,
        pitch=-5,
        description="Calm, steady, good for complex topics"
    ),
    "student_peer": VoiceConfig(
        model_name="en_US-kathleen-medium",
        speaker_id=0,
        speed=1.05,
        pitch=5,
        description="Relatable, peer-to-peer teaching style"
    ),
}


class MedicalTTS:
    """Piper TTS wrapper with medical optimizations"""

    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = model_dir or settings.PIPER_MODEL_DIR
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self._check_piper_install()

    def _check_piper_install(self):
        """Verify Piper is available"""
        try:
            result = subprocess.run(["piper", "--version"], capture_output=True, text=True)
            if result.returncode != 0:
                raise FileNotFoundError("Piper not found")
        except FileNotFoundError:
            raise RuntimeError(
                "Piper TTS not installed. Install with: "
                "pip install piper-tts && "
                "download models from https://huggingface.co/rhasspy/piper-voices"
            )

    def list_available_models(self) -> List[str]:
        """List downloaded Piper models"""
        models = []
        for file in self.model_dir.glob("*.onnx"):
            models.append(file.stem)
        return models

    def download_model(self, model_name: str) -> bool:
        """Download a Piper model"""
        try:
            # Piper models are at https://huggingface.co/rhasspy/piper-voices
            url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{model_name}.onnx"
            json_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{model_name}.onnx.json"

            import httpx
            client = httpx.Client(timeout=120)

            # Download model
            model_path = self.model_dir / f"{model_name}.onnx"
            with client.stream("GET", url) as response:
                response.raise_for_status()
                with open(model_path, "wb") as f:
                    for chunk in response.iter_bytes():
                        f.write(chunk)

            # Download config
            config_path = self.model_dir / f"{model_name}.onnx.json"
            with client.stream("GET", json_url) as response:
                response.raise_for_status()
                with open(config_path, "wb") as f:
                    for chunk in response.iter_bytes():
                        f.write(chunk)

            return True
        except Exception as e:
            print(f"Failed to download {model_name}: {e}")
            return False

    def synthesize(
        self,
        text: str,
        voice: str = "professor",
        output_path: Optional[Path] = None,
        **kwargs
    ) -> Path:
        """
        Synthesize text to speech

        Args:
            text: Text to synthesize
            voice: Voice key from MEDICAL_VOICES or model name
            output_path: Output WAV file path
            **kwargs: Override voice config (speed, pitch, volume)
        """
        # Get voice config
        if voice in MEDICAL_VOICES:
            voice_config = MEDICAL_VOICES[voice]
            model_name = voice_config.model_name
            speaker_id = voice_config.speaker_id
            speed = kwargs.get("speed", voice_config.speed)
            pitch = kwargs.get("pitch", voice_config.pitch)
            volume = kwargs.get("volume", voice_config.volume)
        else:
            # Direct model name
            model_name = voice
            speaker_id = kwargs.get("speaker_id", 0)
            speed = kwargs.get("speed", 1.0)
            pitch = kwargs.get("pitch", 0.0)
            volume = kwargs.get("volume", 1.0)

        # Check model exists
        model_path = self.model_dir / f"{model_name}.onnx"
        if not model_path.exists():
            print(f"Model {model_name} not found, attempting download...")
            if not self.download_model(model_name):
                raise FileNotFoundError(f"Model {model_name} not available")

        # Prepare output
        if output_path is None:
            output_path = Path(tempfile.mktemp(suffix=".wav"))

        # Build piper command
        cmd = [
            "piper",
            "--model", str(model_path),
            "--output_file", str(output_path),
        ]

        if speaker_id > 0:
            cmd.extend(["--speaker", str(speaker_id)])

        if speed != 1.0:
            cmd.extend(["--length_scale", str(1.0 / speed)])

        # Note: Piper doesn't have direct pitch/volume controls
        # Those would need post-processing with sox/ffmpeg

        # Run synthesis
        try:
            process = subprocess.run(
                cmd,
                input=text.encode(),
                capture_output=True,
                timeout=60
            )
            if process.returncode != 0:
                raise RuntimeError(f"Piper failed: {process.stderr.decode()}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("TTS synthesis timed out")

        # Post-process for pitch/volume if needed
        if pitch != 0.0 or volume != 1.0:
            output_path = self._post_process_audio(output_path, pitch, volume)

        return output_path

    def _post_process_audio(self, input_path: Path, pitch: float, volume: float) -> Path:
        """Apply pitch/volume adjustments using ffmpeg"""
        output_path = input_path.with_stem(input_path.stem + "_processed")

        filters = []
        if pitch != 0.0:
            # pitch shift in semitones
            filters.append(f"asetrate=44100*{2**(pitch/12)},aresample=44100")
        if volume != 1.0:
            filters.append(f"volume={volume}")

        if filters:
            cmd = [
                "ffmpeg", "-y", "-i", str(input_path),
                "-af", ",".join(filters),
                str(output_path)
            ]
            subprocess.run(cmd, capture_output=True)
            input_path.unlink()  # Remove original
            return output_path

        return input_path

    async def synthesize_async(self, *args, **kwargs) -> Path:
        """Async wrapper for synthesis"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.synthesize, *args, **kwargs)

    def synthesize_medical_text(
        self,
        text: str,
        voice: str = "professor",
        output_path: Optional[Path] = None,
        add_pauses: bool = True,
        emphasize_terms: List[str] = None
    ) -> Path:
        """
        Synthesize with medical text preprocessing:
        - Add pauses after punctuation
        - Emphasize medical terms
        - Handle abbreviations
        """
        processed_text = self._preprocess_medical_text(text, add_pauses, emphasize_terms)
        return self.synthesize(processed_text, voice, output_path)

    def _preprocess_medical_text(
        self,
        text: str,
        add_pauses: bool,
        emphasize_terms: List[str] = None
    ) -> str:
        """Preprocess text for better medical pronunciation"""
        import re

        # Expand common medical abbreviations
        abbreviations = {
            r'\bMI\b': 'myocardial infarction',
            r'\bBP\b': 'blood pressure',
            r'\bHR\b': 'heart rate',
            r'\bRR\b': 'respiratory rate',
            r'\bCBC\b': 'complete blood count',
            r'\bMRI\b': 'M R I',
            r'\bCT\b': 'C T scan',
            r'\bIV\b': 'intravenous',
            r'\bPO\b': 'by mouth',
            r'\bPRN\b': 'as needed',
            r'\bBID\b': 'twice daily',
            r'\bTID\b': 'three times daily',
            r'\bQID\b': 'four times daily',
            r'\bmg\b': 'milligrams',
            r'\bml\b': 'milliliters',
            r'\bkg\b': 'kilograms',
            r'\bmmHg\b': 'millimeters of mercury',
            r'\bECG\b': 'E C G',
            r'\bEKG\b': 'E K G',
            r'\bCOPD\b': 'C O P D',
            r'\bCHF\b': 'congestive heart failure',
            r'\bDM\b': 'diabetes mellitus',
            r'\bHTN\b': 'hypertension',
        }

        for pattern, replacement in abbreviations.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

        # Add pauses for better pacing
        if add_pauses:
            # Longer pause after sentences
            text = re.sub(r'(\.|\?|!)(\s+)', r'\1 <break time="500ms"/> \2', text)
            # Pause after commas
            text = re.sub(r',(\s+)', r', <break time="200ms"/> \1', text)
            # Pause after semicolons
            text = re.sub(r';(\s+)', r'; <break time="300ms"/> \1', text)

        # Emphasize key medical terms
        if emphasize_terms:
            for term in emphasize_terms:
                pattern = re.compile(re.escape(term), re.IGNORECASE)
                text = pattern.sub(f'<emphasis level="strong">{term}</emphasis>', text)

        return text


# Global TTS instance
_tts_instance: Optional[MedicalTTS] = None


def get_tts() -> MedicalTTS:
    global _tts_instance
    if _tts_instance is None:
        _tts_instance = MedicalTTS()
    return _tts_instance


# Convenience function
def speak(text: str, voice: str = "professor", **kwargs) -> Path:
    """Quick synthesis function"""
    return get_tts().synthesize_medical_text(text, voice, **kwargs)


if __name__ == "__main__":
    # Test
    tts = MedicalTTS()
    print("Available models:", tts.list_available_models())

    # Download a model if needed
    if not tts.list_available_models():
        print("Downloading en_US-lessac-medium...")
        tts.download_model("en_US-lessac-medium")

    # Test synthesis
    test_text = "Welcome to medical education. Today we'll learn about myocardial infarction, commonly known as a heart attack."
    output = tts.synthesize_medical_text(test_text, voice="professor")
    print(f"Generated: {output}")