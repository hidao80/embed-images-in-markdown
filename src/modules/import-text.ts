import * as vscode from "vscode";

import { getFileExt } from ".";
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
 * Resolve the filesystem path for a Uri, correcting for the case where a
 * Windows drive letter (e.g. `E:`) ends up parsed as the URI authority
 * instead of being folded into the path. When that happens, `Uri.fsPath`
 * silently drops the drive and callers fall back to the current process
 * drive (typically `C:`) instead of the actual one.
 * @param {vscode.Uri} uri Uri to resolve.
 * @returns {string} Best-effort filesystem path for the uri.
 */
function resolveFsPath(uri: vscode.Uri): string {
    // Some sources (e.g. VS Code's own explorer on Windows) hand back a Uri
    // whose `path` is already a raw Windows path (drive letter + backslashes)
    // rather than a POSIX-style `/E:/...` path. `Uri.fsPath` mishandles that
    // shape and drops the drive letter, so prefer the raw path when it
    // already looks like a Windows absolute path.
    if (/^[a-zA-Z]:[\\/]/.test(uri.path)) {
        return uri.path;
    }
    // The `path` getter can itself normalize away the drive letter (e.g.
    // return `\project\...` for a uri whose scheme/authority are empty),
    // even though it is still present in the uri's raw string form.
    // Recover it from there before falling back to `fsPath`.
    const raw = decodeURIComponent(uri.toString());
    if (/^[a-zA-Z]:[\\/]/.test(raw)) {
        return raw;
    }
    if (/^[a-zA-Z]:$/.test(uri.authority)) {
        return `${uri.authority}${decodeURIComponent(uri.path)}`.replace(/\//g, "\\");
    }
    return uri.fsPath;
}

/**
 * Retrieve only the first image file that is dropped.
 * @param {vscode.DataTransfer} data Dropped files
 * @returns {Promise<DragFileInfo | undefined>} Dragged file info.
 */
export async function getDragFile(data: vscode.DataTransfer): Promise<DragFileInfo | undefined> {
    let filePath: string | undefined;

    // Files dropped from VS Code's explorer, the OS file manager, etc.
    for (const [, item] of data) {
        const file = item.asFile();
        if (file?.uri) {
            filePath = resolveFsPath(file.uri);
            break;
        }
    }

    // Fallback for drops that only provide a list of URIs (the standard
    // mime type used for resources dragged from the explorer or the OS).
    if (!filePath) {
        const uriList = await data.get('text/uri-list')?.asString();
        const firstUri = uriList?.split('\n').map(line => line.trim()).find(Boolean);
        if (firstUri) {
            filePath = resolveFsPath(vscode.Uri.parse(firstUri));
        }
    }

    if (!filePath) {
        return undefined;
    }

    filePath = filePath.replace("\\\\", "\\");  // for WSL
    const base64 = fs.readFileSync(filePath,  { encoding: "base64" });
    return { filePath, base64 };
}

/**
 * Get the file name portion of a path, handling both `/` and `\` separators.
 * @param {string} filePath Full path to the file.
 * @returns {string} The file name at the end of the path.
 */
export function basename(filePath: string): string {
    const separator = (filePath.startsWith("/")) ? "/" : "\\";
    const index = filePath.lastIndexOf(separator);
    return index === -1 ? filePath : filePath.substring(index+1);
}
