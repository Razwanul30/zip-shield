import { Request, Response } from "express";
import { inspectZip } from "../services/zip.service";

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

    try {
        const result = inspectZip(req.file.path, "extracted");

        res.status(200).json({
            message: "ZIP inspected successfully",
            file: {
                originalName: req.file.originalname,
                uploadedSize: req.file.size
            },
            inspection: result
        });
    } catch (error) {
        console.error("ZIP inspection error:", error);

        res.status(400).json({
            message: "ZIP rejected",
            error: error instanceof Error
                ? error.message
                : String(error)
        });
    }
}