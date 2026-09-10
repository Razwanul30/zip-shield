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
        const result = inspectZip(req.file.path);

        res.status(200).json({
            message: "ZIP inspected successfully",
            file: {
                originalName: req.file.originalname,
                uploadedSize: req.file.size
            },
            inspection: result
        });
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: "Failed to inspect ZIP file"
        });
    }
}