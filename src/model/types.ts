/**
 * Supported file extension types
 */
export type FileExtension = ".gif" | ".jpeg" | ".jpg" | ".png" | ".webp";

export interface DragFileInfo {
    filepath: string;
    base64: string;
}
