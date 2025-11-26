from http.server import BaseHTTPRequestHandler
from any_guardrail import AnyGuardrail, GuardrailName
import json
import traceback

# Available guardrails from any-guardrail
AVAILABLE_GUARDRAILS = {
    "DEEPSET": GuardrailName.DEEPSET,
    "LLAMA_GUARD": GuardrailName.LLAMA_GUARD,
    "NVIDIA_NEMOLLM": GuardrailName.NVIDIA_NEMOLLM,
    "OPENAI_MODERATION": GuardrailName.OPENAI_MODERATION,
}

# Cache guardrail instances for warm starts
_guardrail_cache = {}

def get_guardrail(guardrail_name: str):
    """Get or create guardrail instance"""
    if guardrail_name not in _guardrail_cache:
        if guardrail_name not in AVAILABLE_GUARDRAILS:
            raise ValueError(f"Unsupported guardrail: {guardrail_name}")

        _guardrail_cache[guardrail_name] = AnyGuardrail.create(
            AVAILABLE_GUARDRAILS[guardrail_name]
        )

    return _guardrail_cache[guardrail_name]

class handler(BaseHTTPRequestHandler):
    def _send_json(self, code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # CORS - allow requests from Vercel app
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        # CORS preflight
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        self.end_headers()

    def do_GET(self):
        # Return available guardrails
        response = {
            "available_guardrails": list(AVAILABLE_GUARDRAILS.keys()),
            "status": "healthy"
        }
        self._send_json(200, response)

    def do_POST(self):
        try:
            # Parse content length
            try:
                content_length = int(self.headers.get("content-length", "0"))
            except ValueError:
                return self._send_json(400, {"error": "Missing or invalid Content-Length"})

            # Read and parse request body
            raw_body = self.rfile.read(content_length)
            try:
                data = json.loads(raw_body)
            except json.JSONDecodeError:
                return self._send_json(400, {"error": "Invalid JSON"})

            # Validate required fields
            text = data.get("text")
            if not isinstance(text, str):
                return self._send_json(400, {"error": "`text` must be a string"})

            guardrail_name = data.get("guardrail", "DEEPSET")
            if guardrail_name not in AVAILABLE_GUARDRAILS:
                return self._send_json(400, {
                    "error": f"Unsupported guardrail: {guardrail_name}",
                    "available": list(AVAILABLE_GUARDRAILS.keys())
                })

            # Get guardrail instance
            try:
                guardrail = get_guardrail(guardrail_name)
            except Exception as e:
                return self._send_json(500, {"error": f"Failed to initialize guardrail: {str(e)}"})

            # Run the guardrail validation
            try:
                result = guardrail.validate(text)

                # Extract response fields
                response = {
                    "valid": bool(getattr(result, "valid", False)),
                    "explanation": getattr(result, "explanation", None),
                    "guardrail_used": guardrail_name,
                }

                # Add any additional fields if available
                if hasattr(result, "score"):
                    response["score"] = getattr(result, "score", None)
                if hasattr(result, "confidence"):
                    response["confidence"] = getattr(result, "confidence", None)
                if hasattr(result, "categories"):
                    response["categories"] = getattr(result, "categories", None)

                self._send_json(200, response)

            except Exception as e:
                return self._send_json(500, {
                    "error": f"Guardrail validation failed: {str(e)}",
                    "traceback": traceback.format_exc()
                })

        except Exception as e:
            return self._send_json(500, {
                "error": f"Internal server error: {str(e)}",
                "traceback": traceback.format_exc()
            })
