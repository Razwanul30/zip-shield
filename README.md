# ZipShield

> Secure ZIP upload and extraction service with protection against ZIP bombs, path traversal, nested archives, and other archive-based security threats.

ZipShield is a security-focused backend project built with **Node.js, TypeScript, Express, Multer, and AdmZip**.

The core principle of the project is:

> **Never trust user-uploaded files.**

The goal is not simply to upload and extract ZIP files, but to build an extraction pipeline that treats every uploaded archive as potentially malicious.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Goals](#goals)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Directory Structure](#directory-structure)
- [File Responsibilities](#file-responsibilities)
- [Current Processing Flow](#current-processing-flow)
- [Security Protections](#security-protections)
- [Configuration Limits](#configuration-limits)
- [Implementation Status](#implementation-status)
- [Completed Versions](#completed-versions)
- [Current V6 Progress](#current-v6-progress)
- [Upcoming Security Roadmap](#upcoming-security-roadmap)
- [How to Run](#how-to-run)
- [API](#api)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Development Notes](#development-notes)
- [Future Improvements](#future-improvements)

---

# Project Overview

ZipShield provides an HTTP API for uploading ZIP files.

Instead of blindly extracting an uploaded archive, the application performs security checks before extraction.

High-level flow:

```text
Client
  │
  │ POST /upload
  ▼
Multer Upload Middleware
  │
  ▼
Upload Controller
  │
  ├── ZIP Inspection
  │     ├── ZIP structure
  │     ├── file count
  │     ├── extracted size
  │     ├── compression ratio
  │     ├── path traversal
  │     └── nested archive depth
  │
  ▼
Secure Extraction
  │
  ├── path validation
  ├── file count limit
  ├── extracted size limit
  └── unique extraction directory
  │
  ▼
extracted/<UUID>/
```

---

# Goals

The project is being developed as a practical backend security project.

### Primary goals

- Learn how file-upload systems work internally
- Understand archive-based attacks
- Prevent ZIP bombs
- Prevent path traversal
- Detect deeply nested archives
- Build a safer extraction pipeline
- Practice layered backend architecture
- Practice security-oriented backend development
- Keep the codebase understandable and maintainable

### Security principle

Every uploaded file should be considered **untrusted input**.

The application must validate an archive before allowing it to affect the filesystem.

---

# Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| TypeScript | Application language |
| Express | HTTP server |
| Multer | File upload handling |
| AdmZip | ZIP inspection and extraction |
| Git | Version control |
| Linux/Ubuntu | Development environment |

---

# Project Architecture

ZipShield follows a simple layered architecture:

```text
Request
   │
   ▼
Route
   │
   ▼
Middleware
   │
   ▼
Controller
   │
   ▼
Service
   │
   ├── Security validation
   ├── ZIP inspection
   └── ZIP extraction
   │
   ▼
Utils / Config
```

### Responsibility rule

Each layer should have one clear responsibility.

- **Routes** decide which endpoint handles the request.
- **Middleware** handles request-level concerns such as uploads.
- **Controllers** coordinate the request/response flow.
- **Services** contain ZIP processing and security logic.
- **Utils** contain reusable helper functions.
- **Config** contains security limits and configuration values.

Avoid turning `server.ts` or the controller into a large monolithic file.

---

# Directory Structure

```text
zip-shield/
│
├── src/
│   │
│   ├── server.ts
│   │
│   ├── routes/
│   │   └── upload.route.ts
│   │
│   ├── controllers/
│   │   └── upload.controller.ts
│   │
│   ├── middleware/
│   │   └── upload.middleware.ts
│   │
│   ├── services/
│   │   └── zip.service.ts
│   │
│   ├── utils/
│   │   └── zip.utils.ts
│   │
│   └── config/
│       └── limits.ts
│
├── uploads/
│   └── .gitkeep
│
├── extracted/
│   └── .gitkeep
│
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# File Responsibilities

## `src/server.ts`

Application entry point.

Responsibilities:

- Create Express application
- Start HTTP server
- Register routes
- Provide basic health/root endpoint

Current endpoint:

```text
GET /
```

Response:

```json
{
  "message": "ZipShield is running"
}
```

---

## `src/routes/upload.route.ts`

Defines the upload endpoint.

Current endpoint:

```text
POST /upload
```

The route connects:

```text
Multer middleware
        ↓
upload controller
```

Current request field:

```text
file
```

---

## `src/middleware/upload.middleware.ts`

Handles incoming file uploads using Multer.

Current responsibilities:

- Store uploaded files inside `uploads/`
- Accept ZIP MIME type

Current basic validation:

```text
application/zip
```

### Important future improvement

MIME type alone should not be considered trustworthy.

Magic-byte/signature validation will be strengthened as part of the security roadmap.

---

## `src/controllers/upload.controller.ts`

Coordinates the upload workflow.

Current responsibilities:

1. Check whether a file was uploaded
2. Generate a unique extraction directory
3. Inspect the ZIP
4. Extract the ZIP
5. Return inspection information
6. Remove the extraction directory if processing fails

Extraction directories are generated using UUIDs:

```text
extracted/<UUID>/
```

Example:

```text
extracted/
├── a85252c8-bf4c-4cab-86a3-b3e80d5bf6a3/
│   └── safe.txt
│
└── 6658793b-9c6c-495e-8985-110254d178f5/
    └── safe.txt
```

This prevents different uploads from sharing the same extraction directory.

---

## `src/services/zip.service.ts`

This is the main security and ZIP-processing layer.

It currently contains:

### `inspectZip()`

Inspects the archive before extraction.

Checks:

- ZIP structure
- Path safety
- File count
- Total compressed size
- Total uncompressed size
- Compression ratio
- Nested archive depth

Returns information about ZIP entries.

---

### `extractZip()`

Extracts the archive after inspection.

It performs security checks again during extraction.

Current checks:

- Path traversal protection
- File count limit
- Extracted size limit
- Safe directory creation
- Safe file writing

The duplicate path validation is intentional.

> Security checks should not rely on only one stage of the pipeline.

---

### `checkNestedArchives()`

Recursively checks whether an archive contains another ZIP archive.

It prevents excessive archive nesting.

Current maximum:

```text
3 levels
```

---

## `src/utils/zip.utils.ts`

Contains reusable ZIP security helpers.

### `isSafeZipPath()`

Prevents archive entries from escaping the extraction directory.

Example malicious path:

```text
../../evil.txt
```

The function resolves the final path and verifies that it remains inside the intended extraction directory.

---

### `isZipBuffer()`

Checks whether a buffer begins with a recognized ZIP signature.

Recognized signatures include:

```text
50 4B 03 04
50 4B 05 06
50 4B 07 08
```

This is used when detecting nested ZIP archives.

---

## `src/config/limits.ts`

Contains security limits used by the ZIP service.

Current values:

```ts
export const MAX_EXTRACTED_SIZE = 100 * 1024 * 1024;
export const MAX_FILES = 1000;
export const MAX_COMPRESSION_RATIO = 100;
export const MAX_NESTING_DEPTH = 3;
```

Meaning:

| Limit | Current value |
|---|---:|
| Maximum extracted size | 100 MB |
| Maximum files | 1000 |
| Maximum compression ratio | 100:1 |
| Maximum nesting depth | 3 |

These values are centralized so they can be changed without modifying the security logic itself.

---

# Current Processing Flow

A ZIP upload currently follows this flow:

```text
POST /upload
      │
      ▼
Multer receives file
      │
      ▼
File stored in uploads/
      │
      ▼
Controller creates UUID extraction directory
      │
      ▼
inspectZip()
      │
      ├── Check nested archives
      ├── Check entry paths
      ├── Count files
      ├── Calculate compressed size
      ├── Calculate uncompressed size
      └── Check compression ratio
      │
      ▼
If inspection passes
      │
      ▼
extractZip()
      │
      ├── Validate path again
      ├── Count extracted files
      ├── Track extracted size
      ├── Create directories
      └── Write files
      │
      ▼
Success
      │
      ▼
extracted/<UUID>/
```

If processing fails:

```text
Error
  │
  ▼
Delete current extraction directory
  │
  ▼
Return 400 ZIP rejected
```

The original uploaded ZIP currently remains in:

```text
uploads/
```

This is intentional for the current project design.

---

# Security Protections

## 1. ZIP Signature Validation

ZIP files have known magic-byte signatures.

ZipShield can identify standard ZIP signatures instead of relying exclusively on a filename extension.

Status:

```text
DONE
```

---

## 2. Maximum Extracted Size

A ZIP may be small while expanding into a very large amount of data.

Current limit:

```text
100 MB
```

If the archive exceeds this limit:

```text
ZIP exceeds maximum extracted size
```

Status:

```text
DONE
```

---

## 3. Maximum File Count

An archive containing thousands or millions of tiny files can exhaust filesystem resources.

Current limit:

```text
1000 files
```

Status:

```text
DONE
```

---

## 4. Compression Ratio Protection

A ZIP bomb can have a very high compression ratio.

Current limit:

```text
100:1
```

Conceptually:

```text
compressed size = 1 MB
uncompressed size = 200 MB

ratio = 200:1

→ REJECT
```

Status:

```text
DONE
```

---

## 5. Path Traversal Protection

Prevents malicious archive paths such as:

```text
../../evil.txt
../../../etc/passwd
folder/../../evil.txt
```

The extraction target is resolved and checked against the extraction directory.

Status:

```text
DONE
```

---

## 6. Nested Archive Protection

Prevents excessive ZIP-inside-ZIP nesting.

Current limit:

```text
MAX_NESTING_DEPTH = 3
```

Example:

```text
outer.zip
└── level1.zip
    └── level2.zip
        └── level3.zip
```

Allowed.

Further nesting:

```text
outer.zip
└── level1.zip
    └── level2.zip
        └── level3.zip
            └── level4.zip
```

Rejected.

Status:

```text
DONE
```

---

## 7. Extraction-Time Protection

Security checks are not performed only before extraction.

During extraction, ZipShield also checks:

- File count
- Extracted size
- Path safety

This provides defense in depth.

Status:

```text
DONE
```

---

## 8. Per-Upload Extraction Isolation

Each upload gets a unique extraction directory.

Example:

```text
extracted/
├── UUID-A/
└── UUID-B/
```

This prevents separate uploads from accidentally sharing or overwriting extracted files.

Status:

```text
DONE
```

---

## 9. Failed Extraction Cleanup

If extraction fails, the extraction directory belonging to that upload is removed.

This prevents partially extracted malicious files from remaining on disk.

Status:

```text
DONE
```

---

# Configuration Limits

Current security configuration:

```text
MAX_EXTRACTED_SIZE
        ↓
100 MB

MAX_FILES
        ↓
1000

MAX_COMPRESSION_RATIO
        ↓
100:1

MAX_NESTING_DEPTH
        ↓
3
```

All limits are defined in:

```text
src/config/limits.ts
```

---

# Implementation Status

## Overall Roadmap

```text
V1     Basic ZIP Upload                    ✅
V1.3   ZIP Signature Validation             ✅
V1.4   ZIP Archive Inspection               ✅
V2     Extracted Size Protection            ✅
V2.1   File Count Protection                ✅
V3     Compression Ratio Protection         ✅
V4     Path Traversal Protection            ✅
V5     Nested Archive Protection            ✅
V6     Production-Style Secure Extraction   🚧
```

---

# Completed Versions

## V1 — Basic ZIP Upload

Implemented:

- Express server
- Upload route
- Multer
- ZIP upload

Status:

```text
DONE
```

---

## V1.3 — ZIP Signature Validation

Implemented ZIP magic-byte validation.

Status:

```text
DONE
```

---

## V1.4 — ZIP Archive Inspection

Implemented:

- AdmZip
- ZIP entry inspection
- compressed size
- uncompressed size
- file counting

Status:

```text
DONE
```

---

## V2 — Extracted Size Protection

Added:

```text
MAX_EXTRACTED_SIZE = 100 MB
```

Tested with a 110 MB uncompressed file.

Result:

```text
ZIP rejected
```

Status:

```text
DONE
```

---

## V2.1 — File Count Protection

Added:

```text
MAX_FILES = 1000
```

Tested with:

```text
1001 files
```

Result:

```text
ZIP rejected
```

Status:

```text
DONE
```

---

## V3 — Compression Ratio Protection

Added:

```text
MAX_COMPRESSION_RATIO = 100
```

Tested using a highly compressible zero-filled file.

Result:

```text
ZIP rejected
```

Status:

```text
DONE
```

---

## V4 — Path Traversal Protection

Added:

```text
isSafeZipPath()
```

Tested malicious archive entry:

```text
../../evil.txt
```

Result:

```text
ZIP rejected
```

Status:

```text
DONE
```

---

## V5 — Nested Archive Protection

Added:

```text
MAX_NESTING_DEPTH = 3
```

Implemented recursive nested archive inspection.

Test results:

```text
Depth 1 → allowed
Depth 4 → rejected
```

Status:

```text
DONE
```

---

# Current V6 Progress

V6 focuses on making the extraction process more production-oriented.

## V6 Step 1 — Secure Extraction

Implemented:

```text
extractZip()
```

Features:

- safe path validation
- directory creation
- file extraction

Status:

```text
DONE
```

---

## V6 Step 2 — Connect Extraction to Controller

The upload endpoint now performs:

```text
inspect → extract → response
```

Status:

```text
DONE
```

---

## V6 Step 3 — Extraction-Time Limits

Extraction now independently checks:

```text
MAX_FILES
MAX_EXTRACTED_SIZE
```

Status:

```text
DONE
```

---

## V6 Step 4 — Unique Extraction Directory

Each upload receives:

```text
extracted/<UUID>/
```

This prevents collisions between uploads.

Failed extraction also removes the corresponding extraction directory.

Status:

```text
DONE
```

---

# Upcoming Security Roadmap

The next development stages are intentionally incremental.

## V6.5 — Filename Security

Planned checks:

- suspicious filenames
- extremely long filenames
- null bytes
- problematic path names
- duplicate/conflicting paths
- unusual filename edge cases

Status:

```text
NEXT
```

---

## V6.6 — Symlink / Special File Protection

Investigate and protect against:

- symbolic links
- filesystem special entries
- links pointing outside the extraction directory

Status:

```text
PLANNED
```

---

## V6.7 — Strong ZIP Type Validation

Strengthen upload validation using:

```text
MIME type
      +
ZIP magic bytes
      +
actual archive parsing
```

The goal is to avoid trusting client-provided MIME information.

Status:

```text
PLANNED
```

---

## V6.8 — Upload Size Limit

Add a Multer-level maximum upload size.

Purpose:

```text
Prevent huge files from reaching ZIP inspection.
```

Status:

```text
PLANNED
```

---

## V6.9 — Resource Exhaustion Protection

Current nested archive detection uses:

```ts
entry.getData()
```

This can load archive contents into memory.

Future work should investigate:

- memory usage
- CPU exhaustion
- deeply recursive archives
- large numbers of nested archives
- safer processing strategies

Status:

```text
PLANNED
```

---

## V6.10 — Centralized Error Handling

Introduce centralized Express error handling.

Target flow:

```text
Multer error
ZIP validation error
ZIP extraction error
Unexpected error
        │
        ▼
Central error middleware
        │
        ▼
Consistent JSON response
```

Status:

```text
PLANNED
```

---

## V6.11 — API Rate Limiting

Protect the upload endpoint from request flooding.

Example:

```text
Client
  │
  ├── request
  ├── request
  ├── request
  └── ...
       ↓
Rate limiter
       ↓
ZIP processing
```

Status:

```text
PLANNED
```

---

## V6.12 — Security Logging

Add structured security-related logging.

Examples:

```text
ZIP rejected
Reason: path traversal

ZIP rejected
Reason: compression ratio

ZIP rejected
Reason: nesting depth

ZIP rejected
Reason: file count
```

Logs should avoid leaking sensitive information.

Status:

```text
PLANNED
```

---

# How to Run

## 1. Clone the repository

```bash
git clone git@github.com:Razwanul30/zip-shield.git
cd zip-shield
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Start development server

```bash
npm run dev
```

Server:

```text
http://localhost:3000
```

---

## 4. Verify server

Open:

```text
GET /
```

Expected response:

```json
{
  "message": "ZipShield is running"
}
```

---

# API

## `POST /upload`

Uploads and processes a ZIP archive.

### Request

```text
POST /upload
Content-Type: multipart/form-data
```

Form field:

```text
file
```

Example:

```text
file = example.zip
```

---

## Successful response

A successful request returns:

```json
{
  "message": "ZIP inspected and extracted successfully",
  "file": {
    "originalName": "example.zip",
    "uploadedSize": 1234
  },
  "extraction": {
    "directory": "extracted/<UUID>"
  },
  "inspection": {
    "fileCount": 1,
    "totalCompressedSize": 100,
    "totalUncompressedSize": 500,
    "entries": []
  }
}
```

---

## Rejected ZIP

Example:

```json
{
  "message": "ZIP rejected",
  "error": "ZIP exceeds maximum extracted size"
}
```

Other possible rejection reasons include:

```text
ZIP contains too many files
ZIP has suspicious compression ratio
Unsafe ZIP entry path
ZIP nesting depth exceeded
Extraction size limit exceeded
Extraction file count limit exceeded
```

---

# Testing

Security testing is part of the project.

## Large extracted file

Create a large file:

```bash
dd if=/dev/zero of=test-110mb.bin bs=1M count=110
```

Create ZIP:

```bash
zip test-large.zip test-110mb.bin
```

Expected:

```text
ZIP rejected
```

---

## Too many files

Create 1001 files:

```bash
mkdir -p test-many-files

for i in $(seq 1 1001); do
    echo "test" > "test-many-files/file-$i.txt"
done
```

Create ZIP:

```bash
zip -q test-many-files.zip test-many-files/*
```

Expected:

```text
ZIP rejected
```

---

## High compression ratio

Create highly compressible data:

```bash
dd if=/dev/zero of=high-compression.txt bs=1M count=5
```

Create highly compressed ZIP:

```bash
zip -9 high-compression.zip high-compression.txt
```

Expected:

```text
ZIP rejected
```

---

## Path traversal

Create malicious ZIP:

```bash
python3 -c "import zipfile; z=zipfile.ZipFile('traversal.zip','w'); z.writestr('../../evil.txt','malicious content'); z.close()"
```

Expected:

```text
ZIP rejected
```

---

## Nested archive

Nested ZIP files can be used to test:

```text
MAX_NESTING_DEPTH
```

Expected:

```text
Depth <= 3 → allowed
Depth > 3 → rejected
```

---

## Check extracted files

```bash
find extracted -type f
```

Example:

```text
extracted/<UUID>/safe.txt
```

---

# Git Workflow

The project uses Git for incremental development.

Recommended workflow:

```text
Create feature
     ↓
Implement
     ↓
Compile
     ↓
Test
     ↓
Review
     ↓
Commit
     ↓
Push
```

Before committing:

```bash
git status
```

Compile TypeScript:

```bash
npx tsc --noEmit
```

Then:

```bash
git add <files>
git commit -m "feat: <description>"
git push
```

---

# Development Notes

## Do not modify security limits randomly

Security limits should be changed deliberately.

Current values are:

```text
100 MB extracted size
1000 files
100:1 compression ratio
3 nested levels
```

If a limit changes, update:

```text
src/config/limits.ts
```

and this README.

---

## Keep security logic inside services/utilities

Avoid putting ZIP security logic directly inside:

```text
server.ts
```

or:

```text
upload.route.ts
```

The intended architecture is:

```text
Controller
    ↓
Service
    ↓
Utility / Config
```

---

## Do not trust filenames

The original filename comes from the client.

Never use it as a trusted filesystem path.

Extraction paths should always be resolved and validated.

---

## Do not trust MIME type

A MIME type can be incorrect or manipulated.

Future validation should combine:

```text
MIME type
+
magic bytes
+
actual ZIP parsing
```

---

## Do not assume inspection alone is enough

The project intentionally validates during both:

```text
inspection
```

and:

```text
extraction
```

This provides defense in depth.

---

# Current Project State

At the current checkpoint:

```text
┌─────────────────────────────────────────────┐
│                  ZipShield                   │
├─────────────────────────────────────────────┤
│ Basic Upload                         ✅      │
│ ZIP Signature Validation             ✅      │
│ ZIP Inspection                       ✅      │
│ Extracted Size Protection            ✅      │
│ File Count Protection                ✅      │
│ Compression Ratio Protection         ✅      │
│ Path Traversal Protection            ✅      │
│ Nested Archive Protection             ✅      │
│ Secure Extraction                     ✅      │
│ Extraction-Time Limits                ✅      │
│ Per-Upload Extraction Isolation       ✅      │
│ Failed Extraction Cleanup             ✅      │
├─────────────────────────────────────────────┤
│ Filename Security                    ⏳      │
│ Symlink Protection                   ⏳      │
│ Strong ZIP Type Validation            ⏳      │
│ Upload Size Limit                    ⏳      │
│ Resource Exhaustion Protection        ⏳      │
│ Central Error Handling                ⏳      │
│ Rate Limiting                         ⏳      │
│ Security Logging                      ⏳      │
└─────────────────────────────────────────────┘
```

---

# Future Improvements

After the core security roadmap, possible improvements include:

- Automated security test suite
- Unit tests for ZIP utilities
- Integration tests for upload endpoint
- Better structured logging
- Docker deployment
- Production configuration using environment variables
- Temporary-file lifecycle management
- Authentication/authorization
- Persistent job processing for large archives
- Background ZIP processing
- Queue-based architecture
- Monitoring and metrics
- CI/CD pipeline
- Production deployment

These are **future ideas**, not current requirements.

Do not implement them before completing the current security roadmap unless there is a clear reason.

---

# Project Philosophy

ZipShield is being developed incrementally.

The goal is not:

> Add every security feature at once.

The goal is:

```text
Understand
   ↓
Implement
   ↓
Test
   ↓
Break it intentionally
   ↓
Fix it
   ↓
Commit
   ↓
Move to next layer
```

Every security feature should ideally have:

```text
Threat
  ↓
Protection
  ↓
Implementation
  ↓
Attack test
  ↓
Expected result
```

This makes ZipShield both a working backend project and a practical security-learning project.

---

# Current Next Task

When development resumes, start from:

```text
V6.5 — Filename Security
```

Do not restart previous stages.

Current checkpoint:

```text
V6.4 completed
```

Next target:

```text
V6.5 Filename Security
```