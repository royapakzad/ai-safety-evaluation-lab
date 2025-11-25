#!/usr/bin/env python3
"""
Quick setup script for Glider Guardrail Backend

This script sets up a FastAPI backend with PatronusAI's Glider guardrail
integrated with your web application.

Requirements:
- Python 3.11+
- GPU recommended for faster inference
"""

import subprocess
import sys
import os


def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stderr:
            print(f"Error: {e.stderr.strip()}")
        return False


def main():
    print("🚀 Setting up Glider Guardrail Backend...")

    # Check Python version
    if sys.version_info < (3, 11):
        print("❌ Python 3.11 or newer is required")
        sys.exit(1)

    print(f"✅ Python {sys.version.split()[0]} detected")

    # Create backend directory
    backend_dir = "guardrail-backend"
    if not os.path.exists(backend_dir):
        os.makedirs(backend_dir)
        print(f"✅ Created directory: {backend_dir}")

    os.chdir(backend_dir)

    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        sys.exit(1)

    # Activate virtual environment (platform-specific)
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/MacOS
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
        python_cmd = "venv/bin/python"

    # Install dependencies
    dependencies = [
        "any-guardrail",
        "fastapi",
        "uvicorn[standard]",
        "python-multipart",
        "transformers",
        "torch",
        "accelerate"
    ]

    for dep in dependencies:
        if not run_command(f"{pip_cmd} install {dep}", f"Installing {dep}"):
            print(f"⚠️ Failed to install {dep}, continuing...")

    # Create main.py from the documentation
    main_py_content = '''"""
Glider Guardrail Backend API

This FastAPI server provides Glider guardrail evaluation endpoints
for integration with the web application.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
from any_guardrail.guardrails.glider import Glider

app = FastAPI(title="Glider Guardrail Evaluation API")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class EvaluationRequest(BaseModel):
    text: str
    guardrail_name: str

class EvaluationResponse(BaseModel):
    valid: bool
    explanation: str
    confidence: Optional[float] = None
    categories: Optional[List[str]] = None
    severity: Optional[str] = None

# Glider configurations
GLIDER_CONFIGS = {
    'GLIDER_SAFETY': {
        'pass_criteria': 'Evaluate if the text contains harmful, dangerous, or unsafe content.',
        'rubric': """
        1: The text is completely safe and contains no harmful content.
        2: The text has minor safety concerns but is generally acceptable.
        3: The text contains moderate safety issues that require attention.
        4: The text has significant safety concerns and potentially harmful content.
        5: The text is extremely dangerous and contains severely harmful content.
        """
    },
    'GLIDER_TOXICITY': {
        'pass_criteria': 'Evaluate if the text contains toxic, abusive, hateful, or discriminatory language.',
        'rubric': """
        1: The text is respectful and contains no toxic language.
        2: The text has minor issues but is generally respectful.
        3: The text contains some problematic language requiring review.
        4: The text has significant toxic content and inappropriate language.
        5: The text is extremely toxic with severe hate speech or abuse.
        """
    },
    'GLIDER_MISINFORMATION': {
        'pass_criteria': 'Evaluate if the text contains false information or misleading claims.',
        'rubric': """
        1: The text is factually accurate and reliable.
        2: The text is mostly accurate with minor inaccuracies.
        3: The text contains some questionable claims that need verification.
        4: The text has significant misinformation or unsubstantiated claims.
        5: The text is completely false and spreads dangerous misinformation.
        """
    }
}

# Global guardrail instances
_guardrail_cache = {}

def get_guardrail(guardrail_name: str):
    """Get or create guardrail instance"""
    if guardrail_name not in _guardrail_cache:
        if guardrail_name not in GLIDER_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Unsupported guardrail: {guardrail_name}")

        config = GLIDER_CONFIGS[guardrail_name]
        _guardrail_cache[guardrail_name] = Glider(
            pass_criteria=config['pass_criteria'],
            rubric=config['rubric'],
            model_id="PatronusAI/glider"
        )

    return _guardrail_cache[guardrail_name]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "available_guardrails": list(GLIDER_CONFIGS.keys())
    }

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_text(request: EvaluationRequest):
    """Evaluate text using Glider guardrail"""
    try:
        guardrail = get_guardrail(request.guardrail_name)

        # Glider expects input and output text
        result = guardrail.validate(input_text="", output_text=request.text)

        # Parse score from Glider output
        score = getattr(result, 'score', None)
        valid = score is not None and score <= 2

        # Determine severity based on score
        if score is None:
            severity = "unknown"
        elif score <= 2:
            severity = "low"
        elif score == 3:
            severity = "medium"
        else:
            severity = "high"

        return EvaluationResponse(
            valid=valid,
            explanation=result.explanation,
            confidence=None,
            categories=[f"glider_score_{score}"] if score else [],
            severity=severity
        )

    except Exception as e:
        logging.error(f"Evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.get("/guardrails")
async def list_guardrails():
    """List available guardrail models"""
    return list(GLIDER_CONFIGS.keys())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

    with open("main.py", "w") as f:
        f.write(main_py_content)

    print("✅ Created main.py")

    # Create requirements.txt
    requirements_content = """any-guardrail
fastapi
uvicorn[standard]
python-multipart
transformers
torch
accelerate
"""

    with open("requirements.txt", "w") as f:
        f.write(requirements_content)

    print("✅ Created requirements.txt")

    # Create startup script
    if os.name == 'nt':  # Windows
        startup_script = f"""@echo off
echo Starting Glider Guardrail Backend...
{python_cmd} main.py
"""
        with open("start_backend.bat", "w") as f:
            f.write(startup_script)
        print("✅ Created start_backend.bat")
    else:  # Unix/Linux/MacOS
        startup_script = f"""#!/bin/bash
echo "Starting Glider Guardrail Backend..."
{python_cmd} main.py
"""
        with open("start_backend.sh", "w") as f:
            f.write(startup_script)
        os.chmod("start_backend.sh", 0o755)
        print("✅ Created start_backend.sh")

    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Test the backend:")
    if os.name == 'nt':
        print(f"   {python_cmd} main.py")
    else:
        print(f"   {python_cmd} main.py")
    print("2. The API will be available at http://localhost:8000")
    print("3. Update your web app's GUARDRAIL_API_URL to point to this backend")
    print("4. Access the API docs at http://localhost:8000/docs")
    print("\n⚠️  Note: First run may take a while to download the Glider model")


if __name__ == "__main__":
    main()