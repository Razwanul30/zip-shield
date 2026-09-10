import AdmZip from "adm-zip";
import { MAX_EXTRACTED_SIZE } from "../config/limits";

export interface ZipEntryInfo {
    name: string;
    isDirectory: boolean;
    compressedSize: number;
    uncompressedSize: number;
}

export interface ZipInspectionResult {
    fileCount: number;
    totalCompressedSize: number;
    totalUncompressedSize: number;
    entries: ZipEntryInfo[];
}

export function inspectZip(zipPath: string): ZipInspectionResult {
    const zip = new AdmZip(zipPath);

    const entries: ZipEntryInfo[] = [];

    let fileCount = 0;
    let totalCompressedSize = 0;
    let totalUncompressedSize = 0;

    for (const entry of zip.getEntries()) {
        const compressedSize = entry.header.compressedSize;
        const uncompressedSize = entry.header.size;

        if (!entry.isDirectory) {
            fileCount++;
        }

        totalCompressedSize += compressedSize;
        totalUncompressedSize += uncompressedSize;

        entries.push({
            name: entry.entryName,
            isDirectory: entry.isDirectory,
            compressedSize,
            uncompressedSize
        });
    }

    if (totalUncompressedSize > MAX_EXTRACTED_SIZE) {
        throw new Error("ZIP exceeds maximum extracted size");
    }

    return {
        fileCount,
        totalCompressedSize,
        totalUncompressedSize,
        entries
    };
}