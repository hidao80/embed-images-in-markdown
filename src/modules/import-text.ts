import * as vscode from "vscode";

import { getFileExt } from ".";
import { supportedImages } from "../providers";
import { DragFileInfo } from "../model";
import * as fs from "fs";

/**
 * Get calculated import style to append in editor.
 * @param {string} index Index of image links.
 * @param {string} filename Dragged file base name.
 * @returns Import statement string
 */
export function getImportTag(
    index: string,
    filename: string | null = null,
): string {
    return `![${filename}][${index}]`;
}

/**
 * Get calculated import style to append in editor.
 * @param {string} index Index of image links.
 * @param {DragFileInfo} dragFile Dragged file info.
 * @returns Import images base64 string
 */
export function getImportData(
    index: string,
    dragFile: DragFileInfo,
): string {
    const ext = getFileExt(dragFile.filePath).substring(1);
    return `\n\n[${index}]: data:image/${ext};base64,${dragFile.base64}`;
}

/**
 * Retrieve only the first image file that is dropped.
 * @param {vscode.DataTransfer} data Dropped files
 * @returns {Promise<DragFileInfo | undefined>} Dragged file info.
 */
export async function getDragFile(data: vscode.DataTransfer): Promise<DragFileInfo | undefined> {
    for (const ext of supportedImages) {
        const lowerCaseExt = ext.substring(1).toLowerCase();
        const mimeType = `image/${lowerCaseExt}`;
        const file = data.get(mimeType)?.asFile();
        if (file) {
            const filePath = file.uri?.fsPath ?? "";
            const base64 = Buffer.from(await file.data()).toString("base64");
            return { filePath, base64 };
        }
    }
    const filePath: string = data.get('text/plain')?.value;
    const base64 = fs.readFileSync(filePath, { encoding: "base64" });
    return { filePath, base64 };
}

export function basename(filePath: string): string {
    const sep = (filePath.startsWith("/")) ? "/" : "\\";
    const index = filePath.lastIndexOf(sep);
    return index === -1 ? filePath : filePath.substring(index+1);
}
