import * as vscode from "vscode";

/**
 * Declared language identifiers
 * for drop edit provider registration
 */
export const selectors: vscode.DocumentSelector = [
    {
        language: "markdown",
        scheme: "file"
    },
];
