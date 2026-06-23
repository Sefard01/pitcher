const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function scanProject() {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
        return null;
    }

    const rootPath = workspace.uri.fsPath;
    const projectName = path.basename(rootPath);

    // 1. Find all files using VS Code API
    const excludePattern = '**/{node_modules,.git,dist,build,coverage,.next,out}/**';
    const files = await vscode.workspace.findFiles('**/*', excludePattern);

    const rawPaths = [];
    const fileNames = [];
    const techStack = [];
    const folders = new Set();
    const languageStats = {};
    let emptyFoldersCount = 0;

    // 2. Physical File System Scan for ALL directories & empty ones
    function checkDirectories(dir) {
        let items = [];
        try {
            items = fs.readdirSync(dir);
        } catch (err) {
            return; 
        }

        const ignoredDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out'];
        if (ignoredDirs.includes(path.basename(dir))) {
            return;
        }

        if (items.length === 0 && dir !== rootPath) {
            emptyFoldersCount++;
            const relativeEmptyPath = path.relative(rootPath, dir);
            rawPaths.push(relativeEmptyPath); 
            folders.add(relativeEmptyPath);
            return;
        }

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            let stats;
            try {
                stats = fs.statSync(fullPath);
            } catch (err) {
                return;
            }

            if (stats.isDirectory()) {
                const relativeFolder = path.relative(rootPath, fullPath);
                folders.add(relativeFolder);
                checkDirectories(fullPath);
            }
        });
    }

    checkDirectories(rootPath);

    // 3. Process Files Found
    files.forEach(file => {
        const relativePath = path.relative(rootPath, file.fsPath);
        rawPaths.push(relativePath);

        const fileName = path.basename(file.fsPath);
        fileNames.push(fileName);

        const ext = path.extname(fileName);
        if (ext) {
            languageStats[ext] = (languageStats[ext] || 0) + 1;
        }
    });

    // 4. Tree Builder (Fixed for cross-platform matching)
    function buildTree(paths) {
        const tree = {};

        paths.forEach(filePath => {
            const normalizedPath = filePath.replace(/\\/g, '/');
            const parts = normalizedPath.split('/').filter(Boolean);
            let current = tree;

            parts.forEach(part => {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            });
        });

        const result = [];
        function traverse(node, prefix = '') {
            const keys = Object.keys(node);
            keys.forEach((key, index) => {
                const isLast = index === keys.length - 1;
                result.push(prefix + (isLast ? '└── ' : '├── ') + key);
                traverse(node[key], prefix + (isLast ? '    ' : '│   '));
            });
        }

        traverse(tree);
        return result;
    }

    // 5. Author & package.json Detection
    let packageAuthor = '';
    const packageJsonPath = path.join(rootPath, 'package.json');
    try {
        if (fs.existsSync(packageJsonPath)) {
            techStack.push('Node.js');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            if (packageJson.author) {
                packageAuthor = typeof packageJson.author === 'object' 
                    ? packageJson.author.name 
                    : packageJson.author;
            }

            const deps = {
                ...(packageJson.dependencies || {}),
                ...(packageJson.devDependencies || {})
            };

            if (deps.react) techStack.push('React');
            if (deps.next) techStack.push('Next.js');
            if (deps.express) techStack.push('Express');
            if (deps.mongoose) techStack.push('MongoDB');
            if (deps.mysql2) techStack.push('MySQL');
            if (deps.pg) techStack.push('PostgreSQL');
            if (deps.firebase) techStack.push('Firebase');
            if (deps.tailwindcss) techStack.push('Tailwind CSS');
            if (deps.typescript) techStack.push('TypeScript');
            if (deps.vue) techStack.push('Vue.js');
            if (deps.angular) techStack.push('Angular');
            if (deps.nestjs) techStack.push('NestJS');
        }
    } catch (err) {
        console.error('Package.json Error:', err);
    }

    // Git configuration extraction for global fallback
    let gitAuthor = '';
    try {
        gitAuthor = execSync('git config user.name', { cwd: rootPath }).toString().trim();
    } catch (e) {
        // Fallback transparent silently
    }

    const finalAuthor = packageAuthor || gitAuthor || 'Developer';

    // 6. Extension & Configuration File Detections
    if (fileNames.some(file => file.endsWith('.html'))) techStack.push('HTML');
    if (fileNames.some(file => file.endsWith('.css'))) techStack.push('CSS');
    if (fileNames.some(file => file.endsWith('.js'))) techStack.push('JavaScript');
    if (fileNames.some(file => file.endsWith('.ts'))) techStack.push('TypeScript');
    if (fileNames.some(file => file.endsWith('.java')) || fileNames.includes('pom.xml')) techStack.push('Java');
    if (fileNames.some(file => file.endsWith('.py')) || fileNames.includes('requirements.txt')) techStack.push('Python');
    if (fileNames.some(file => file.endsWith('.php'))) techStack.push('PHP');
    if (fileNames.some(file => file.endsWith('.cs'))) techStack.push('C#');
    if (fileNames.some(file => file.endsWith('.cpp') || file.endsWith('.hpp'))) techStack.push('C++');
    if (fileNames.some(file => file.endsWith('.c'))) techStack.push('C');
    if (fileNames.some(file => file.endsWith('.dart')) || fileNames.includes('pubspec.yaml')) {
        techStack.push('Dart');
        if (fileNames.includes('pubspec.yaml')) techStack.push('Flutter');
    }
    if (fileNames.includes('Dockerfile')) techStack.push('Docker');
    if (fileNames.includes('.env')) techStack.push('Environment Variables');
    if (fileNames.includes('extension.js') || fileNames.includes('extension.ts')) techStack.push('VS Code Extension');

    const uniqueTechStack = [...new Set(techStack)];
    const structure = buildTree(rawPaths);
    
    // Project Type Detection
    let projectType = 'Unknown Project';
    if (uniqueTechStack.includes('VS Code Extension')) projectType = 'VS Code Extension';
    else if (uniqueTechStack.includes('Next.js')) projectType = 'Next.js Application';
    else if (uniqueTechStack.includes('React')) projectType = 'React Application';
    else if (uniqueTechStack.includes('Express')) projectType = 'REST API Backend';
    else if (uniqueTechStack.includes('Flutter')) projectType = 'Flutter Application';
    else if (uniqueTechStack.includes('Python')) projectType = 'Python Application';
    else if (uniqueTechStack.includes('Java')) projectType = 'Java Application';
    else if (uniqueTechStack.includes('HTML') && uniqueTechStack.includes('CSS') && uniqueTechStack.includes('JavaScript')) {
        projectType = 'Frontend Web Application';
    }

    return {
        projectName,
        projectType,
        author: finalAuthor,
        totalFiles: files.length,
        totalFolders: folders.size,
        emptyFoldersCount,
        techStack: uniqueTechStack,
        languageStats,
        structure
    };
}

module.exports = {
    scanProject
};