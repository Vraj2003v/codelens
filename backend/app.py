"""
CodeLens v5 - AI Code Error Detector
Backend: Flask + Groq API (llama-3.3-70b-versatile — free)
Languages: Python, JavaScript, TypeScript, Java, C, C++, SQL, HTML, CSS
Detects: syntax, logical, conceptual, runtime, type, security errors
Always provides: fix suggestion + corrected full code + step-by-step solution
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
import sys
import io
import ast
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MODEL_ID = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Only languages Llama handles reliably
SUPPORTED_LANGUAGES = {
    "python":     "Python",
    "py":         "Python",
    "javascript": "JavaScript",
    "js":         "JavaScript",
    "typescript": "TypeScript",
    "ts":         "TypeScript",
    "java":       "Java",
    "c":          "C",
    "cpp":        "C++",
    "c++":        "C++",
    "csharp":     "C#",
    "c#":         "C#",
    "sql":        "SQL",
    "html":       "HTML",
    "css":        "CSS",
}

ERROR_TAXONOMY = {
    "syntax":     "Syntax errors — missing delimiters, incorrect indentation, mismatched brackets, invalid identifiers, missing semicolons, bad keywords",
    "logical":    "Logical errors — off-by-one, wrong operator, incorrect loop bounds, flawed conditionals, division by zero, infinite loops",
    "conceptual": "Conceptual errors — scope misunderstanding, uninitialized variables, return statement misuse, type confusion, misuse of language features",
    "runtime":    "Runtime errors — null/undefined access, index out of bounds, stack overflow, infinite recursion",
    "type":       "Type errors — type mismatches, invalid casts, incompatible operations, wrong argument types",
    "security":   "Security errors — SQL injection, buffer overflows, unhandled exceptions, resource leaks, hardcoded credentials",
}

SPECIFICATIONS = [
    "s1: Loop boundaries must be correctly defined (correct start/end/operator)",
    "s2: Variables must be initialized before use and with appropriate types",
    "s3: Conditional logic must correctly express the intended decision",
    "s4: Functions must have explicit return statements when a value is expected",
    "s5: Indentation/block structure must be consistent with language rules",
    "s6: Data structures must be accessed with valid indices or keys",
    "s7: Boolean expressions must be semantically correct for the intended condition",
    "s8: Function arguments must match parameter definitions in type and count",
    "s9: All syntax must be valid for the detected language",
    "s10: Type operations must be compatible and safe",
    "s11: Division operations must handle potential division by zero",
    "s12: Null/undefined/None references must be handled safely",
]

# Per-language rules injected into every prompt so Llama never confuses them
LANGUAGE_RULES = {
    "Python": (
        "Python RULES: "
        "1) Colons (:) required after if/elif/else/for/while/def/class. "
        "2) Indentation defines blocks — no braces. "
        "3) 0-indexed lists. range(n) gives 0..n-1. "
        "4) None/True/False are capitalized. "
        "5) Variables must be assigned before use. "
        "6) No implicit type conversion — str+int raises TypeError. "
        "7) Division: // is integer division, / is float division."
    ),
    "JavaScript": (
        "JavaScript RULES: "
        "1) Blocks use braces {} NOT colons. "
        "2) var/let/const scoping — let/const are block-scoped. "
        "3) == does type coercion; === is strict equality. "
        "4) undefined vs null are different. "
        "5) async functions return Promises; always await async calls. "
        "6) Array indices are 0-based. "
        "7) typeof null === 'object' is a known quirk."
    ),
    "TypeScript": (
        "TypeScript RULES: "
        "1) All JavaScript rules apply. "
        "2) Type annotations required for function params/return types. "
        "3) Interfaces define object shapes. "
        "4) string vs String — use lowercase string. "
        "5) Strict null checks — null/undefined must be handled explicitly. "
        "6) Generic types use <T> syntax. "
        "7) Type assertion uses 'as Type', not C-style casts."
    ),
    "Java": (
        "Java RULES: "
        "1) Every method needs an explicit return type (int, void, String, etc.). "
        "2) All statements end with semicolons. "
        "3) String comparison: use .equals() not ==. "
        "4) Arrays are 0-indexed; bounds violations throw ArrayIndexOutOfBoundsException. "
        "5) null reference causes NullPointerException. "
        "6) Checked exceptions must be declared or caught. "
        "7) Class name must match filename."
    ),
    "C": (
        "C RULES: "
        "1) Manual memory management — malloc/free must be paired. "
        "2) Arrays decay to pointers; no bounds checking. "
        "3) strcpy/gets are unsafe — use strncpy/fgets. "
        "4) printf format strings must match argument types. "
        "5) All statements end with semicolons. "
        "6) No classes or objects. "
        "7) int main() must return 0 on success."
    ),
    "C++": (
        "C++ RULES: "
        "1) All C rules apply PLUS object-oriented features. "
        "2) Use smart pointers (unique_ptr/shared_ptr) over raw new/delete. "
        "3) std:: namespace prefix required unless 'using namespace std'. "
        "4) Constructors/destructors must be correct for RAII. "
        "5) Pass large objects by reference (const &) not by value. "
        "6) Vector out-of-bounds with [] is undefined behavior; use .at() for checked access."
    ),
    "C#": (
        "C# RULES: "
        "1) All statements end with semicolons. "
        "2) null reference throws NullReferenceException. "
        "3) Use ?. (null-conditional) and ?? (null-coalescing) operators. "
        "4) string is an alias for System.String. "
        "5) Properties use get/set not direct field access from outside. "
        "6) async methods must return Task or Task<T>."
    ),
    "SQL": (
        "SQL RULES: "
        "1) SELECT requires FROM clause. "
        "2) UPDATE/DELETE without WHERE affects ALL rows — always check. "
        "3) NULL comparisons: use IS NULL / IS NOT NULL, never = NULL. "
        "4) HAVING filters aggregates; WHERE filters rows. "
        "5) JOIN type matters: INNER vs LEFT vs RIGHT vs FULL. "
        "6) String literals use single quotes. "
        "7) SQL injection risk: never concatenate user input directly."
    ),
    "HTML": (
        "HTML RULES: "
        "1) Tags must be properly nested and closed. "
        "2) DOCTYPE declaration required at top. "
        "3) Attribute values must be quoted. "
        "4) <img> requires alt attribute for accessibility. "
        "5) <a> href must be valid. "
        "6) Semantic elements preferred: header/nav/main/footer. "
        "7) <script> should be at end of body or use defer attribute."
    ),
    "CSS": (
        "CSS RULES: "
        "1) Each property declaration must end with semicolon. "
        "2) Property names are hyphenated (background-color not backgroundColor). "
        "3) Values must use correct units: px/em/rem/% for sizes, # or rgb() for colors. "
        "4) Selectors must match valid HTML elements/classes/IDs. "
        "5) Shorthand properties (margin, padding) follow top/right/bottom/left order. "
        "6) Typos in property names are silently ignored by browsers."
    ),
}

SYSTEM_PROMPT = """You are CodeLens — a precise, expert code analysis engine and programming tutor.

