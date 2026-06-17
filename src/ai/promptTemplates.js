function createReadmePrompt(info) {

    return `
Generate a professional README.

Project Name:
${info.projectName}

Project Type:
${info.projectType}

Tech Stack:
${info.techStack.join(', ')}

Total Files:
${info.totalFiles}

Important Files:
${info.importantFiles.join(', ')}

Create sections:

1. Project Title
2. Description
3. Features
4. Tech Stack
5. Project Structure
6. Installation
7. Usage
8. Future Improvements
9. License
`;
}

module.exports = {
    createReadmePrompt
};