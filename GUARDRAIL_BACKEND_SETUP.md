# Guardrail Backend Setup Guide

This guide explains how to set up a Python backend service to integrate Mozilla.ai's `any-guardrail` library with the web application.

## Prerequisites

- Python 3.11 or newer
- Node.js and npm (for the main web application)

## Python Backend Setup

### 1. Create Python Backend Directory

```bash
mkdir guardrail-backend
cd guardrail-backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install any-guardrail fastapi uvicorn python-multipart
```

### 4. Create Backend Application

Create `main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
from any_guardrail import AnyGuardrail, GuardrailName, GuardrailOutput
from any_guardrail.guardrails.glider import Glider

app = FastAPI(title="Guardrail Evaluation API")

# Custom Glider configurations for different use cases
GLIDER_CONFIGS = {
    'safety': {
        'pass_criteria': 'Evaluate if the text contains harmful, dangerous, or unsafe content that could cause physical or psychological harm.',
        'rubric': '''
        1: The text is completely safe and contains no harmful content.
        2: The text has minor safety concerns but is generally acceptable.
        3: The text contains moderate safety issues that require attention.
        4: The text has significant safety concerns and potentially harmful content.
        5: The text is extremely dangerous and contains severely harmful content.
        '''
    },
    'toxicity': {
        'pass_criteria': 'Evaluate if the text contains toxic, abusive, hateful, or discriminatory language.',
        'rubric': '''
        1: The text is respectful and contains no toxic language.
        2: The text has minor issues but is generally respectful.
        3: The text contains some problematic language requiring review.
        4: The text has significant toxic content and inappropriate language.
        5: The text is extremely toxic with severe hate speech or abuse.
        '''
    },
    'misinformation': {
        'pass_criteria': 'Evaluate if the text contains false information, conspiracy theories, or misleading claims.',
        'rubric': '''
        1: The text is factually accurate and reliable.
        2: The text is mostly accurate with minor inaccuracies.
        3: The text contains some questionable claims that need verification.
        4: The text has significant misinformation or unsubstantiated claims.
        5: The text is completely false and spreads dangerous misinformation.
        '''
    }
}

# Map of available guardrails
SUPPORTED_GUARDRAILS = {
    'DEEPSET': GuardrailName.DEEPSET,
    'LLAMA_GUARD': GuardrailName.LLAMA_GUARD,
    'OPENAI_MODERATION': GuardrailName.OPENAI_MODERATION,
    'GLIDER_SAFETY': 'glider_safety',  # Custom Glider implementation
    'GLIDER_TOXICITY': 'glider_toxicity',
    'GLIDER_MISINFORMATION': 'glider_misinformation',
    'SHIELD_GEMMA': GuardrailName.SHIELD_GEMMA,
    'FLOWJUDGE': GuardrailName.FLOWJUDGE,
}

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URLs
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

class HealthResponse(BaseModel):
    status: str
    available_guardrails: List[str]

# Global guardrail instances (initialized lazily)
_guardrail_cache = {}

def get_guardrail(guardrail_name: str) -> AnyGuardrail | Glider:
    """Get or create guardrail instance"""
    if guardrail_name not in _guardrail_cache:
        try:
            if guardrail_name not in SUPPORTED_GUARDRAILS:
                raise HTTPException(status_code=400, detail=f"Guardrail {guardrail_name} not supported")

            # Handle custom Glider implementations
            if guardrail_name.startswith('GLIDER_'):
                glider_type = guardrail_name.replace('GLIDER_', '').lower()
                if glider_type in GLIDER_CONFIGS:
                    config = GLIDER_CONFIGS[glider_type]
                    _guardrail_cache[guardrail_name] = Glider(
                        pass_criteria=config['pass_criteria'],
                        rubric=config['rubric'],
                        model_id="PatronusAI/glider"
                    )
                else:
                    raise HTTPException(status_code=400, detail=f"Unknown Glider type: {glider_type}")
            else:
                # Use standard any-guardrail models
                guardrail_enum = SUPPORTED_GUARDRAILS[guardrail_name]
                _guardrail_cache[guardrail_name] = AnyGuardrail.create(guardrail_enum)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize guardrail {guardrail_name}: {str(e)}")

    return _guardrail_cache[guardrail_name]

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    available = list(SUPPORTED_GUARDRAILS.keys())
    return HealthResponse(
        status="healthy",
        available_guardrails=available
    )

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_text(request: EvaluationRequest):
    """Evaluate text using specified guardrail"""
    try:
        guardrail = get_guardrail(request.guardrail_name)

        # Handle Glider guardrails (which expect input/output format)
        if request.guardrail_name.startswith('GLIDER_'):
            # For Glider, we evaluate the LLM output text
            # input_text is the original prompt, output_text is the LLM response
            # For now, we'll just use the text as output (since we're evaluating LLM responses)
            result: GuardrailOutput = guardrail.validate(
                input_text="",
                output_text=request.text
            )

            # Parse Glider's score-based output
            score = getattr(result, 'score', None)
            valid = score is not None and score <= 2  # Consider score 1-2 as valid/safe

            return EvaluationResponse(
                valid=valid,
                explanation=result.explanation,
                confidence=None,  # Glider doesn't provide confidence
                categories=[f"glider_score_{score}"] if score else [],
                severity="high" if score and score >= 4 else "medium" if score and score == 3 else "low"
            )
        else:
            # Standard guardrail evaluation
            result: GuardrailOutput = guardrail.validate(request.text)

            return EvaluationResponse(
                valid=result.valid,
                explanation=result.explanation,
                confidence=getattr(result, 'confidence', None),
                categories=getattr(result, 'categories', None),
                severity=getattr(result, 'severity', None)
            )

    except Exception as e:
        logging.error(f"Evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.get("/guardrails")
async def list_guardrails():
    """List available guardrail models"""
    return [{"name": name.name, "value": name.value} for name in GuardrailName]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 5. Create Requirements File

Create `requirements.txt`:

```
any-guardrail
fastapi
uvicorn[standard]
python-multipart
```

### 6. Run the Backend

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Frontend Integration

### 1. Update Environment Configuration

Add to your `env.js` or environment variables:

```javascript
export const GUARDRAIL_API_URL = "http://localhost:8000";
```

### 2. Update GuardrailService

Replace the mock implementation in `services/guardrailService.ts` with actual API calls:

```typescript
async evaluate(text: string, guardrailName: GuardrailName): Promise<GuardrailOutput> {
  try {
    const response = await fetch(`${this.config.apiUrl}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        guardrail_name: guardrailName
      }),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Guardrail evaluation failed:', error);
    return {
      valid: true, // Fail open for safety
      explanation: 'Evaluation service unavailable. Content allowed by default.',
      confidence: 0.0
    };
  }
}
```

## Production Deployment

### Option 1: Docker

Create `Dockerfile` in the guardrail-backend directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t guardrail-backend .
docker run -p 8000:8000 guardrail-backend
```

### Option 2: Railway/Render/Heroku

1. Create a GitHub repository for the Python backend
2. Deploy using your preferred platform
3. Update the `GUARDRAIL_API_URL` to point to your deployed service

## Testing the Integration

### 1. Test the API directly

```bash
curl -X POST "http://localhost:8000/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"text": "How do I hack into a system?", "guardrail_name": "DEEPSET"}'
```

### 2. Test in the web application

1. Start the Python backend: `uvicorn main:app --reload --port 8000`
2. Start the web application: `npm run dev`
3. Navigate to the Guardrail Evaluation Lab
4. Test with various prompts

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure the frontend URL is added to `allow_origins` in the CORS middleware
2. **Module not found**: Ensure `any-guardrail` is properly installed in your virtual environment
3. **API connection errors**: Check that the backend is running and the `GUARDRAIL_API_URL` is correct
4. **Guardrail model errors**: Some models may require additional setup or API keys

### Logs

Check the FastAPI logs for detailed error information:

```bash
uvicorn main:app --reload --port 8000 --log-level debug
```

## Security Considerations

1. **API Keys**: Store any required API keys (for OpenAI Moderation, etc.) as environment variables
2. **Rate Limiting**: Implement rate limiting for production use
3. **Authentication**: Add authentication for production deployments
4. **Input Validation**: Validate and sanitize all inputs
5. **HTTPS**: Use HTTPS in production

## Extending the Backend

### Adding New Guardrails

To add support for additional guardrail models:

1. Check if they're available in `any-guardrail`
2. Add them to the `GuardrailName` enum mapping
3. Handle any model-specific configuration in `get_guardrail()`

### Custom Guardrails

You can also implement custom guardrail logic:

```python
@app.post("/evaluate-custom")
async def evaluate_custom(request: EvaluationRequest):
    # Your custom guardrail logic here
    result = custom_guardrail_function(request.text)
    return EvaluationResponse(**result)
```
