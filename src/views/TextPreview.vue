<template>
    <div class="text-preview-page">
        <div class="preview-header">
            <h1>{{ displayName }}</h1>
            <div class="preview-header-right">
                <div class="theme-selector">
                    <span class="theme-label">主题：</span>
                    <el-select v-model="currentCodeTheme" @change="handleThemeChange" size="small" style="width: 180px;">
                        <el-option
                            v-for="theme in darkThemes"
                            :key="theme.value"
                            :label="theme.label"
                            :value="theme.value">
                        </el-option>
                    </el-select>
                </div>
                <div class="preview-actions">
                    <el-button @click="copyContent" :disabled="loading">
                        <font-awesome-icon icon="copy" style="margin-right: 4px;" />
                        复制文件内容
                    </el-button>
                    <el-button @click="copyFileLink" :disabled="loading">
                        <font-awesome-icon icon="link" style="margin-right: 4px;" />
                        复制下载链接
                    </el-button>
                    <el-button @click="downloadFile" :disabled="loading">
                        <font-awesome-icon icon="download" style="margin-right: 4px;" />
                        下载文件
                    </el-button>
                </div>
            </div>
        </div>
        <div class="preview-content">
            <div v-if="loading" class="preview-loading">
                <el-icon class="is-loading" :size="40">
                    <Loading />
                </el-icon>
                <p>加载中...</p>
            </div>
            <div v-else-if="error" class="preview-error">
                <p>加载失败: {{ error }}</p>
            </div>
            <div v-else class="preview-code">
                <pre><code v-html="highlighted" class="hljs"></code></pre>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { darkThemes } from '@/utils/highlightTheme';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import php from 'highlight.js/lib/languages/php';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import ini from 'highlight.js/lib/languages/ini';
import shell from 'highlight.js/lib/languages/shell';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import makefile from 'highlight.js/lib/languages/makefile';
import perl from 'highlight.js/lib/languages/perl';
import lua from 'highlight.js/lib/languages/lua';
import r from 'highlight.js/lib/languages/r';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('php', php);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('perl', perl);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('r', r);

