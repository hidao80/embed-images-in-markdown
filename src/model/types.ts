/**
 * Supported file extension types
 */
export type FileExtension = ".gif" | ".jpeg" | ".jpg" | ".png" | ".webp";

export interface DragFileInfo {
    filePath: string;
    base64: string;
}
