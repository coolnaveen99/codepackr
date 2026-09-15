#!/usr/bin/env python3
"""
CodePackr Tool Documentation Generator
---------------------------------------
Reads src/data/tools.ts (parsed) + src/data/toolMetadata.json, combines them
with hand-written plain-English content (TOOL_CONTENT below), and renders one
Markdown file per tool into docs/tools/<category>/<tool-id>.md.

This script is the "engine" referenced by .github/skills/update-tool-docs.md.
Re-run it after editing TOOL_CONTENT, or after tools.ts / toolMetadata.json change,
to regenerate docs without hand-editing every file.

Usage (run from anywhere inside the repo, or pass the repo root explicitly):
    python3 scripts/generate-tool-docs.py
    python3 scripts/generate-tool-docs.py /path/to/codepackr
"""
import json
import os
import re
import sys
from datetime import date

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(REPO_ROOT, "docs", "tools")
TOOLS_TS = os.path.join(REPO_ROOT, "src", "data", "tools.ts")
METADATA_JSON = os.path.join(REPO_ROOT, "src", "data", "toolMetadata.json")
TODAY = date.today().isoformat()


def parse_tools_ts(path):
    """Parse src/data/tools.ts's TOOLS array into a list of dicts.
    This is a best-effort regex parser, not a real TS parser — if tools.ts's
    object shape changes significantly, adjust the pattern below."""
    content = open(path).read()
    pattern = re.compile(
        r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',"
        r"\s*(?:secondaryCategories:\s*\[[^\]]*\],\s*)?"
        r"description:\s*'([^']*(?:\\'[^']*)*)',\s*keywords:\s*\[([^\]]*)\],"
        r"\s*icon:\s*'([^']+)'(,\s*popular:\s*(true|false))?",
        re.DOTALL,
    )
    tools = []
    for m in pattern.findall(content):
        tid, name, cat, desc, kw, icon, _, popular = m
        keywords = [k.strip().strip("'") for k in kw.split(",") if k.strip()]
        tools.append({
            "id": tid, "name": name, "category": cat, "description": desc,
            "keywords": keywords, "icon": icon, "popular": popular == "true",
        })
    found_ids = {t["id"] for t in tools}
    all_ids = re.findall(r"id:\s*'([a-z0-9-]+)',", content)
    missing = [i for i in all_ids if i not in found_ids and i not in
               ("all", "formatters", "encoders", "validators", "converters",
                "image", "edi", "xml", "text", "utilities", "financial-calculators")]
    if missing:
        sys.stderr.write(
            f"WARNING: {len(missing)} tool id(s) in tools.ts did not match the parser "
            f"regex (likely due to an extra field like `secondaryCategories`, `isNew`, "
            f"or `badge`): {missing}\n"
            f"Add a TOOL_CONTENT entry for them manually and extend parse_tools_ts() if "
            f"they should be auto-parsed next time.\n"
        )
    return tools

CATEGORY_INFO = {
    "formatters": {
        "label": "Formatters",
        "emoji": "🧹",
        "analogy": (
            "Think of a Formatter like an iron for a wrinkled shirt. The words on the shirt "
            "(your code or data) don't change — it just gets pressed into neat, readable lines "
            "so a human (or another program) can read it comfortably."
        ),
        "who": (
            "Anyone who has ever received a giant wall of squashed-together code or data — from an "
            "API response, a database export, or a colleague's copy-paste — and needed to actually read it."
        ),
    },
    "encoders": {
        "label": "Encoders",
        "emoji": "🔐",
        "analogy": (
            "Think of an Encoder like a translator that turns your message into a different alphabet so "
            "it can travel safely (Base64, URL-encoding) or be checked for authenticity (hashes, JWTs). "
            "It's not about hiding a secret from a determined reader — it's about making data safe to move "
            "through systems that don't understand every character, or proving a piece of data hasn't been tampered with."
        ),
        "who": (
            "Developers moving data between systems (emails, URLs, APIs), and anyone working with login "
            "tokens, checksums, or security handshakes."
        ),
    },
    "validators": {
        "label": "Validators",
        "emoji": "✅",
        "analogy": (
            "Think of a Validator like a proofreader or a spell-checker, but for structured data instead of "
            "prose. It doesn't rewrite your document — it points at exactly which line broke the rules, so "
            "you can fix it before it breaks something downstream (a deployment, an API call, a contract)."
        ),
        "who": (
            "Anyone about to submit, deploy, or send a file (config, API spec, JSON payload) who wants to "
            "catch mistakes before a computer somewhere else rejects it."
        ),
    },
    "converters": {
        "label": "Converters",
        "emoji": "🔁",
        "analogy": (
            "Think of a Converter like a universal travel power adapter. Your data (the appliance) doesn't "
            "change what it does — it just gets a different \"plug shape\" so it fits into a system that "
            "expects a different format."
        ),
        "who": (
            "Anyone who has data in one format but needs it in another — a spreadsheet that needs to become "
            "JSON for an API, or camelCase variable names that need to become snake_case."
        ),
    },
    "image": {
        "label": "Image Tools",
        "emoji": "🖼️",
        "analogy": (
            "Think of these like a private, in-browser photo-editing desk: resize, compress, compare, or "
            "strip hidden information from a picture — without ever uploading that picture to a stranger's server."
        ),
        "who": (
            "Anyone prepping images for a website, an app, an upload limit, or checking whether a photo "
            "secretly contains GPS location or camera data they don't want to share."
        ),
    },
    "edi": {
        "label": "EDI Integration Hub",
        "emoji": "📦",
        "analogy": (
            "EDI (Electronic Data Interchange) is how big companies send each other business documents — "
            "purchase orders, invoices, shipping notices — as strict, computer-readable text files instead "
            "of PDFs or emails. Think of these tools as a translator's desk sitting between two companies' "
            "computer systems: one side speaks the ultra-compact \"EDI\" dialect, the other side speaks "
            "everyday formats like JSON or CSV, and these tools convert, check, and clean up messages moving "
            "in both directions."
        ),
        "who": (
            "Supply-chain, logistics, healthcare, and retail teams (and the developers who support them) who "
            "exchange purchase orders (850), invoices (810), shipping notices (856), healthcare claims (837), "
            "or enrollment files (834) with trading partners."
        ),
    },
    "xml": {
        "label": "XML & XSD Tools",
        "emoji": "📐",
        "analogy": (
            "XML is a way of writing structured documents using labeled tags (like HTML, but for data). An "
            "XSD is the \"blueprint\" or contract that says which tags are allowed, in what order, and what "
            "type of data they hold. These tools help you write, check, and transform XML against that blueprint."
        ),
        "who": (
            "Developers and integration specialists working with XML-based APIs, SOAP services, government "
            "or banking file formats, or any system that demands a document match an exact schema."
        ),
    },
    "utilities": {
        "label": "Utilities",
        "emoji": "🧰",
        "analogy": (
            "This is the Swiss-army-knife drawer: small, focused tools that each solve one everyday annoyance "
            "in five seconds — generate an ID, build a QR code, decode a timestamp, or figure out what a cron "
            "schedule actually means."
        ),
        "who": (
            "Developers, testers, and IT folks who need a fast one-off answer instead of writing a script."
        ),
    },
    "text": {
        "label": "Text Tools",
        "emoji": "✍️",
        "analogy": (
            "A digital text workbench: paste a block of text in and get counts, cleanups, and reordering done "
            "instantly, the way you'd use \"Find & Replace\" in a word processor — but built for developers."
        ),
        "who": (
            "Writers, developers, and data-cleaners who need quick word/character counts or want to strip out "
            "duplicate or blank lines from a list."
        ),
    },
}

def load_data():
    tools = parse_tools_ts(TOOLS_TS)
    meta = json.load(open(METADATA_JSON))
    return tools, meta

def slug_title(s):
    return s

def category_dir(cat):
    return os.path.join(OUT_DIR, cat)

TOOL_CONTENT = {}

TOOL_CONTENT.update({
"json-formatter": {
    "what": "JSON is the format almost every modern API speaks — but when it comes back from a server it's often squished onto one line with no spacing. This tool takes that squished JSON and lays it out with proper indentation (like paragraphs and tabs in a document) so you can actually see the structure: which value belongs to which field, and which brackets close which section. It can also do the reverse — squash a neat JSON file back down to one compact line (\"minify\") to save space before sending it somewhere.",
    "who": [
        "You pasted an API response into a text editor and it's one giant unreadable line.",
        "You need to shrink a JSON config file before shipping it to production to save bytes.",
        "You want to quickly check whether a JSON payload is even valid before debugging further.",
    ],
    "example": {
        "scenario": "You received this compact JSON from an API and want to read it clearly:",
        "input": '{"user":{"id":42,"name":"Asha","roles":["admin","editor"]}}',
        "output": (
            "{\n"
            '  "user": {\n'
            '    "id": 42,\n'
            '    "name": "Asha",\n'
            '    "roles": ["admin", "editor"]\n'
            "  }\n"
            "}"
        ),
    },
    "mistakes": [
        "Trailing commas after the last item in an object or array — valid JSON does not allow them.",
        "Using single quotes instead of double quotes around keys and string values.",
        "Forgetting that JSON keys must always be text in quotes, even if they look like numbers.",
    ],
},
"html-formatter": {
    "what": "HTML is the skeleton of every web page. When it's generated by a build tool or copied from \"View Source\", it often arrives as one dense block with no indentation. This tool re-indents the tags so nested elements (like a `<div>` inside a `<section>` inside a `<body>`) are visually staircased, making the page's structure obvious at a glance.",
    "who": [
        "You're debugging why a page looks broken and need to see how the tags are actually nested.",
        "You copied minified HTML from a live site and want to study its layout.",
        "You're reviewing a teammate's markup in a code review and it's all on one line.",
    ],
    "example": {
        "scenario": "Turning a squashed snippet into readable markup:",
        "input": '<div class="card"><h2>Title</h2><p>Body text</p></div>',
        "output": (
            '<div class="card">\n'
            "  <h2>Title</h2>\n"
            "  <p>Body text</p>\n"
            "</div>"
        ),
    },
    "mistakes": [
        "Unclosed tags (like a missing `</div>`) will make the formatter's output look wrong even though the code itself is broken — fix the missing tag first.",
        "Mixing tabs and spaces before formatting can produce uneven indentation after.",
    ],
},
"css-formatter": {
    "what": "CSS controls how a web page looks. This tool takes CSS rules — whether tightly packed on one line (minified) or messily spaced — and either beautifies them into a clean, one-property-per-line style, or minifies them by stripping all unnecessary whitespace to make the file smaller and faster to load.",
    "who": [
        "You want to read a competitor's or library's minified stylesheet to understand their styling.",
        "You're about to ship a stylesheet to production and want to shrink its file size.",
        "You're cleaning up inconsistent spacing in a shared team stylesheet.",
    ],
    "example": {
        "scenario": "Beautifying a one-line rule:",
        "input": ".card{padding:16px;border-radius:8px;background:#fff}",
        "output": (
            ".card {\n"
            "  padding: 16px;\n"
            "  border-radius: 8px;\n"
            "  background: #fff;\n"
            "}"
        ),
    },
    "mistakes": [
        "Missing a closing `}` on a rule — the formatter will still try its best, but check the result carefully.",
        "Minifying before you're done editing — always keep an unminified source copy.",
    ],
},
"sql-formatter": {
    "what": "SQL queries copied from logs, ORMs, or database tools often arrive as one long line with keywords in random casing. This tool lays the query out on multiple lines (one clause per line: SELECT, FROM, WHERE, JOIN...) and capitalizes SQL keywords, so it reads like a query a person actually wrote by hand.",
    "who": [
        "You're debugging a slow query logged by your database and it's an unreadable wall of text.",
        "You want a consistent style (capitalized keywords, indentation) across a team's SQL files.",
        "You're reviewing a generated query from an ORM (like Hibernate or Sequelize) before running it manually.",
    ],
    "example": {
        "scenario": "Formatting a one-line query:",
        "input": "select id,name from users where age>18 and active=true order by name",
        "output": (
            "SELECT id, name\n"
            "FROM users\n"
            "WHERE age > 18\n"
            "  AND active = true\n"
            "ORDER BY name"
        ),
    },
    "mistakes": [
        "Formatting does not fix logical bugs in the query (wrong table name, missing JOIN condition) — it only improves readability.",
        "Very database-specific syntax (vendor extensions) may format slightly differently than expected; always sanity-check the result.",
    ],
},
"xml-formatter": {
    "what": "Like the HTML formatter, but for XML documents — the tag-based format used by many enterprise systems, SOAP APIs, RSS feeds, and configuration files. It indents nested elements and can flag basic well-formedness issues (like a tag that was never closed).",
    "who": [
        "You received an XML response from a SOAP API as one solid block of text.",
        "You're inspecting an RSS/Atom feed or a config file (like a Maven pom.xml) that's been minified.",
    ],
    "example": {
        "scenario": "Indenting a compact XML document:",
        "input": "<order><id>1001</id><item qty=\"2\">Widget</item></order>",
        "output": (
            "<order>\n"
            "  <id>1001</id>\n"
            '  <item qty="2">Widget</item>\n'
            "</order>"
        ),
    },
    "mistakes": [
        "XML tags are case-sensitive and must be closed exactly — `<Item>` and `</item>` do not match.",
        "Special characters like `&`, `<`, `>` inside text content must be escaped (`&amp;`, `&lt;`, `&gt;`); see the XML Entity & CDATA Escaper tool.",
    ],
},
"yaml-formatter": {
    "what": "YAML is a whitespace-sensitive configuration format used by tools like Docker Compose, Kubernetes, and CI pipelines (GitHub Actions, GitLab CI). Because indentation is meaningful, a single misplaced space can break a file. This tool cleans up and standardizes indentation and can validate that the YAML is structurally sound.",
    "who": [
        "You're editing a Kubernetes manifest or GitHub Actions workflow and indentation looks inconsistent.",
        "You want to double-check a YAML config parses correctly before committing it.",
    ],
    "example": {
        "scenario": "Cleaning up inconsistent indentation:",
        "input": "app:\n  name: demo\n    version: 1.0\n  port: 8080",
        "output": (
            "app:\n"
            "  name: demo\n"
            "  version: 1.0\n"
            "  port: 8080"
        ),
    },
    "mistakes": [
        "YAML never uses tab characters for indentation — only spaces. A stray tab is one of the most common causes of a broken YAML file.",
        "Two spaces vs. four spaces per level matters for consistency, not correctness, but mixing them inside the same file causes confusion.",
    ],
},
"js-minifier": {
    "what": "This tool shrinks JavaScript source code by removing comments, extra whitespace, and line breaks (and can shorten variable names) so the file downloads and parses faster in a browser — without changing what the code actually does.",
    "who": [
        "You're preparing a small script for production and want to reduce its file size.",
        "You want to see what a minified third-party script roughly does structurally before deciding whether to trust it.",
    ],
    "example": {
        "scenario": "Minifying a small function:",
        "input": "function add(a, b) {\n  // returns the sum\n  return a + b;\n}",
        "output": "function add(a,b){return a+b;}",
    },
    "mistakes": [
        "Minifying is not the same as bundling — this tool compresses the code you give it, it doesn't combine multiple files or resolve `import`/`require` statements.",
        "Always keep your original, readable source file — minified code is very hard to debug directly.",
    ],
},
"connection-string-parser": {
    "what": "Databases like PostgreSQL, MySQL, MongoDB Atlas, and Redis are usually connected to using a single long \"connection string\" (e.g. `postgres://user:pass@host:5432/dbname`). This tool works both ways: paste a connection string in and it breaks it into individual readable fields (host, port, username, database name, options); or fill in the individual fields and it builds the correctly formatted connection string for you.",
    "who": [
        "You're setting up a new environment (`.env` file) and need to build a valid connection string from separate credentials.",
        "You received a connection string from a teammate or a cloud dashboard and want to understand exactly what host/port/database it points to.",
        "You need to safely change just the password or database name inside an existing connection string without breaking its formatting.",
    ],
    "example": {
        "scenario": "Parsing a Postgres connection string into its parts:",
        "input": "postgres://admin:secret123@db.example.com:5432/inventory?sslmode=require",
        "output": (
            "Protocol: postgres\n"
            "Username: admin\n"
            "Password: secret123\n"
            "Host: db.example.com\n"
            "Port: 5432\n"
            "Database: inventory\n"
            "Options: sslmode=require"
        ),
    },
    "mistakes": [
        "Special characters in passwords (like `@` or `:`) must be percent-encoded inside a connection string, or the parser will split the string in the wrong place.",
        "Since this is 100% local processing, remember to still treat any password you paste here as sensitive — clear the field when you're done.",
    ],
},
})

