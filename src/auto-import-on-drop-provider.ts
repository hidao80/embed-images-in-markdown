import * as vscode from "vscode";

import { getImportTag, getImportData, getData, getFileExt, notify } from './modules';
import { NotifyType } from "./model";

/**
 * Drag and drop handler
 */
export class AutoImportOnDropProvider
    implements vscode.DocumentDropEditProvider
{
    async provideDocumentDropEdits(
        _document: vscode.TextDocument,
        _position: vscode.Position,
        _dataTransfer: vscode.DataTransfer,
        _token: vscode.CancellationToken
    ): Promise<vscode.DocumentDropEdit> {
        // Get the active text editor file path and dragged file path from tree view
        // await vscode.commands.executeCommand('copyFilePath');
        // const dragFilePath = await vscode.env.clipboard.readText();
        const dragFilePath = getData(_dataTransfer)?.asFile()?.uri?.fsPath ?? _document.uri.fsPath;
        const dropFilePath = _document.uri.fsPath;

        // Prevents same file drag and drop
        if (dragFilePath.toLowerCase() === dropFilePath.toLowerCase()) {
            return notify(NotifyType.sameFilePath);
        }

        // Prevents unsupported drag and drop
        if (
            // Checks unsupported drag and drop files
            (getFileExt(dragFilePath) !== getFileExt(dropFilePath) &&
                ![".md"].includes(
                    getFileExt(dropFilePath)
                ))
        ) {
            return notify(NotifyType.notSupported);
        }

        // Use UUID as the ID of the reference link.
        const index: string = new Date().getTime().toString();

        const editor = vscode.window.activeTextEditor;

        // Place data at the end of the file.
        editor?.edit((editBuilder: vscode.TextEditorEdit) => {
            // Insert a reference link at the dropped position.
            editBuilder.insert(
                _position,
                getImportTag(index)
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
