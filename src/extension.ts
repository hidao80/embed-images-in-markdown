import * as vscode from 'vscode';

import {  EmbeddingImagesOnDropProvider } from './auto-import-on-drop-provider';
import { selectors } from './providers';

/**
 * Called when the extension is activated.
 * Extension is activated the first time the command is executed.
 * @param {vscode.ExtensionContext} context An extension context is a collection of utilities private to an extension.
 * @returns void
 */
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
        vscode.languages.registerDocumentDropEditProvider(selectors, new EmbeddingImagesOnDropProvider())
	);
}
