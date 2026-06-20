

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const { scanProject } = require('./parser/projectScanner');
const { generateReadme } = require('./generator/readmeGenerator');
const { writeReadme } = require('./utils/fileSystem');

function activate(context) {

    console.log('Pitcher Activated');

    //       FIX: Create the panel completely before trying to access its webview property
    // const panel = vscode.window.createWebviewPanel(
    //     'pitcher',
    //     'Extension: Pitcher for VS Code',
    //     vscode.ViewColumn.One,
    //     { enableScripts: true } // Webview options. More on these later.
    // );




    // panel.webview.onDidReceiveMessage(message => {
    //     switch (message.command) {
    //         case 'alert':
    //             vscode.window.showInformationMessage(message.text);
    //             return;
    //     }
    // });


    const saveListener = vscode.workspace.onDidSaveTextDocument(
        async (document) => {

            const workspace = vscode.workspace.workspaceFolders?.[0];

            if (!workspace) {
                return;
            }

            const readmePath = path.join(
                workspace.uri.fsPath,
                'README.md'
            );

            // README pe save hua hai to ignore karo (infinite loop se bachne ke liye)
            if (path.basename(document.fileName) === 'README.md') {
                return;
            }

            // 1. Check karo ki README pehle se exist karti hai ya nahi
            const isUpdate = fs.existsSync(readmePath);

            if (isUpdate) {
                console.log('README found. Updating...');
            } else {
                console.log('README not found. Generating...');
            }

            const project = await scanProject();
            const content = generateReadme(project);

            // README write/overwrite karein
            writeReadme(
                readmePath,
                content
            );

            // 2. Conditionally alag-alag notification show karein
            if (isUpdate) {
                vscode.window.showInformationMessage(
                    'README.md updated successfully!'
                );
            } else {
                vscode.window.showInformationMessage(
                    'README.md created successfully!'
                );
            }
        }
    );

    context.subscriptions.push(saveListener);
}

function deactivate() { }


module.exports = {
    activate,
    deactivate
};

