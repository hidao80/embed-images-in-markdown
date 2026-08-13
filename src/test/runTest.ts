import * as path from 'path';

import { runTests } from '@vscode/test-electron';

/**
 * Downloads VS Code and runs the extension's integration test suite against it.
 * @returns {Promise<void>} Resolves when the test run completes, or exits the process on failure.
 */
async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
