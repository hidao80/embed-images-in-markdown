import * as vscode from "vscode";

import { getFileExt } from ".";
import { supportedImages } from "../providers";

/**
 * Get calculated import style to append in editor.
 * @param {string} dragFilePath Dragged file path.
 * @param {string} index Index of image links.
 * @returns Import statement string
 */
export function getImportTag(
    index: string,
): string {
    return `![alt-text][${index}]`;
}

/**
 * Get calculated import style to append in editor.
 * @param {string} dragFilePath Dragged file path.
 * @param {string} index Index of image links.
 * @returns Import images base64 string
 */
export function getImportData(
    dragFilePath: string,
    index: string,
): string {
    const fs = require("fs");
    const ext = getFileExt(dragFilePath).substring(1);
    const base64Data = fs.readFileSync(dragFilePath, { encoding: "base64" });

    return `\n\n[${index}]: data:image/${ext};base64,${base64Data}`;
}

/**
 * Retrieve only the first image file that is dropped.
 * @param {vscode.DataTransfer} data Dropped files
 * @returns {vscode.DataTransferItem | undefined} Graphics file
 */
export function getData(data: vscode.DataTransfer): vscode.DataTransferItem | undefined {
    let file: vscode.DataTransferItem | undefined;
    for (const ext of supportedImages) {
        const lowerCaseExt = ext.substring(1).toLowerCase();
        const mimeType = `image/${lowerCaseExt}`;
        file = data.get(mimeType);
        if (file) {
            break;
        }
    }
    return file;
}
