const TEXT_FILE_EXTENSIONS = [
    'txt', 'log', 'md', 'markdown', 'rst', 'csv', 'tsv',
    'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'cnf',
    'html', 'htm', 'css', 'scss', 'sass', 'less',
    'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx',
    'py', 'pyw', 'rb', 'php', 'java', 'kt', 'kts', 'scala',
    'c', 'h', 'cpp', 'hpp', 'cc', 'cxx', 'cs', 'go', 'rs', 'swift',
    'sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1', 'psm1',
    'sql', 'graphql', 'gql',
    'vue', 'svelte', 'astro',
    'dockerfile', 'makefile', 'rakefile',
    'env', 'gitignore', 'dockerignore', 'editorconfig',
    'properties', 'gradle', 'sbt',
    'r', 'lua', 'pl', 'pm', 'perl',
];

const SPECIAL_TEXT_FILES = [
    'dockerfile', 'makefile', 'rakefile',
    '.gitignore', '.dockerignore', '.editorconfig', '.env',
];

const EXT_TO_LANGUAGE = {
    'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript',
    'ts': 'typescript', 'tsx': 'typescript',
    'py': 'python', 'pyw': 'python',
    'sh': 'bash', 'bash': 'bash', 'zsh': 'bash', 'fish': 'bash',
    'json': 'json',
    'xml': 'xml', 'html': 'xml', 'htm': 'xml', 'svg': 'xml',
    'css': 'css', 'scss': 'css', 'sass': 'css', 'less': 'css',
    'sql': 'sql',
    'yaml': 'yaml', 'yml': 'yaml',
    'md': 'markdown', 'markdown': 'markdown',
    'go': 'go',
    'java': 'java', 'kt': 'kotlin', 'kts': 'kotlin', 'scala': 'scala',
    'php': 'php',
    'rb': 'ruby',
    'rs': 'rust',
    'c': 'c', 'h': 'c',
    'cpp': 'cpp', 'hpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp',
    'cs': 'csharp',
    'swift': 'swift',
    'ini': 'ini', 'conf': 'ini', 'cfg': 'ini', 'cnf': 'ini', 'toml': 'ini',
    'dockerfile': 'dockerfile',
    'makefile': 'plaintext',
    'lua': 'lua',
    'pl': 'perl', 'pm': 'perl', 'perl': 'perl',
    'r': 'r',
    'vue': 'xml', 'svelte': 'xml', 'astro': 'xml',
    'graphql': 'plaintext', 'gql': 'plaintext',
    'env': 'shell',
};

export function isTextFile(fileName) {
    if (!fileName) return false;
    const name = fileName.toLowerCase();
    const baseName = name.split('/').pop();
    if (SPECIAL_TEXT_FILES.includes(baseName)) return true;
    const ext = baseName.split('.').pop();
    if (ext === baseName) return false;
    return TEXT_FILE_EXTENSIONS.includes(ext);
}

export function getLanguageFromExt(fileName) {
    if (!fileName) return 'plaintext';
    const name = fileName.toLowerCase();
    const baseName = name.split('/').pop();
    // 特殊文件名
    if (baseName === 'dockerfile') return 'dockerfile';
    if (baseName === 'makefile' || baseName === 'rakefile') return 'plaintext';
    if (baseName.startsWith('.env')) return 'shell';
    if (baseName === '.gitignore' || baseName === '.dockerignore') return 'plaintext';
    const ext = baseName.split('.').pop();
    return EXT_TO_LANGUAGE[ext] || 'plaintext';
}
