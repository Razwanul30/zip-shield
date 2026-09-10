import AdmZip from "adm-zip";

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
    let totalCompressedSize = 0;
    let totalUncompressedSize = 0;
    let fileCount = 0;

    for (const entry of zip.getEntries()) {
        const header = entry.getHeader();

        const compressedSize = header.getCompressedSize();
        const uncompressedSize = header.getUncompressedSize();

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

    return {
        fileCount,
        totalCompressedSize,
        totalUncompressedSize,
        entries
    };
}