export default {
    name: 'TextPreview',
    data() {
        return {
            fileName: '',
            displayName: '',
            content: '',
            highlighted: '',
            loading: true,
            error: null,
            darkThemes: darkThemes,
        };
    },
    computed: {
        ...mapGetters(['codeTheme']),
        currentCodeTheme: {
            get() {
                return this.codeTheme;
            },
            set(value) {
                this.$store.commit('setCodeTheme', value);
            }
        }
    },
    mounted() {
        this.loadFile();
    },
    methods: {
        handleThemeChange(theme) {
            this.$message.success(`已切换到 ${theme} 主题`);
        },
        async loadFile() {
            // 从路由参数获取文件路径
            const pathParam = this.$route.params.path;
            if (!pathParam) {
                this.error = '文件路径无效';
                this.loading = false;
                return;
            }

            // 将逗号分隔的路径转换回斜杠分隔
            this.fileName = Array.isArray(pathParam) ? pathParam.join('/') : pathParam.replace(/,/g, '/');
            this.displayName = this.fileName.split('/').pop();

            try {
                const fileUrl = process.env.NODE_ENV === 'production'
                    ? `/file/${this.fileName}`
                    : `/api/file/${this.fileName}`;

                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const text = await response.text();
                const language = this.getLanguageFromExt(this.displayName);

                try {
                    this.highlighted = hljs.highlight(text, { language }).value;
                } catch (e) {
                    this.highlighted = this.escapeHtml(text);
                }

                this.content = text;
                this.loading = false;
            } catch (error) {
                this.error = error.message;
                this.loading = false;
            }
        },
        getLanguageFromExt(fileName) {
            const ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();

            // 处理无扩展名的特殊文件
            const baseName = fileName.split('/').pop().toLowerCase();
            if (baseName === 'dockerfile') return 'dockerfile';
            if (baseName === 'makefile' || baseName === 'rakefile') return 'makefile';
            if (baseName === '.gitignore' || baseName === '.dockerignore' || baseName === '.editorconfig') return 'plaintext';

            const langMap = {
                // JavaScript/TypeScript
                'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript',
                'ts': 'typescript', 'tsx': 'typescript',
                // Python
                'py': 'python',
                // Shell scripts
                'sh': 'bash', 'bash': 'bash', 'zsh': 'bash', 'fish': 'bash',
                'bat': 'shell', 'cmd': 'shell', 'ps1': 'shell',
                // Config/Data formats
                'json': 'json', 'jsonc': 'json', 'json5': 'json',
                'xml': 'xml', 'html': 'html', 'htm': 'html', 'xhtml': 'html',
                'css': 'css', 'scss': 'css', 'sass': 'css', 'less': 'css',
                'yaml': 'yaml', 'yml': 'yaml',
                'toml': 'ini',
                'ini': 'ini', 'conf': 'ini', 'config': 'ini', 'cfg': 'ini', 'cnf': 'ini', 'properties': 'ini',
                'env': 'shell',
                // Markdown
                'md': 'markdown', 'markdown': 'markdown',
                // SQL
                'sql': 'sql', 'prisma': 'sql',
                // Programming languages
                'go': 'go',
                'rs': 'rust',
                'php': 'php',
                'java': 'java',
                'c': 'c', 'h': 'c',
                'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'hpp': 'cpp', 'hh': 'cpp', 'hxx': 'cpp',
                'rb': 'ruby',
                'swift': 'swift',
                'kt': 'kotlin', 'kts': 'kotlin',
                'scala': 'scala',
                'pl': 'perl',
                'lua': 'lua',
                'r': 'r',
                // Frontend frameworks
                'vue': 'html', 'svelte': 'html', 'astro': 'html',
                // GraphQL (使用 plaintext，因为 highlight.js 核心不包含 graphql)
                'graphql': 'plaintext', 'gql': 'plaintext',
                // Plain text
                'txt': 'plaintext', 'text': 'plaintext', 'log': 'plaintext',
                'csv': 'plaintext', 'tsv': 'plaintext', 'dat': 'plaintext',
            };
            return langMap[ext] || 'plaintext';
        },
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        async copyContent() {
            try {
                await navigator.clipboard.writeText(this.content);
                this.$message.success('内容已复制到剪贴板');
            } catch (e) {
                this.$message.error('复制失败');
            }
        },
        async copyFileLink() {
            try {
                const fileUrl = process.env.NODE_ENV === 'production'
                    ? `/file/${this.fileName}`
                    : `/api/file/${this.fileName}`;
                const fullUrl = window.location.origin + fileUrl;
                await navigator.clipboard.writeText(fullUrl);
                this.$message.success('下载链接已复制到剪贴板');
            } catch (e) {
                this.$message.error('复制失败');
            }
        },
        downloadFile() {
            const blob = new Blob([this.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.displayName;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
};
</script>

<style scoped>
.text-preview-page {
    min-height: 100vh;
    background: #0d1117;
    color: #c9d1d9;
}

.preview-header {
    background: #161b22;
    padding: 20px 24px;
    border-bottom: 1px solid #30363d;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 100;
}

.preview-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #c9d1d9;
    word-break: break-all;
}

.preview-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.theme-selector {
    display: flex;
    align-items: center;
    gap: 8px;
}

.theme-label {
    color: #c9d1d9;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
}

.preview-actions {
    display: flex;
    gap: 12px;
}

.preview-content {
    padding: 24px;
}

.preview-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #64b5f6;
}

.preview-loading p {
    margin-top: 16px;
    color: #8b949e;
}

.preview-error {
    padding: 40px 20px;
    text-align: center;
    color: #f85149;
}

.preview-code {
    max-width: 100%;
    overflow: auto;
}

.preview-code pre {
    margin: 0;
    padding: 16px;
    background: #0d1117;
    border-radius: 6px;
    overflow-x: auto;
}

.preview-code code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #c9d1d9;
    white-space: pre;
    display: block;
    text-align: left;
}

/* highlight.js 主题 */
.preview-code .hljs {
    background: #0d1117;
    padding: 0;
}

.preview-code .hljs-keyword { color: #ff79c6; }
.preview-code .hljs-string { color: #f1fa8c; }
.preview-code .hljs-number { color: #bd93f9; }
.preview-code .hljs-comment { color: #6272a4; }
.preview-code .hljs-function { color: #50fa7b; }
.preview-code .hljs-class { color: #8be9fd; }
.preview-code .hljs-variable { color: #f8f8f2; }
.preview-code .hljs-operator { color: #ff79c6; }
.preview-code .hljs-punctuation { color: #f8f8f2; }
.preview-code .hljs-property { color: #66d9ef; }
.preview-code .hljs-attr { color: #50fa7b; }
.preview-code .hljs-tag { color: #ff79c6; }
.preview-code .hljs-name { color: #ff79c6; }
.preview-code .hljs-selector-tag { color: #ff79c6; }
.preview-code .hljs-selector-class { color: #50fa7b; }
.preview-code .hljs-selector-id { color: #8be9fd; }
.preview-code .hljs-built_in { color: #8be9fd; }
.preview-code .hljs-literal { color: #bd93f9; }
.preview-code .hljs-type { color: #8be9fd; }
.preview-code .hljs-params { color: #ffb86c; }
.preview-code .hljs-meta { color: #f8f8f2; }
.preview-code .hljs-title { color: #50fa7b; }
</style>
