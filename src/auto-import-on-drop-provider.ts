import * as vscode from "vscode";

import { getImportTag, getImportData, getDragFile, getFileExt, notify, basename } from './modules';
import { NotifyType } from "./model";
import { supportedImages } from "./providers";
import * as path from "path";

/**
 * Drag and drop handler
 */
export class  EmbeddingImagesOnDropProvider
    implements vscode.DocumentDropEditProvider
{
    async provideDocumentDropEdits(
        _document: vscode.TextDocument,
        _position: vscode.Position,
        _dataTransfer: vscode.DataTransfer,
        _token: vscode.CancellationToken
    ): Promise<vscode.DocumentDropEdit> {
        // Focus on the editor to be pasted
        const editor = vscode.window.visibleTextEditors.filter(v => v.document === _document)[0];
        if (!editor) {
            return { insertText: "" };
        }

        const dragFile = await getDragFile(_dataTransfer);
        if (!dragFile) {
            return { insertText: "" };
        }
        const dragFilePath = dragFile.filepath;
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

        // Place data at the end of the file.
        editor.edit((editBuilder: vscode.TextEditorEdit) => {
            // Insert a reference link at the dropped position.
            editBuilder.insert(
                _position,
                getImportTag(index, filename)
            );

            // Insert DataUrl at the end of the file.
            editBuilder.insert(
                new vscode.Position(editor.document.lineCount, 0),
                importData
            );
        });

        // Insert text
        return {
            insertText: ""
        };
    }
}
