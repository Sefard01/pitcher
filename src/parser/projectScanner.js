const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

async function scanProject() {

    const workspace =
        vscode.workspace.workspaceFolders?.[0];

    if (!workspace) {
        return null;
    }

    const rootPath =
        workspace.uri.fsPath;

    const projectName =
        path.basename(rootPath);

    const files =
        await vscode.workspace.findFiles(
            '**/*',
            '**/{node_modules,.git,dist,build,coverage,.next,out}/**'
        );

    const rawPaths = [];
    const fileNames = [];
    const techStack = [];
    const folders = new Set();
    const languageStats = {};

    function buildTree(paths) {

        const tree = {};

        paths.forEach(filePath => {

            const parts =
                filePath.split(path.sep);

            let current = tree;

            parts.forEach(part => {

                if (!current[part]) {
                    current[part] = {};
                }

                current = current[part];
            });
        });

        const result = [];

        function traverse(
            node,
            prefix = ''
        ) {

            const keys =
                Object.keys(node);

            keys.forEach(
                (key, index) => {

                    const isLast =
                        index ===
                        keys.length - 1;

                    result.push(
                        prefix +
                        (isLast
                            ? '└── '
                            : '├── ') +
                        key
                    );

                    traverse(
                        node[key],
                        prefix +
                        (isLast
                            ? '    '
                            : '│   ')
                    );
                }
            );
        }

        traverse(tree);

        return result;
    }

    files.forEach(file => {

        const relativePath =
            path.relative(
                rootPath,
                file.fsPath
            );

        rawPaths.push(relativePath);

        const fileName =
            path.basename(file.fsPath);

        fileNames.push(fileName);

        folders.add(
            path.dirname(relativePath)
        );

        // Language Statistics

        const ext =
            path.extname(fileName);

        if (ext) {

            languageStats[ext] =
                (languageStats[ext] || 0)
                + 1;
        }
    });


    // package.json Detection


    const packageJsonPath =
        path.join(
            rootPath,
            'package.json'
        );

    if (
        fs.existsSync(
            packageJsonPath
        )
    )

        techStack.push(
            'Node.js'
        );

    try {

        const packageJson =
            JSON.parse(
                fs.readFileSync(
                    packageJsonPath,
                    'utf8'
                )
            );

        const deps = {

            ...(packageJson.dependencies || {}),

            ...(packageJson.devDependencies || {})
        };

        if (deps.react)
            techStack.push('React');

        if (deps.next)
            techStack.push('Next.js');

        if (deps.express)
            techStack.push('Express');

        if (deps.mongoose)
            techStack.push('MongoDB');

        if (deps.mysql2)
            techStack.push('MySQL');

        if (deps.pg)
            techStack.push('PostgreSQL');

        if (deps.firebase)
            techStack.push('Firebase');

        if (deps.tailwindcss)
            techStack.push('Tailwind CSS');

        if (deps.typescript)
            techStack.push('TypeScript');

        if (deps.vue)
            techStack.push('Vue.js');

        if (deps.angular)
            techStack.push('Angular');

        if (deps.nestjs)
            techStack.push('NestJS');

    } catch (err) {

        console.log(
            'Package.json Error:',
            err
        );
    }

    // Extension Detection


    if (
        fileNames.some(
            file => file.endsWith('.html')
        )
    ) {
        techStack.push('HTML');
    }

    if (
        fileNames.some(
            file => file.endsWith('.css')
        )
    ) {
        techStack.push('CSS');
    }

    if (
        fileNames.some(
            file => file.endsWith('.js')
        )
    ) {
        techStack.push('JavaScript');
    }

    if (
        fileNames.some(
            file => file.endsWith('.ts')
        )
    ) {
        techStack.push('TypeScript');
    }

    if (
        fileNames.some(
            file => file.endsWith('.java')
        )
    ) {
        techStack.push('Java');
    }

    if (
        fileNames.some(
            file => file.endsWith('.py')
        )
    ) {
        techStack.push('Python');
    }

    if (
        fileNames.some(
            file => file.endsWith('.php')
        )
    ) {
        techStack.push('PHP');
    }

    if (
        fileNames.some(
            file => file.endsWith('.cs')
        )
    ) {
        techStack.push('C#');
    }

    if (
        fileNames.some(
            file =>
                file.endsWith('.cpp') ||
                file.endsWith('.hpp')
        )
    ) {
        techStack.push('C++');
    }

    if (
        fileNames.some(
            file => file.endsWith('.c')
        )
    ) {
        techStack.push('C');
    }

    if (
        fileNames.some(
            file => file.endsWith('.dart')
        )
    ) {
        techStack.push('Dart');
    }


    // Config Files Detection

    if (
        fileNames.includes(
            'requirements.txt'
        )
    ) {
        techStack.push('Python');
    }

    if (
        fileNames.includes(
            'pom.xml'
        )
    ) {
        techStack.push('Java');
    }

    if (
        fileNames.includes(
            'pubspec.yaml'
        )
    ) {
        techStack.push('Flutter');
        techStack.push('Dart');
    }

    if (
        fileNames.includes(
            'Dockerfile'
        )
    ) {
        techStack.push('Docker');
    }

    if (
        fileNames.includes(
            '.env'
        )
    ) {
        techStack.push(
            'Environment Variables'
        );
    }


    // VS Code Extension Detection

    if (

        fileNames.includes(
            'extension.js'
        ) ||

        fileNames.includes(
            'extension.ts'
        )
    ) {

        techStack.push(
            'VS Code Extension'
        );
    }



    // Remove Duplicates


    const uniqueTechStack =
        [...new Set(techStack)];

    // Project Type Detection


    const structure =
        buildTree(rawPaths);
    let projectType =
        'Unknown Project';

    if (
        uniqueTechStack.includes(
            'VS Code Extension'
        )
    ) {

        projectType =
            'VS Code Extension';
    }

    else if (
        uniqueTechStack.includes(
            'Next.js'
        )
    ) {

        projectType =
            'Next.js Application';
    }

    else if (
        uniqueTechStack.includes(
            'React'
        )
    ) {

        projectType =
            'React Application';
    }

    else if (
        uniqueTechStack.includes(
            'Express'
        )
    ) {

        projectType =
            'REST API Backend';
    }

    else if (
        uniqueTechStack.includes(
            'Flutter'
        )
    ) {

        projectType =
            'Flutter Application';
    }

    else if (
        uniqueTechStack.includes(
            'Python'
        )
    ) {

        projectType =
            'Python Application';
    }

    else if (
        uniqueTechStack.includes(
            'Java'
        )
    ) {

        projectType =
            'Java Application';
    }

    else if (

        uniqueTechStack.includes(
            'HTML'
        ) &&

        uniqueTechStack.includes(
            'CSS'
        ) &&

        uniqueTechStack.includes(
            'JavaScript'
        )
    ) {

        projectType =
            'Frontend Web Application';
    }

    return {

        projectName,

        projectType,

        totalFiles:
            files.length,

        totalFolders:
            folders.size,

        techStack:
            uniqueTechStack,

        languageStats,

        structure
    };
}

module.exports = {
    scanProject
};