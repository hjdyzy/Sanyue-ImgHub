<template>
    <div class="text-preview-page">
        <header class="preview-header">
            <h1>{{ displayName }}</h1>
            <div class="header-actions">
                <el-select v-model="currentCodeTheme" size="small" style="width: 160px;" @change="handleThemeChange">
                    <el-option v-for="t in darkThemes" :key="t.value" :label="t.label" :value="t.value" />
                </el-select>
                <el-button size="small" @click="copyContent">复制内容</el-button>
                <el-button size="small" @click="copyFileLink">复制下载链接</el-button>
                <el-button size="small" @click="downloadFile">下载</el-button>
            </div>
        </header>
        <main class="preview-main">
            <div v-if="loading" class="loading-state">
                <el-icon class="is-loading" :size="32"><Loading /></el-icon>
                <span>加载中...</span>
            </div>
            <div v-else-if="error" class="error-state">{{ error }}</div>
            <div v-else class="code-editor">
                <div class="line-numbers">
                    <span v-for="n in lineCount" :key="n">{{ n }}</span>
                </div>
                <pre class="code-content"><code v-html="highlighted" class="hljs"></code></pre>
            </div>
        </main>
        <footer v-if="!loading && !error" class="preview-footer">
            <span>{{ lineCount }} 行</span>
            <span>{{ charCount }} 字符</span>
            <span>{{ formattedFileSize }}</span>
        </footer>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { Loading } from '@element-plus/icons-vue';
import hljs from '@/utils/hljs';
import { isTextFile, getLanguageFromExt } from '@/utils/textFileDetector';
import { darkThemes } from '@/utils/highlightTheme';

export default {
    name: 'TextPreview',
    components: { Loading },
    data() {
        return {
            fileName: '',
            displayName: '',
            content: '',
            highlighted: '',
            loading: true,
            error: null,
            darkThemes,
        };
    },
    computed: {
        ...mapGetters(['codeTheme']),
        currentCodeTheme: {
            get() { return this.$store.state.codeTheme; },
            set(val) { this.$store.commit('setCodeTheme', val); }
        },
        lineCount() { return this.content ? this.content.split('\n').length : 0; },
        charCount() { return this.content.length; },
        fileSize() { return new Blob([this.content]).size; },
        formattedFileSize() {
            const s = this.fileSize;
            if (s < 1024) return s + ' B';
            if (s < 1024 * 1024) return (s / 1024).toFixed(1) + ' KB';
            return (s / 1024 / 1024).toFixed(2) + ' MB';
        },
    },
    mounted() {
        this.loadFile();
    },
    methods: {
        handleThemeChange(theme) {
            this.$message.success(`主题已切换为 ${theme}`);
        },
        async loadFile() {
            const pathParam = this.$route.params.path;
            let filePath;
            if (Array.isArray(pathParam)) {
                filePath = pathParam.join('/');
            } else {
                filePath = (pathParam || '').replace(/,/g, '/');
            }
            this.fileName = filePath;
            this.displayName = filePath.split('/').pop();

            if (!isTextFile(this.displayName)) {
                window.location.href = '/file/' + filePath;
                return;
            }

            try {
                const res = await fetch('/file/' + filePath);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const text = await res.text();
                const lang = getLanguageFromExt(this.displayName);
                try {
                    this.highlighted = hljs.highlight(text, { language: lang }).value;
                } catch { this.highlighted = this.escapeHtml(text); }
                this.content = text;
            } catch (e) {
                this.error = '加载失败: ' + e.message;
            } finally {
                this.loading = false;
            }
        },
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        copyContent() {
            navigator.clipboard.writeText(this.content).then(() => {
                this.$message.success('已复制文件内容');
            }).catch(() => this.$message.error('复制失败'));
        },
        copyFileLink() {
            const link = window.location.origin + '/file/' + this.fileName;
            navigator.clipboard.writeText(link).then(() => {
                this.$message.success('已复制下载链接');
            }).catch(() => this.$message.error('复制失败'));
        },
        downloadFile() {
            const blob = new Blob([this.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.displayName;
            a.click();
            URL.revokeObjectURL(url);
        },
    },
};
</script>

<style scoped>
.text-preview-page {
    min-height: 100vh;
    background: #24292e;
    color: #c9d1d9;
    display: flex;
    flex-direction: column;
}
.preview-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #161b22;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    border-bottom: 1px solid #30363d;
}
.preview-header h1 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: #c9d1d9;
}
.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.preview-main {
    flex: 1;
    overflow: auto;
}
.loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    gap: 12px;
}
.code-editor {
    display: flex;
    min-height: 100%;
}
.line-numbers {
    display: flex;
    flex-direction: column;
    padding: 12px 12px 12px 16px;
    text-align: right;
    user-select: none;
    color: #6e7681;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 22.4px;
    font-variant-numeric: tabular-nums;
    border-right: 1px solid #30363d;
    background: #0d1117;
}
.code-content {
    flex: 1;
    margin: 0;
    padding: 12px 16px;
    overflow-x: auto;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
}
.code-content .hljs {
    background: transparent !important;
}
.preview-footer {
    background: #161b22;
    padding: 8px 20px;
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 13px;
    color: #8b949e;
    border-top: 1px solid #30363d;
    flex-wrap: wrap;
}
@media (max-width: 768px) {
    .preview-header { padding: 10px 12px; }
    .preview-footer { gap: 12px; }
}
</style>