TOOL_CONTENT.update({
"base64": {
    "what": "Base64 turns any data (text, or even the raw bytes of a small file) into a string made only of letters, numbers, `+`, `/`, and `=`. It's not encryption or a secret code — it's a translation so that binary-ish data can safely travel through systems (like email or JSON) that only expect plain text characters. This tool encodes plain text to Base64, and decodes Base64 back to the original text.",
    "who": [
        "You need to embed a small image directly inside a CSS or HTML file (a \"data URI\").",
        "You're debugging an API that returns Base64-encoded fields (common for tokens, certificates, or binary payloads).",
        "Someone sent you a Base64 string and you want to see what it actually says.",
    ],
    "example": {
        "scenario": "Encoding and decoding plain text:",
        "input": "Hello, World!",
        "output": "SGVsbG8sIFdvcmxkIQ== (decoding this back gives you \"Hello, World!\" again)",
    },
    "mistakes": [
        "Base64 is NOT encryption — anyone can decode it instantly. Never use it to hide passwords or secrets.",
        "Decoding will fail or produce garbage if the input isn't valid Base64 (wrong length, invalid characters).",
    ],
},
"url-encode": {
    "what": "URLs can only safely contain a limited set of characters. URL (percent) encoding replaces anything else — spaces, `&`, `?`, non-English letters, emoji — with a `%` followed by a two-digit code, so the URL doesn't break when it's clicked, shared, or processed by a server. This tool encodes plain text into that safe format, and decodes an encoded URL back into readable text.",
    "who": [
        "You're building a link that includes a search term, email address, or special characters as a query parameter.",
        "You're debugging why a URL with spaces or symbols is breaking in the browser address bar.",
        "You want to read what a long, cryptic-looking `%20`-filled URL actually says.",
    ],
    "example": {
        "scenario": "Encoding a search query for a URL:",
        "input": "hello world & more",
        "output": "hello%20world%20%26%20more",
    },
    "mistakes": [
        "Encoding the entire URL (including `https://` and `/`) instead of just the parameter value will break the link.",
        "Double-encoding (encoding something that's already encoded) turns `%` into `%25` and produces broken results.",
    ],
},
"html-entity": {
    "what": "Certain characters (`<`, `>`, `&`, quotes) have special meaning in HTML and will be misread as tags or broken markup if typed directly into page content. HTML entity encoding replaces them with safe placeholder codes (like `&lt;` for `<`). This tool converts risky characters into safe entities, or converts entities back into normal readable characters.",
    "who": [
        "You're displaying user-submitted text (like a comment or blog post) on a web page and need to prevent it from being misread as HTML tags.",
        "You copied text containing `&amp;` or `&quot;` codes and want to see the actual, readable version.",
    ],
    "example": {
        "scenario": "Escaping text that contains HTML-sensitive characters:",
        "input": "5 < 10 & \"quoted\"",
        "output": "5 &lt; 10 &amp; &quot;quoted&quot;",
    },
    "mistakes": [
        "Escaping the same text twice will turn `&amp;` into `&amp;amp;` — always check whether the text is already escaped first.",
        "This does not replace security sanitization for user-generated content in a live app — it helps you understand and manually inspect content, not enforce app-level security by itself.",
    ],
},
"hash-generator": {
    "what": "A cryptographic hash is a fixed-length \"fingerprint\" calculated from any input — even a tiny change to the input produces a completely different fingerprint, and you can never reverse a hash back into the original data. This tool computes common hash algorithms (MD5, SHA-1, SHA-256, SHA-384, SHA-512) for any text you paste in, useful for checking data integrity or comparing values without storing the original.",
    "who": [
        "You downloaded a file and want to verify its SHA-256 checksum matches what the publisher listed.",
        "You need to generate a hash of a password or value for a config file or test fixture (never for real production password storage).",
        "You want to quickly confirm two pieces of text are byte-for-byte identical by comparing their hashes.",
    ],
    "example": {
        "scenario": "Hashing the word \"password\" with SHA-256:",
        "input": "password",
        "output": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d",
    },
    "mistakes": [
        "MD5 and SHA-1 are considered broken for security purposes (collisions exist) — use SHA-256 or better for anything security-sensitive.",
        "Hashing a password directly (without a proper \"salt\" and a slow algorithm like bcrypt/Argon2) is not safe for real user account storage — this tool is for checksums and learning, not production auth systems.",
    ],
},
"jwt-decoder": {
    "what": "A JWT (JSON Web Token) is a compact, three-part string (`header.payload.signature`) commonly used to represent a logged-in user or an API session. This tool splits a JWT apart and decodes the header and payload sections back into readable JSON, so you can see who the token says it belongs to, what permissions ('claims') it grants, and when it expires.",
    "who": [
        "You're debugging \"why am I logged out\" and want to check a token's expiry (`exp`) claim.",
        "You want to see what data (claims) an API's auth token actually contains.",
    ],
    "example": {
        "scenario": "Decoding a JWT's payload section:",
        "input": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkFzaGEifQ.signature-part",
        "output": '{\n  "sub": "1234",\n  "name": "Asha"\n}',
    },
    "mistakes": [
        "Decoding a JWT does NOT verify it's genuine — anyone can read the contents of a JWT without knowing the secret key. Verifying the signature requires the correct secret/public key.",
        "Never paste a real production access token into any third-party tool if you're not sure how it's processed — this tool runs 100% locally in your browser, but always be cautious with live credentials in general.",
    ],
},
"jwt-encoder": {
    "what": "This is the reverse of decoding: you provide a header, a payload (claims), and a secret key, and the tool signs and assembles a valid HS256 JWT string — useful for testing an API that expects a bearer token, without needing a full auth server running.",
    "who": [
        "You're testing an API locally and need a quickly-crafted JWT with specific claims (like a fake `role: admin`) to check permission logic.",
        "You're learning how JWTs are structured by building one from scratch.",
    ],
    "example": {
        "scenario": "Encoding a payload with a test secret:",
        "input": 'Payload: {"sub":"1234","role":"tester"}  Secret: my-test-secret',
        "output": "A three-part JWT string like eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0Iiwicm9sZSI6InRlc3RlciJ9.<signature>",
    },
    "mistakes": [
        "Tokens created here are for testing only — a real production system must verify the signature using its own securely-stored secret, and that secret should never be shared or guessable.",
        "HS256 uses a single shared secret; some production systems use RS256 (public/private key pairs) instead, which this simple encoder does not create.",
    ],
},
"jwt-inspector": {
    "what": "A more complete companion to the JWT Decoder: besides showing the decoded header and payload, it checks whether the token is expired, flags missing or unusual claims, and clearly separates the header, payload, and signature sections visually — a one-stop dashboard for understanding a token at a glance.",
    "who": [
        "You're troubleshooting an authentication bug and need a full picture of a token's state, not just its raw contents.",
        "You want a quick visual check of whether a token has already expired.",
    ],
    "example": {
        "scenario": "Inspecting a token that has expired:",
        "input": "A JWT with an exp claim set to a date in the past",
        "output": "Header and payload decoded, plus a clear ⚠️ 'This token expired on <date>' notice.",
    },
    "mistakes": [
        "Like the decoder, this shows you the contents of a token — it doesn't cryptographically prove the token is untampered with unless you separately verify the signature with the correct key.",
    ],
},
"pkce-generator": {
    "what": "PKCE (\"pixy\", Proof Key for Code Exchange) is a security add-on for OAuth 2.0 login flows, especially for apps that can't safely keep a secret (mobile apps, single-page apps). This tool generates a random `code_verifier` and its matching `code_challenge` (a hashed version), which you plug into an OAuth authorization request and token exchange to follow the PKCE protocol correctly.",
    "who": [
        "You're implementing or testing an OAuth 2.0 \"Authorization Code + PKCE\" login flow and need valid verifier/challenge values.",
        "You're debugging why an OAuth provider is rejecting your app's login request for missing/incorrect PKCE parameters.",
    ],
    "example": {
        "scenario": "Generating a PKCE pair:",
        "input": "(no input needed — click Generate)",
        "output": (
            "code_verifier: a long random string (43-128 characters)\n"
            "code_challenge: the SHA-256 hash of the verifier, Base64URL-encoded\n"
            "code_challenge_method: S256"
        ),
    },
    "mistakes": [
        "The `code_verifier` must be kept by your app and sent again at the token exchange step — sending only the `code_challenge` twice will make the login fail.",
        "Don't reuse the same verifier/challenge pair across separate login attempts.",
    ],
},
})

