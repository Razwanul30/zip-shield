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

export function isZipBuffer (buffer: Buffer): boolean {
    return (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        (   
            buffer[2] === 0x03 && buffer[3] === 0x04 ||
            buffer[2] === 0x05 && buffer[3] === 0x06 ||
            buffer[2] === 0x07 && buffer[3] === 0x08
        )
    );
}