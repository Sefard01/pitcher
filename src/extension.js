

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const { scanProject } = require('./parser/projectScanner');
const { generateReadme } = require('./generator/readmeGenerator');
const { writeReadme } = require('./utils/fileSystem');

function activate(context) {

    console.log('Pitcher Activated');

    //       FIX: Create the panel completely before trying to access its webview property
    const panel = vscode.window.createWebviewPanel(
        'pitcher',
        'Extension: Pitcher for VS Code',
        vscode.ViewColumn.One,
        { enableScripts: true } // Webview options. More on these later.
    );




    panel.webview.html = getWebviewContent();
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'alert':
                vscode.window.showInformationMessage(message.text);
                return;
        }
    });


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

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pitcher Extension Detail</title>
    <style>
        :root {
            --bg-primary: #121212;
            --bg-secondary: #1a1a1a;
            --text-main: #e0e0e0;
            --text-muted: #888888;
            --text-link: #ffaa00;
            --pitcher-yellow: #ffcc00;
            --pitcher-orange: #ff6600;
            --border-color: #2d2d2d;
            --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* Pure window screen ko freeze karne ke liye rules */
        html, body {
            background-color: var(--bg-primary);
            color: var(--text-main);
            font-family: var(--font-family);
            margin: 0;
            padding: 0;
            height: 100vh;
            width: 100vw;
            overflow: hidden; /* Main window scrollbar disabled */
            display: flex;
            flex-direction: column;
        }

        /* Fixed Top Assembly (Header + Tabs) */
        .fixed-top-wrapper {
            padding: 24px 24px 0 24px;
            flex-shrink: 0; /* Header space ko reduce nahi hone dega */
            background-color: var(--bg-primary);
        }

        /* Header Section */
        .header-container {
            display: flex;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 24px;
        }

        .logo-container {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, var(--pitcher-orange), var(--pitcher-yellow));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .logo-icon {
            width: 70px;
            height: 70px;
            fill: #121212;
        }

        .header-info h1 {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #ffffff;
            letter-spacing: -0.5px;
        }

        .meta-line {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
            margin-bottom: 12px;
        }

        .publisher {
            color: var(--pitcher-yellow);
            font-weight: 600;
            text-decoration: none;
        }

        .verified-badge {
            background-color: #222222;
            color: var(--pitcher-yellow);
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #444444;
        }

        .tagline {
            font-size: 14px;
            color: #b3b3b3;
            margin: 0 0 16px 0;
            max-width: 700px;
        }

        .action-buttons {
            display: flex;
            gap: 8px;
        }

        .btn {
            background-color: var(--bg-secondary);
            color: #ffffff;
            border: 1px solid var(--border-color);
            padding: 6px 16px;
            font-size: 13px;
            cursor: pointer;
            border-radius: 4px;
        }

        .btn-primary {
            background-color: var(--pitcher-orange);
            border-color: var(--pitcher-orange);
            color: #121212;
            font-weight: 600;
        }

        /* Tabs Block */
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            gap: 20px;
        }

        .tab {
            padding: 8px 4px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid transparent;
        }

        .tab.active {
            color: #ffffff;
            border-bottom: 2px solid var(--pitcher-yellow);
        }

        /* DYNAMIC INNER WORKSPACE GRID */
        .main-layout {
            display: grid;
            grid-template-columns: 1fr 320px;
            gap: 48px;
            flex-grow: 1; /* Bacha hua saara vertical space le lega */
            overflow: hidden; /* Apne andar ke elements ko container se bahar wrap hone se rokega */
            padding: 24px;
            box-sizing: border-box;
        }

        /* Left Content Panel: YAHAN SCROLLBAR CHALEGA */
        .content-left {
            height: 100%;
            overflow-y: auto; /* Sirf left pane vertical scroll hoga */
            padding-right: 12px; /* Scrollbar separation track */
            box-sizing: border-box;
        }

        /* Custom Scrollbar Aesthetic for Webviews */
        .content-left::-webkit-scrollbar {
            width: 8px;
        }
        .content-left::-webkit-scrollbar-track {
            background: transparent;
        }
        .content-left::-webkit-scrollbar-thumb {
            background: #2d2d2d;
            border-radius: 4px;
        }
        .content-left::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        .tab-panel {
            display: none;
        }

        .tab-panel.active {
            display: block;
        }

        .content-left h2 {
            font-size: 20px;
            color: #ffffff;
            font-weight: 600;
            margin: 0 0 16px 0;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 8px;
        }

        .content-left p, .content-left li {
            font-size: 14px;
            color: #cccccc;
            line-height: 1.6;
        }

        .callout {
            border-left: 4px solid var(--pitcher-yellow);
            background-color: var(--bg-secondary);
            padding: 14px 18px;
            margin: 20px 0;
            font-size: 14px;
            border-radius: 0 4px 4px 0;
        }

        code {
            background-color: #222222;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            color: #ff8800;
        }

        /* Right Side Sidebar: LOCK STATUS (NO SCROLL) */
        .sidebar {
            height: 100%;
            overflow: hidden; /* Sidebar strict rigid lock */
        }

        .sidebar-section {
            margin-bottom: 24px;
            background-color: var(--bg-secondary);
            padding: 16px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }

        .sidebar-section h3 {
            font-size: 13px;
            color: #ffffff;
            margin: 0 0 14px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 6px 0;
            font-size: 13px;
        }

        .info-table td:first-child {
            color: var(--text-muted);
            width: 110px;
        }

        .highlight-data {
            color: var(--pitcher-yellow) !important;
        }

        .badges-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .badge {
            background-color: #252525;
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
        }
    </style>
