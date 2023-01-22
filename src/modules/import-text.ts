import * as vscode from "vscode";

import { getFileExt } from ".";
import { supportedImages } from "../providers";
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
 * @param {string} dragFilePath Dragged file path.
 * @returns Import images base64 string
 */
export function getImportData(
    index: string,
    dragFilePath: string,
): string {
    const ext = getFileExt(dragFilePath).substring(1);
    const base64Data = fs.readFileSync(dragFilePath, { encoding: "base64" });

    return `\n\n[${index}]: data:image/${ext};base64,${base64Data}`;
}

/**
 * Retrieve only the first image file that is dropped.
 * @param {vscode.DataTransfer} data Dropped files
 * @returns {vscode.DataTransferItem | undefined} Graphics file
 */
export function getDragFilePath(data: vscode.DataTransfer): string | undefined {
    for (const ext of supportedImages) {
        const lowerCaseExt = ext.substring(1).toLowerCase();
        const mimeType = `image/${lowerCaseExt}`;
        const file = data.get(mimeType)?.asFile()?.uri?.fsPath;
        if (file) {
            return file;
        }
    }
    return data.get('text/plain')?.value;
}
