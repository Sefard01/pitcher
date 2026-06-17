const fs = require('fs');

function writeReadme(
    readmePath,
    generatedContent
) {

    const startTag =
        '<!-- PITCHER_START -->';

    const endTag =
        '<!-- PITCHER_END -->';

    if (
        !fs.existsSync(
            readmePath
        )
    ) {

        fs.writeFileSync(
            readmePath,

            `# Project

## Description

Write your project description here.

${startTag}

${generatedContent}

${endTag}
`,
            'utf8'
        );

        return;
    }

    const existingContent =
        fs.readFileSync(
            readmePath,
            'utf8'
        );

    if (
        existingContent.includes(startTag) &&
        existingContent.includes(endTag)
    ) {

        const updatedContent =
            existingContent.replace(
                /<!-- PITCHER_START -->[\s\S]*?<!-- PITCHER_END -->/,
                `${startTag}

${generatedContent}

${endTag}`
            );

        fs.writeFileSync(
            readmePath,
            updatedContent,
            'utf8'
        );

        return;
    }

    fs.writeFileSync(
        readmePath,

        existingContent +

        `

${startTag}

${generatedContent}

${endTag}
`,
        'utf8'
    );
}

module.exports = {
    writeReadme
};