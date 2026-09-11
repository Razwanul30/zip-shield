import { Request, Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
    inspectZip,
    extractZip
} from "../services/zip.service";

export async function uploadZip(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.file) {
        res.status(400).json({
            message: "No file uploaded"
        });

        return;
    }

    const extractionDir = path.join(
        "extracted",
        crypto.randomUUID()
    );

    try {
        const result = inspectZip(
            req.file.path,
            extractionDir
        );

        extractZip(
            req.file.path,
            extractionDir
        );

        res.status(200).json({
            message: "ZIP inspected and extracted successfully",
            file: {
                originalName: req.file.originalname,
                uploadedSize: req.file.size
            },
            extraction: {
                directory: extractionDir
            },
            inspection: result
        });
    } catch (error) {
        console.error(
            "ZIP inspection/extraction error:",
            error
        );

        if (fs.existsSync(extractionDir)) {
            fs.rmSync(extractionDir, {
                recursive: true,
                force: true
            });
        }

        res.status(400).json({
            message: "ZIP rejected",
            error: error instanceof Error
                ? error.message
                : String(error)
        });
    }
}