</head>
<body>

    <div class="fixed-top-wrapper">
        <div class="header-container">
            <div class="logo-container">
                <svg class="logo-icon" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
            </div>
            <div class="header-info">
                <h1>Pitcher</h1>
                <div class="meta-line">
                    <span class="publisher">Himanshu Singh Production</span>
                    <span class="verified-badge">✓ Open Source</span>
                    <span class="downloads">⤓ Development Version</span>
                </div>
                <p class="tagline">Streamline documentation by generating high-quality, comprehensive README markdown structures directly inside your development panel.</p>
                <div class="action-buttons">
                    <button class="btn btn-primary">Run Command</button>
                    <button class="btn">Disable</button>
                    <button class="btn">Uninstall</button>
                </div>
            </div>
        </div>

        <div class="tabs">
            <div class="tab active" data-target="tab-details">Details</div>
            <div class="tab" data-target="tab-features">Features</div>
            <div class="tab" data-target="tab-changelog">Changelog</div>
        </div>
    </div>

    <div class="main-layout">

        <div class="content-left">

            <div id="tab-details" class="tab-panel active">
                <h2>The Pitcher README Engine</h2>
                <p><strong>Pitcher</strong> is an intuitive VS Code extension engineered to accelerate project onboarding by automating markdown documentation compilation. Built directly on the VS Code Extensibility Engine, it removes the friction of manual layout structuring by deploying standard document scaffolds in one swift execution.</p>
                <div class="callout">
                    <strong>Prerequisites:</strong> Pitcher runs natively on Visual Studio Code <code>v1.74</code> and later. No external dependencies or remote keys required.
                </div>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                <h2>Activation Commands</h2>
                <p>Open the Command Palette (<code>Ctrl+Shift+P</code>) and invoke:</p>
                <p><code>pitcher.helloWorld</code> — Spawns the main interactive README compiler view panel.</p>
            </div>

            <div id="tab-features" class="tab-panel">
                <h2>Extension Features</h2>
                <ul>
                    <li><strong>One-Click Scaffolding:</strong> Immediately inject pre-built professional structures into your workspace.</li>
                    <li><strong>Theme Compliance:</strong> Adapts cleanly to dark, light, or custom high-contrast systems natively.</li>
                    <li><strong>Interactive Context Windows:</strong> Configure options fluidly without editing complex configuration raw maps.</li>
                    <li><strong>Zero Dependencies:</strong> Runs entirely on your local development context machine without cloud tracking layers.</li>
                </ul>
            </div>

            <div id="tab-changelog" class="tab-panel">
                <h2>Changelog History</h2>
                <h3 style="color: var(--pitcher-yellow); font-size: 16px;">v1.0.0 (June 2026)</h3>
                <p style="margin-left: 12px; color: #aaaaaa;">— Initial beta deployment launch.<br>— Implemented native Webview UI panels with secure isolated CSP architectures.<br>— Integrated unified theme token tracking variables.</p>
            </div>

        </div>

        <div class="sidebar">
            <div class="sidebar-section">
                <h3>Installation</h3>
                <table class="info-table">
                    <tr>
                        <td>Identifier</td>
                        <td>pitcher.readme-generator</td>
                    </tr>
                    <tr>
                        <td>Version</td>
                        <td>1.0.0</td>
                    </tr>
                    <tr>
                        <td>Size</td>
                        <td class="highlight-data">Lightweight</td>
                    </tr>
                </table>
            </div>

            <div class="sidebar-section">
                <h3>Ecosystem</h3>
                <table class="info-table">
                    <tr>
                        <td>Published</td>
                        <td>June 2026</td>
                    </tr>
                    <tr>
                        <td>Licensing</td>
                        <td>MIT Approved</td>
                    </tr>
                </table>
            </div>

            <div class="sidebar-section">
                <h3>Categories</h3>
                <div class="badges-container">
                    <div class="badge">Documentation</div>
                    <div class="badge">Productivity</div>
                    <div class="badge">Markdown</div>
                </div>
            </div>
        </div>

    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const tabs = document.querySelectorAll('.tab');
            const panels = document.querySelectorAll('.tab-panel');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));

                    tab.classList.add('active');
                    const targetId = tab.getAttribute('data-target');
                    document.getElementById(targetId).classList.add('active');

                    // Tab switch hone par scroll up ho jaye automatic
                    document.querySelector('.content-left').scrollTop = 0;
                });
            });
        });
    </script>
</body>
</html>

`;
}
module.exports = {
    activate,
    deactivate
};

