import * as vscode from "vscode";

import { getImportTag, getImportData, getDragFile, getFileExt, notify, basename } from './modules';
import { NotifyType } from "./model";
import { supportedImages } from "./providers";

/**
 * Drag and drop handler
 */
export class  EmbeddingImagesOnDropProvider
    implements vscode.DocumentDropEditProvider
{
    /**
     * Handles a drag-and-drop into a markdown document.
     * Converts a dropped image file into a DataUrl, inserting a reference
     * link at the drop position and the DataUrl definition at the end of the file.
     * @param {vscode.TextDocument} _document The document being dropped into.
     * @param {vscode.Position} _position The position in the document where the drop occurred.
     * @param {vscode.DataTransfer} _dataTransfer Data describing the dragged content.
     * @param {vscode.CancellationToken} _token Token signaling drop cancellation.
     * @returns {Promise<vscode.DocumentDropEdit>} Edit to apply, or an empty edit if nothing was inserted.
     */
    async provideDocumentDropEdits(
        _document: vscode.TextDocument,
        _position: vscode.Position,
        _dataTransfer: vscode.DataTransfer,
        _token: vscode.CancellationToken
    ): Promise<vscode.DocumentDropEdit> {
        try {
            const dragFile = await getDragFile(_dataTransfer);
            if (!dragFile) {
                return { insertText: "" };
            }
            const dragFilePath = dragFile.filePath;
            const dropFilePath = _document.uri.fsPath;

            if (dragFilePath.toLowerCase() === dropFilePath.toLowerCase()) {
                return notify(NotifyType.sameFilePath);
            }

            if (!supportedImages.includes(getFileExt(dragFilePath.toLowerCase()))) {
                return notify(NotifyType.notSupported);
            }

            // Use Unix time as the ID of the reference link.
            const index: string = new Date().getTime().toString();

            const filename = basename(dragFilePath);

            const importData = getImportData(index, dragFile);

            // Insert the DataUrl definition at the end of the file via the additional edit,
            // so it is applied atomically together with the reference link insertText below.
            const additionalEdit = new vscode.WorkspaceEdit();
            additionalEdit.insert(
                _document.uri,
                new vscode.Position(_document.lineCount, 0),
                importData
            );

            return {
                // Insert a reference link at the dropped position.
                insertText: getImportTag(index, filename),
                additionalEdit
            };
        } catch (err) {
            // Surface unexpected failures instead of silently falling back
            // to VS Code's default drop behavior.
            console.error('embed-images-in-markdown: drop failed', err);
            vscode.window.showErrorMessage(`Embed images in markdown: ${err instanceof Error ? err.message : String(err)}`);
            return { insertText: "" };
        }
    }
}
