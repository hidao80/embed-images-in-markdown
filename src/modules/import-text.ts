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
    let file: vscode.DataTransferFile | undefined;
    for (const ext of supportedImages) {
        const lowerCaseExt = ext.substring(1).toLowerCase();
        const mimeType = `image/${lowerCaseExt}`;
        file = data.get(mimeType)?.asFile();
        if (file) {
            break;
        }
    }
    let filePath = file?.uri?.fsPath ?? data.get('text/plain')?.value;
    filePath = filePath.replace("\\\\", "\\");  // for WSL
    const base64 = fs.readFileSync(filePath,  { encoding: "base64" });
    return { filePath, base64 };
}

export function basename(filePath: string): string {
    const separator = (filePath.startsWith("/")) ? "/" : "\\";
    const index = filePath.lastIndexOf(separator);
    return index === -1 ? filePath : filePath.substring(index+1);
}
