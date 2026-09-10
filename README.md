# ZipShield

Secure ZIP file upload and inspection service built with Node.js, TypeScript, Express, and AdmZip.

ZipShield is a backend security practice project focused on detecting and preventing common archive-based security threats before ZIP files are processed or extracted.

## Features

- ZIP file type validation
- ZIP signature validation
- ZIP archive inspection
- Maximum extracted-size protection
- Maximum file-count protection
- Compression-ratio protection
- Planned path traversal protection
- Planned nested archive protection
- Planned secure extraction

## Security Limits

Current limits:

| Protection | Limit |
|---|---:|
| Maximum extracted size | 100 MB |
| Maximum files | 1000 |
| Maximum compression ratio | 100× |

These limits help reduce the risk of resource exhaustion and archive-based attacks.

## Project Structure

```text
zip-shield/
├── src/
│   ├── controllers/
│   │   └── upload.controller.ts
│   ├── middleware/
│   │   └── upload.middleware.ts
│   ├── routes/
│   │   └── upload.route.ts
│   ├── services/
│   │   └── zip.service.ts
│   ├── utils/
│   │   └── zip.utils.ts
│   ├── config/
│   │   └── limits.ts
│   └── server.ts
├── uploads/
│   └── .gitkeep
├── extracted/
│   └── .gitkeep
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Tech Stack

- Node.js
- TypeScript
- Express
- Multer
- AdmZip

## Current Protection Layers

### ZIP Signature Validation

The uploaded file is checked using its actual ZIP signature instead of relying only on the MIME type.

### Archive Inspection

ZipShield reads ZIP entries and collects:

- File name
- Directory status
- Compressed size
- Uncompressed size
- Total file count
- Total compressed size
- Total uncompressed size

### Extracted Size Protection

ZIP archives are rejected when their total declared uncompressed size exceeds 100 MB.

This protects the server from archives that could consume excessive disk space during extraction.

### File Count Protection

ZIP archives containing more than 1000 files are rejected.

This helps prevent attacks involving an extremely large number of small files.

### Compression Ratio Protection

ZipShield calculates:

```text
compression ratio =
total uncompressed size / total compressed size
```

Archives with a compression ratio greater than 100× are rejected as suspicious.

Example:

```text
Compressed size:   5 KB
Uncompressed size: 5 MB

Ratio: ~1000×
```

The archive is rejected before extraction.

## API

### Health Check

```http
GET /
```

Response:

```json
{
  "message": "ZipShield is running"
}
```

### Upload ZIP

```http
POST /upload
```

Request:

```text
Content-Type: multipart/form-data
```

Form field:

```text
file
```

Example successful response:

```json
{
  "message": "ZIP inspected successfully",
  "file": {
    "originalName": "example.zip",
    "uploadedSize": 5138615
  },
  "inspection": {
    "fileCount": 1,
    "totalCompressedSize": 5138413,
    "totalUncompressedSize": 5363449,
    "entries": []
  }
}
```

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The server runs on:

```text
http://localhost:3000
```

Check TypeScript:

```bash
npx tsc --noEmit
```

## Roadmap

- [x] V1 Basic ZIP upload
- [x] V1.3 ZIP signature validation
- [x] V1.4 ZIP archive inspection
- [x] V2 Extracted-size protection
- [x] V2.1 File-count protection
- [x] V3 Compression-ratio protection
- [ ] V4 Path traversal protection
- [ ] V5 Nested archive protection
- [ ] V6 Production-style secure extraction

## Purpose

ZipShield is primarily a security-focused backend learning project.

The goal is to understand how untrusted uploaded archives can affect a server and how multiple layers of validation and resource protection can be implemented before extraction.