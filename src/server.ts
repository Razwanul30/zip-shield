import express from "express";
import multer from "multer";
import fs from "node:fs/promises";

const app = express();

const PORT = 3000;

// ------------------------------
// Multer configuration
// ------------------------------

const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, callback) => {
        if (file.mimetype === "application/zip") {
            callback(null, true);
        } else {
            callback(new Error("Only ZIP files are allowed"));
        }
    }
});

// ------------------------------
// ZIP signature validation
// ------------------------------

async function isValidZip(filePath: string): Promise<boolean> {
    const fileHandle = await fs.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(4);

        await fileHandle.read(buffer, 0, 4, 0);

        // ZIP files normally start with:
        // PK\x03\x04
        // PK\x05\x06 -> empty ZIP
        // PK\x07\x08 -> spanned ZIP

        const isStandardZip =
            buffer[0] === 0x50 &&
            buffer[1] === 0x4b &&
            (
                (buffer[2] === 0x03 && buffer[3] === 0x04) ||
                (buffer[2] === 0x05 && buffer[3] === 0x06) ||
                (buffer[2] === 0x07 && buffer[3] === 0x08)
            );

        return isStandardZip;
    } finally {
        await fileHandle.close();
    }
}

// ------------------------------
// Health check
// ------------------------------

app.get("/", (req, res) => {
    res.json({
        message: "ZipShield is running"
    });
});

// ------------------------------
// ZIP upload
// ------------------------------

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded"
        });
    }

    try {
        const validZip = await isValidZip(req.file.path);

        if (!validZip) {
            await fs.unlink(req.file.path);

            return res.status(400).json({
                message: "Invalid ZIP file"
            });
        }

        return res.status(200).json({
            message: "Valid ZIP file uploaded successfully",
            file: {
                originalName: req.file.originalname,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        // Clean up uploaded file if validation fails
        try {
            await fs.unlink(req.file.path);
        } catch {
            // File may already have been deleted
        }

        console.error(error);

        return res.status(500).json({
            message: "Failed to validate ZIP file"
        });
    }
});

// ------------------------------
// Start server
// ------------------------------

app.listen(PORT, () => {
    console.log(`ZipShield running on http://localhost:${PORT}`);
});