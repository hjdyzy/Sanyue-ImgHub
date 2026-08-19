<template>
    <div class="text-preview-page">
        <div class="preview-header">
            <h1>{{ displayName }}</h1>
            <div class="preview-header-right">
                <div class="theme-selector">
                    <span class="theme-label">主题：</span>
                    <el-select v-model="currentCodeTheme" @change="handleThemeChange" style="width: 180px;">
                        <el-option v-for="theme in darkThemes" :key="theme.value" :label="theme.label" :value="theme.value" />
                    </el-select>
                </div>
                <div class="preview-actions">
                    <el-button @click="copyContent" :disabled="loading">
                        <font-awesome-icon icon="copy" />复制文件内容
                    </el-button>
                    <el-button @click="copyFileLink" :disabled="loading">
                        <font-awesome-icon icon="link" />复制下载链接
                    </el-button>
                    <el-button @click="downloadFile" :disabled="loading">
                        <font-awesome-icon icon="download" />下载文件
                    </el-button>
                </div>
            </div>
        </div>
        <div class="preview-content">
            <div v-if="loading" class="preview-loading">
                <el-icon class="is-loading" :size="40"><Loading /></el-icon>
                <p>加载中...</p>
            </div>
            <div v-else-if="error" class="preview-error">
                <p>加载失败: {{ error }}</p>
            </div>
            <div v-else class="preview-code">
                <div class="code-editor">
                    <div class="line-numbers" aria-hidden="true">
                        <span v-for="lineNumber in lineCount" :key="lineNumber">{{ lineNumber }}</span>
                    </div>
                    <pre class="code-content"><code v-html="highlighted" class="hljs"></code></pre>
                </div>
            </div>
        </div>
        <div class="preview-footer" v-if="!loading && !error">
            <div class="stats">
                <span>共 <strong>{{ lineCount.toLocaleString() }}</strong> 行</span>
                <span>共 <strong>{{ charCount.toLocaleString() }}</strong> 字符</span>
                <span>文件大小: <strong>{{ formattedFileSize }}</strong></span>
            </div>
        </div>
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
            get() {
                return this.codeTheme;
            },
            set(theme) {
                this.$store.commit('setCodeTheme', theme);
            }
        },
        lineCount() {
            return this.content ? this.content.split('\n').length : 0;
        },
        charCount() {
            return this.content.length;
        },
        fileSize() {
            return new Blob([this.content]).size;
        },
        formattedFileSize() {
            const size = this.fileSize;
            if (size < 1024) return `${size} B`;
            if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
            return `${(size / 1024 / 1024).toFixed(2)} MB`;
        },
    },
    mounted() {
        this.loadFile();
    },
    methods: {
        handleThemeChange(theme) {
            this.$message.success(`主题已切换为 ${theme}`);
        },
        getRouteFilePath() {
            const pathParam = this.$route.params.path;
            const parts = Array.isArray(pathParam) ? pathParam : [pathParam];
            return parts.filter(Boolean).join('/');
        },
        getFileUrl(filePath) {
            const encodedPath = filePath.split('/').map(part => encodeURIComponent(part)).join('/');
            return `/file/${encodedPath}`;
        },
        async loadFile() {
            const filePath = this.getRouteFilePath();
            this.fileName = filePath;
            this.displayName = filePath.split('/').pop() || filePath;

            if (!isTextFile(this.displayName)) {
                window.location.href = this.getFileUrl(filePath);
                return;
            }

            try {
                const response = await fetch(this.getFileUrl(filePath), { credentials: 'include' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const text = await response.text();
                const language = getLanguageFromExt(this.displayName);
                try {
                    this.highlighted = hljs.highlight(text, { language }).value;
                } catch {
                    this.highlighted = this.escapeHtml(text);
                }
                this.content = text;
                document.title = `${this.displayName} - Text Preview`;
            } catch (loadError) {
                this.error = `加载失败: ${loadError.message}`;
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
            navigator.clipboard.writeText(this.content)
                .then(() => this.$message.success('已复制文件内容'))
                .catch(() => this.$message.error('复制失败'));
        },
        copyFileLink() {
            const link = `${window.location.origin}${this.getFileUrl(this.fileName)}`;
            navigator.clipboard.writeText(link)
                .then(() => this.$message.success('已复制下载链接'))
                .catch(() => this.$message.error('复制失败'));
        },
        downloadFile() {
            const url = URL.createObjectURL(new Blob([this.content], { type: 'text/plain' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = this.displayName;
            link.click();
            URL.revokeObjectURL(url);
        },
    },
};
</script>

<style scoped>
.text-preview-page {
    min-height: 100vh;
    background: #1e1e1e;
    color: #d4d4d4;
    display: flex;
    flex-direction: column;
}
.preview-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #252526;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    border-bottom: 1px solid #3c3c3c;
}
.preview-header h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #d4d4d4;
}
.preview-header-right,
.theme-selector,
.preview-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.preview-header-right { gap: 16px; }
.theme-label { font-size: 14px; color: #d4d4d4; white-space: nowrap; }
.preview-content { flex: 1; padding: 24px; overflow: auto; }
.preview-loading,
.preview-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    gap: 12px;
}
.preview-loading { color: #858585; }
.preview-error { color: #f85149; }
.preview-code { background: #1e1e1e; border-radius: 6px; overflow: hidden; border: 1px solid #3c3c3c; }
.code-editor { display: flex; min-height: 100%; }
.line-numbers {
    display: flex;
    flex-direction: column;
    padding: 16px 6px 16px 12px;
    text-align: right;
    user-select: none;
    color: #858585;
    font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
    font-size: 14px;
    line-height: 1.6;
    font-variant-numeric: tabular-nums;
    border-right: 1px solid #3c3c3c;
    background: #1e1e1e;
    min-width: 48px;
}
.code-content {
    flex: 1;
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
    font-size: 14px;
    line-height: 1.6;
    background: #1e1e1e;
}
.code-content code,
.code-content .hljs {
    text-align: left;
    white-space: pre;
    display: block;
    color: #d4d4d4;
    background: transparent !important;
    padding: 0 !important;
}
.preview-footer {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background: #252526;
    padding: 16px 24px;
    display: flex;
    justify-content: center;
    border-top: 1px solid #3c3c3c;
}
.stats { display: flex; gap: 24px; justify-content: center; font-size: 13px; color: #858585; flex-wrap: wrap; }
.preview-actions :deep(.el-button) { display: inline-flex; align-items: center; gap: 6px; }
@media (max-width: 768px) {
    .preview-header { padding: 12px 16px; }
    .preview-content { padding: 12px; }
    .preview-footer { padding: 12px 16px; }
    .stats { gap: 12px; }
}
</style>
