import AdmZip from "adm-zip";
import fs from "node:fs";
import path from "node:path";
import { MAX_EXTRACTED_SIZE, MAX_FILES, MAX_COMPRESSION_RATIO, MAX_NESTING_DEPTH } from "../config/limits";
import { isSafeZipPath,isZipBuffer } from "../utils/zip.utils";

export interface ZipEntryInfo {
    name: string;
    isDirectory: boolean;
    compressedSize: number;
    uncompressedSize: number;
}

function checkNestedArchives(zip: AdmZip,
    depth: number
): void {
    if (depth > MAX_NESTING_DEPTH) {
        throw new Error("ZIP nesting depth exceeded");
    }
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) {
            continue;
        }
        const data = entry.getData();
        if (!isZipBuffer(data)) {
            continue;
        }
        const nestedZip = new AdmZip(data);
        checkNestedArchives(nestedZip, depth + 1);
    }
}

export interface ZipInspectionResult {
    fileCount: number;
    totalCompressedSize: number;
    totalUncompressedSize: number;
    entries: ZipEntryInfo[];
}

export function inspectZip(zipPath: string, extractionDir: string): ZipInspectionResult {
    const zip = new AdmZip(zipPath);

    checkNestedArchives(zip, 0);

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

export function extractZip(
    zipPath: string,
    extractionDir: string
): void {
    const zip = new AdmZip(zipPath);

    let extractedSize = 0;
    let fileCount = 0;

    for (const entry of zip.getEntries()) {
        const safe = isSafeZipPath(
            extractionDir,
            entry.entryName
        );

        if (!safe) {
            throw new Error(
                `Unsafe ZIP entry path: ${entry.entryName}`
            );
        }

        const targetPath = path.resolve(
            extractionDir,
            entry.entryName
        );

        if (entry.isDirectory) {
            fs.mkdirSync(targetPath, {
                recursive: true
            });

            continue;
        }

        fileCount++;

        if (fileCount > MAX_FILES) {
            throw new Error(
                "Extraction file count limit exceeded"
            );
        }

        const uncompressedSize = entry.header.size;

        extractedSize += uncompressedSize;

        if (extractedSize > MAX_EXTRACTED_SIZE) {
            throw new Error(
                "Extraction size limit exceeded"
            );
        }

        const parentDir = path.dirname(targetPath);

        fs.mkdirSync(parentDir, {
            recursive: true
        });

        const data = entry.getData();

        fs.writeFileSync(
            targetPath,
            data
        );
    }
}