TOOL_CONTENT.update({
"diff-checker": {
    "what": "This tool compares two blocks of text side by side and highlights exactly what changed — added lines, removed lines, and modified lines — the same way a \"track changes\" view works in a word processor, but for any plain text (code, config, notes).",
    "who": [
        "You want to compare two versions of a file (before/after an edit) without using Git.",
        "Someone sent you an updated document or config and you want to know exactly what they changed.",
    ],
    "example": {
        "scenario": "Comparing two short snippets:",
        "input": "Doc A: name: web-app\\nport: 8080\n\nDoc B: name: web-app\\nport: 9090",
        "output": "Line 2 shown as changed: `port: 8080` → `port: 9090` (highlighted in red/green).",
    },
    "mistakes": [
        "Comparing text with different line-ending styles (Windows `\\r\\n` vs Unix `\\n`) can show every line as \"changed\" even if the content looks the same — check the line-ending setting if this happens.",
    ],
},
"openapi-validator": {
    "what": "OpenAPI (formerly \"Swagger\") is the standard way to describe a REST API's endpoints, parameters, and responses in a YAML or JSON file. This tool loads that specification file, checks it's structurally valid, and lets you browse it visually — endpoint by endpoint — rather than scrolling through raw YAML.",
    "who": [
        "You're reviewing an API contract before writing client code against it.",
        "You want to check whether an `openapi.yaml` file is valid before publishing it or generating SDKs from it.",
    ],
    "example": {
        "scenario": "Loading a spec that defines one endpoint:",
        "input": "A YAML file describing GET /users/{id}",
        "output": "A navigable list showing the endpoint, its parameters, and its expected response schema, plus any spec errors found.",
    },
    "mistakes": [
        "An OpenAPI file that's valid YAML but missing required OpenAPI fields (like `paths` or `info`) will still fail validation — YAML-valid isn't the same as OpenAPI-valid.",
    ],
},
"docker-k8s-validator": {
    "what": "This tool checks Dockerfiles, `docker-compose.yml` files, and Kubernetes YAML manifests for syntax errors and common misconfigurations (like a missing `image:` field or invalid indentation) before you try to actually deploy them.",
    "who": [
        "You're about to run `kubectl apply` on a manifest and want to catch typos first.",
        "You're reviewing a teammate's Docker Compose file in a pull request.",
    ],
    "example": {
        "scenario": "Validating a Kubernetes Pod manifest:",
        "input": "A YAML manifest missing the required `spec.containers` field",
        "output": "A flagged error: 'spec.containers is required for a Pod definition', pointing at the exact location.",
    },
    "mistakes": [
        "This checks structure and common patterns, not whether your specific cluster has the referenced resources (like a `ConfigMap` that doesn't exist) — that still requires testing against a real cluster.",
    ],
},
"regex-tester": {
    "what": "A regular expression (regex) is a pattern used to search, match, or replace text — powerful but notoriously hard to get right. This tool lets you type a regex pattern and some sample text, then instantly highlights every match, so you can build and debug the pattern step by step instead of guessing.",
    "who": [
        "You're writing a validation rule (like \"is this a valid email address\") and want to test it against real examples before using it in code.",
        "You're trying to understand what an existing regex from a codebase actually matches.",
    ],
    "example": {
        "scenario": "Testing a pattern that matches simple email addresses:",
        "input": "Pattern: [\\w.]+@[\\w.]+  |  Text: Contact us at hello@example.com or spam!",
        "output": "hello@example.com is highlighted as a match; 'spam!' is not.",
    },
    "mistakes": [
        "Forgetting to escape special characters (like a literal `.` or `$`) makes the pattern match more than intended.",
        "Different programming languages have slightly different regex flavors — a pattern tested here should still be double-checked in your actual runtime (e.g. JavaScript vs. Python regex differences).",
    ],
},
"json-validator": {
    "what": "This checks whether a block of text is syntactically correct JSON, and if not, points to the exact line and character where it breaks (a missing comma, an extra bracket, unescaped quote, etc.) — much faster than scanning a long payload by eye.",
    "who": [
        "An API call is failing with a vague \"invalid JSON\" error and you need to find the exact typo.",
        "You're hand-writing a JSON config file and want to confirm it's valid before saving.",
    ],
    "example": {
        "scenario": "Validating JSON with a trailing comma:",
        "input": '{"a": 1, "b": 2,}',
        "output": "❌ Invalid — unexpected trailing comma before '}' at position 16.",
    },
    "mistakes": [
        "JSON does not support comments (`//` or `/* */`) — a config file with comments copied from JavaScript will always fail JSON validation.",
    ],
},
"json-path-tester": {
    "what": "JSONPath is a small query language for pulling specific values out of a JSON document, similar to how XPath works for XML. This tool lets you paste JSON and type a JSONPath expression (like `$.users[*].name`) and instantly see which values it extracts.",
    "who": [
        "You're building an API integration or automation tool that needs to extract one specific field from a large JSON response.",
        "You want to test a JSONPath expression before hardcoding it into a script.",
    ],
    "example": {
        "scenario": "Extracting all user names from a list:",
        "input": 'JSON: {"users":[{"name":"Asha"},{"name":"Ravi"}]}  Path: $.users[*].name',
        "output": '["Asha", "Ravi"]',
    },
    "mistakes": [
        "JSONPath implementations vary slightly between libraries — double-check the exact library you'll use in production supports the syntax you tested here.",
    ],
},
"csv-viewer": {
    "what": "Raw CSV (comma-separated values) text is hard to read as plain text, especially with quoted fields or commas inside values. This tool renders CSV data as an actual scrollable table with columns and rows, making it easy to spot which value is in which column.",
    "who": [
        "You have a raw CSV export and want to eyeball the data without opening Excel or Google Sheets.",
        "You're checking whether a CSV file has the right number of columns and no obviously broken rows.",
    ],
    "example": {
        "scenario": "Viewing a small CSV export:",
        "input": "id,name,active\\n1,Asha,true\\n2,Ravi,false",
        "output": "A table with headers 'id / name / active' and two neatly aligned data rows.",
    },
    "mistakes": [
        "CSV files can use different delimiters (comma, semicolon, tab) depending on the exporting country/locale — if the table looks like one giant column, try a different delimiter setting.",
    ],
},
"json-structural-diff": {
    "what": "A specialized diff that understands JSON's structure rather than just comparing text line-by-line. It compares two JSON documents and reports exactly which keys were added, removed, or had their values changed — even if the two documents are formatted completely differently (spacing, key order).",
    "who": [
        "You're comparing two versions of an API response or config and want to know only the meaningful differences, ignoring formatting noise.",
        "You're debugging why two supposedly-identical JSON objects behave differently in code.",
    ],
    "example": {
        "scenario": "Comparing two JSON objects with a changed value and a formatting-only difference:",
        "input": 'A: {"id":1,"active":true}   B: {"active":false,"id":1}',
        "output": "Only 'active' is flagged as changed (true → false). Key order is correctly ignored.",
    },
    "mistakes": [
        "A plain text diff would incorrectly flag every line as different just because the key order changed — this tool avoids that trap, which is exactly why it's useful for JSON specifically.",
    ],
},
"dotenv-formatter": {
    "what": "`.env` files store an app's secrets and configuration as `KEY=value` lines. This tool formats, sorts, and validates a `.env` file — catching duplicate keys, malformed lines, or values that need quoting — so your environment configuration stays clean and predictable across a team.",
    "who": [
        "You're merging `.env` file suggestions from multiple teammates and want to catch duplicate or conflicting keys.",
        "You want to alphabetically sort a growing `.env` file so related settings are easier to find.",
    ],
    "example": {
        "scenario": "Validating a .env file with a duplicate key:",
        "input": "DB_HOST=localhost\\nDB_PORT=5432\\nDB_HOST=127.0.0.1",
        "output": "⚠️ Warning: DB_HOST is defined twice (line 1 and line 3) — only the last one will actually take effect in most tools.",
    },
    "mistakes": [
        "Values containing spaces usually need to be wrapped in quotes (`NAME=\"John Smith\"`), or some loaders will cut the value off at the first space.",
        "Never commit a real `.env` file with production secrets to a public repository — use this tool locally, not as a place to store the file itself.",
    ],
},
})

TOOL_CONTENT.update({
"json-xml-converter": {
    "what": "JSON and XML both represent structured data but with very different shapes — JSON uses `{}` and `[]`, XML uses opening/closing tags. This tool automatically maps one to the other, turning JSON objects into nested XML elements (or back again), so you don't have to hand-write the conversion.",
    "who": [
        "You're integrating a modern JSON-based app with an older enterprise system that only speaks XML (or vice versa).",
        "You're migrating a data feed from one format to another and need a quick one-off conversion.",
    ],
    "example": {
        "scenario": "Converting a small JSON object to XML:",
        "input": '{"order":{"id":1001,"item":"Widget"}}',
        "output": "<order>\n  <id>1001</id>\n  <item>Widget</item>\n</order>",
    },
    "mistakes": [
        "JSON arrays don't have one single 'correct' XML shape — check the generated tag names/repetition style match what your target system expects.",
        "XML attributes (like `id=\"1001\"`) vs. child elements (`<id>1001</id>`) are a design choice — this tool defaults to child elements; adjust manually if your system requires attributes.",
    ],
},
"json-csv-converter": {
    "what": "This converts a flat or nested JSON array of objects into a CSV table (rows and columns) suitable for opening in Excel/Sheets, and can also go the other way — turning an uploaded CSV file into a JSON array of objects, one per row.",
    "who": [
        "You have an API that returns JSON and a stakeholder who wants the data as a spreadsheet.",
        "You have a spreadsheet of data (like a product list) that needs to become JSON for an app or script.",
    ],
    "example": {
        "scenario": "Converting a JSON array to CSV:",
        "input": '[{"name":"Asha","age":30},{"name":"Ravi","age":25}]',
        "output": "name,age\\nAsha,30\\nRavi,25",
    },
    "mistakes": [
        "Deeply nested JSON (objects inside objects) doesn't flatten perfectly into a 2D table — check how nested fields were represented in the output columns.",
        "CSV has no true concept of data types — numbers, booleans, and text all become plain text strings when converted, so re-parsing on the other end may need type conversion.",
    ],
},
"case-converter": {
    "what": "Programming languages and style guides use different \"casing\" conventions for names: `camelCase`, `PascalCase`, `snake_case`, `kebab-case`, `CONSTANT_CASE`, and more. This tool instantly converts a name (or a whole list of names) between all of these styles.",
    "who": [
        "You're renaming variables to match a different language's convention (e.g. converting a Python `snake_case` API response into JavaScript `camelCase`).",
        "You need URL-friendly `kebab-case` slugs from regular titles.",
    ],
    "example": {
        "scenario": "Converting one name into several cases:",
        "input": "user first name",
        "output": (
            "camelCase: userFirstName\n"
            "PascalCase: UserFirstName\n"
            "snake_case: user_first_name\n"
            "kebab-case: user-first-name\n"
            "CONSTANT_CASE: USER_FIRST_NAME"
        ),
    },
    "mistakes": [
        "Acronyms (like \"URL\" or \"ID\") can convert unexpectedly (`urlId` vs `URLId`) — always sanity check names containing acronyms.",
    ],
},
"yaml-json-converter": {
    "what": "YAML and JSON can represent the exact same data — YAML is just more human-friendly to type by hand (no quotes or braces required), while JSON is the strict format most APIs and code expect. This tool converts cleanly between the two in either direction.",
    "who": [
        "You're working with a Kubernetes/Docker Compose file (YAML) but need to feed the same data into a JSON-only API or tool.",
        "You have a JSON config and want a more human-readable YAML version to hand-edit.",
    ],
    "example": {
        "scenario": "Converting YAML to JSON:",
        "input": "name: demo-app\\nport: 8080\\ntags:\\n  - web\\n  - api",
        "output": '{\n  "name": "demo-app",\n  "port": 8080,\n  "tags": ["web", "api"]\n}',
    },
    "mistakes": [
        "YAML supports some data types (like dates, or the special values `yes`/`no` as booleans) that don't map perfectly onto JSON — double-check unusual values after converting.",
    ],
},
"number-base-converter": {
    "what": "Computers can represent the same number in different \"bases\": decimal (base 10, what humans use daily), binary (base 2, what hardware uses), hexadecimal (base 16, common in color codes and memory addresses), and octal (base 8). This tool converts a number between all of these bases instantly.",
    "who": [
        "You're reading a hex color code, a memory address, or a permission bitmask (like Unix `chmod 755`) and want to see its decimal or binary equivalent.",
        "You're studying for a computer science exam or interview involving number systems.",
    ],
    "example": {
        "scenario": "Converting the decimal number 255:",
        "input": "255 (decimal)",
        "output": "Binary: 11111111  |  Hexadecimal: FF  |  Octal: 377",
    },
    "mistakes": [
        "Hexadecimal is sometimes written with a `0x` prefix (like `0xFF`) — remove the prefix if the tool expects just the digits, or check whether it auto-detects it.",
    ],
},
"markdown-html-converter": {
    "what": "Markdown is the lightweight `**bold**` / `# Heading` style of writing used in README files, chat apps, and documentation tools. This tool converts Markdown into rendered HTML (ready to paste into a web page), and can also convert existing HTML back into clean Markdown.",
    "who": [
        "You wrote documentation in Markdown and need the raw HTML to paste into a CMS or email template.",
        "You have an HTML page and want a cleaner Markdown version for a README or wiki.",
    ],
    "example": {
        "scenario": "Converting Markdown to HTML:",
        "input": "# Welcome\\n\\nThis is **bold** text.",
        "output": "<h1>Welcome</h1>\\n<p>This is <strong>bold</strong> text.</p>",
    },
    "mistakes": [
        "Not all Markdown \"flavors\" (GitHub Flavored Markdown vs. CommonMark) support exactly the same syntax (like tables or task lists) — check the output if you're using more advanced Markdown features.",
    ],
},
"curl-code-converter": {
    "what": "A `curl` command is the most common way developers share \"how to call this API\" instructions in documentation and browser dev tools (\"Copy as cURL\"). This tool converts that curl command into working code snippets in popular languages (like JavaScript `fetch`, Python `requests`, etc.), so you don't have to manually translate headers and parameters by hand.",
    "who": [
        "You copied a curl command from your browser's Network tab and want the equivalent Python or JavaScript code.",
        "You're documenting an API and want to show the same request in multiple languages.",
    ],
    "example": {
        "scenario": "Converting a simple GET request:",
        "input": "curl -H \"Authorization: Bearer TOKEN\" https://api.example.com/users",
        "output": (
            "fetch('https://api.example.com/users', {\n"
            "  headers: { 'Authorization': 'Bearer TOKEN' }\n"
            "})"
        ),
    },
    "mistakes": [
        "Very complex curl commands (multi-part form uploads, unusual flags) may need manual review of the generated code, especially around encoding and content-type headers.",
    ],
},
"csv-xml-converter": {
    "what": "This converts each row of a CSV table into its own XML element (with each column becoming a child tag), useful when a legacy or enterprise system needs data as XML but your source data is a plain spreadsheet export.",
    "who": [
        "You need to feed a spreadsheet of records into an XML-only import system.",
        "You're preparing test data in XML format from an easier-to-edit CSV file.",
    ],
    "example": {
        "scenario": "Converting a 2-row CSV into XML:",
        "input": "id,name\\n1,Widget\\n2,Gadget",
        "output": (
            "<records>\n"
            "  <record><id>1</id><name>Widget</name></record>\n"
            "  <record><id>2</id><name>Gadget</name></record>\n"
            "</records>"
        ),
    },
    "mistakes": [
        "Column headers containing spaces or special characters may need to be renamed to valid XML tag names (no spaces, can't start with a number).",
    ],
},
"html-markdown-converter": {
    "what": "The reverse-focused sibling of the Markdown ⇄ HTML converter: paste in raw HTML (like a page you copied) and get back clean, readable Markdown — useful for pulling content out of a webpage into a note-taking app or a README.",
    "who": [
        "You copied a block of formatted text from a webpage and want a clean Markdown version instead of messy pasted HTML.",
        "You're migrating web content into a Markdown-based static site generator or wiki.",
    ],
    "example": {
        "scenario": "Converting a small HTML snippet:",
        "input": "<h2>Steps</h2><ul><li>First</li><li>Second</li></ul>",
        "output": "## Steps\\n\\n- First\\n- Second",
    },
    "mistakes": [
        "Complex layouts (tables with merged cells, embedded scripts, inline styles) don't always have a clean Markdown equivalent — expect some manual cleanup for advanced HTML.",
    ],
},
"json-definition-generator": {
    "what": "Given a sample JSON object, this tool infers and generates a formal type definition for it (such as a TypeScript `interface`), saving you from manually typing out field names and guessing types when integrating with a new API.",
    "who": [
        "You received an example API response and want a ready-to-use TypeScript interface instead of typing it by hand.",
        "You want to quickly document the 'shape' of a JSON payload for a teammate.",
    ],
    "example": {
        "scenario": "Generating a TypeScript interface from sample JSON:",
        "input": '{"id":1,"name":"Asha","active":true}',
        "output": (
            "interface Root {\n"
            "  id: number;\n"
            "  name: string;\n"
            "  active: boolean;\n"
            "}"
        ),
    },
    "mistakes": [
        "The generated type is only as good as your sample — if a field is sometimes `null` or missing in other responses, the inferred type may need manual adjustment (e.g. adding `| null`).",
    ],
},
})