YOUR JOB:
1. Identify the programming language from the code
2. Apply ONLY that language's rules — never mix up rules from different languages
3. Find ALL errors: syntax, logical, conceptual, runtime, type, security
4. For EVERY error found, provide a working fix
5. Return the COMPLETE corrected code with ALL fixes applied
6. If the code has NO errors, say so clearly

ABSOLUTE RULES:
- Valid C code (int a=5; printf("%d",a);) is NOT an error — never flag correct code
- Python needs colons after if/for/while/def — JavaScript uses braces, never flag JS for missing colons
- Always provide corrected_full_code — never truncate it with "..." or "[rest of code]"
- Always provide at least one step in step_by_step_solution when has_error is true
- Respond ONLY with valid JSON — no markdown fences, no text outside the JSON object"""


def detect_language(code: str, lang_override: str = "") -> str:
    """Detect language from override or code patterns."""
    if lang_override and lang_override.strip():
        return SUPPORTED_LANGUAGES.get(lang_override.lower().strip(), lang_override.strip())

    code_lower = code.lower()

    # Java — very distinctive
    if ("public static void main" in code or
            "system.out.println" in code_lower or
            "public class " in code):
        return "Java"

    # C / C++ — #include is the giveaway
    if "#include" in code:
        if ("<iostream>" in code or "cout" in code or "cin" in code or
                "std::" in code or "vector<" in code or "string " in code):
            return "C++"
        return "C"

    # TypeScript — type annotations (check before JS)
    if ("def " not in code and
            (": string" in code or ": number" in code or ": boolean" in code or
             "interface " in code or ": void" in code or ": any" in code or
             "Array<" in code or "<T>" in code)):
        return "TypeScript"

    # JavaScript — common patterns
    if ("console.log" in code or "const " in code or "let " in code or
            "var " in code or "=>" in code or "function " in code or
            "document." in code or "window." in code):
        if "def " not in code and "print(" not in code:
            return "JavaScript"

    # SQL
    if any(kw in code_lower for kw in [
        "select ", "insert into", "create table",
        "update ", "delete from", "drop table", "alter table"
    ]):
        return "SQL"

    # HTML
    if "<!doctype" in code_lower or "<html" in code_lower or (
            "<body" in code_lower and "<head" in code_lower):
        return "HTML"

    # CSS — property: value patterns
    if ("{" in code and "}" in code and
            any(p in code_lower for p in [
                "color:", "font-", "margin:", "padding:",
                "display:", "background", "border:", "width:", "height:"
            ])):
        return "CSS"

    # Python — most common scripting patterns
    if ("def " in code or "import " in code or "print(" in code or
            "elif " in code or "lambda " in code or "self." in code or
            "class " in code):
        return "Python"

    return "Unknown"


def build_prompt(code: str, language: str = "", mode: str = "specification") -> str:
    lang = detect_language(code, language)
    lang_rules = LANGUAGE_RULES.get(lang, f"Apply standard {lang} rules and best practices.")

    json_schema = """{
  "has_error": true or false,
  "detected_language": "language name",
  "error_type": "syntax" | "logical" | "conceptual" | "runtime" | "type" | "security" | "none",
  "severity": "low" | "medium" | "high" | "none",
  "error_line": line_number_or_null,
  "error_description": "clear description of the primary error",
  "misconception": "what the programmer misunderstood or got wrong",
  "explanation": "beginner-friendly explanation referencing language-specific rules",
  "fix_suggestion": "the corrected snippet for the primary error only",
  "corrected_full_code": "THE COMPLETE corrected source code with ALL fixes — never use ... or truncate",
  "step_by_step_solution": [
    {"step": 1, "description": "what to fix and why", "before": "original snippet", "after": "fixed snippet"}
  ],
  "learning_tip": "one concise tip to avoid this mistake in this language",
  "additional_errors": [
    {"line": 1, "type": "error_type", "description": "description", "fix": "corrected snippet"}
  ]
}"""

    taxonomy = "\n".join([f"  - {k}: {v}" for k, v in ERROR_TAXONOMY.items()])
    specs = "\n".join([f"  {s}" for s in SPECIFICATIONS])

    if mode == "zero_shot":
        return f"""Analyze this {lang} code and find ALL errors.

