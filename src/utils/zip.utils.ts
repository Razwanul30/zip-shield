import path from "node:path";

export function isSafeZipPath(
    extractionDir: string,
    entryName: string
): boolean {
    const targetPath = path.resolve(extractionDir, entryName);
    const basePath = path.resolve(extractionDir);

    return (
        targetPath === basePath ||
        targetPath.startsWith(basePath + path.sep)
    );
}