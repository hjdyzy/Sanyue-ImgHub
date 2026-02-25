<template>
    <div class="text-preview-page">
        <div class="preview-header">
            <h1>{{ displayName }}</h1>
            <div class="preview-header-right">
                <div class="theme-selector">
                    <span class="theme-label">主题：</span>
                    <el-select v-model="currentCodeTheme" @change="handleThemeChange" style="width: 180px;">
                        <el-option v-for="t in darkThemes" :key="t.value" :label="t.label" :value="t.value" />
                    </el-select>
                </div>
                <div class="preview-actions">
                    <el-button @click="copyContent" :disabled="loading">
                        <span style="margin-right: 4px;">📋</span>复制文件内容
                    </el-button>
                    <el-button @click="copyFileLink" :disabled="loading">
                        <span style="margin-right: 4px;">🔗</span>复制下载链接
                    </el-button>
                    <el-button @click="downloadFile" :disabled="loading">
                        <span style="margin-right: 4px;">⬇️</span>下载文件
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
                        <span v-for="n in lineCount" :key="n">{{ n }}</span>
                    </div>
                    <pre class="code-content"><code v-html="highlighted" class="hljs"></code></pre>
                </div>
            </div>
        </div>
        <div class="preview-footer" v-if="!loading && !error">
            <div class="stats">
                <span>📏 共 <strong>{{ lineCount.toLocaleString() }}</strong> 行</span>
                <span>📝 共 <strong>{{ charCount.toLocaleString() }}</strong> 字符</span>
                <span>💾 文件大小: <strong>{{ formattedFileSize }}</strong></span>
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
    font-size: 14px;
    color: #d4d4d4;
    white-space: nowrap;
}
.preview-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.preview-content {
    flex: 1;
    padding: 24px;
    overflow: auto;
}
.preview-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    gap: 12px;
    color: #858585;
}
.preview-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    gap: 12px;
    color: #f85149;
}
.preview-code {
    background: #1e1e1e;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #3c3c3c;
}
.code-editor {
    display: flex;
    min-height: 100%;
}
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
.code-content code {
    text-align: left;
    white-space: pre;
    display: block;
    color: #d4d4d4;
}
.code-content .hljs {
    background: transparent !important;
    text-align: left;
    white-space: pre;
    display: block;
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
.stats {
    display: flex;
    gap: 24px;
    justify-content: center;
    font-size: 13px;
    color: #858585;
    flex-wrap: wrap;
}
@media (max-width: 768px) {
    .preview-header { padding: 12px 16px; }
    .preview-content { padding: 12px; }
    .preview-footer { padding: 12px 16px; }
    .stats { gap: 12px; }
}
</style>