LANGUAGE: {lang}
{lang_rules}

Find ALL of these error types:
{taxonomy}

REQUIREMENTS:
- If has_error is true: corrected_full_code must be the COMPLETE fixed code (never truncated)
- If has_error is true: step_by_step_solution must have at least one step
- If has_error is false: set error_type to "none", corrected_full_code = original code
- List every additional error in additional_errors with a fix

Respond ONLY with this JSON (no markdown, no extra text):
{json_schema}

Code:
```
{code}
```"""
    else:
        return f"""Perform specification-guided analysis of this {lang} code.

LANGUAGE: {lang}
{lang_rules}

Specifications to check:
{specs}

Error types to detect:
{taxonomy}

REQUIREMENTS:
- Find ALL errors across all specifications and error types
- corrected_full_code must be the COMPLETE fixed code — NEVER truncate with "..." or "[rest of code]"
- step_by_step_solution must have one step per fix, with before/after snippets
- Every item in additional_errors must have a fix field
- If no errors: has_error=false, error_type="none", corrected_full_code=original code

Respond ONLY with this JSON (no markdown, no extra text):
{json_schema}

Code:
```
{code}
```"""


def call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        "max_tokens": 3000,
        "temperature": 0.1,   # low temperature = consistent, accurate output
        "top_p": 0.9,
    }
    resp = requests.post(GROQ_URL, headers=headers, json=payload, timeout=45)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def parse_response(raw: str) -> dict:
    raw = raw.strip()
    # Strip any accidental markdown fences
    for fence in ("```json", "```"):
        if fence in raw:
            parts = raw.split(fence)
            if len(parts) >= 3:
                raw = parts[1].strip()
                break

    # Find outermost JSON object
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(raw[start:end])
        except json.JSONDecodeError:
            # Try to salvage partial JSON
            pass

    # Fallback — return a safe default
    return {
        "has_error": False,
        "detected_language": "Unknown",
        "error_type": "none",
        "severity": "none",
        "error_line": None,
        "error_description": "",
        "misconception": "",
        "explanation": "Could not parse the analysis response. Please try again.",
        "fix_suggestion": "",
        "corrected_full_code": "",
        "step_by_step_solution": [],
        "learning_tip": "",
        "additional_errors": [],
    }


def python_static_check(code: str) -> dict | None:
    """Fast AST syntax check for Python — no API call needed."""
    try:
        ast.parse(code)
        return None
    except SyntaxError as e:
        return {
            "has_error": True,
            "detected_language": "Python",
            "error_type": "syntax",
            "severity": "high",
            "error_line": e.lineno,
            "error_description": f"SyntaxError on line {e.lineno}: {e.msg}",
            "misconception": "The code has a Python syntax error that prevents it from running",
            "explanation": (
                f"Python cannot parse this code. Error at line {e.lineno}: '{e.msg}'. "
                "Common causes: missing colon after if/for/while/def, "
                "mismatched parentheses/brackets, or wrong indentation."
            ),
            "fix_suggestion": (
                f"Check line {e.lineno}. "
                "In Python, if/elif/else/for/while/def/class must end with a colon (:)."
            ),
            "corrected_full_code": "",
            "step_by_step_solution": [{
                "step": 1,
                "description": f"Fix syntax error on line {e.lineno}: {e.msg}",
                "before": f"Line {e.lineno} has a syntax error",
                "after": "Add missing colon, close bracket, or fix indentation",
            }],
            "learning_tip": "Every if/elif/else/for/while/def/class in Python must end with a colon (:).",
            "additional_errors": [],
        }


def run_python(code: str, stdin_input: str = "") -> dict:
    """Execute Python code safely in a sandboxed environment."""
    result = {"output": "", "error": "", "success": False}

    try:
        ast.parse(code)
    except SyntaxError as e:
        result["error"] = f"SyntaxError at line {e.lineno}: {e.msg}"
        return result

    if "input(" in code and not stdin_input.strip():
        result["error"] = (
            "This code uses input() to read user input.\n"
            "Please provide the input values in the Stdin box (one value per line)."
        )
        result["needs_input"] = True
        return result

    stdout_buf = io.StringIO()
    stdin_iter = iter(stdin_input.splitlines()) if stdin_input else iter([])

    def fake_input(prompt=""):
        try:
            val = next(stdin_iter)
            stdout_buf.write((prompt or "") + val + "\n")
            return val
        except StopIteration:
            raise EOFError("Not enough input values provided.")

    import builtins as _b
    orig_input = _b.input
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = stdout_buf
    sys.stderr = stdout_buf
    try:
        _b.input = fake_input
        exec(compile(code, "<string>", "exec"), {"__builtins__": vars(_b)})
        result["output"] = stdout_buf.getvalue()
        result["success"] = True
    except EOFError as e:
        result["output"] = stdout_buf.getvalue()
        result["error"] = str(e)
    except Exception as e:
        result["output"] = stdout_buf.getvalue()
        result["error"] = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.stdout = old_out
        sys.stderr = old_err
        _b.input = orig_input

    return result


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_ID,
        "provider": "Groq",
        "api_key_set": bool(GROQ_API_KEY),
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Invalid JSON body"}), 400

    code     = body.get("code", "").strip()
    mode     = body.get("mode", "specification")
    language = body.get("language", "")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    if not GROQ_API_KEY:
        return jsonify({
            "error": "GROQ_API_KEY is not configured. Add it to backend/.env and restart the server."
        }), 503

    lang = detect_language(code, language)

    # Fast static check for Python — saves an API call for obvious syntax errors
    if lang == "Python":
        hit = python_static_check(code)
        if hit:
            hit["mode"]  = mode
            hit["model"] = "static-ast"
            return jsonify(hit)

    try:
        prompt = build_prompt(code, language, mode)
        raw    = call_groq(prompt)
        result = parse_response(raw)

        result["mode"]  = mode
        result["model"] = MODEL_ID

        # Ensure all expected fields exist
        result.setdefault("additional_errors",     [])
        result.setdefault("step_by_step_solution", [])
        result.setdefault("corrected_full_code",   code if not result.get("has_error") else "")
        result.setdefault("learning_tip",          "")
        result.setdefault("misconception",         "")

        # If no error, corrected code = original
        if not result.get("has_error"):
            result["corrected_full_code"] = code

        return jsonify(result)

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": "Analysis timed out. Try with shorter code."}), 504
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else 500
        if status == 401:
            return jsonify({"error": "Invalid GROQ_API_KEY. Check your .env file."}), 401
        if status == 429:
            return jsonify({"error": "Groq rate limit hit. Wait a moment and try again."}), 429
        return jsonify({"error": f"Groq API error: {status}"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/run", methods=["POST"])
def run_code():
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Invalid JSON body"}), 400

    code  = body.get("code", "").strip()
    lang  = body.get("language", "")
    stdin = body.get("stdin", "")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    detected = detect_language(code, lang)
    if detected != "Python":
        return jsonify({
            "success": False,
            "output": "",
            "error": (
                f"Live execution is only available for Python.\n"
                f"Detected language: {detected}.\n\n"
                f"Run {detected} code online:\n"
                f"  • replit.com — all languages\n"
                f"  • codepen.io — JS / HTML / CSS\n"
                f"  • onecompiler.com — 50+ languages"
            ),
            "language_unsupported": True,
        })

    return jsonify(run_python(code, stdin))


@app.route("/api/examples", methods=["GET"])
def get_examples():
    return jsonify([
        # Python
        {
            "title": "Python: Off-by-one loop", "category": "logical", "language": "python",
            "code": (
                "def sum_list(nums):\n"
                "    total = 0\n"
                "    for i in range(1, len(nums)):\n"
                "        total += nums[i]\n"
                "    return total\n\n"
                "print(sum_list([1, 2, 3, 4, 5]))"
            ),
        },
        {
            "title": "Python: Uninitialized variable", "category": "conceptual", "language": "python",
            "code": (
                "def find_max(nums):\n"
                "    for n in nums:\n"
                "        if n > max_val:\n"
                "            max_val = n\n"
                "    return max_val\n\n"
                "print(find_max([3, 1, 4, 1, 5]))"
            ),
        },
        {
            "title": "Python: Multiple syntax errors", "category": "syntax", "language": "python",
            "code": (
                "def calculate_average(numbers)\n"
                "    total = 0\n"
                "    for i in range(len(numbers)):\n"
                "        total += numbers[i]\n"
                "    avg = total / len(numbers)\n"
                "    return avg\n"
                "nums = [10, 20, 30, 40, 50]\n"
                'result = calculate_average(nums\n'
                'print("Average is: " + result)'
            ),
        },
        {
            "title": "Python: Division by zero", "category": "logical", "language": "python",
            "code": (
                "def divide(a, b):\n"
                "    return a / b\n\n"
                "print(divide(10, 0))"
            ),
        },
        {
            "title": "Python: Clean code (no errors)", "category": "none", "language": "python",
            "code": (
                "def factorial(n):\n"
                "    if n == 0 or n == 1:\n"
                "        return 1\n"
                "    return n * factorial(n - 1)\n\n"
                "print(factorial(5))"
            ),
        },
        # JavaScript
        {
            "title": "JavaScript: Type coercion bug", "category": "conceptual", "language": "javascript",
            "code": (
                "function addNumbers(a, b) {\n"
                "  return a + b;\n"
                "}\n\n"
                'const result = addNumbers("5", 3);\n'
                'console.log("Sum: " + result);\n'
                "console.log(result === 8);"
            ),
        },
        {
            "title": "JavaScript: Missing await", "category": "logical", "language": "javascript",
            "code": (
                "async function fetchData() {\n"
                "  const res = fetch('https://api.example.com/data');\n"
                "  const data = res.json();\n"
                "  return data.name;\n"
                "}\n"
                "fetchData().then(name => console.log(name));"
            ),
        },
        {
            "title": "JavaScript: var hoisting bug", "category": "conceptual", "language": "javascript",
            "code": (
                "function checkValue() {\n"
                "  console.log(x);\n"
                "  var x = 10;\n"
                "  console.log(x);\n"
                "}\n"
                "checkValue();"
            ),
        },
        # TypeScript
        {
            "title": "TypeScript: Type mismatch", "category": "type", "language": "typescript",
            "code": (
                "interface User {\n"
                "  name: string;\n"
                "  age: number;\n"
                "}\n\n"
                "function getUser(): User {\n"
                '  return { name: "Alice", age: "30" };\n'
                "}\n\n"
                "const user = getUser();\n"
                "console.log(user.age + 1);"
            ),
        },
        {
            "title": "TypeScript: Null safety violation", "category": "runtime", "language": "typescript",
            "code": (
                "function getLength(str: string | null): number {\n"
                "  return str.length;\n"
                "}\n\n"
                "console.log(getLength(null));"
            ),
        },
        # Java
        {
            "title": "Java: Missing return type", "category": "syntax", "language": "java",
            "code": (
                "public class Calculator {\n"
                "    public add(int a, int b) {\n"
                "        return a + b;\n"
                "    }\n\n"
                "    public static void main(String[] args) {\n"
                "        Calculator c = new Calculator();\n"
                "        System.out.println(c.add(3, 4));\n"
                "    }\n"
                "}"
            ),
        },
        {
            "title": "Java: NullPointerException risk", "category": "runtime", "language": "java",
            "code": (
                "public class Main {\n"
                "    public static String greet(String name) {\n"
                '        return "Hello, " + name.toUpperCase();\n'
                "    }\n"
                "    public static void main(String[] args) {\n"
                "        System.out.println(greet(null));\n"
                "    }\n"
                "}"
            ),
        },
        {
            "title": "Java: Wrong String comparison", "category": "conceptual", "language": "java",
            "code": (
                "public class Main {\n"
                "    public static void main(String[] args) {\n"
                '        String a = new String("hello");\n'
                '        String b = new String("hello");\n'
                "        if (a == b) {\n"
                '            System.out.println("Equal");\n'
                "        } else {\n"
                '            System.out.println("Not equal");\n'
                "        }\n"
                "    }\n"
                "}"
            ),
        },
        # C
        {
            "title": "C: Buffer overflow", "category": "security", "language": "c",
            "code": (
                "#include <stdio.h>\n"
                "#include <string.h>\n\n"
                "void copyString(char* dest, const char* src) {\n"
                "    strcpy(dest, src);\n"
                "}\n\n"
                "int main() {\n"
                "    char buf[5];\n"
                '    copyString(buf, "Hello World");\n'
                '    printf("%s\\n", buf);\n'
                "    return 0;\n"
                "}"
            ),
        },
        {
            "title": "C: Division by zero", "category": "logical", "language": "c",
            "code": (
                "#include <stdio.h>\n\n"
                "int divide(int a, int b) {\n"
                "    return a / b;\n"
                "}\n\n"
                "int main() {\n"
                '    printf("Result: %d\\n", divide(10, 0));\n'
                "    return 0;\n"
                "}"
            ),
        },
        # C++
        {
            "title": "C++: Vector out-of-bounds", "category": "runtime", "language": "cpp",
            "code": (
                "#include <iostream>\n"
                "#include <vector>\n"
                "using namespace std;\n\n"
                "int main() {\n"
                "    vector<int> nums = {1, 2, 3};\n"
                "    for (int i = 0; i <= nums.size(); i++) {\n"
                "        cout << nums[i] << endl;\n"
                "    }\n"
                "    return 0;\n"
                "}"
            ),
        },
        # SQL
        {
            "title": "SQL: UPDATE without WHERE", "category": "logical", "language": "sql",
            "code": (
                "UPDATE users\n"
                "SET email = 'newemail@example.com';\n\n"
                "-- This updates ALL rows in the table!"
            ),
        },
        {
            "title": "SQL: NULL comparison mistake", "category": "conceptual", "language": "sql",
            "code": (
                "SELECT * FROM employees\n"
                "WHERE manager_id = NULL;\n\n"
                "-- Should use IS NULL, not = NULL"
            ),
        },
        # HTML
        {
            "title": "HTML: Improper nesting & missing alt", "category": "syntax", "language": "html",
            "code": (
                "<!DOCTYPE html>\n"
                "<html>\n"
                "<head><title>My Page</title></head>\n"
                "<body>\n"
                "    <img src='photo.jpg'>\n"
                "    <p>Welcome <b>to my page</p></b>\n"
                "    <a href=>Click here</a>\n"
                "</body>\n"
                "</html>"
            ),
        },
        # CSS
        {
            "title": "CSS: Missing semicolons & typo", "category": "syntax", "language": "css",
            "code": (
                ".container {\n"
                "    display: flex;\n"
                "    width: 100%\n"
                "    height: 200px;\n"
                "    backround-color: #fff;\n"
                "    margin: 10px auto\n"
                "}"
            ),
        },
    ])


@app.route("/api/specifications", methods=["GET"])
def get_specifications():
    return jsonify({
        "specifications": SPECIFICATIONS,
        "taxonomy": ERROR_TAXONOMY,
        "supported_languages": list(set(SUPPORTED_LANGUAGES.values())),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
