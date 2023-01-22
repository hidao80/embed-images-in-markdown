import * as vscode from "vscode";

import { getImportTag, getImportData, getDragFilePath, getFileExt, notify } from './modules';
import { NotifyType } from "./model";
import path = require("path");

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
        const dragFilePath = getDragFilePath(_dataTransfer) ?? "";
        const dropFilePath = _document.uri.fsPath;

        if (dragFilePath.toLowerCase() === dropFilePath.toLowerCase()) {
            return notify(NotifyType.sameFilePath);
        }

        if (getFileExt(dragFilePath) !== getFileExt(dropFilePath)) {
            return notify(NotifyType.notSupported);
        }

        // Use Unix time as the ID of the reference link.
        const index: string = new Date().getTime().toString();

        const filename = path.basename(dragFilePath);

        const editor = vscode.window.activeTextEditor;

        // Place data at the end of the file.
        editor?.edit((editBuilder: vscode.TextEditorEdit) => {
            // Insert a reference link at the dropped position.
            editBuilder.insert(
                _position,
                getImportTag(index, filename)
            );

            // Insert DataUrl at the end of the file.
            editBuilder.insert(
                new vscode.Position(editor.document.lineCount, 0),
                getImportData(dragFilePath, index)
            );
        });

        // Insert text
        return {
            insertText: ""
        };
    }
}
