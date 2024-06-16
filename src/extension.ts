// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from 'path';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jvmcreatetestfile" is now active!');


	const getCurrentFilePackage = (filePath: string): string => {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
		if (workspaceFolder) {
			const workspaceFolderPath = workspaceFolder.uri.fsPath;
			const relativePath = path.relative(workspaceFolderPath, filePath);
			const packagePath = path.dirname(relativePath);
			const packageSegments = packagePath.split(path.sep);
			return packageSegments.slice(3).join('.');
		}
		return '';
	};

	// Inside the activate function, add a new command registration
	const newFileDisposable = vscode.commands.registerCommand('jvmcreatetestfile.createTestFile', async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const currentFilePath = activeEditor.document.uri.fsPath;
		console.log("currentFilePath: ", currentFilePath);
		const newFilePath = currentFilePath.replace("src/main", "src/test").replace("src\\main", "src\\test");
		console.log("newFilePath: ", newFilePath);
		const currentClassName = activeEditor.document.getText(activeEditor.document.getWordRangeAtPosition(activeEditor.selection.active));
		if (!currentClassName) {
			vscode.window.showErrorMessage('No class name found.');
			return;
		}

		const className = await vscode.window.showInputBox({
			prompt: 'Enter the new class name',
			value: currentClassName + 'Test',
		});

		if (className) {
			const currentFilePackage = getCurrentFilePackage(currentFilePath);
			const fileExt = path.extname(currentFilePath).replace(/^\./, '');
			const newFileName = `${className}.${fileExt}`;
			let newFileContent;
			if (fileExt === 'scala') {
				newFileContent = `package ${currentFilePackage};\n\nclass ${className} extends munit.FunSuite {}`;
			} else if (fileExt === 'java') {
				newFileContent = `package ${currentFilePackage};\n\npublic class ${className} {}`;
			}
			if (!newFileContent) {
				vscode.window.showErrorMessage(`Unsupported file extension: ${fileExt}`);
				return;
			}
			const newFilePathWithNewFilename = path.join(path.dirname(newFilePath), newFileName);
			const fileExists = await vscode.workspace.fs.stat(vscode.Uri.file(newFilePathWithNewFilename)).then(() => true, () => false);
			if (fileExists) {
				vscode.window.showInformationMessage(`File already exists: ${newFilePathWithNewFilename}`);
			} else {
				try {
					await vscode.workspace.fs.writeFile(vscode.Uri.file(newFilePathWithNewFilename), Buffer.from(newFileContent));
					vscode.window.showInformationMessage(`New class created: ${newFilePathWithNewFilename}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to create class: ${error}`);
				}
			}
			// open new file
			await vscode.window.showTextDocument(vscode.Uri.file(newFilePathWithNewFilename));
		}
	});


	context.subscriptions.push(newFileDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