TOOL_CONTENT.update({
"image-target-compressor": {
    "what": "Instead of guessing a quality percentage and hoping the file comes out small enough, this tool lets you type a target file size (like \"under 200 KB\") and it automatically adjusts compression until the image fits that limit — perfect for upload forms with strict file-size limits.",
    "who": [
        "A website or form rejects your image for being \"too large\" and gives an exact size limit.",
        "You're preparing many photos for the web and want them all under a consistent size budget.",
    ],
    "example": {
        "scenario": "Compressing a photo to fit an upload limit:",
        "input": "A 3.2 MB JPEG photo, target size: 200 KB",
        "output": "A compressed JPEG at roughly 195 KB, with a live preview so you can check the quality tradeoff before downloading.",
    },
    "mistakes": [
        "Extremely small target sizes on a large, detailed photo will force heavy quality loss — there's a physical limit to how small an image can get before it looks noticeably blurry.",
    ],
},
"image-resizer": {
    "what": "Changes an image's pixel dimensions (width and height) and/or compresses it, without needing a full photo-editing program. You can resize by exact pixels, by percentage, or to fit within a maximum dimension while keeping the aspect ratio.",
    "who": [
        "You need a smaller thumbnail version of a large photo for a website.",
        "An app requires an exact pixel size (like a 1200x630 social media banner) and your image is the wrong dimensions.",
    ],
    "example": {
        "scenario": "Resizing a photo for a website banner:",
        "input": "A 4000x3000 photo, target width: 1200px (keep aspect ratio)",
        "output": "A resized 1200x900 image, ready to download.",
    },
    "mistakes": [
        "Resizing a small image up to a much larger size will make it blurry — resizing works best going from bigger to smaller.",
        "Forgetting to lock the aspect ratio can stretch or squash the image unnaturally.",
    ],
},
"image-merger": {
    "what": "Combines two or more separate images into a single image — side by side, stacked vertically, or in a grid — with adjustable spacing and alignment, without needing design software.",
    "who": [
        "You want to create a quick before/after comparison image.",
        "You need to combine several screenshots into one image for a bug report or documentation.",
    ],
    "example": {
        "scenario": "Merging a before and after screenshot side by side:",
        "input": "Two 800x600 screenshots, layout: side-by-side",
        "output": "A single 1600x600 combined image with both screenshots placed next to each other.",
    },
    "mistakes": [
        "Merging images of very different sizes can leave awkward empty space or force uneven scaling — try to use images with similar dimensions when possible.",
    ],
},
"image-exif-inspector": {
    "what": "Photos taken on phones and cameras often carry hidden \"EXIF\" metadata: the exact GPS location, camera model, and timestamp the photo was taken. This tool reads and displays that hidden data, and lets you strip it out entirely before sharing the photo publicly.",
    "who": [
        "You're about to post a photo online and want to make sure it doesn't secretly reveal your home GPS coordinates.",
        "You're curious what camera settings (ISO, shutter speed, lens) were used for a photo.",
    ],
    "example": {
        "scenario": "Inspecting a phone photo:",
        "input": "A photo taken on a smartphone",
        "output": "GPS: 37.7749, -122.4194 | Camera: iPhone 14 Pro | Date: 2026-03-02 14:31 — with a one-click 'Strip Metadata' button.",
    },
    "mistakes": [
        "Some platforms automatically strip EXIF data when you upload (like most social media sites) — but email, cloud storage, and direct file sharing usually do NOT strip it, so check before sharing sensitive photos that way.",
    ],
},
"image-diff-checker": {
    "what": "Places two images side by side (or overlaid) and highlights exactly which pixels differ between them — useful for visual regression testing or spotting subtle changes between two versions of a design or screenshot.",
    "who": [
        "You're checking whether a UI change accidentally broke the visual layout of a page (\"visual regression testing\").",
        "You want to compare two photos or design exports to spot small differences.",
    ],
    "example": {
        "scenario": "Comparing two versions of a button design:",
        "input": "before.png and after.png (same size, slightly different button color)",
        "output": "A highlighted diff image showing only the button area in red, confirming that's the only pixel difference.",
    },
    "mistakes": [
        "Comparing two images of different pixel dimensions will produce a mostly-red \"different everywhere\" result — resize both images to match first for a meaningful comparison.",
    ],
},
"favicon-generator": {
    "what": "A favicon is the small icon shown in a browser tab. Modern websites actually need this icon in many different sizes and formats (16x16, 32x32, Apple touch icon, Android icons, and a manifest file) for every device to display it correctly. This tool takes one source image and automatically generates the entire set.",
    "who": [
        "You're launching a new website and need a properly sized favicon set for browsers, phones, and bookmarks.",
        "You want to check whether your existing favicon files cover all the sizes modern browsers expect.",
    ],
    "example": {
        "scenario": "Generating a full favicon set from a logo:",
        "input": "A 512x512 PNG logo",
        "output": "favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png, and a ready-to-use site.webmanifest snippet.",
    },
    "mistakes": [
        "Starting from a low-resolution source image will make the larger generated icons look blurry — start from at least a 512x512 source image.",
    ],
},
"base64-image": {
    "what": "Converts an image file into a Base64 text string (a \"data URI\") that can be pasted directly into HTML or CSS to embed the image inline, without a separate image file — and can also convert a Base64 string back into a downloadable image file.",
    "who": [
        "You want to embed a small icon or logo directly inside a single HTML/CSS file with no external image request.",
        "You have a Base64 image string (from an API response or database) and want to see and download the actual picture.",
    ],
    "example": {
        "scenario": "Converting a small icon to an embeddable string:",
        "input": "icon.png (2 KB)",
        "output": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA... (ready to paste as an <img src=\"...\"> or CSS background-image)",
    },
    "mistakes": [
        "Base64-encoding an image makes the text representation roughly 33% larger than the original file — this is fine for small icons but a poor choice for large photos.",
    ],
},
})

TOOL_CONTENT.update({
"xml-to-xsd": {
    "what": "An XSD (XML Schema Definition) is the rulebook that says what a valid XML document is allowed to look like. Instead of writing that rulebook by hand, this tool looks at a real example XML document and automatically drafts a matching XSD — inferring element names, nesting, and basic data types.",
    "who": [
        "You have example XML files from a partner system but no official schema, and need one to validate future files against.",
        "You're documenting the structure of an XML format your team already uses.",
    ],
    "example": {
        "scenario": "Generating a schema from a sample order document:",
        "input": "<order><id>1001</id><total>49.99</total></order>",
        "output": "An XSD defining an 'order' element containing a required 'id' (integer) and 'total' (decimal) child element.",
    },
    "mistakes": [
        "A schema generated from a single example only knows about the fields in that one example — if some fields are optional or only appear in other documents, you'll need to adjust the generated XSD manually.",
    ],
},
"xsd-to-xml": {
    "what": "The reverse of the tool above: given an XSD schema, this generates a valid, realistic sample XML document that follows all its rules — useful for testing, or for understanding what a schema actually requires without reading raw XSD syntax.",
    "who": [
        "You received a partner's official XSD and want a working example XML file to use as a template.",
        "You're writing test cases for a system and need valid sample data quickly.",
    ],
    "example": {
        "scenario": "Generating a sample from a schema that requires id and total fields:",
        "input": "An XSD requiring 'order' with child elements 'id' (integer) and 'total' (decimal)",
        "output": "<order>\n  <id>1</id>\n  <total>0.00</total>\n</order>",
    },
    "mistakes": [
        "Generated sample values are placeholders (like `1` or `0.00`) — always replace them with real, meaningful data before using the sample for anything beyond structural testing.",
    ],
},
"xpath-evaluator": {
    "what": "XPath is a query language for navigating and extracting data out of an XML document — the XML equivalent of the JSONPath tool. This tool lets you paste XML and type an XPath expression (like `//order/id`) to instantly see which nodes it selects.",
    "who": [
        "You're writing an XSLT transformation or a scraper and need to test an XPath expression before using it in code.",
        "You want to pull one specific value out of a large XML document without writing a parser.",
    ],
    "example": {
        "scenario": "Extracting the order ID from an XML document:",
        "input": "XML: <order><id>1001</id></order>  XPath: //order/id/text()",
        "output": "1001",
    },
    "mistakes": [
        "Forgetting to account for XML namespaces (`xmlns=\"...\"`) is the #1 reason an XPath expression that \"looks right\" matches nothing — check whether the document declares a default namespace.",
    ],
},
"xml-escape-tool": {
    "what": "Similar to the HTML Entity tool, but focused on XML's rules: characters like `<`, `>`, `&`, and quotes must be escaped when they appear inside XML text content, or wrapped in a `CDATA` section if there's a lot of them (like embedding raw HTML inside an XML field). This tool handles both approaches.",
    "who": [
        "You're inserting user-generated or HTML content into an XML field and need it properly escaped.",
        "You're debugging an XML parsing error caused by an unescaped `&` or `<` inside text content.",
    ],
    "example": {
        "scenario": "Escaping a text value containing special characters:",
        "input": "Price < $10 & free shipping",
        "output": "Price &lt; $10 &amp; free shipping  (or, as CDATA: <![CDATA[Price < $10 & free shipping]]>)",
    },
    "mistakes": [
        "A `CDATA` section cannot contain the literal sequence `]]>` — if your content includes that exact sequence, standard entity-escaping must be used instead.",
    ],
},
"xsd-validator": {
    "what": "Checks a real XML document against its XSD schema and reports every place the document breaks the schema's rules — a missing required field, a value in the wrong format, an element in the wrong order — before you send that document to a system that will reject it outright.",
    "who": [
        "You're about to submit an XML file to a government, banking, or partner system that enforces a strict schema.",
        "You're debugging why an XML file that \"looks fine\" is being rejected by a downstream system.",
    ],
    "example": {
        "scenario": "Validating a document missing a required field:",
        "input": "XML missing the required <total> element defined in the XSD",
        "output": "❌ Error: Element 'order' is missing required child element 'total' (line 2).",
    },
    "mistakes": [
        "Make sure you're validating against the correct version of the schema — schemas evolve over time, and validating against an outdated XSD gives misleading results.",
    ],
},
"xslt-transformer": {
    "what": "XSLT is a language for transforming one XML document into a different XML (or HTML, or text) document, using a separate \"stylesheet\" of rules. This tool runs a real XSLT transformation (1.0/2.0) against your source XML and stylesheet, showing you the transformed output live, without needing to install any XML tooling — including ready-made presets for converting EDI-flavored XML.",
    "who": [
        "You're building or debugging a data mapping between two XML formats (e.g. converting a partner's XML invoice into your internal format).",
        "You want to render an XML document as human-readable HTML using an XSLT stylesheet.",
    ],
    "example": {
        "scenario": "Transforming an order into a simple HTML summary:",
        "input": "XML: <order><id>1001</id></order>  +  an XSLT template that outputs <p>Order #<value-of select=\"id\"/></p>",
        "output": "<p>Order #1001</p>",
    },
    "mistakes": [
        "XSLT 1.0 and 2.0 support different functions — a stylesheet written for 2.0 (like string manipulation functions) will fail or behave differently under a 1.0-only processor. Confirm which version your production pipeline actually uses.",
    ],
},
})

TOOL_CONTENT.update({
"uuid-generator": {
    "what": "A UUID (Universally Unique Identifier) is a 36-character random ID (like `550e8400-e29b-41d4-a716-446655440000`) that's practically guaranteed to never collide with another UUID generated anywhere else in the world — no central registry needed. This tool generates one or many UUIDs instantly, in the standard version-4 (random) format.",
    "who": [
        "You need a unique ID for a new database record, test user, or API key while prototyping.",
        "You're writing test data and need several guaranteed-unique identifiers quickly.",
    ],
    "example": {
        "scenario": "Generating a single UUID:",
        "input": "(click Generate)",
        "output": "550e8400-e29b-41d4-a716-446655440000",
    },
    "mistakes": [
        "UUIDs are for uniqueness, not security — don't use a UUID alone as a secret password-reset token or authentication credential unless it's paired with proper access controls.",
    ],
},
"qr-generator": {
    "what": "Turns text — a URL, a Wi-Fi password, contact info, plain text — into a scannable QR code image that any phone camera can read, with adjustable size and (in supporting versions) color.",
    "who": [
        "You want to share a link, menu, or contact card that people can scan instead of typing.",
        "You're adding a QR code to printed materials (flyers, business cards, packaging).",
    ],
    "example": {
        "scenario": "Creating a QR code for a website link:",
        "input": "https://example.com",
        "output": "A downloadable QR code image that opens example.com when scanned.",
    },
    "mistakes": [
        "Very long text (like a huge URL with tracking parameters) creates a denser, harder-to-scan QR code — shorten the link first if possible.",
        "Low contrast colors (light gray on white) make QR codes unreliable to scan — stick to strong contrast unless you've tested the specific combination.",
    ],
},
"password-generator": {
    "what": "Generates strong, random passwords with configurable length and character sets (uppercase, lowercase, numbers, symbols), so you're not tempted to reuse a weak, memorable password across accounts.",
    "who": [
        "You're creating a new account and want a strong, unique password instead of typing one from memory.",
        "You're setting up a shared service account or API key and need a random secret.",
    ],
    "example": {
        "scenario": "Generating a 16-character password with symbols:",
        "input": "Length: 16, include: uppercase, lowercase, numbers, symbols",
        "output": "xQ7#mK2$pL9@vR4!",
    },
    "mistakes": [
        "Always use a password manager to store generated passwords — a random string like this is not meant to be memorized or reused across sites.",
        "Some sites restrict which symbols are allowed — if a generated password is rejected, regenerate with a narrower symbol set.",
    ],
},
"lorem-ipsum": {
    "what": "Generates placeholder \"greeking\" text (the classic `Lorem ipsum dolor sit amet...`) in however many words, sentences, or paragraphs you need, so you can mock up a design or document layout before the real content is ready.",
    "who": [
        "You're designing a webpage or document layout and need filler text so it doesn't look empty.",
        "You're testing how a UI handles long vs. short text content.",
    ],
    "example": {
        "scenario": "Generating 2 sentences of placeholder text:",
        "input": "2 sentences",
        "output": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    "mistakes": [
        "Don't forget to replace ALL placeholder text before publishing — it's a classic and embarrassing mistake to ship a page with leftover Lorem Ipsum.",
    ],
},
"color-converter": {
    "what": "Colors in web design can be written many different ways — HEX (`#3B82F6`), RGB (`rgb(59,130,246)`), HSL (`hsl(217,91%,60%)`), and more. This tool converts one color format into all the others instantly, and usually shows a live color preview swatch.",
    "who": [
        "A designer gave you a color as HSL but your CSS framework needs HEX.",
        "You're picking a color and want to see it and fine-tune it across multiple formats at once.",
    ],
    "example": {
        "scenario": "Converting a hex color:",
        "input": "#3B82F6",
        "output": "RGB: rgb(59, 130, 246)  |  HSL: hsl(217, 91%, 60%)",
    },
    "mistakes": [
        "HEX colors can be written with 3, 4, 6, or 8 digits (the last two adding transparency) — make sure you're pasting the intended full form.",
    ],
},
"timestamp": {
    "what": "A Unix timestamp is the number of seconds (or milliseconds) since January 1, 1970 — the way computers usually store dates and times internally. This tool converts a timestamp into a human-readable date/time (in your timezone or UTC), and can also go the other way: turn a chosen date into its timestamp number.",
    "who": [
        "You see a raw number like `1717027200` in a log file or database and need to know what actual date/time it represents.",
        "You're writing an API call or script and need the exact timestamp value for a specific date.",
    ],
    "example": {
        "scenario": "Converting a Unix timestamp to a readable date:",
        "input": "1717027200",
        "output": "Wednesday, May 29, 2024, 8:00:00 PM UTC",
    },
    "mistakes": [
        "Confusing seconds vs. milliseconds is the most common mistake — a JavaScript `Date.now()` timestamp has 13 digits (milliseconds), while many APIs use 10-digit second-based timestamps.",
    ],
},
"cron-expression": {
    "what": "Cron expressions (like `0 9 * * 1-5`) schedule recurring tasks but are notoriously cryptic to read. This tool takes a cron expression and translates it into a plain-English sentence (\"At 09:00, Monday through Friday\"), and shows the next several times it will actually run.",
    "who": [
        "You inherited a scheduled job with a cron expression and need to understand exactly when it runs.",
        "You're writing a new scheduled task and want to build the cron expression by describing the schedule instead of memorizing the syntax.",
    ],
    "example": {
        "scenario": "Explaining a cron expression:",
        "input": "0 9 * * 1-5",
        "output": "Runs at 9:00 AM, Monday through Friday. Next run: tomorrow at 9:00 AM (if it's a weekday).",
    },
    "mistakes": [
        "Some cron implementations count days-of-week starting at 0=Sunday, others start differently, and some systems (like Quartz) add a seconds field — double check which \"flavor\" of cron your specific scheduler uses.",
    ],
},
"slugify": {
    "what": "A \"slug\" is the URL-friendly version of a title — lowercase, spaces replaced with hyphens, special characters removed (e.g. \"Hello, World!\" becomes \"hello-world\"). This tool converts any text into a clean slug ready to use in a URL.",
    "who": [
        "You're publishing a blog post or product page and need a clean URL from its title.",
        "You're generating file names or IDs from user-entered titles and need them to be safe and consistent.",
    ],
    "example": {
        "scenario": "Slugifying a blog post title:",
        "input": "10 Tips for Better API Design!",
        "output": "10-tips-for-better-api-design",
    },
    "mistakes": [
        "Titles that only differ by punctuation or casing (\"API Design\" vs \"api design!\") can produce the same slug — check for duplicate slugs if you're generating many at once.",
    ],
},
"http-status-codes": {
    "what": "A quick, searchable reference for what every HTTP status code means (200, 301, 404, 500, and dozens more) — including the official name, a plain-English explanation, and when it's typically returned, so you don't have to guess or search the web mid-debug.",
    "who": [
        "You're debugging an API call that returned a status code you don't immediately recognize.",
        "You're writing API documentation and need the exact standard wording for a status code.",
    ],
    "example": {
        "scenario": "Looking up a status code:",
        "input": "429",
        "output": "429 Too Many Requests — the client has sent too many requests in a given amount of time (\"rate limited\"). Typically resolved by waiting and retrying.",
    },
    "mistakes": [
        "Some APIs use status codes in non-standard ways (like returning 200 with an error message in the body) — always check the specific API's documentation, not just the generic meaning.",
    ],
},
"mock-json-generator": {
    "what": "Lets you define a custom data schema (field names and types — like `name: string`, `age: number`, `email: email`) and instantly generates many rows of realistic-looking fake data matching that schema, exportable as JSON, CSV, or ready-to-run SQL INSERT statements.",
    "who": [
        "You're building a UI and need realistic sample data before the real backend/API exists.",
        "You need to seed a test database with many rows of fake but structurally-correct data.",
    ],
    "example": {
        "scenario": "Generating 3 fake user records:",
        "input": "Schema: name (full name), email (email), age (number 18-65). Rows: 3",
        "output": '[{"name":"Priya Nair","email":"priya.nair@example.com","age":34}, ... ]',
    },
    "mistakes": [
        "Generated data is fake and random — never use it as if it were real production or customer data, and don't assume it covers every edge case (like unusual Unicode names) your real system will encounter.",
    ],
},
"markdown-preview": {
    "what": "A live, side-by-side Markdown editor: type or paste Markdown on one side and see the fully rendered result (headings, bold text, lists, links) update instantly on the other, along with a running word count.",
    "who": [
        "You're writing a README, blog post, or documentation page in Markdown and want to see how it will actually look.",
        "You want to quickly check whether your Markdown syntax (like a table or nested list) is formatted correctly before publishing.",
    ],
    "example": {
        "scenario": "Previewing a short Markdown snippet:",
        "input": "## Getting Started\\n\\n1. Install the package\\n2. Run `npm start`",
        "output": "A rendered preview showing a proper heading and a numbered list with 'npm start' displayed in code formatting.",
    },
    "mistakes": [
        "Preview rendering can vary slightly between tools/platforms (GitHub vs. a blog CMS vs. this tool) — always double check final rendering on the actual destination platform for anything complex.",
    ],
},
})

TOOL_CONTENT.update({
"text-tools": {
    "what": "A single workbench of small text utilities bundled together: paste any block of text and instantly get word/character/line/sentence counts, plus one-click cleanup actions — remove duplicate lines, remove blank lines, collapse extra spaces, sort lines alphabetically, or reverse the line order.",
    "who": [
        "You're checking whether an essay, tweet, or form field fits a word/character limit.",
        "You have a messy list (like an email list or a log file) with duplicate or blank lines you need cleaned up before using it.",
        "You want to alphabetize a list of items pasted from somewhere else.",
    ],
    "example": {
        "scenario": "Cleaning up a messy list of items — removing duplicates and blank lines, then sorting:",
        "input": "banana\\n\\napple\\nbanana\\ncherry\\n\\napple",
        "output": "apple\\nbanana\\ncherry  (duplicates and blank lines removed, then sorted alphabetically)",
    },
    "mistakes": [
        "'Remove duplicate lines' compares lines exactly, including capitalization and trailing spaces — \"Apple\" and \"apple\" are treated as different lines unless you also clean up casing/spacing first.",
        "Word count for languages that don't use spaces between words (like Japanese or Chinese) may not match what you'd expect from a space-based word counter — character count is usually more meaningful for those languages.",
    ],
    "extra_sections": [
        (
            "🔧 The individual tools inside this workbench",
            (
                "- **Word Counter** — total word count, useful for essays, meta descriptions, or tweet-length limits.\n"
                "- **Character Counter** — total characters, with and without spaces.\n"
                "- **Line Counter** — how many lines the text contains.\n"
                "- **Sentence Counter** — an estimate of how many sentences the text contains (based on `.`, `!`, `?`).\n"
                "- **Remove Duplicate Lines** — keeps only the first occurrence of each unique line.\n"
                "- **Remove Empty Lines** — strips out blank lines, useful for cleaning pasted lists.\n"
                "- **Remove Extra Spaces** — collapses multiple spaces/tabs into a single space.\n"
                "- **Sort Lines Alphabetically** — reorders lines A→Z (or Z→A).\n"
                "- **Reverse Line Order** — flips the order of all lines, first-to-last."
            ),
        ),
    ],
},
})

TOOL_CONTENT.update({
"edi-message-gateway": {
    "what": "This is the flagship, all-in-one EDI workspace — a two-lane pipeline that mirrors how a real integration works. The **Inbound** lane takes a raw EDI message you (or a trading partner) received, decodes its segments, validates it, and transforms it into a clean JSON/CSV \"canonical\" model you can actually work with. The **Outbound** lane does the reverse: starting from your own JSON/canonical data, it maps and generates a properly formatted, standards-compliant EDI message ready to send to a partner.",
    "who": [
        "You're building or testing an integration between your internal systems and a trading partner's EDI feed, and want to simulate both directions without touching production.",
        "You received a raw EDI file and need to quickly see it as readable JSON, or vice versa.",
        "You're training a new team member on how an EDI pipeline actually flows from raw text to structured data and back.",
    ],
    "example": {
        "scenario": "Inbound: pasting a raw purchase order and getting structured, readable data:",
        "input": "ISA*00*...*~GS*PO*...~ST*850*0001~BEG*00*NE*PO123456**20260301~N1*ST*Acme Corp~PO1*1*10*EA*25.00**VN*SKU-100~SE*5*0001~GE*1*1~IEA*1*000000001~",
        "output": "A segment tree (ISA → GS → ST 850 → BEG, N1, PO1 → SE) plus a generated JSON object like {\"poNumber\":\"PO123456\",\"shipTo\":\"Acme Corp\",\"lines\":[{\"qty\":10,\"unitPrice\":25.00,\"sku\":\"SKU-100\"}]}",
    },
    "mistakes": [
        "Choosing the wrong lane: use Inbound when you HAVE raw EDI text and want to understand/convert it; use Outbound when you have your own data and need to PRODUCE EDI text.",
        "Auto-detected delimiters (segment terminator, element separator) are usually correct, but always double-check them against the ISA header if the parsed output looks scrambled — a wrong delimiter guess is the #1 cause of a garbled parse.",
        "This tool is for building, testing, and understanding messages locally — it does not itself transmit anything to a real trading partner; you still need your AS2/SFTP/VAN connection for that (see the AS2 Tools page).",
    ],
},
"edi-formatter": {
    "what": "Raw EDI text is a single dense line of segments separated by tilde (`~`) or newline characters, with elements inside each segment separated by asterisks (`*`) — nearly impossible to read by eye. This tool reformats that single line into one segment per line, clearly indented, so a human can actually follow the document's structure without a specialized EDI viewer.",
    "who": [
        "You received a raw .edi/.x12 file from a partner and it's all on one line — you just want to read it.",
        "You're comparing a formatted example from documentation against your own raw file.",
    ],
    "example": {
        "scenario": "Formatting a compact X12 message:",
        "input": "ISA*00*...~GS*PO*SENDER*RECEIVER*20260301*1200*1*X*004010~ST*850*0001~BEG*00*NE*PO123456~SE*2*0001~GE*1*1~IEA*1*000000001~",
        "output": (
            "ISA*00*...\n"
            "GS*PO*SENDER*RECEIVER*20260301*1200*1*X*004010\n"
            "ST*850*0001\n"
            "BEG*00*NE*PO123456\n"
            "SE*2*0001\n"
            "GE*1*1\n"
            "IEA*1*000000001"
        ),
    },
    "mistakes": [
        "Formatting only changes how the message looks — it doesn't validate the content is correct EDI (use the EDI Syntax & Envelope Validator for that).",
    ],
},
"edi-schema-viewer": {
    "what": "EDI standards (X12, EDIFACT) define exactly which segments and elements are allowed inside each transaction type (like an 850 Purchase Order or an 856 Advance Ship Notice), and what each individual code means (e.g. element `BEG02` = 'Purchase Order Type Code', where value `NE` means 'New Order'). This tool is a searchable, hierarchical browser of that entire rulebook — pick a transaction set and drill down into its segments, loops, and element definitions.",
    "who": [
        "You're mapping a new transaction type and need to know what each segment/element actually represents.",
        "You're reading a raw EDI file and want to look up what an unfamiliar code (like a qualifier value) means.",
    ],
    "example": {
        "scenario": "Looking up what the BEG segment means in an 850 Purchase Order:",
        "input": "Transaction: 850, Segment: BEG",
        "output": "BEG — Beginning Segment for Purchase Order. BEG01: Transaction Set Purpose Code (00=Original). BEG02: Purchase Order Type Code (NE=New Order, CN=Change...). BEG03: Purchase Order Number.",
    },
    "mistakes": [
        "Real trading partners often customize the 'standard' in their own implementation guide — always cross-check this general reference against your specific partner's implementation guide before finalizing a mapping.",
    ],
},
"edi-segment-viewer": {
    "what": "A lighter, focused companion to the Schema Viewer: paste a real EDI message and it breaks the message down segment by segment, labeling each one (ISA, GS, ST, BEG, N1, PO1, SE, GE, IEA...) with a plain-English description of its purpose, right next to your actual data.",
    "who": [
        "You're new to EDI and want to understand what each line of a real message you're looking at actually means.",
        "You're debugging a specific message and want quick, inline labels rather than switching to a separate reference page.",
    ],
    "example": {
        "scenario": "Viewing a segment from a real message:",
        "input": "N1*ST*Acme Corp*92*12345",
        "output": "N1 = Name segment. N101 'ST' = Ship To entity code. N102 = Name ('Acme Corp'). N103 '92' = Identification Code Qualifier (Assigned by Buyer). N104 = the actual ID '12345'.",
    },
    "mistakes": [
        "Qualifier codes (like the '92' above) can mean different things depending on which segment they appear in — always read the segment ID together with its position, not the qualifier value alone.",
    ],
},
"edi-to-json": {
    "what": "Converts a raw EDI message directly into a structured JSON object — decoding the envelope (ISA/GS/ST), segments, and elements into readable, nested key-value data that any modern application, script, or API can consume without needing a dedicated EDI parsing library.",
    "who": [
        "You're building an integration where your app speaks JSON but your trading partner only sends EDI.",
        "You want to quickly inspect or log an EDI message's content in a JSON viewer or a script.",
    ],
    "example": {
        "scenario": "Converting a minimal purchase order to JSON:",
        "input": "ST*850*0001~BEG*00*NE*PO123456~SE*2*0001~",
        "output": '{\n  "transactionSet": "850",\n  "controlNumber": "0001",\n  "purchaseOrderNumber": "PO123456",\n  "purchaseOrderTypeCode": "NE"\n}',
    },
    "mistakes": [
        "The generated JSON's field names are this tool's own interpretation of the EDI structure — if you're feeding this into another system, confirm the field names match what that system actually expects, or use it as a first draft to hand-adjust.",
    ],
},
"json-to-edi": {
    "what": "The reverse of EDI to JSON: provide a JSON object describing your business data (like a purchase order), and this tool maps and assembles it into a properly formatted, standards-compliant EDI message with correct segment order and envelope wrapping (ISA/GS/ST...SE/GE/IEA).",
    "who": [
        "Your internal system produces JSON, but a trading partner requires EDI files — you need a way to generate valid EDI output.",
        "You're testing an EDI-receiving system and need to quickly generate sample messages from simple JSON input.",
    ],
    "example": {
        "scenario": "Generating an 850 Purchase Order from JSON:",
        "input": '{"transactionSet":"850","poNumber":"PO123456","poType":"NE"}',
        "output": "ST*850*0001~BEG*00*NE*PO123456~SE*2*0001~",
    },
    "mistakes": [
        "A real trading partner's EDI usually requires many more required segments (N1 for addresses, dates, line items) than a minimal example — check their implementation guide for the full required segment list before sending live.",
    ],
},
"edi-validator": {
    "what": "Checks a raw EDI message's structural integrity: does the envelope open and close correctly (ISA...IEA, GS...GE, ST...SE), do the control numbers match between the opening and closing segments, are segment terminators and element separators used consistently, and are required segments present. It reports every rule violation with a clear description.",
    "who": [
        "You're about to send an EDI file to a trading partner and want to catch envelope errors before they reject the transmission.",
        "A partner rejected your file and you need to quickly pinpoint exactly which control number or segment is wrong.",
    ],
    "example": {
        "scenario": "Validating a message with mismatched control numbers:",
        "input": "ISA...*000000001~ ... IEA*1*000000002~ (ISA control number 000000001 doesn't match IEA's 000000002)",
        "output": "❌ Error: ISA13 control number '000000001' does not match IEA02 '000000002' — envelope control numbers must match exactly.",
    },
    "mistakes": [
        "This validates general X12/EDIFACT structural rules — it does not know your specific trading partner's custom implementation guide requirements (like which fields they made mandatory beyond the standard).",
    ],
},
"edi-997-generator": {
    "what": "A 997 (Functional Acknowledgment) — or CONTRL in EDIFACT — is the formal \"receipt\" one company's system sends back after receiving an EDI message, confirming whether it was structurally accepted or rejected. This tool reads an inbound EDI message and generates the correct matching 997/CONTRL acknowledgment for it automatically, instead of you constructing one by hand.",
    "who": [
        "You're building an integration and need to simulate sending back a proper 997 acknowledgment after receiving a message.",
        "You want to understand what a 997 you received actually means (accepted, accepted with errors, or rejected).",
    ],
    "example": {
        "scenario": "Generating an acknowledgment for a received 850:",
        "input": "A valid inbound 850 Purchase Order message with GS control number 1 and ST control number 0001",
        "output": "A 997 message referencing the same functional group and transaction control numbers, reporting 'Accepted' (AK9 segment code 'A').",
    },
    "mistakes": [
        "A 997 only confirms the message was structurally readable — it does NOT mean the business content was correct or that the order will actually be fulfilled; that's a separate business-level response.",
    ],
},
"edi-sample-generator": {
    "what": "Generates ready-to-use, realistic sample EDI messages for common transaction sets (850 Purchase Order, 810 Invoice, 856 Advance Ship Notice, 855 PO Acknowledgment, and more) — useful as a starting template, a test fixture, or a learning example, instead of writing one from a blank page.",
    "who": [
        "You're building a parser or integration and need realistic test data for several transaction types.",
        "You're learning EDI and want to see what a real 850 or 810 actually looks like end-to-end.",
    ],
    "example": {
        "scenario": "Generating a sample 856 Advance Ship Notice:",
        "input": "Transaction type: 856",
        "output": "A complete, correctly-enveloped 856 message with BSN (shipment info), HL loops (shipment/order/item hierarchy), and TD1/TD5 (carrier details) segments filled with realistic placeholder data.",
    },
    "mistakes": [
        "Generated samples use the general X12/EDIFACT standard structure — a specific trading partner may require additional custom segments not present in the generic sample.",
    ],
},
"edi-delimiter-converter": {
    "what": "Different EDI systems (or even different versions of the same system) sometimes use different characters as the segment terminator (`~`, newline) or element separator (`*`, `|`, `^`). This tool rewrites an entire EDI message to swap one set of delimiters for another, without touching the actual data inside.",
    "who": [
        "A trading partner's system requires a different delimiter set than what your file currently uses.",
        "You're normalizing files from multiple partners (who each use slightly different delimiters) into one consistent format for internal processing.",
    ],
    "example": {
        "scenario": "Converting from tilde/asterisk delimiters to pipe/caret:",
        "input": "ST*850*0001~BEG*00*NE*PO123456~SE*2*0001~",
        "output": "ST^850^0001|BEG^00^NE^PO123456|SE^2^0001|",
    },
    "mistakes": [
        "If any data value inside the message happens to contain the new delimiter character you're switching to, it must be escaped or replaced first — otherwise the converted message will parse incorrectly.",
    ],
},
"edi-csv-converter": {
    "what": "Converts raw EDI messages into a flat, spreadsheet-friendly CSV table (one row per segment, or a smart summary table for common transaction types with recognized fields like PO number, line items, and quantities), and can also generate EDI from a correctly-shaped CSV going the other way.",
    "who": [
        "A business user (not a developer) needs to review EDI order data in Excel instead of raw text.",
        "You're bulk-loading many historical EDI messages into a spreadsheet for reporting or auditing.",
    ],
    "example": {
        "scenario": "Converting a purchase order's line items into a CSV table:",
        "input": "PO1*1*10*EA*25.00**VN*SKU-100~PO1*2*5*EA*12.50**VN*SKU-200~",
        "output": "Line,Qty,Unit,Price,SKU\\n1,10,EA,25.00,SKU-100\\n2,5,EA,12.50,SKU-200",
    },
    "mistakes": [
        "A single flat CSV row struggles to represent deeply nested EDI structures (like multiple loops within loops) — the 'raw segment matrix' export mode preserves everything exactly, while the 'smart summary' mode is easier to read but only recognizes common fields.",
    ],
},
"edi-hipaa-sanitizer": {
    "what": "Healthcare EDI transactions (like an 834 enrollment file or 837 claim) contain real Protected Health Information (PHI) — patient names, birth dates, member IDs, SSNs, addresses. This tool automatically finds those specific fields in a message and replaces them with realistic but fake substitute values, following the HIPAA Safe Harbor de-identification standard (45 CFR § 164.514(b)) — so you can safely share, test with, or store the file without exposing real patient data.",
    "who": [
        "You need to share a real production EDI healthcare file with a QA team, a vendor, or a support ticket, without exposing real patient information.",
        "You're building test fixtures from real transaction shapes but need them scrubbed of any actual PHI before they can live in a shared repository.",
    ],
    "example": {
        "scenario": "Sanitizing a segment containing a patient's real name and date of birth:",
        "input": "NM1*IL*1*SMITH*JOHN*A~DMG*D8*19850101",
        "output": "NM1*IL*1*DOE*JANE*X~DMG*D8*19850101  (name replaced with a synthetic name; a safe static test DOB is used consistently)",
    },
    "mistakes": [
        "Always review the specific toggles (patient names, DOB, addresses, member IDs, claim IDs, provider NPIs, contact info) to make sure every category relevant to your file is switched on — an off-by-default toggle could leave a PHI field untouched.",
        "This tool is a strong first pass, but for anything going into a regulated production audit, have a compliance/privacy officer confirm the sanitized output meets your organization's specific policy before wider distribution.",
    ],
},
"edi-batch-splitter": {
    "what": "A single EDI file transmission can contain many individual transactions bundled together (multiple ST...SE transaction sets inside one interchange). This tool splits a large batch file into separate, individually valid files — one per transaction, or grouped/chunked in configurable batches — and can also do the reverse: join many individual transaction files back into one combined batch for transmission.",
    "who": [
        "You received one giant EDI file containing hundreds of individual orders and need to process them one at a time.",
        "You have many small EDI files ready to send and need to combine them into fewer, larger transmissions for efficiency.",
    ],
    "example": {
        "scenario": "Splitting a batch of 3 purchase orders into individual files:",
        "input": "One interchange containing three ST*850...SE blocks (PO123, PO124, PO125)",
        "output": "Three separate, individually enveloped files: PO123.edi, PO124.edi, PO125.edi — each independently valid and identifiable by its PO number.",
    },
    "mistakes": [
        "When splitting, remember each individual output file still needs a valid envelope (ISA/GS...GE/IEA) of its own to be usable standalone — this tool handles that automatically, but double-check if you're scripting around it.",
    ],
},
"edi-diff-compare": {
    "what": "A specialized diff for EDI messages that understands their structure, not just raw text lines: it aligns segments by their meaning (like matching up the same `PO1` line item across two versions even if it moved position), automatically ignores \"volatile\" noise fields that always change between messages (control numbers, timestamps), and highlights only the segments and elements that meaningfully changed.",
    "who": [
        "You're debugging why a re-sent EDI message is being treated as different from the original by a partner's system.",
        "You want to compare two versions of a purchase order (like an original vs. a change order) and see exactly what changed in the business data, not just the changed control numbers.",
    ],
    "example": {
        "scenario": "Comparing an original PO and a corrected version:",
        "input": "Doc A: PO1*1*10*EA*25.00  |  Doc B: PO1*1*12*EA*25.00 (quantity changed from 10 to 12)",
        "output": "PO1 segment flagged as modified: element 2 (quantity) changed 10 → 12. Control numbers and dates are automatically masked/ignored as non-meaningful.",
    },
    "mistakes": [
        "A plain text diff of two EDI messages (like the general Diff Checker tool) would flag every line as changed just because control numbers differ — use this EDI-specific diff instead when comparing real transaction content.",
    ],
},
"as2-tools": {
    "what": "AS2 is the standard secure protocol most EDI trading partners use to actually transmit files to each other over the internet (with encryption, digital signatures, and MDN receipts). This tool suite lets you build and inspect AS2 messages: encode a payload into an AS2 message (with simulated signing/encryption), decode a received AS2 message back to its original content, and generate a matching MDN (Message Disposition Notification) — the AS2 equivalent of a delivery receipt.",
    "who": [
        "You're setting up a new AS2 connection with a trading partner and want to understand the message format before configuring your real AS2 software (like Mendelson, IBM Sterling, or Cleo).",
        "You're troubleshooting why a partner says they never received your AS2 transmission, and want to inspect the MDN receipt you got back.",
    ],
    "example": {
        "scenario": "Generating an MDN acknowledging successful receipt of a message:",
        "input": "A received AS2 message with Message-ID <20260301120000@yourcompany.com>",
        "output": "An MDN referencing that same Message-ID with a disposition of 'automatic-action/MDN-sent-automatically; processed', confirming successful receipt.",
    },
    "mistakes": [
        "This tool simulates AS2 message structure for learning, testing, and troubleshooting — it does not replace a real, certified AS2 connector for actual production transmission (real AS2 requires exchanging live certificates with your trading partner).",
    ],
},
"gs1-sscc-label-generator": {
    "what": "GS1-128 and SSCC-18 are the barcode standards printed on shipping labels and pallets worldwide — the SSCC-18 (Serial Shipping Container Code) is an 18-digit number that uniquely identifies one specific physical shipment/pallet, encoded into a GS1-128 barcode alongside other data (like quantity, batch number, or ship date) using standardized \"Application Identifiers\" (AIs). This tool generates a valid SSCC-18 (including the correct check digit) and renders the corresponding scannable GS1-128 barcode label.",
    "who": [
        "You're preparing shipping/pallet labels for a warehouse or logistics partner that requires GS1-128 compliant barcodes.",
        "You need to generate a valid SSCC-18 number with a correctly calculated check digit for a shipment.",
    ],
    "example": {
        "scenario": "Generating an SSCC-18 for a pallet shipment:",
        "input": "Extension digit: 3, Company prefix: 0614141, Serial reference: 12345678",
        "output": "SSCC-18: 300614141123456785 (last digit is the calculated check digit), rendered as a scannable GS1-128 barcode with AI (00).",
    },
    "mistakes": [
        "The check digit is calculated, not chosen — if you're hand-typing an SSCC-18 elsewhere and it doesn't match what this tool generates, double check you copied every digit exactly, since a single wrong digit produces an invalid code.",
    ],
},
"edi-lifecycle-reconciliation": {
    "what": "A real purchase order isn't a single EDI message — it's a lifecycle: an 850 (order) is sent, an 855 (acknowledgment) comes back, an 856 (shipping notice) follows, and an 810 (invoice) closes it out. This tool takes multiple related EDI messages that share the same PO number and lines them up on one timeline/view, so you can see the full order lifecycle and immediately spot where something is missing, delayed, or mismatched (like an invoiced quantity that doesn't match what was actually shipped).",
    "who": [
        "You're auditing whether every order has been fully acknowledged, shipped, and invoiced correctly.",
        "A customer disputes an invoice and you need to quickly reconstruct the full order-to-invoice trail for that PO number.",
    ],
    "example": {
        "scenario": "Reconciling an order's lifecycle:",
        "input": "An 850 for PO123456 (qty 100), an 856 shipping 100 units, and an 810 invoicing 90 units",
        "output": "A lifecycle view showing Ordered: 100 → Shipped: 100 → Invoiced: 90, with a ⚠️ flag on the 10-unit shipped/invoiced quantity mismatch.",
    },
    "mistakes": [
        "Reconciliation depends on the PO number (and other reference IDs) being consistent across all related messages — if a partner changes or reformats the PO number between documents, the messages won't automatically link up.",
    ],
},
})

# ---------------------------------------------------------------------------
# Overrides for tools whose src/data/toolMetadata.json entry is generic/missing
# ---------------------------------------------------------------------------
# NOTE: 13 of the 17 EDI tools share one identical, copy-pasted "features"/
# "howToUse" block in toolMetadata.json (a bug in that file's own generator —
# it looks like a category-level fallback leaked into per-tool entries). 5
# other tools (mostly the newest EDI additions) have no metadata entry at
# all yet. Rather than publish that inaccurate/missing copy, every tool below
# gets accurate, tool-specific bullets instead. If a future run of
# scripts/generate-metadata.mjs fixes the root metadata, these overrides can
# be safely deleted and the tool will fall back to the (now-correct) metadata.

_EDI_OVERRIDES = {
    "edi-formatter": {
        "features": [
            "Reformats a single-line raw EDI transaction into one segment per line.",
            "Auto-detects the segment terminator (~ or newline) and element separator (*).",
            "Works with both ANSI ASC X12 and EDIFACT messages.",
            "100% client-side — no EDI content is ever uploaded.",
        ],
        "how_to": [
            "Paste your raw, single-line EDI message into the input box.",
            "The tool detects delimiters automatically and reformats the message, one segment per line.",
            "Review the readable output, or switch to the raw view to copy the original delimiters back.",
            "Copy the formatted result for documentation or code review.",
        ],
    },
    "edi-schema-viewer": {
        "features": [
            "Searchable, hierarchical browser of X12 and EDIFACT transaction set definitions.",
            "Drill down from a transaction set (e.g. 850) into its segments, loops, and individual elements.",
            "Plain-English descriptions and common code/qualifier values for each element.",
            "Covers multiple standard versions (e.g. X12 4010/5010, EDIFACT D96A/D01B).",
        ],
        "how_to": [
            "Pick a transaction set (e.g. 850, 810, 856) or EDIFACT message (e.g. ORDERS).",
            "Browse or search its segment list.",
            "Click a segment to expand its elements and see plain-English definitions and common codes.",
            "Use this alongside a real message in the EDI Segment Viewer to look up unfamiliar codes.",
        ],
    },
    "edi-segment-viewer": {
        "features": [
            "Paste a real EDI message and see every segment labeled in plain English inline.",
            "Highlights the envelope structure (ISA/GS/ST ... SE/GE/IEA) alongside business segments.",
            "No need to memorize segment codes — definitions appear next to your actual data.",
        ],
        "how_to": [
            "Paste your raw EDI message into the workspace.",
            "The tool splits it into segments and labels each one with its name and purpose.",
            "Click any segment to see element-by-element definitions for that specific line.",
            "Use this to quickly orient yourself in an unfamiliar message.",
        ],
    },
    "edi-to-json": {
        "features": [
            "Decodes the ISA/GS/ST envelope and every segment/element into nested JSON.",
            "Supports common X12 transaction sets (850, 810, 856, 855, 834, 837, and more) and EDIFACT.",
            "One-click copy or download of the generated JSON.",
        ],
        "how_to": [
            "Paste your raw EDI message into the input panel.",
            "The tool parses the envelope and segments and generates a structured JSON object on the right.",
            "Adjust field-naming options if available, to match your target system's expected shape.",
            "Copy or download the JSON output.",
        ],
    },
    "edi-validator": {
        "features": [
            "Checks envelope integrity: matching ISA/IEA, GS/GE, and ST/SE control numbers.",
            "Flags missing required segments and out-of-sequence segments.",
            "Reports every issue with a plain-English explanation and the exact segment location.",
        ],
        "how_to": [
            "Paste the raw EDI message you want to check.",
            "Run validation and review the list of errors/warnings, each pointing to a specific segment.",
            "Fix the issues in your source system and re-paste to confirm they're resolved.",
        ],
    },
    "edi-997-generator": {
        "features": [
            "Reads an inbound X12 message and generates a matching 997 Functional Acknowledgment (or EDIFACT CONTRL).",
            "Automatically carries over the correct functional group and transaction control numbers.",
            "Supports marking the acknowledgment as fully accepted, accepted-with-errors, or rejected.",
        ],
        "how_to": [
            "Paste the inbound EDI message you received (or are simulating receiving).",
            "Choose the acknowledgment status (accepted / accepted with errors / rejected).",
            "Generate the 997/CONTRL message, correctly referencing the original control numbers.",
            "Copy the acknowledgment to send back, or to test your own inbound-processing logic.",
        ],
    },
    "json-to-edi": {
        "features": [
            "Maps a JSON object describing your business document into standards-compliant EDI segments.",
            "Automatically wraps the output in a valid ISA/GS/ST ... SE/GE/IEA envelope.",
            "Supports common outbound transaction sets (e.g. 850, 810, 856).",
        ],
        "how_to": [
            "Paste JSON describing your order, invoice, or shipment data.",
            "Select the target transaction set (e.g. 850 Purchase Order).",
            "Generate the EDI output and review the segment-by-segment breakdown.",
            "Copy or download the finished EDI file.",
        ],
    },
    "edi-sample-generator": {
        "features": [
            "Generates realistic, fully-enveloped sample messages for common transaction sets.",
            "Covers 850, 810, 856, 855, 834, 837 (X12) and common EDIFACT message types.",
            "Great starting template for building test fixtures or learning message structure.",
        ],
        "how_to": [
            "Choose a transaction set (e.g. 856 Advance Ship Notice).",
            "Generate a complete sample message with realistic placeholder data.",
            "Copy the sample as a starting point, or feed it directly into another CodePackr EDI tool to explore.",
        ],
    },
    "edi-delimiter-converter": {
        "features": [
            "Rewrites segment terminators and element separators across an entire message.",
            "Supports common delimiter sets (~ * , | ^, and newline-based).",
            "Leaves the actual data untouched — only the separator characters change.",
        ],
        "how_to": [
            "Paste your EDI message and confirm its current delimiters (auto-detected).",
            "Choose the new segment terminator and element separator you need.",
            "Convert and copy the result — ready for a partner expecting different delimiters.",
        ],
    },
    "as2-tools": {
        "features": [
            "Encodes a payload into a simulated AS2 message structure with headers and MIME packaging.",
            "Decodes a received AS2 message back into its original payload for inspection.",
            "Generates matching MDN (Message Disposition Notification) receipts.",
        ],
        "how_to": [
            "Choose Encode, Decode, or Generate MDN.",
            "Paste your payload (for encoding) or your received AS2 message (for decoding).",
            "Review the resulting AS2 message structure, headers, and/or MDN receipt.",
            "Use the output to understand or troubleshoot your real AS2 connector's behavior.",
        ],
    },
    "gs1-sscc-label-generator": {
        "features": [
            "Calculates a valid SSCC-18 (Serial Shipping Container Code) including the correct check digit.",
            "Encodes the SSCC-18, plus optional GTIN, quantity, batch, and expiration data, using standard GS1 Application Identifiers.",
            "Renders a scannable GS1-128 barcode label ready to print or export.",
        ],
        "how_to": [
            "Enter your GS1 company prefix, extension digit, and serial reference.",
            "Optionally add GTIN, quantity, batch/lot number, or expiration date.",
            "Generate the SSCC-18 and its scannable GS1-128 barcode label.",
            "Download or print the label, or copy the SSCC-18 into your 856 ASN.",
        ],
    },
    "edi-lifecycle-reconciliation": {
        "features": [
            "Groups related EDI messages (850, 855, 856, 810) by shared reference numbers (like PO number).",
            "Displays the full order lifecycle on one timeline.",
            "Flags mismatches — like a shipped quantity that doesn't match the invoiced quantity.",
        ],
        "how_to": [
            "Paste in the related messages for one order (e.g. its 850, 856, and 810).",
            "The tool links them by PO number / reference ID and builds a lifecycle timeline.",
            "Review the timeline for any flagged mismatches between ordered, shipped, and invoiced quantities.",
        ],
    },
    # These 5 tools have no toolMetadata.json entry at all yet (newest additions) —
    # give them proper features/how_to instead of falling back to a generic placeholder.
    "edi-csv-converter": {
        "features": [
            "Converts raw EDI messages into a flat, spreadsheet-ready CSV table.",
            "Smart-summary mode recognizes common fields (PO number, line items, quantities) for common transaction sets.",
            "Raw segment matrix mode preserves every segment/element exactly, for lossless round-tripping.",
            "Converts a correctly-shaped CSV back into valid EDI.",
        ],
        "how_to": [
            "Paste your raw EDI message (EDI → CSV) or upload/paste a CSV table (CSV → EDI).",
            "Choose Smart Summary (readable) or Raw Segment Matrix (lossless) output mode.",
            "Review the generated table or EDI output.",
            "Copy or download the result.",
        ],
    },
    "edi-hipaa-sanitizer": {
        "features": [
            "Detects and replaces PHI fields following the HIPAA Safe Harbor standard (45 CFR § 164.514(b)).",
            "Individually toggleable rules: patient/subscriber names, birth dates, addresses, member IDs, claim IDs, provider NPIs, and contact info (phone/email).",
            "Replaces real values with realistic synthetic substitutes, preserving the message's structure.",
            "Includes preloaded sample HIPAA transactions (834, 837) to try the tool safely.",
        ],
        "how_to": [
            "Paste a real or sample healthcare EDI transaction (e.g. 834 enrollment or 837 claim).",
            "Review and toggle on every PHI category relevant to your file (names, DOB, addresses, IDs, NPIs, contacts).",
            "Run the sanitizer and review the de-identified output next to the original.",
            "Copy or download the sanitized file for safe sharing, testing, or storage.",
        ],
    },
    "edi-batch-splitter": {
        "features": [
            "Splits a multi-transaction EDI batch into individually valid, independently enveloped files.",
            "Supports splitting by transaction, by a filter query, or by grouping/chunking N transactions per file.",
            "Join mode combines many individual transaction files back into one batch transmission.",
            "Recognizes common reference identifiers (PO number, invoice number, ASN number) to help name split files.",
        ],
        "how_to": [
            "Choose Split (one big file → many) or Join (many files → one batch).",
            "For Split: paste the batch file, optionally filter or group by functional code, and set a chunk size.",
            "For Join: paste each individual transaction to combine.",
            "Review and download the resulting file(s).",
        ],
    },
    "edi-diff-compare": {
        "features": [
            "Aligns two EDI messages by semantic meaning (e.g. matching the same PO1 line item even if it moved).",
            "Automatically masks volatile, always-changing fields (control numbers, dates/timestamps) so they don't create false differences.",
            "Highlights only genuinely modified, added, or removed segments and elements.",
            "Includes preloaded sample message pairs to try the comparison instantly.",
        ],
        "how_to": [
            "Paste your first EDI message (Doc A) and the message you want to compare it to (Doc B).",
            "Run the comparison — the tool auto-aligns segments and masks volatile fields.",
            "Review the highlighted differences: added, removed, and modified segments/elements.",
            "Use the quick 'swap A/B' button to compare in the other direction if needed.",
        ],
    },
    "xslt-transformer": {
        "features": [
            "Runs real XSLT 1.0 and 2.0 transformations directly in the browser.",
            "Live preview of the transformed output as you edit the stylesheet.",
            "Includes ready-made presets for common EDI-to-XML transformation patterns.",
            "Supports XML, HTML, or plain-text output depending on your stylesheet.",
        ],
        "how_to": [
            "Paste your source XML document.",
            "Paste or write your XSLT stylesheet (or start from an EDI XML preset).",
            "Run the transformation and review the live output.",
            "Copy or download the transformed result.",
        ],
    },
}
for _tid, _ov in _EDI_OVERRIDES.items():
    TOOL_CONTENT[_tid].update(_ov)

# ---------------------------------------------------------------------------
# Rendering engine
# ---------------------------------------------------------------------------

def guess_category_faq_dupe(faqs):
    """toolMetadata FAQs share a lot of boilerplate wording across tools.
    Keep them (they are accurate) but trim to the most useful 4."""
    return faqs[:4]

def render_tool_doc(tool, meta_entry, content):
    name = tool["name"]
    cat = tool["category"]
    cat_info = CATEGORY_INFO[cat]
    tool_id = tool["id"]
    desc = tool["description"]
    keywords = tool.get("keywords", [])
    # Prefer hand-written overrides in TOOL_CONTENT (used where toolMetadata.json
    # has generic/boilerplate copy that isn't specific to this exact tool) and
    # fall back to the site's own SEO metadata otherwise.
    features = content.get("features") or (meta_entry or {}).get("features", [])
    how_to = content.get("how_to") or (meta_entry or {}).get("howToUse", [])
    faqs = guess_category_faq_dupe((meta_entry or {}).get("faqs", []))
    canonical = (meta_entry or {}).get("canonicalPath", f"/{tool_id}")

    lines = []
    lines.append(f"# {cat_info['emoji']} {name}")
    lines.append("")
    lines.append(f"> {desc}")
    lines.append("")
    lines.append(
        f"**Category:** [{cat_info['label']}](../README.md#{cat}) &nbsp;·&nbsp; "
        f"**Tool page:** `{canonical}` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; "
        f"**Data ever sent to a server:** No"
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 🧠 What is this, in plain English?")
    lines.append("")
    lines.append(content["what"])
    lines.append("")

    lines.append("## 🙋 Who is this for, and when do I need it?")
    lines.append("")
    for w in content.get("who", []):
        lines.append(f"- {w}")
    lines.append("")

    if features:
        lines.append("## ✨ What it can do")
        lines.append("")
        for f in features:
            lines.append(f"- {f}")
        lines.append("")

    lines.append(f"## 📝 Step-by-step: how to use the {name}")
    lines.append("")
    if how_to:
        for i, step in enumerate(how_to, 1):
            lines.append(f"{i}. {step}")
    else:
        lines.append("1. Open the tool page and paste or type your input into the main workspace.")
        lines.append("2. Adjust any available options for your use case.")
        lines.append("3. Review the live output panel.")
        lines.append("4. Copy or download the result.")
    lines.append("")

    ex = content.get("example")
    if ex:
        lines.append("### 💡 Worked example")
        lines.append("")
        lines.append(f"**Scenario:** {ex['scenario']}")
        lines.append("")
        lines.append("**You paste in:**")
        lines.append("```")
        lines.append(ex["input"])
        lines.append("```")
        lines.append("")
        lines.append("**You get back:**")
        lines.append("```")
        lines.append(ex["output"])
        lines.append("```")
        lines.append("")

    for title, body in content.get("extra_sections", []):
        lines.append(f"## {title}")
        lines.append("")
        lines.append(body)
        lines.append("")

    mistakes = content.get("mistakes", [])
    if mistakes:
        lines.append("## ⚠️ Common mistakes & troubleshooting")
        lines.append("")
        for m in mistakes:
            lines.append(f"- {m}")
        lines.append("")

    lines.append("## 🔒 Privacy note")
    lines.append("")
    lines.append(
        "Everything above happens locally in your browser. Whatever you paste into this tool "
        "is never uploaded, logged, or stored on a remote server — closing the tab clears it."
    )
    lines.append("")

    if faqs:
        lines.append("## ❓ Frequently asked questions")
        lines.append("")
        for f in faqs:
            lines.append(f"**{f['question']}**")
            lines.append("")
            lines.append(f"{f['answer']}")
            lines.append("")

    if keywords:
        lines.append("## 🔗 Also searchable as")
        lines.append("")
        lines.append(", ".join(f"`{k}`" for k in keywords))
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append(
        f"_Part of the [CodePackr tool documentation](../README.md). "
        f"Last generated: {TODAY}. See `.github/skills/update-tool-docs.md` for how to keep this page in sync "
        f"when the tool changes._"
    )
    return "\n".join(lines) + "\n"


def build_related_tools_note():
    pass


def main():
    tools, meta = load_data()
    os.makedirs(OUT_DIR, exist_ok=True)

    by_cat = {}
    for t in tools:
        by_cat.setdefault(t["category"], []).append(t)

    written = []
    for t in tools:
        tid = t["id"]
        cat = t["category"]
        content = TOOL_CONTENT.get(tid)
        if not content:
            print("!! missing content for", tid)
            continue
        meta_entry = meta.get(tid)
        doc = render_tool_doc(t, meta_entry, content)
        d = category_dir(cat)
        os.makedirs(d, exist_ok=True)
        path = os.path.join(d, f"{tid}.md")
        with open(path, "w") as f:
            f.write(doc)
        written.append((cat, tid, t["name"]))

    print(f"Wrote {len(written)} tool doc files.")

    readme = render_readme(by_cat)
    with open(os.path.join(OUT_DIR, "README.md"), "w") as f:
        f.write(readme)
    print("Wrote README.md index.")

    return written, by_cat

def render_readme(by_cat):
    order = ["formatters", "encoders", "validators", "converters", "image", "edi", "xml", "utilities", "text"]
    lines = []
    lines.append("# 📚 CodePackr Tool Documentation")
    lines.append("")
    lines.append(
        "Plain-English documentation and step-by-step tutorials for every tool on CodePackr. "
        "Each tool has its own page with: what it is, who it's for, a worked example, common "
        "mistakes, and FAQs — written for people who are **not** already EDI/XML/dev-tool experts."
    )
    lines.append("")
    lines.append("**New to a specialized topic? Start with these primers first:**")
    lines.append("- 📦 [EDI Basics](edi/00-edi-basics.md) — what EDI, X12, EDIFACT, segments, and envelopes actually are.")
    lines.append("- 📐 [XML/XSD Basics](xml/00-xml-basics.md) — what XML, XSD, XPath, and XSLT actually are.")
    lines.append("- 📖 [Glossary](GLOSSARY.md) — quick definitions of every term used across these docs.")
    lines.append("")
    lines.append(
        "Building or updating a tool? See [`_TEMPLATE.md`](_TEMPLATE.md) for the doc format, and "
        "[`.github/skills/update-tool-docs.md`](../../.github/skills/update-tool-docs.md) for how an AI "
        "coding agent should keep these pages in sync automatically."
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Table of contents")
    lines.append("")
    for cat in order:
        info = CATEGORY_INFO[cat]
        lines.append(f"- [{info['emoji']} {info['label']}](#{cat}) ({len(by_cat.get(cat, []))} tools)")
    lines.append("")
    lines.append("---")
    lines.append("")

    for cat in order:
        info = CATEGORY_INFO[cat]
        tools = by_cat.get(cat, [])
        lines.append(f"## {cat}")
        lines.append("")
        lines.append(f"### {info['emoji']} {info['label']}")
        lines.append("")
        lines.append(f"*{info['analogy']}*")
        lines.append("")
        if cat == "edi":
            lines.append("👉 **Start with the [EDI Basics primer](edi/00-edi-basics.md) first if you're new to EDI.**")
            lines.append("")
        if cat == "xml":
            lines.append("👉 **Start with the [XML/XSD Basics primer](xml/00-xml-basics.md) first if you're new to XML/XSD.**")
            lines.append("")
        lines.append("| Tool | Description |")
        lines.append("|------|-------------|")
        for t in tools:
            lines.append(f"| [{t['name']}]({cat}/{t['id']}.md) | {t['description']} |")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append(f"_77 tools documented · Last generated: {TODAY} · Auto-generated by `scripts/generate-tool-docs.py` from `src/data/tools.ts` + `src/data/toolMetadata.json`._")
    return "\n".join(lines) + "\n"

if __name__ == "__main__":
    main()
