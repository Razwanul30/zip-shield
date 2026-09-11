import AdmZip from "adm-zip";
import { MAX_EXTRACTED_SIZE, MAX_FILES, MAX_COMPRESSION_RATIO } from "../config/limits";
import { isSafeZipPath } from "../utils/zip.utils";

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

export function inspectZip(zipPath: string, extractionDir: string): ZipInspectionResult {
    const zip = new AdmZip(zipPath);

    const entries: ZipEntryInfo[] = [];

    let fileCount = 0;
    let totalCompressedSize = 0;
    let totalUncompressedSize = 0;

    for (const entry of zip.getEntries()) {
        const safe = isSafeZipPath(extractionDir, entry.entryName);
        if (!safe) {
            throw new Error(`Unsafe ZIP entry path: ${entry.entryName}`);
        }
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

    if (fileCount > MAX_FILES) {
        throw new Error("ZIP contains too many files");
    }

    if (totalUncompressedSize > MAX_EXTRACTED_SIZE) {
        throw new Error("ZIP exceeds maximum extracted size");
    }

    if (totalCompressedSize > 0) {
        const compressionRatio =
        totalUncompressedSize / totalCompressedSize;

    if (compressionRatio > MAX_COMPRESSION_RATIO) {
        throw new Error("ZIP has suspicious compression ratio");
    }
}

    return {
        fileCount,
        totalCompressedSize,
        totalUncompressedSize,
        entries
    };
}