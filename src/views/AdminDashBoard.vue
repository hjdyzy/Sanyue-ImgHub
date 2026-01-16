<template>
    <div class="container">
        <el-container>
            <el-header>
            <div class="header-content">
                <DashboardTabs activeTab="dashboard"></DashboardTabs>
                <div class="search-card">
                    <el-input v-model="tempSearch" size="mini" placeholder="搜索：#标签 -#排除标签" @keyup.enter="handleSearch">
                        <template #suffix>
                            <font-awesome-icon icon="search" class="search-icon" @click="handleSearch"/>
                        </template>
                    </el-input>
                </div>
                <div class="actions">
                <el-dropdown @command="sort" :hide-on-click="false">
                    <span class="el-dropdown-link">
                        <font-awesome-icon :icon="sortIcon" class="header-icon"></font-awesome-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="dateDesc">按时间倒序</el-dropdown-item>
                            <el-dropdown-item command="nameAsc">按名称升序</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <el-tooltip :disabled="disableTooltip" content="全选此页" placement="bottom">
                    <font-awesome-icon :icon="selectPageIcon" class="header-icon" @click="handleSelectPage"></font-awesome-icon>
                </el-tooltip>
                <el-dropdown @command="handleBatchAction" :hide-on-click="false" :disabled="selectedFiles.length === 0">
                    <span class="el-dropdown-link">
                        <font-awesome-icon icon="ellipsis-h" class="header-icon" :class="{ disabled: selectedFiles.length === 0 }"></font-awesome-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="copy">
                                <font-awesome-icon icon="copy" class="batch-action-item-icon"></font-awesome-icon>
                                复制
                            </el-dropdown-item>
                            <el-dropdown-item command="delete">
                                <font-awesome-icon icon="trash-alt" class="batch-action-item-icon"></font-awesome-icon>
                                删除
                            </el-dropdown-item>
                            <el-dropdown-item command="download">
                                <font-awesome-icon icon="download" class="batch-action-item-icon"></font-awesome-icon>
                                下载
                            </el-dropdown-item>
                            <el-dropdown-item command="move">
                                <font-awesome-icon icon="file-export" class="batch-action-item-icon"></font-awesome-icon>
                                移动
                            </el-dropdown-item>
                            <el-dropdown-item command="tagManagement">
                                <font-awesome-icon icon="tags" class="batch-action-item-icon"></font-awesome-icon>
                                标签管理
                            </el-dropdown-item>
                            <el-dropdown-item command="ban">
                                <font-awesome-icon icon="ban" class="batch-action-item-icon"></font-awesome-icon>
                                加入黑名单
                            </el-dropdown-item>
                            <el-dropdown-item command="white">
                                <font-awesome-icon icon="user-plus" class="batch-action-item-icon"></font-awesome-icon>
                                加入白名单
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <el-tooltip :disabled="disableTooltip" content="链接格式" placement="bottom">
                    <span class="el-dropdown-link">
                        <font-awesome-icon icon="link" class="header-icon" @click="showUrlDialog = true"></font-awesome-icon>
                    </span>
                </el-tooltip>
                <el-tooltip :disabled="disableTooltip" :content="viewMode === 'card' ? '列表视图' : '卡片视图'" placement="bottom">
                    <font-awesome-icon :icon="viewMode === 'card' ? 'list' : 'th-large'" class="header-icon" @click="toggleViewMode"></font-awesome-icon>
                </el-tooltip>
                <el-tooltip :disabled="disableTooltip" content="退出登录" placement="bottom">
                    <font-awesome-icon icon="sign-out-alt" class="header-icon" @click="handleLogout"></font-awesome-icon>
                </el-tooltip>
                </div>
            </div>
            </el-header>
            <el-main class="main-container">
            <!-- 目录导航 -->
            <div class="breadcrumb-container">
                <!-- 移动端目录按钮 -->
                <div class="mobile-directory-trigger" @click="showMobileDirectoryDrawer = true">
                    <font-awesome-icon icon="folder-open" class="mobile-directory-icon"/>
                    <span class="mobile-directory-path">{{ currentPath && currentPath.split('/').filter(Boolean).length > 0 ? currentPath.split('/').filter(Boolean).pop() : '根目录' }}</span>
                    <font-awesome-icon icon="chevron-down" class="mobile-directory-arrow"/>
                </div>
                <!-- 桌面端面包屑 -->
                <div class="breadcrumb desktop-only">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item @click="navigateToFolder('')">
                            <font-awesome-icon icon="home" class="breadcrumb-home-icon"/>
                        </el-breadcrumb-item>
                        <el-breadcrumb-item 
                            v-for="(folder, index) in currentPath.split('/').filter(Boolean)" 
                            :key="index"
                            @click="navigateToFolder(currentPath.split('/').filter(Boolean).slice(0, index + 1).join('/'))">
                            {{ folder }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <span class="stats-badge" :title="`共 ${$data.Number} 个文件`">
                    <font-awesome-icon icon="database" class="stats-badge-icon"/>
                    {{ Number }}
                </span>
            </div>
            
            <!-- 卡片视图 -->
            <div v-if="viewMode === 'card'" class="content">
                <!-- 加载骨架屏 -->
                <SkeletonLoader v-if="loading" type="card" :count="15" />
                <!-- 文件夹和文件列表 -->
                <template v-else v-for="(item, index) in paginatedTableData" :key="index">
                    <!-- 文件夹卡片 -->
                    <FolderCard 
                        v-if="isFolder(item)"
                        :name="item.name"
                        v-model:selected="item.selected"
                        :showActions="!isSearchMode"
                        :disableTooltip="disableTooltip"
                        @enter="enterFolder(item.name)"
                        @copy="handleFolderCopy(item.name)"
                        @move="handleMove(index, item.name)"
                        @delete="handleDelete(index, item.name)"
                        @touchstart="handleFolderTouchStart(item, index)"
                        @touchend="handleTouchEnd"
                        @touchmove="handleTouchEnd"
                    />
                    <!-- 文件卡片 -->
                    <FileCard
                        v-else
                        :item="item"
                        v-model:selected="item.selected"
                        :fileLink="getFileLink(item.name)"
                        :previewSrcList="item.previewSrcList"
                        :disableTooltip="disableTooltip"
                        :textPreviewLoading="textPreviewCache[item.name]?.loading"
                        :textPreviewHighlighted="textPreviewCache[item.name]?.highlighted"
                        :textPreviewHasMore="textPreviewCache[item.name]?.hasMore"
                        @detail="openDetailDialog(index, item.name)"
                        @copy="handleCopy(index, item.name)"
                        @move="handleMove(index, item.name)"
                        @delete="handleDelete(index, item.name)"
                        @download="handleDownload(item.name)"
                        @textPreview="openTextPreview(item)"
                        @textHover="handleTextFileHover(item)"
                        @textLeave="handleTextFileLeave(item)"
                        @touchstart="handleTouchStart(item, index)"
                        @touchend="handleTouchEnd"
                        @touchmove="handleTouchEnd"
                    />
                </template>
            </div>
            <!-- 列表视图 -->
            <div v-else class="list-view">
                <div class="list-header">
                    <div class="list-col list-col-checkbox">
                        <span class="custom-checkbox" :class="{ 'checked': isSelectAll, 'indeterminate': isIndeterminate }" @click="handleSelectAllPage(!isSelectAll)">
                            <font-awesome-icon v-if="isSelectAll" icon="check" class="check-icon"/>
                            <font-awesome-icon v-else-if="isIndeterminate" icon="minus" class="check-icon"/>
                        </span>
                    </div>
                    <div class="list-col list-col-preview">预览</div>
                    <div class="list-col list-col-name">文件名</div>
                    <div class="list-col list-col-tags">标签</div>
                    <div class="list-col list-col-channel">渠道类型</div>
                    <div class="list-col list-col-channel-name">渠道名称</div>
                    <div class="list-col list-col-address">上传地址</div>
                    <div class="list-col list-col-size">大小</div>
                    <div class="list-col list-col-date">上传时间</div>
                    <div class="list-col list-col-actions">操作</div>
                </div>
                <!-- 列表骨架屏 -->
                <SkeletonLoader v-if="loading" type="list" :count="15" />
                <!-- 实际数据 -->
                <template v-else>
                    <FileListItem
                        v-for="(item, index) in paginatedTableData"
                        :key="index"
                        :item="item"
                        v-model:selected="item.selected"
                        :fileLink="getFileLink(item.name)"
                        @enter="enterFolder(item.name)"
                        @detail="openDetailDialog(index, item.name)"
                        @copy="handleCopy(index, item.name)"
                        @folderCopy="handleFolderCopy(item.name)"
                        @move="handleMove(index, item.name)"
                        @delete="handleDelete(index, item.name)"
                        @download="handleDownload(item.name)"
                        @touchstart="isFolder(item) ? handleFolderTouchStart(item, index) : handleTouchStart(item, index)"
                        @touchend="handleTouchEnd"
                        @touchmove="handleTouchEnd"
                    />
                </template>
            </div>
            
            <div class="pagination-container">
                <div class="pagination-center">
                    <el-pagination
                        background
                        layout="prev, pager, next"
                        :total="filteredTableData.length"
                        :page-size="pageSize"
                        :current-page="currentPage"
                        :pager-count="pagerCount"
                        @current-change="handlePageChange">
                    </el-pagination>
                    <el-button 
                        type="primary" 
                        @click="refreshFileList" 
                        class="refresh-btn">
                        <font-awesome-icon icon="sync" :class="{ 'fa-spin': refreshLoading }"/>
                    </el-button>
                    <el-button
                        v-if="currentPage === Math.ceil(filteredTableData.length / pageSize)" 
                        type="primary" 
                        @click="loadMoreData" 
                        :loading="loading" 
                        class="load-more">
                        加载更多
                    </el-button>
                </div>
                <div class="pagination-right">
                    <span class="page-total">共 {{ realTotalPages }} 页</span>
                    <div class="page-jump">
                        <span>跳至</span>
                        <el-input 
                            v-model="jumpPage" 
                            size="small" 
                            class="jump-input"
                            @keyup.enter="handleJumpPage"
                        />
                        <el-button size="small" type="primary" @click="handleJumpPage" class="jump-btn">GO</el-button>
                    </div>
                </div>
            </div>
            </el-main>
        </el-container>
        <!-- 文件详情弹窗 -->
        <FileDetailDialog
            v-model="showdetailDialog"
            :file="detailFile"
            :fileLink="getFileLink(detailFile?.name)"
            :urls="allUrl"
            @download="handleDownload(detailFile?.name)"
            @tagManagement="handleTagManagement(detailFile?.name)"
            @block="handleBlock(detailFile?.name)"
            @white="handleWhite(detailFile?.name)"
            @delete="handleDetailDelete(detailFile?.name)"
        />
        <el-dialog title="链接格式" v-model="showUrlDialog" :width="dialogWidth" :show-close="false" class="settings-dialog">
            <div class="dialog-section">
                <div class="section-header">
                    <span class="section-title">默认复制链接</span>
                </div>
                <div class="section-content">
                    <el-radio-group v-model="defaultUrlFormat" class="radio-card-group grid-2x2">
                        <el-radio label="originUrl" class="radio-card">
                            <font-awesome-icon icon="link" class="radio-icon"/>
                            <span>原始链接</span>
                        </el-radio>
                        <el-radio label="mdUrl" class="radio-card">
                            <font-awesome-icon icon="code" class="radio-icon"/>
                            <span>Markdown</span>
                        </el-radio>
                        <el-radio label="htmlUrl" class="radio-card">
                            <font-awesome-icon icon="code-branch" class="radio-icon"/>
                            <span>HTML</span>
                        </el-radio>
                        <el-radio label="bbUrl" class="radio-card">
                            <font-awesome-icon icon="quote-right" class="radio-icon"/>
                            <span>BBCode</span>
                        </el-radio>
                        <el-radio label="tgId" class="radio-card">
                            <font-awesome-icon icon="paper-plane" class="radio-icon"/>
                            <span>TG File ID</span>
                        </el-radio>
                        <el-radio label="s3Location" class="radio-card">
                            <font-awesome-icon icon="cloud" class="radio-icon"/>
                            <span>S3链接</span>
                        </el-radio>
                    </el-radio-group>
                </div>
            </div>

            <div class="dialog-section">
                <div class="section-header">
                    <span class="section-title">自定义链接</span>
                    <el-tooltip content="默认链接为https://your.domain/file/xxx.jpg <br> 如果启用自定义链接格式，只保留xxx.jpg部分，其他部分请自行输入" placement="top" raw-content>
                        <font-awesome-icon icon="question-circle" class="section-help-icon"/>
                    </el-tooltip>
                </div>
                <div class="section-content">
                    <div class="setting-item">
                        <span class="setting-label">启用自定义</span>
                        <el-switch v-model="useCustomUrl" active-value="true" inactive-value="false" />
                    </div>
                    <div class="setting-item" v-if="useCustomUrl === 'true'">
                        <span class="setting-label">自定义前缀</span>
                        <el-input v-model="customUrlPrefix" placeholder="请输入自定义链接前缀" class="setting-input"/>
                    </div>
                </div>
            </div>

            <div class="dialog-action">
                <el-button type="primary" @click="showUrlDialog = false" class="confirm-btn">确定</el-button>
            </div>
        </el-dialog>

        <!-- Tag Management Dialog -->
        <TagManagementDialog
            v-model="showTagDialog"
            :fileId="currentTagFile"
            @tagsUpdated="handleTagsUpdated"
        />

        <!-- Batch Tag Management Dialog -->
        <BatchTagDialog
            v-model="showBatchTagDialog"
            :selectedFiles="selectedFiles"
            @tagsUpdated="handleBatchTagsUpdated"
        />
        <!-- 移动端操作菜单 -->
        <MobileActionSheet
            v-model="showMobileActionModal"
            :title="mobileActionIsFolder ? getFolderName(mobileActionFile?.name || '') : (mobileActionFile?.metadata?.FileName || getFileName(mobileActionFile?.name || ''))"
            :isFolder="mobileActionIsFolder"
            @action="handleMobileAction"
        />
        <!-- 移动端目录抽屉 -->
        <MobileDirectoryDrawer
            v-model="showMobileDirectoryDrawer"
            :currentPath="currentPath"
            @navigate="navigateToFolder"
            @goBack="handleGoBack"
        />
        <!-- 文本预览弹窗 -->
        <el-dialog
            v-model="textPreviewDialogVisible"
            :title="textPreviewDialogData.displayName"
            class="text-preview-dialog"
            width="80%"
            :close-on-click-modal="true"
        >
            <div class="text-preview-dialog-content">
                <div v-if="textPreviewDialogData.loading" class="text-preview-loading-container">
                    <font-awesome-icon icon="spinner" spin style="font-size: 32px;"/>
                    <p>加载中...</p>
                </div>
                <div v-else-if="textPreviewDialogData.error" class="text-preview-error-container">
                    <p>加载失败: {{ textPreviewDialogData.error }}</p>
                </div>
                <div v-else class="text-preview-code-container">
                    <div class="code-editor">
                        <div class="line-numbers" aria-hidden="true">
                            <span v-for="n in (textPreviewDialogData.content ? textPreviewDialogData.content.split('\n').length : 0)" :key="n">{{ n }}</span>
                        </div>
                        <pre class="code-content"><code v-html="textPreviewDialogData.highlighted" class="hljs"></code></pre>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="text-preview-dialog-footer">
                    <div class="theme-selector-row">
                        <span class="theme-label">代码主题：</span>
                        <el-select v-model="currentCodeTheme" @change="handleThemeChange" style="width: 200px;">
                            <el-option label="Tokyo Night Dark" value="tokyo-night-dark"/>
                            <el-option label="GitHub Dark" value="github-dark"/>
                            <el-option label="Dracula" value="dracula"/>
                            <el-option label="One Dark" value="atom-one-dark"/>
                            <el-option label="VS Code Dark" value="vs2015"/>
                            <el-option label="Monokai" value="monokai"/>
                        </el-select>
                    </div>
                    <div class="action-buttons-row">
                        <el-button @click="copyTextContent" :disabled="textPreviewDialogData.loading">
                            <span style="margin-right: 4px;">📋</span>
                            复制文件内容
                        </el-button>
                        <el-button @click="copyFileLink" :disabled="textPreviewDialogData.loading">
                            <span style="margin-right: 4px;">🔗</span>
                            复制下载链接
                        </el-button>
                        <el-button @click="downloadTextFile" :disabled="textPreviewDialogData.loading">
                            <span style="margin-right: 4px;">💾</span>
                            下载文件
                        </el-button>
                        <el-button @click="copyPreviewLink" :disabled="textPreviewDialogData.loading">
                            <span style="margin-right: 4px;">👁️</span>
                            复制预览链接
                        </el-button>
                        <el-button @click="openInNewTab" :disabled="textPreviewDialogData.loading">
                            <span style="margin-right: 4px;">🔖</span>
                            新标签页打开
                        </el-button>
                        <el-button @click="textPreviewDialogVisible = false">
                            <span style="margin-right: 4px;">❌</span>
                            关闭
                        </el-button>
                    </div>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import JSZip from 'jszip';
import DashboardTabs from '@/components/DashboardTabs.vue';
import TagManagementDialog from '@/components/TagManagementDialog.vue';
import BatchTagDialog from '@/components/BatchTagDialog.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import FileCard from '@/components/FileCard.vue';
import FolderCard from '@/components/FolderCard.vue';
import FileListItem from '@/components/FileListItem.vue';
import FileDetailDialog from '@/components/FileDetailDialog.vue';
import MobileActionSheet from '@/components/MobileActionSheet.vue';
import MobileDirectoryDrawer from '@/components/MobileDirectoryDrawer.vue';
import { fileManager } from '@/utils/fileManager';
import fetchWithAuth from '@/utils/fetchWithAuth';
import { validateFolderPath } from '@/utils/pathValidator';

// highlight.js 模块化导入
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import ini from 'highlight.js/lib/languages/ini';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import nginx from 'highlight.js/lib/languages/nginx';
import plaintext from 'highlight.js/lib/languages/plaintext';

// 注册语言
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
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('nginx', nginx);
hljs.registerLanguage('plaintext', plaintext);

export default {
data() {
    return {
        Number: 0,
        directFileCount: 0, // 当前目录直接子文件数量
        directFolderCount: 0, // 当前目录直接子文件夹数量
        showLogoutButton: false,
        tableData: [],
        tempSearch: '',
        search: '',
        searchKeywords: '', // Keywords only (without tag filters) for backend search
        searchIncludeTags: '', // 包含的标签，逗号分隔
        searchExcludeTags: '', // 排除的标签，逗号分隔
        isSearchMode: false,
        currentPage: 1,
        pageSize: 15,
        selectedFiles: [],
        sortOption: 'dateDesc',
        isUploading: false,
        showdetailDialog: false,
        detailFile: null,
        activeUrlTab: 'originUrl',
        defaultUrlFormat: 'originUrl',
        showUrlDialog: false,
        useCustomUrl: 'false', // 是否启用自定义链接
        customUrlPrefix: '', // 自定义链接前缀
        loading: false, // 加载状态
        currentPath: '', // 当前文件夹路径
        refreshLoading: false,
        showTagDialog: false, // 标签管理对话框
        showBatchTagDialog: false, // 批量标签管理对话框
        currentTagFile: '', // 当前标签管理的文件
        viewMode: 'card', // 视图模式：card 或 list
        showMobileActionModal: false, // 移动端操作模态框
        mobileActionFile: null, // 当前移动端操作的文件
        mobileActionIndex: -1, // 当前移动端操作的文件索引
        mobileActionIsFolder: false, // 是否为文件夹操作
        longPressTimer: null, // 长按计时器
        showMobileDirectoryDrawer: false, // 移动端目录抽屉
        jumpPage: '', // 跳转页码输入
        // 文本预览相关
        textPreviewCache: {},
        textPreviewDialogVisible: false,
        textPreviewDialogData: {
            loading: false,
            error: null,
            content: '',
            highlighted: '',
            fileName: '',
            displayName: '',
            fileLink: ''
        },
        currentCodeTheme: this.$store?.state?.codeTheme || 'tokyo-night-dark',
    }
},
components: {
    DashboardTabs,
    TagManagementDialog,
    BatchTagDialog,
    SkeletonLoader,
    FileCard,
    FolderCard,
    FileListItem,
    FileDetailDialog,
    MobileActionSheet,
    MobileDirectoryDrawer
},
computed: {
    ...mapGetters(['adminUrlSettings', 'userConfig']),
    filteredTableData() {
        return this.tableData;
    },
    totalPages() {
        return Math.ceil(this.filteredTableData.length / this.pageSize) || 1;
    },
    // 基于当前文件夹直接子文件和子文件夹数量计算的真实总页数
    realTotalPages() {
        const total = this.directFolderCount + this.directFileCount;
        return Math.ceil(total / this.pageSize) || 1;
    },
    paginatedTableData() {
        const sortedData = this.sortData(this.filteredTableData);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        let data = sortedData.slice(start, end);
        // 增加previewSrcList属性，用于预览图片
        const fullList = data.filter(file => this.isImage(file)).map(file => this.getFileLink(file.name));
        data.forEach(file => {
            if (this.isImage(file)) {
                // 重新排序，索引大于等于当前索引的元素在前，否则在后
                file.previewSrcList = fullList.slice(fullList.indexOf(this.getFileLink(file.name))).concat(fullList.slice(0, fullList.indexOf(this.getFileLink(file.name))));
            }
        });
        // 增加channelTag属性，用于显示渠道信息
        data.forEach(file => {
            if (file.metadata?.Channel === 'TelegramNew') {
                file.channelTag = 'TG';
            } else if (file.metadata?.Channel === 'CloudflareR2') {
                file.channelTag = 'R2';
            } else if (file.metadata?.Channel === 'S3') {
                file.channelTag = 'S3';
            } else if (file.metadata?.Channel === 'Discord') {
                file.channelTag = 'DC';
            } else if (file.metadata?.Channel === 'HuggingFace') {
                file.channelTag = 'HF';
            } else if (file.metadata?.Channel === 'External') {
                file.channelTag = '外链';
            } else {
                file.channelTag = '未知';
            }
        });
        return data;
    },
    sortIcon() {
        return this.sortOption === 'dateDesc' ? 'sort-amount-down' : 'sort-alpha-up';
    },
    dialogWidth() {
        return window.innerWidth > 768 ? '50%' : '90%';
    },
    detailDialogWidth() {
        return window.innerWidth > 768 ? '70%' : '90%';
    },
    accessType() {
        if (this.detailFile?.metadata?.ListType === 'White') {
            return '正常';
        } else if (this.detailFile?.metadata?.ListType === 'Block' || this.detailFile?.metadata?.Label === 'adult') {
            return '受限';
        } else {
            return '正常';
        }
    },
    allUrl() {
        // 外链图片均采用外链
        if (this.detailFile?.metadata?.Channel === 'External') {
            return {
                'originUrl': `${this.detailFile?.metadata?.ExternalLink}`,
                'mdUrl': `![${this.detailFile?.metadata?.FileName || this.detailFile?.name}](${this.detailFile?.metadata?.ExternalLink})`,
                'htmlUrl': `<img src="${this.detailFile?.metadata?.ExternalLink}" alt="${this.detailFile?.metadata?.FileName || this.detailFile?.name}" width=100%>`,
                'bbUrl': `[img]${this.detailFile?.metadata?.ExternalLink}[/img]`,
                'tgId': this.detailFile?.metadata?.TgFileId || '未知',
                'S3Location': this.detailFile?.metadata?.S3Location || '未知'
            }
        } else {
            return {
                'originUrl': `${this.rootUrl}${this.detailFile?.name}`,
                'mdUrl': `![${this.detailFile?.metadata?.FileName || this.detailFile?.name}](${this.rootUrl}${this.detailFile?.name})`,
                'htmlUrl': `<img src="${this.rootUrl}${this.detailFile?.name}" alt="${this.detailFile?.metadata?.FileName || this.detailFile?.name}" width=100%>`,
                'bbUrl': `[img]${this.rootUrl}${this.detailFile?.name}[/img]`,
                'tgId': this.detailFile?.metadata?.TgFileId || '未知',
                'S3Location': this.detailFile?.metadata?.S3Location || '未知'
            }
        }
    },
    tableColumnNum() {
        return window.innerWidth > 768 ? 3 : 1;
    },
    tablePreviewSpan() {
        return window.innerWidth > 768 ? 2 : 1;
    },
    disableTooltip() {
        return window.innerWidth < 768;
    },
    selectPage() {
        // 如果当前页所有文件都被选中，则返回 true，否则返回 false
        return this.paginatedTableData.every(file => file.selected);
    },
    selectedPageFiles() {
        // 如果当前页有文件被选中，则返回 true，否则返回 false
        return this.paginatedTableData.some(file => file.selected);
    },
    selectPageIcon() {
        // 全选为 true 时，返回 check-square；部分选中为 minus-square；全不选为 square
        return this.selectPage ? 'check-square' : this.selectedPageFiles ? 'minus-square' : 'square';
    },
    rootUrl() {
        // 链接前缀，优先级：用户自定义 > urlPrefix > 默认
        return this.useCustomUrl === 'true' ? this.customUrlPrefix : this.userConfig?.urlPrefix || `${document.location.origin}/file/`
    },
    isSelectAll: {
        get() {
            return this.paginatedTableData.length > 0 && this.paginatedTableData.every(file => file.selected);
        },
        set(val) {
            this.paginatedTableData.forEach(file => file.selected = val);
        }
    },
    isIndeterminate() {
        const selectedCount = this.paginatedTableData.filter(file => file.selected).length;
        return selectedCount > 0 && selectedCount < this.paginatedTableData.length;
    },
    pagerCount() {
        return window.innerWidth < 768 ? 3 : 7;
    }
},
watch: {
    tableData: {
        handler(newData) {
            // selectedFiles 增加 newData中新选中，不包含在 selectedFiles 中的文件
            this.selectedFiles = this.selectedFiles.concat(newData.filter(file => file.selected && !this.selectedFiles.includes(file)));
            // selectedFiles 删掉 newData 中已取消选中的文件
            this.selectedFiles = this.selectedFiles.filter(file => file.selected);
            // selectedFiles 删掉 tableData 中已删除的文件
            this.selectedFiles = this.selectedFiles.filter(file => newData.includes(file));
        },
        deep: true
    },
    sortOption(newOption) {
        localStorage.setItem('sortOption', newOption);
    },
    defaultUrlFormat(newFormat) {
        localStorage.setItem('defaultUrlFormat', newFormat);
    },
    showdetailDialog(newVal) {
        if (newVal) {
            this.activeUrlTab = this.defaultUrlFormat || 'originUrl';
        }
    },
    customUrlPrefix(val) {
        this.$store.commit('setAdminUrlSettings', { key: 'customUrlPrefix', value: val })
    },
    useCustomUrl(val) {
        this.$store.commit('setAdminUrlSettings', { key: 'useCustomUrl', value: val })
    },
    currentPath(val) {
        // 页面切换时，取消选择的内容
        this.tableData.forEach(file => file.selected = false);
    }
},
methods: {
    // 切换视图模式
    toggleViewMode() {
        this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
        localStorage.setItem('viewMode', this.viewMode);
    },
    // 列表视图全选当前页
    handleSelectAllPage(val) {
        this.paginatedTableData.forEach(file => file.selected = val);
    },
    // 移动端长按开始
    handleTouchStart(item, index) {
        this.longPressTimer = setTimeout(() => {
            this.mobileActionFile = item;
            this.mobileActionIndex = index;
            this.mobileActionIsFolder = false;
            this.showMobileActionModal = true;
        }, 500); // 500ms 长按触发
    },
    // 移动端长按结束/取消
    handleTouchEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    },
    // 文件夹长按开始
    handleFolderTouchStart(item, index) {
        this.longPressTimer = setTimeout(() => {
            this.mobileActionFile = item;
            this.mobileActionIndex = index;
            this.mobileActionIsFolder = true;
            this.showMobileActionModal = true;
        }, 500);
    },
    // 处理移动端操作
    handleMobileAction(action) {
        const file = this.mobileActionFile;
        const index = this.mobileActionIndex;
        this.showMobileActionModal = false;
        
        if (!file) return;
        
        switch (action) {
            case 'detail':
                this.openDetailDialog(index, file.name);
                break;
            case 'copy':
                this.handleCopy(index, file.name);
                break;
            case 'folderCopy':
                this.handleFolderCopy(file.name);
                break;
            case 'download':
                this.handleDownload(file.name);
                break;
            case 'move':
                this.handleMove(index, file.name);
                break;
            case 'delete':
                this.handleDelete(index, file.name);
                break;
            case 'tag':
                this.handleTagManagement(file.name);
                break;
        }
    },
    // 返回上一级目录
    handleGoBack() {
        const pathParts = this.currentPath.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            pathParts.pop();
            const parentPath = pathParts.join('/');
            this.navigateToFolder(parentPath);
        }
        this.showMobileDirectoryDrawer = false;
    },
    // 获取标签颜色
    getTagColor(index) {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];
        return colors[index % colors.length];
    },
    // 视频hover播放控制
    handleVideoHover(event, isEnter) {
        const video = event.target;
        if (isEnter) {
            video.play().catch(() => {});
        } else {
            video.pause();
            video.currentTime = 0;
        }
    },
    // 格式化文件大小
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '-';
        bytes = Number(bytes);
        if (isNaN(bytes)) return '-';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return bytes.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
    },
    handleSearch() {
        this.search = this.tempSearch;
        this.isSearchMode = this.search.trim() !== '';
        this.currentPage = 1; // 重置到第一页

        // 解析搜索字符串，提取标签和关键字
        // 支持 #tag 表示包含标签，-#tag 表示排除标签
        if (this.search && this.search.trim()) {
            const includeTags = [];
            const excludeTags = [];
            
            // 匹配 -#tag 和 #tag
            let searchText = this.search;
            
            // 先匹配排除标签 -#tag
            const excludeTagRegex = /-#([\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\.\+\-]+)/g;
            searchText = searchText.replace(excludeTagRegex, (match, tag) => {
                excludeTags.push(tag.toLowerCase());
                return ' ';
            });
            
            // 再匹配包含标签 #tag
            const includeTagRegex = /#([\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\.\+\-]+)/g;
            searchText = searchText.replace(includeTagRegex, (match, tag) => {
                includeTags.push(tag.toLowerCase());
                return ' ';
            });
            
            // 清理剩余的关键字（去除多余空格）
            this.searchKeywords = searchText.replace(/\s+/g, ' ').trim();
            
            // 构建标签查询字符串
            this.searchIncludeTags = includeTags.join(',');
            this.searchExcludeTags = excludeTags.join(',');
            
            console.log('Search keywords:', this.searchKeywords);
            console.log('Include tags:', this.searchIncludeTags);
            console.log('Exclude tags:', this.searchExcludeTags);
        } else {
            this.searchKeywords = '';
            this.searchIncludeTags = '';
            this.searchExcludeTags = '';
        }

        this.refreshFileList();
    },
    handleDownload(key) {
        const link = document.createElement('a');
        link.href = this.getFileLink(key);
        link.download = key;
        link.click();
    },
    openDetailDialog(index, key) {
        this.detailFile = this.paginatedTableData[index];
        this.showdetailDialog = true;
    },
    handleTabClick(tab) {
        this.activeUrlTab = tab.props.name;
    },
    handleUrlClick(event) {
        // 复制到剪贴板
        navigator.clipboard.writeText(event.target.value)
            .then(() => {
                this.$message({
                    type: 'success',
                    message: '复制成功'
                });
            })
            .catch(() => {
                this.$message({
                    type: 'error',
                    message: '复制失败'
                });
            });
    },
    handleDetailDelete(key) {
        this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
        }).then(() => {
        fetchWithAuth(`/api/manage/delete/${key}`, { method: 'GET' })
            .then(response => {
            if (response.ok) {
                const fileIndex = this.tableData.findIndex(file => file.name === key);
                if (fileIndex !== -1) {
                this.tableData.splice(fileIndex, 1);
                }
            } else {
                return Promise.reject('请求失败');
            }
            })
            .then(() => {
            this.updateStats(-1, false);
            this.$message.success('删除成功');
            this.showdetailDialog = false;
            })
            .catch(() => this.$message.error('删除失败'));
        }).catch(() => console.log('已取消删除'));
    },
    handleBlock(key) {
        this.$confirm('此操作将把该文件加入黑名单, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
        fetchWithAuth(`/api/manage/block/${key}`, { method: 'GET' })
            .then(response => {
                if (response.ok) {
                    const fileIndex = this.tableData.findIndex(file => file.name === key);
                    if (fileIndex !== -1) {
                        this.tableData[fileIndex].metadata.ListType = 'Block';
                    }
                } else {
                    return Promise.reject('请求失败');
                }
            })
            .then(() => {
                this.$message.success('加入黑名单成功');
            })
            .catch(() => this.$message.error('加入黑名单失败'));
        }).catch(
            () => console.log('已取消加入黑名单')
        );
    },
    handleWhite(key) {
        this.$confirm('此操作将把该文件加入白名单, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
        fetchWithAuth(`/api/manage/white/${key}`, { method: 'GET' })
            .then(response => {
                if (response.ok) {
                    const fileIndex = this.tableData.findIndex(file => file.name === key);
                    if (fileIndex !== -1) {
                        this.tableData[fileIndex].metadata.ListType = 'White';
                    }
                } else {
                    return Promise.reject('请求失败');
                }
            })
            .then(() => {
                this.$message.success('加入白名单成功');
            })
            .catch(() => this.$message.error('加入白名单失败'));
        }).catch(
            () => console.log('已取消加入白名单')
        );
    },
    handleDelete(index, key) {
        // 判断是否为文件夹
        const isFolder = this.tableData.find(file => file.name === key).isFolder;

        this.$confirm(`此操作将永久删除${isFolder ? '文件夹' : '该文件'}, 是否继续?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
        }).then(() => {
        fetchWithAuth(`/api/manage/delete/${key}?folder=${isFolder}`, { method: 'GET' })
            .then(response => {
                if (response.ok) {
                    const fileIndex = this.tableData.findIndex(file => file.name === key);
                    if (fileIndex !== -1) {
                        this.tableData.splice(fileIndex, 1);
                    }
                } else {
                    return Promise.reject('请求失败');
                }
            })
            .then(() => {
                this.updateStats(-1, false);
                fileManager.removeFile(key);
                this.$message.success('删除成功');
            })
            .catch(() => this.$message.error('删除失败'));
        }).catch(() => console.log('已取消删除'));
    },
    handleBatchDelete() {
        this.$confirm('此操作将永久删除选中的文件及文件夹, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
        }).then(() => {
        const promises = this.selectedFiles.map(file => {
            const isFolder = file.isFolder;
            return fetchWithAuth(`/api/manage/delete/${file.name}?folder=${isFolder}`, { method: 'GET' });
        });

        Promise.all(promises)
            .then(results => {
                let successNum = 0;
                results.forEach((response, index) => {
                    if (response.ok) {
                        successNum++;
                        const fileIndex = this.tableData.findIndex(file => file.name === this.selectedFiles[index].name);
                        if (fileIndex !== -1) {
                            this.tableData.splice(fileIndex, 1);
                        }
                        fileManager.removeFile(this.selectedFiles[index].name);
                    }
                });
                this.selectedFiles = [];
                this.updateStats(-successNum, false);
                this.$message.success('批量删除成功');
            })
            .catch(() => this.$message.error('批量删除失败'));
        }).catch(() => console.log('已取消批量删除'));
    },
    async handleBatchCopy() {
        // 分离文件和文件夹
        const files = this.selectedFiles.filter(item => !item.isFolder);
        const folders = this.selectedFiles.filter(item => item.isFolder);
        
        // 如果有文件夹，显示加载状态
        let loading = null;
        if (folders.length > 0) {
            loading = this.$loading({
                lock: true,
                text: '正在获取文件列表...'
            });
        }
        
        try {
            // 收集所有文件（包括文件夹内的文件）
            let allFiles = [...files];
            
            // 递归获取所有文件夹内的文件
            for (const folder of folders) {
                try {
                    const response = await fetchWithAuth(
                        `/api/manage/list?dir=${encodeURIComponent(folder.name)}&recursive=true&count=-1`,
                        { method: 'GET' }
                    );
                    const data = await response.json();
                    if (data.files && data.files.length > 0) {
                        allFiles = allFiles.concat(data.files);
                    }
                } catch (error) {
                    console.error(`获取文件夹 ${folder.name} 内容失败:`, error);
                }
            }
            
            if (loading) loading.close();
            
            if (allFiles.length === 0) {
                this.$message.warning('没有可复制的链接');
                return;
            }
            
            // 生成所有链接
            const links = allFiles.map(file => {
                return this.generateFileLink(file.name, file.metadata);
            }).filter(link => link); // 过滤掉空链接
            
            if (links.length === 0) {
                this.$message.warning('没有可复制的链接');
                return;
            }
            
            // 复制到剪贴板
            const text = links.join('\n');
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                this.$message.success(`批量复制 ${links.length} 个链接成功`);
            } else {
                this.copyToClipboardFallback(text);
            }
        } catch (error) {
            if (loading) loading.close();
            console.error('批量复制链接失败:', error);
            this.$message.error('批量复制链接失败，请重试');
        }
    },
    copyToClipboardFallback(text) {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.style.position = 'fixed';
        textarea.style.clip = 'rect(0 0 0 0)';
        textarea.style.top = '10px';
        textarea.value = text;
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.$message.success('批量复制链接成功');
    },
    handleCopy(index, key) {
        let text = '';
        if (this.paginatedTableData[index].metadata?.Channel === 'External') {
            switch (this.defaultUrlFormat) {
                case 'originUrl':
                    text = this.paginatedTableData[index].metadata?.ExternalLink;
                    break;
                case 'mdUrl':
                    text = `![${this.paginatedTableData[index].metadata?.FileName || key}](${this.paginatedTableData[index].metadata?.ExternalLink})`;
                    break;
                case 'htmlUrl':
                    text = `<img src="${this.paginatedTableData[index].metadata?.ExternalLink}" alt="${this.paginatedTableData[index].metadata?.FileName || key}" width=100%>`;
                    break;
                case 'bbUrl':
                    text = `[img]${this.paginatedTableData[index].metadata?.ExternalLink}[/img]`;
                    break;
                case 'tgId':
                    text = this.paginatedTableData[index].metadata?.TgFileId || 'none';
                    break;
                case 's3Location':
                    text = this.paginatedTableData[index].metadata?.S3Location || 'none';
                    break;
            }
        } else {
            switch (this.defaultUrlFormat) {
                case 'originUrl':
                    text = `${this.rootUrl}${key}`;
                    break;
                case 'mdUrl':
                    text = `![${this.paginatedTableData[index].metadata?.FileName || key}](${this.rootUrl}${key})`;
                    break;
                case 'htmlUrl':
                    text = `<img src="${this.rootUrl}${key}" alt="${this.paginatedTableData[index].metadata?.FileName || key}" width=100%>`;
                    break;
                case 'bbUrl':
                    text = `[img]${this.rootUrl}${key}[/img]`;
                    break;
                case 'tgId':
                    text = this.paginatedTableData[index].metadata?.TgFileId || 'none';
                    break;
                case 's3Location':
                    text = this.paginatedTableData[index].metadata?.S3Location || 'none';
                    break;
            }
        }
        navigator.clipboard ? navigator.clipboard.writeText(text).then(() => this.$message.success('复制文件链接成功')) :
        this.copyToClipboardFallback(text);
    },
    async loadMoreData() {
        this.loading = true;

        try {
            // 传递标签参数到后端
            await fileManager.loadMoreFiles(
                this.currentPath, 
                this.searchKeywords,
                this.searchIncludeTags,
                this.searchExcludeTags
            );
            // 获取新的文件列表后
            await this.fetchFileList();
        } catch (error) {
            this.$message.error('加载更多文件失败，请检查网络连接');
        } finally {
            this.loading = false;
        }
    },
    updateStats(num, init = false) {
        if (init) {
            this.Number = num;
        } else {
            this.Number += num;
        }
    },
    sort(command) {
        this.sortOption = command;
    },
    sortData(data) {
        // 文件夹始终在前
        const folders = data.filter(file => file.isFolder);
        const files = data.filter(file => !file.isFolder);

        if (this.sortOption === 'dateDesc') {
            // 按时间降序
            folders.sort((a, b) => new Date(b.metadata?.TimeStamp) - new Date(a.metadata?.TimeStamp));
            files.sort((a, b) => new Date(b.metadata?.TimeStamp) - new Date(a.metadata?.TimeStamp));
        } else {
            // 按文件名升序
            folders.sort((a, b) => a.name.localeCompare(b.name));
            files.sort((a, b) => a.name.localeCompare(b.name));
        }

        return folders.concat(files);
    },
    handleVideoClick(event) {
        const videoElement = event.target;
        if (videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
        } else if (videoElement.webkitRequestFullscreen) {
            // Safari/Old Chrome
            videoElement.webkitRequestFullscreen();
        } else if (videoElement.mozRequestFullScreen) {
            // Firefox
            videoElement.mozRequestFullScreen();
        } else if (videoElement.msRequestFullscreen) {
            // IE/Edge
            videoElement.msRequestFullscreen();
        }
    },
    handleLogout() {
        this.$store.commit('setCredentials', null);
        this.$router.push('/adminLogin');
    },
    handleSelectPage() {
        if (this.selectPage) {
            this.paginatedTableData.forEach(file => file.selected = false);
        } else {
            this.paginatedTableData.forEach(file => file.selected = true);
        }
    },
    handleBatchAction(command) {
        if (command === 'copy') {
            this.handleBatchCopy();
        } else if (command === 'delete') {
            this.handleBatchDelete();
        } else if (command === 'download') {
            this.handleBatchDownload();
        } else if (command === 'move') {
            this.handleBatchMove();
        } else if (command === 'tagManagement') {
            this.handleBatchTagManagement();
        } else if (command === 'ban') {
            this.handleBatchBlock();
        } else if (command === 'white') {
            this.handleBatchWhite();
        }
    },
    handleMove(index, key) {
        // 弹窗输入新的文件夹路径
        this.$prompt('请输入新的目录', '移动文件', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputValue: '/',
            beforeClose: (action, instance, done) => {
                if (action === 'confirm') {
                    const value = instance.inputValue;
                    // 使用共享验证器验证路径
                    const validation = validateFolderPath(value);
                    if (!validation.valid) {
                        this.$message.error(validation.error);
                        return; // 验证失败，不关闭弹窗
                    }
                    done(); // 验证通过，关闭弹窗
                } else {
                    done(); // 取消操作，直接关闭
                }
            }
        }).then(({ value }) => {
            // 去掉开头的 /，结尾若没有 /，则加上
            const newPath = value.replace(/^\/+/, '') + (value.endsWith('/') ? '' : value === '' ? '' : '/');
            const isFolder = this.tableData.find(file => file.name === key).isFolder;
            // 判断目标文件夹是否是当前文件夹
            if (newPath === this.currentPath) {
                this.$message.warning('目标文件夹不能是当前文件夹');
                return;
            }
            fetchWithAuth(`/api/manage/move/${key}?folder=${isFolder}&dist=${newPath}`, { method: 'GET' })
                .then(response => {
                    if (response.ok) {
                        const fileIndex = this.tableData.findIndex(file => file.name === key);
                        if (fileIndex !== -1) {
                            // 更新本地文件管理器
                            const newKey = newPath + key.split('/').pop();
                            fileManager.moveFile(key, newKey, isFolder, this.currentPath);
                            // 移除文件
                            this.tableData.splice(fileIndex, 1);
                            // 强制重新渲染内容
                            this.$nextTick(() => {
                                // 创建临时数组
                                const tempData = [...this.tableData];
                                // 清空数组
                                this.tableData = [];
                                // 在下一个tick中恢复数据
                                this.$nextTick(() => {
                                    this.tableData = tempData;
                                });
                            });
                        }
                        this.updateStats(-1, false);
                        this.$message.success('移动成功');
                    } else {
                        return Promise.reject('请求失败');
                    }
                })
                .then(() => {
                    // 刷新本地文件列表
                    this.refreshLocalFileList();
                })
                .catch(() => this.$message.error('移动失败'));
        }).catch(() => console.log('已取消移动文件'));
    },
    handleBatchMove() {
        // 弹窗输入新的文件夹路径
        this.$prompt('请输入新的目录', '移动文件', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputValue: '/',
            beforeClose: (action, instance, done) => {
                if (action === 'confirm') {
                    const value = instance.inputValue;
                    // 使用共享验证器验证路径
                    const validation = validateFolderPath(value);
                    if (!validation.valid) {
                        this.$message.error(validation.error);
                        return; // 验证失败，不关闭弹窗
                    }
                    done(); // 验证通过，关闭弹窗
                } else {
                    done(); // 取消操作，直接关闭
                }
            }
        }).then(({ value }) => {
            // 去掉开头的 /，结尾若没有 /，则加上
            const newPath = value.replace(/^\/+/, '') + (value.endsWith('/') ? '' : value === '' ? '' : '/');
            // 判断目标文件夹是否是当前文件夹
            if (newPath === this.currentPath) {
                this.$message.warning('目标文件夹不能是当前文件夹');
                return;
            }
            const promises = this.selectedFiles.map(file => {
                const isFolder = file.isFolder;
                return fetchWithAuth(`/api/manage/move/${file.name}?folder=${isFolder}&dist=${newPath}`, { method: 'GET' });
            });

            Promise.all(promises)
                .then(results => {
                    let successNum = 0;
                    results.forEach((response, index) => {
                        if (response.ok) {
                            successNum++;
                            const file = this.selectedFiles[index];
                            file.selected = false;
                            const fileIndex = this.tableData.findIndex(f => f.name === file.name);
                            if (fileIndex !== -1) {
                                // 更新本地文件管理器
                                const newKey = newPath + file.name.split('/').pop();
                                fileManager.moveFile(file.name, newKey, file.isFolder, this.currentPath);
                                // 移除文件
                                this.tableData.splice(fileIndex, 1);
                            }
                        }
                    });
                    // 强制重新渲染内容
                    this.$nextTick(() => {
                        // 创建临时数组
                        const tempData = [...this.tableData];
                        // 清空数组
                        this.tableData = [];
                        // 在下一个tick中恢复数据
                        this.$nextTick(() => {
                            this.tableData = tempData;
                        });
                    });
                    this.updateStats(-successNum, false);
                    this.$message.success('移动成功');
                })
                .then(() => {
                    // 刷新本地文件列表
                    this.refreshLocalFileList();
                })
                .catch(() => this.$message.error('移动失败'));
        }).catch(() => console.log('已取消移动文件'));
    },
    handleBatchBlock(){
        this.$confirm('此操作将把选中的文件加入黑名单, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            // 跳过文件夹
            const promises = this.selectedFiles.map(file => {
                if (file.isFolder) {
                    return Promise.resolve({ ok: false });
                }
                return fetchWithAuth(`/api/manage/block/${file.name}`, { method: 'GET' });
            });

            Promise.all(promises)
                .then(results => {
                    results.forEach((response, index) => {
                        if (response.ok) {
                            const fileIndex = this.tableData.findIndex(file => file.name === this.selectedFiles[index].name);
                            if (fileIndex !== -1) {
                                this.tableData[fileIndex].metadata.ListType = 'Block';
                            }
                        }
                    });
                    this.$message.success('批量加入黑名单成功');
                })
                .catch(() => this.$message.error('批量加入黑名单失败'));
        }).catch(() => console.log('已取消批量加入黑名单'));
    },
    handleBatchWhite(){
        this.$confirm('此操作将把选中的文件加入白名单, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            // 跳过文件夹
            const promises = this.selectedFiles.map(file => {
                if (file.isFolder) {
                    return Promise.resolve({ ok: false });
                }
                return fetchWithAuth(`/api/manage/white/${file.name}`, { method: 'GET' });
            });

            Promise.all(promises)
                .then(results => {
                    results.forEach((response, index) => {
                        if (response.ok) {
                            const fileIndex = this.tableData.findIndex(file => file.name === this.selectedFiles[index].name);
                            if (fileIndex !== -1) {
                                this.tableData[fileIndex].metadata.ListType = 'White';
                            }
                        }
                    });
                    this.$message.success('批量加入白名单成功');
                })
                .catch(() => this.$message.error('批量加入白名单失败'));
        }).catch(() => console.log('已取消批量加入白名单'));
    },
    handleBatchDownload() {
        // 将选中文件打包成 zip 文件下载
        const zip = new JSZip();
        const folder = zip.folder('files');
        // 构造Promise数组，等待所有文件下载完成后再打包
        const fileNameCount = {}; // 用于跟踪文件名出现的次数

        const downloadPromises = this.selectedFiles.map(async file => {
            // 跳过文件夹
            if (file.isFolder) {
                return;
            }
            const response = await fetch(this.getFileLink(file.name));
            const blob = await response.blob();
            // 检查文件名是否已经存在
            let fileName = file.metadata?.FileName || file.name;
            if (fileNameCount[fileName]) {
                // 如果已经存在，则在文件名后加上编号
                const extension = fileName.substring(fileName.lastIndexOf('.'));
                const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
                fileName = `${baseName}(${fileNameCount[fileName]})${extension}`;
                fileNameCount[file.name]++;
            } else {
                // 如果不存在，则初始化为1
                fileNameCount[fileName] = 1;
            }
            // 将文件添加到 zip 文件夹中
            folder.file(fileName, blob);
        });

        Promise.all(downloadPromises)
            .then(() => zip.generateAsync({ type: 'blob' }))
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'files.zip';
                link.click();
            });
    },
    isVideo(file) {
        // 排除音频文件
        if (this.isAudio(file)) return false;
        let flag = file.metadata?.FileType?.includes('video');
        // 用文件名后缀判断是否为视频文件
        if (!flag) {
            const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'flv', 'wmv', 'mkv', 'rmvb', '3gp', 'mpg', 'mpeg', 'm4v', 'f4v', 'rm', 'asf', 'dat', 'ts', 'vob', 'swf', 'divx', 'xvid', 'm2ts', 'mts', 'm2v', '3g2', '3gp2', '3gpp', '3gpp2', 'mpe', 'm1v', 'mpv', 'mpv2', 'mp2v', 'm2t', 'm2ts', 'm2v', 'm4v'];
            const extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
            flag = videoExtensions.includes(extension);
        }
        return flag;
    },
    isAudio(file) {
        let flag = file.metadata?.FileType?.includes('audio');
        // 用文件名后缀判断是否为音频文件
        if (!flag) {
            const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'ape', 'aiff', 'alac', 'opus', 'mid', 'midi', 'm4b', 'm4p', 'm4r', 'amr', 'au', 'ra', 'ram'];
            const extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
            flag = audioExtensions.includes(extension);
        }
        return flag;
    },
    isImage(file) {
        let flag = file.metadata?.FileType?.includes('image');
        // 用文件名后缀判断是否为图片文件
        if (!flag) {
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'psd', 'ai', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2', 'dng', 'arw', 'rw2', 'raf', 'pef', 'x3f', 'srf', 'erf', 'mrw', 'nrw', 'kdc', 'dcr', 'mef', 'mos', 'crw', 'raf', 'rwl', 'srw', '3fr', 'fff', 'iiq', 'qtk', 'bay', 'k25', 'kdc', 'dcs', 'drf', 'dng', 'erf', 'kdc', 'mdc', 'mef', 'mos', 'mrw', 'nef', 'nrw', 'orf', 'pef', 'ptx', 'pxn', 'r3d', 'raf', 'raw', 'rwl', 'rw2', 'rwz', 'sr2', 'srf', 'x3f'];
            const extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
            flag = imageExtensions.includes(extension);
        }
        return flag;
    },
    getFileLink(filename) {
        const fileLink = process.env.NODE_ENV === 'production' ? `/file/${filename}?from=admin` : `/api/file/${filename}?from=admin`;
        return fileLink;
    },
    handlePageChange(page) {
        this.currentPage = page;
        // 到最后一页时，加载更多数据
        if (this.currentPage === Math.ceil(this.tableData.length / this.pageSize)) {
            this.loadMoreData();
        }
    },
    // 跳转到指定页码
    handleJumpPage() {
        const page = parseInt(this.jumpPage);
        if (isNaN(page) || page < 1) {
            this.$message.warning('请输入有效的页码');
            return;
        }
        if (page > this.realTotalPages) {
            this.$message.warning(`页码不能超过 ${this.realTotalPages}`);
            return;
        }
        // 如果目标页超过当前已加载的页数，需要先加载更多数据
        if (page > this.totalPages) {
            this.$message.info('正在加载数据，请稍候...');
            this.loadMoreDataUntilPage(page);
        } else {
            this.currentPage = page;
        }
        this.jumpPage = '';
    },
    // 加载数据直到指定页
    async loadMoreDataUntilPage(targetPage) {
        this.loading = true;
        try {
            // 计算目标页需要的文件数量（不包含文件夹）
            // 目标页最后一个项目的索引 = targetPage * pageSize
            // 需要的文件数 = 目标索引 - 已有文件夹数量
            const targetIndex = targetPage * this.pageSize;
            const currentFolderCount = this.filteredTableData.filter(item => item.isFolder).length;
            const currentFileCount = this.filteredTableData.filter(item => !item.isFolder).length;
            
            // 需要加载的文件数量 = 目标位置需要的文件数 - 当前已加载的文件数
            const neededFileCount = Math.max(0, targetIndex - currentFolderCount - currentFileCount);
            
            if (neededFileCount > 0) {
                await fileManager.loadMoreFiles(
                    this.currentPath,
                    this.searchKeywords,
                    this.searchIncludeTags,
                    this.searchExcludeTags,
                    neededFileCount
                );
                await this.fetchFileList();
            }
            
            this.currentPage = Math.min(targetPage, this.totalPages);
        } catch (error) {
            this.$message.error('加载数据失败，请检查网络连接');
        } finally {
            this.loading = false;
        }
    },
    // 判断是否为文件夹
    isFolder(item) {
        // 如果是已经标记为文件夹的项目，直接返回true
        if (item.isFolder) {
            return true;
        }
        
        // 获取真实的文件路径（去除URL前缀）
        let path = item.name;
        if (path.startsWith('http')) {
            path = path.split('/file/')[1];
        }
        
        // 如果文件名包含'/'，需要判断是否是当前路径下的文件
        if (path && path.includes('/')) {
            // 获取相对于当前路径的部分
            const relativePath = this.currentPath ? 
                path.substring(this.currentPath.length) : 
                path;
            
            // 如果在根目录，第一个斜杠前的部分就是文件夹
            if (this.currentPath === '') {
                return !path.split('/')[0].includes('.');
            }
            
            // 如果在子文件夹中，检查相对路径是否还包含其他文件夹
            return relativePath.includes('/');
        }
        
        return false;
    },
    
    // 获取文件夹名称
    getFolderName(path) {
        let folderName = '';
        // 如果是文件夹路径，只返回最后一级文件夹名
        if (path && path.includes('/')) {
            const parts = path.split('/');
            // 如果是根目录下的文件夹
            if (this.currentPath === '') {
                folderName = parts[0];
            } else {
                // 如果是子文件夹
                const relativePath = path.substring(this.currentPath.length);
                folderName = relativePath.split('/')[0];
            }
        } else {
            folderName = path;
        }

        const maxLength = 20; // Adjust max length as needed
        if (folderName.length > maxLength) {
            const startLength = Math.floor((maxLength - 3) / 2);
            const endLength = Math.ceil((maxLength - 3) / 2);
            return `${folderName.substring(0, startLength)}...${folderName.substring(folderName.length - endLength)}`;
        }
        return folderName;
    },
    
    // 获取文件名称（去除路径和URL前缀）
    getFileName(path) {
        let fileName = path.split('/').pop();
        const maxLength = 20; // Adjust max length as needed, ensure it fits in one line
        if (fileName.length > maxLength) {
            const startLength = Math.floor((maxLength - 3) / 2);
            const endLength = Math.ceil((maxLength - 3) / 2);
            return `${fileName.substring(0, startLength)}...${fileName.substring(fileName.length - endLength)}`;
        }
        return fileName;
    },
    
    // 获取文件名前半部分（用于中间省略效果）
    getFileNameStart(name) {
        if (!name) return '';
        // 如果文件名较短，返回全部
        if (name.length <= 30) return name;
        // 保留开头部分（约60%的长度用于显示前半部分）
        const dotIndex = name.lastIndexOf('.');
        if (dotIndex > 0) {
            // 有扩展名的情况：返回文件名主体部分
            const baseName = name.substring(0, dotIndex);
            const keepLength = Math.min(baseName.length, Math.floor(name.length * 0.6));
            return baseName.substring(0, keepLength);
        }
        // 无扩展名的情况
        return name.substring(0, Math.floor(name.length * 0.6));
    },
    
    // 获取文件名后半部分（用于中间省略效果）
    getFileNameEnd(name) {
        if (!name) return '';
        // 如果文件名较短，返回空
        if (name.length <= 30) return '';
        // 保留末尾部分（包含扩展名）
        const dotIndex = name.lastIndexOf('.');
        if (dotIndex > 0) {
            // 有扩展名的情况：返回最后几个字符 + 扩展名
            const ext = name.substring(dotIndex);
            const baseName = name.substring(0, dotIndex);
            const keepLength = Math.min(8, Math.floor(baseName.length * 0.2));
            return '…' + baseName.substring(baseName.length - keepLength) + ext;
        }
        // 无扩展名的情况
        const keepLength = Math.min(10, Math.floor(name.length * 0.3));
        return '…' + name.substring(name.length - keepLength);
    },
    
    // 进入文件夹
    enterFolder(folderPath) {
        // 确保路径末尾有 '/'
        this.currentPath = folderPath + (folderPath.endsWith('/') ? '' : '/');
        // 刷新文件列表，到指定currentPath下
        this.refreshFileList();
    },
    
    // 导航到指定文件夹
    navigateToFolder(path) {
        // 确保空路径时不添加 '/'
        this.currentPath = path ? (path + (path.endsWith('/') ? '' : '/')) : '';
        // 刷新文件列表，到指定currentPath下
        this.refreshFileList();
    },
    
    // 获取文件列表
    async fetchFileList() {
        this.loading = true;
        try {
            // 从本地存储获取数据
            const data = fileManager.getLocalFileList();
            
            // 解析返回的数据
            const folders = new Set(data.directories || []);
            const files = data.files || [];

            // 处理文件夹数据
            const folderItems = Array.from(folders).map(folder => ({
                name: folder,
                isFolder: true,
                selected: false,
                metadata: { FileName: folder.split('/').pop() }
            }));

            // 处理文件数据
            const fileItems = files.map(file => ({
                name: file.name,
                isFolder: false,
                selected: false,
                metadata: file.metadata
            }));

            // 更新表格数据
            this.tableData = [...folderItems, ...fileItems];

            // 更新统计信息
            this.updateStats(data.totalCount, true);
            
            // 更新直接文件和文件夹数量
            this.directFileCount = data.directFileCount || 0;
            this.directFolderCount = data.directFolderCount || 0;

        } catch (error) {
            console.error('Error fetching file list:', error);
            this.$message.error('获取文件列表失败');
        } finally {
            this.loading = false;
        }
    },
    // 刷新文件列表
    async refreshFileList() {
        this.refreshLoading = true;
        this.loading = true;
        try {
            // 传递标签参数到后端
            const success = await fileManager.refreshFileList(
                this.currentPath, 
                this.searchKeywords,
                this.searchIncludeTags,
                this.searchExcludeTags
            );
            if (success) {
                await this.fetchFileList();
            } else {
                throw new Error('Refresh failed');
            }
        } catch (error) {
            console.error('Error refreshing file list:', error);
            this.$message.error('刷新失败，请重试');
        } finally {
            this.refreshLoading = false;
            this.loading = false;
        }
    },
    // 刷新本地文件列表
    async refreshLocalFileList() {
        this.refreshLoading = true;
        this.loading = true;
        try {
            await this.fetchFileList();
        } catch (error) {
            console.error('Error refreshing local file list:', error);
            this.$message.error('刷新失败，请重试');
        } finally {
            this.refreshLoading = false;
            this.loading = false;
        }
    },
    // Tag management methods
    handleTagManagement(fileId) {
        this.currentTagFile = fileId;
        this.showTagDialog = true;
    },
    handleBatchTagManagement() {
        if (this.selectedFiles.length === 0) {
            this.$message.warning('请先选择文件');
            return;
        }
        this.showBatchTagDialog = true;
    },
    async handleTagsUpdated(tags) {
        // 更新本地文件数据中的标签
        const fileIndex = this.tableData.findIndex(file => file.name === this.currentTagFile);
        if (fileIndex !== -1) {
            // 更新 tableData 中的标签
            if (!this.tableData[fileIndex].metadata) {
                this.tableData[fileIndex].metadata = {};
            }
            this.tableData[fileIndex].metadata.Tags = tags;
            
            // 如果详情对话框正在显示这个文件，也更新详情数据
            if (this.showdetailDialog && this.detailFile?.name === this.currentTagFile) {
                if (!this.detailFile.metadata) {
                    this.detailFile.metadata = {};
                }
                this.detailFile.metadata.Tags = tags;
            }
        }
    },
    async handleBatchTagsUpdated() {
        // 刷新文件列表以显示更新后的标签
        await this.refreshLocalFileList();
    },
    // 生成单个文件链接
    generateFileLink(key, metadata) {
        const isExternal = metadata?.Channel === 'External';
        const baseUrl = isExternal ? metadata?.ExternalLink : `${this.rootUrl}${key}`;
        const fileName = metadata?.FileName || key;
        
        switch (this.defaultUrlFormat) {
            case 'originUrl':
                return baseUrl;
            case 'mdUrl':
                return `![${fileName}](${baseUrl})`;
            case 'htmlUrl':
                return `<img src="${baseUrl}" alt="${fileName}" width=100%>`;
            case 'bbUrl':
                return `[img]${baseUrl}[/img]`;
            case 'tgId':
                return metadata?.TgFileId || '';
            case 's3Location':
                return metadata?.S3Location || '';
            default:
                return baseUrl;
        }
    },
    // 复制文件夹中所有文件的链接
    async handleFolderCopy(folderName) {
        // 显示加载状态
        const loading = this.$loading({
            lock: true,
            text: '正在获取文件列表...'
        });
        
        try {
            // 调用 list API 递归获取文件夹内所有文件
            const response = await fetchWithAuth(
                `/api/manage/list?dir=${encodeURIComponent(folderName)}&recursive=true&count=-1`,
                { method: 'GET' }
            );
            
            const data = await response.json();
            loading.close();
            
            if (!data.files || data.files.length === 0) {
                this.$message.warning('文件夹为空，没有可复制的链接');
                return;
            }
            
            // 根据当前链接格式生成所有文件链接
            const links = data.files.map(file => {
                return this.generateFileLink(file.name, file.metadata);
            }).filter(link => link); // 过滤掉空链接
            
            if (links.length === 0) {
                this.$message.warning('没有可复制的链接');
                return;
            }
            
            // 复制到剪贴板
            const text = links.join('\n');
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                this.$message.success(`已复制 ${links.length} 个文件链接`);
            } else {
                this.copyToClipboardFallback(text);
                this.$message.success(`已复制 ${links.length} 个文件链接`);
            }
        } catch (error) {
            loading.close();
            console.error('复制文件夹链接失败:', error);
            this.$message.error('复制文件夹链接失败，请重试');
        }
    },
    // 文本预览相关方法
    async handleTextFileHover(item) {
        const fileName = item.name;
        if (this.textPreviewCache[fileName]) return;

        this.$set(this.textPreviewCache, fileName, { loading: true });

        try {
            const fileLink = this.getFileLink(fileName);
            const response = await fetch(fileLink);
            if (!response.ok) throw new Error('Failed to fetch');

            const text = await response.text();
            const lines = text.split('\n').slice(0, 15).join('\n');
            const ext = fileName.split('.').pop().toLowerCase();
            const langMap = {
                'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
                'ts': 'typescript', 'tsx': 'typescript',
                'py': 'python', 'sh': 'bash', 'bash': 'bash',
                'json': 'json', 'xml': 'xml', 'html': 'xml',
                'css': 'css', 'sql': 'sql', 'yaml': 'yaml', 'yml': 'yaml',
                'md': 'markdown', 'go': 'go', 'java': 'java',
                'php': 'php', 'rb': 'ruby', 'rs': 'rust',
                'c': 'c', 'h': 'c', 'cpp': 'cpp', 'hpp': 'cpp',
                'cs': 'csharp', 'swift': 'swift', 'kt': 'kotlin',
                'scala': 'scala', 'ini': 'ini', 'conf': 'ini',
                'dockerfile': 'dockerfile'
            };
            const lang = langMap[ext] || 'plaintext';
            const highlighted = hljs.highlight(lines, { language: lang }).value;

            this.$set(this.textPreviewCache, fileName, {
                loading: false,
                highlighted,
                hasMore: text.split('\n').length > 15
            });
        } catch (error) {
            this.$set(this.textPreviewCache, fileName, { loading: false, error: true });
        }
    },
    handleTextFileLeave(item) {
        // 可选：清理缓存或保留
    },
    async openTextPreview(item) {
        const fileName = item.name;
        const displayName = item.metadata?.FileName || fileName.split('/').pop();
        const fileLink = this.getFileLink(fileName);

        this.textPreviewDialogData = {
            loading: true,
            error: null,
            content: '',
            highlighted: '',
            fileName,
            displayName,
            fileLink
        };
        this.textPreviewDialogVisible = true;

        try {
            const response = await fetch(fileLink);
            if (!response.ok) throw new Error('Failed to fetch');

            const text = await response.text();
            const ext = fileName.split('.').pop().toLowerCase();
            const langMap = {
                'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
                'ts': 'typescript', 'tsx': 'typescript',
                'py': 'python', 'sh': 'bash', 'bash': 'bash',
                'json': 'json', 'xml': 'xml', 'html': 'xml',
                'css': 'css', 'sql': 'sql', 'yaml': 'yaml', 'yml': 'yaml',
                'md': 'markdown', 'go': 'go', 'java': 'java',
                'php': 'php', 'rb': 'ruby', 'rs': 'rust',
                'c': 'c', 'h': 'c', 'cpp': 'cpp', 'hpp': 'cpp',
                'cs': 'csharp', 'swift': 'swift', 'kt': 'kotlin',
                'scala': 'scala', 'ini': 'ini', 'conf': 'ini',
                'dockerfile': 'dockerfile'
            };
            const lang = langMap[ext] || 'plaintext';
            const highlighted = hljs.highlight(text, { language: lang }).value;

            this.textPreviewDialogData = {
                ...this.textPreviewDialogData,
                loading: false,
                content: text,
                highlighted
            };
        } catch (error) {
            this.textPreviewDialogData = {
                ...this.textPreviewDialogData,
                loading: false,
                error: error.message
            };
        }
    },
    copyTextContent() {
        const text = this.textPreviewDialogData.content;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            this.$message.success('已复制文件内容');
        } else {
            this.copyToClipboardFallback(text);
            this.$message.success('已复制文件内容');
        }
    },
    copyFileLink() {
        const link = window.location.origin + '/file/' + this.textPreviewDialogData.fileName;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link);
            this.$message.success('已复制下载链接');
        } else {
            this.copyToClipboardFallback(link);
            this.$message.success('已复制下载链接');
        }
    },
    downloadTextFile() {
        const link = this.textPreviewDialogData.fileLink;
        const a = document.createElement('a');
        a.href = link;
        a.download = this.textPreviewDialogData.displayName;
        a.click();
    },
    copyPreviewLink() {
        const link = window.location.origin + '/preview/' + this.textPreviewDialogData.fileName;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link);
            this.$message.success('已复制预览链接');
        } else {
            this.copyToClipboardFallback(link);
            this.$message.success('已复制预览链接');
        }
    },
    openInNewTab() {
        const link = window.location.origin + '/preview/' + this.textPreviewDialogData.fileName;
        window.open(link, '_blank');
    },
    handleThemeChange(theme) {
        this.currentCodeTheme = theme;
        this.$store.commit('setCodeTheme', theme);
    },
    get dialogLineCount() {
        return this.textPreviewDialogData.content ? this.textPreviewDialogData.content.split('\n').length : 0;
    },
},
mounted() {
    this.loading = true;
    fetchWithAuth("/api/manage/check", { method: 'GET' })
        .then(response => response.text())
        .then(result => {
            if(result == "true"){
                this.showLogoutButton = true;
                return true;
            } else if(result == "Not using basic auth."){
                return true;
            } else {
                throw new Error('Unauthorized');
            }
        })
        .then(() => {
            // 首次加载时刷新文件列表
            return this.refreshFileList();
        })
        .catch((err) => {
            if (err.message !== 'Unauthorized') {
                this.$message.error('同步数据时出错，请检查网络连接');
            }
        })
        .finally(() => {
            this.loading = false;
        });
    
    // 读取自定义链接设置项
    this.customUrlPrefix = this.adminUrlSettings.customUrlPrefix;
    this.useCustomUrl = this.adminUrlSettings.useCustomUrl;
}

};
</script>

<style scoped>
.container {
    background: var(--admin-container-bg-color);
    min-height: 100vh;
    font-family: 'Arial', sans-serif;
    color: var(--admin-container-color);
    margin: 0;
    padding: 0;
}

/* 确保el-container和el-main不裁剪内容 */
:deep(.el-container) {
    overflow: visible;
}

:deep(.el-main) {
    overflow: visible;
}

:deep(.el-dialog) {
    border-radius: 12px;
    background-color: var(--dialog-bg-color);
    backdrop-filter: blur(10px);
    box-shadow: var(--dialog-box-shadow);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 24px;
    /* macOS 风格毛玻璃效果 */
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    /* 顶部边框形成玻璃边缘光泽 */
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.5);
    /* 悬浮阴影效果 */
    box-shadow: 
        0 4px 30px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px;
    position: fixed;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(95% - 16px);
    z-index: 2001;
    min-height: 45px;
}

/* 深色模式毛玻璃效果 */
html.dark .header-content {
    background: rgba(30, 30, 30, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 
        0 4px 30px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}


@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        top: 6px;
        width: calc(100% - 32px);
        border-radius: 14px;
        padding: 6px 12px;
        gap: 4px;
    }
    
    .header-icon {
        font-size: 0.95em;
    }
    
    .header-content .actions {
        gap: 10px;
    }
    
    .search-card :deep(.el-input__inner) {
        height: 28px;
        font-size: 0.85em;
        width: 50vw;
    }
    
    .search-card :deep(.el-input__wrapper) {
        padding: 0 10px;
    }
    
    .search-card :deep(.el-input__inner:focus) {
        width: 65vw;
    }
}

.header-content:hover {
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 
        0 8px 40px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transform: translateX(-50%) translateY(-1px);
}

html.dark .header-content:hover {
    background: rgba(35, 35, 35, 0.85);
    box-shadow: 
        0 8px 40px rgba(0, 0, 0, 0.4),
        0 2px 6px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.header-icon {
    font-size: 1.5em;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--admin-container-color);
    outline: none;
}

.header-icon:hover {
    color: var(--admin-purple); /* 使用柔和的淡紫色 */
    transform: scale(1.2);
}


/* 面包屑容器，包含路径和文件数量 */
.breadcrumb-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 10px; /* 与 .content 的 padding 对齐 */
    margin-bottom: 4px; /* 与下方内容的间距 */
}

@media (max-width: 768px) {
    .breadcrumb-container {
        flex-direction: row;
        align-items: center;
        gap: 8px;
        padding: 0 5px;
        margin-bottom: 2px;
    }
}

/* 文件数量小徽章 */
.stats-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.stats-badge:hover {
    background: var(--el-fill-color);
    color: var(--admin-purple);
    border-color: var(--admin-purple);
}

.stats-badge-icon {
    font-size: 11px;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .stats-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 8px;
    }
    
    .stats-badge-icon {
        font-size: 9px;
    }
}


.header-content .actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

@media (max-width: 768px) {
    .header-content .actions {
        margin-top: 10px;
    }
}

.header-content .actions i {
    font-size: 1.5em;
    cursor: pointer;
    transition: color 0.3s, transform 0.3s;
    color: var(--admin-container-color);
}

.header-content .actions i:hover {
    color: var(--admin-purple); /* 使用柔和的淡紫色 */
    transform: scale(1.2);
}

.header-content .actions .el-dropdown-link i {
    color: var(--admin-container-color);
}

.header-content .actions .el-dropdown-link i:hover {
    color: var(--admin-purple); /* 使用柔和的淡紫色 */
}

.header-content .actions .disabled {
    color: #bbb;
    pointer-events: none;
}

.header-content .actions .enabled {
    color: var(--admin-purple); /* 使用柔和的淡紫色 */
}

.batch-action-item-icon {
    width: 20px;
    margin-right: 5px;
}

/* 搜索卡片样式 */
.search-card {
    margin-left: auto;
    margin-right: 20px;
}
@media (max-width: 768px) {
    .search-card {
        margin-right: 0;
        margin-left: 0;
        margin-top: 10px;
    }
}
.search-card :deep(.el-input__wrapper) {
    border-radius: 20px;
    background: var(--admin-dashboard-search-card-bg-color);
    box-shadow: var(--admin-dashboard-search-card-box-shadow);
    transition: background-color 0.3s;
}

.search-card :deep(.el-input__inner) {
    width: 300px;
    height: 40px;
    font-size: 1.2em;
    border: none;
    transition: width 0.3s;
    background: none;
}

.search-card :deep(.el-input__inner::placeholder) {
    color: var(--el-text-color-placeholder);
    font-style: italic;
    font-weight: 400;
    font-size: 14px;
    opacity: 0.6;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
}

.search-card :deep(.el-input__inner:focus::placeholder) {
    opacity: 0.4;
    transform: translateX(5px);
}
@media (max-width: 768px) {
    .search-card :deep(.el-input__inner) {
        width: 60vw;
    }
}
.search-card :deep(.el-input__inner:focus) {
    width: 400px;
}
@media (max-width: 768px) {
    .search-card :deep(.el-input__inner:focus) {
        width: 80vw;
    }
}
.search-icon {
    cursor: pointer;
    color: var(--admin-container-color);
    transition: all 0.3s ease;
    font-size: 1.3em;
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
}
.search-card:focus-within .search-icon {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
}
.search-card:focus-within .search-icon:hover {
    color: var(--admin-purple); /* 使用柔和的淡紫色 */
    transform: scale(1.2);
}
.search-card :deep(.el-input__suffix) {
    display: flex;
    align-items: center;
    right: 10px;
}

/* 主容器样式 */
.main-container {
    display: flex;
    flex-direction: column;
    padding: 20px 60px;
    min-height: calc(100vh - 80px);
}

@media (max-width: 768px) {
    .main-container {
        margin-top: 12vh;
    }
}

.content {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 20px;
    padding: 10px;
    padding-bottom: 0px;
    flex-grow: 1;
    min-height: 80vh;
}

/* 在小屏幕上，将所有内容放入一列 */
@media (max-width: 768px) {
    .content {
        grid-template-columns: 1fr; /* 将所有内容放入一列 */
        grid-template-rows: none;   /* 行根据内容高度自动调整 */
    }
}

/* 列表视图样式 - 仅保留容器和表头 */
.list-view {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--admin-dashboard-imgcard-bg-color);
    border-radius: 12px;
    overflow-x: auto;
    overflow-y: visible;
    box-shadow: var(--admin-dashboard-imgcard-shadow);
    margin-top: 15px;
}

.list-header {
    display: grid;
    grid-template-columns: 50px 60px minmax(180px, 1fr) 130px 100px 110px 130px 80px 100px 120px;
    padding: 12px 20px;
    background: var(--admin-dashboard-stats-bg);
    font-weight: 600;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    min-width: fit-content;
}

.list-col {
    display: flex;
    align-items: center;
}

.list-col-checkbox {
    justify-content: center;
    min-width: 40px;
}

/* 表头自定义复选框 */
.custom-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--el-border-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
}

.custom-checkbox:hover {
    border-color: #38bdf8;
}

.custom-checkbox.checked,
.custom-checkbox.indeterminate {
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    border-color: #38bdf8;
}

.custom-checkbox .check-icon {
    font-size: 10px;
    color: white;
}

/* 移动端列表视图 */
@media (max-width: 768px) {
    .list-header {
        display: none;
    }
}

.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    padding-bottom: 20px;
    gap: 15px;
    position: relative;
}

.pagination-center {
    display: flex;
    align-items: center;
    gap: 10px;
}

/* 页码按钮美化 */
.pagination-container :deep(.el-pagination) {
    --el-pagination-button-bg-color: var(--admin-dashboard-btn-bg-color);
    --el-pagination-hover-color: var(--admin-purple);
}

.pagination-container :deep(.el-pager li) {
    background: var(--admin-dashboard-btn-bg-color);
    border-radius: 10px;
    margin: 0 4px;
    min-width: 36px;
    height: 36px;
    line-height: 36px;
    font-weight: 500;
    border: none;
    box-shadow: var(--admin-dashboard-btn-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pagination-container :deep(.el-pager li:hover) {
    color: #38bdf8;
    transform: translateY(-2px);
    box-shadow: var(--admin-dashboard-btn-hover-shadow);
}

.pagination-container :deep(.el-pager li.is-active) {
    background: linear-gradient(135deg, #0ea5e9, #38bdf8) !important;
    color: white !important;
    border-radius: 10px;
    box-shadow: 
        var(--admin-dashboard-btn-shadow),
        0 4px 12px rgba(56, 189, 248, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pagination-container :deep(.el-pager li.is-active:hover) {
    transform: translateY(-2px) !important;
    box-shadow: 
        var(--admin-dashboard-btn-hover-shadow),
        0 6px 16px rgba(56, 189, 248, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.pagination-container :deep(.btn-prev),
.pagination-container :deep(.btn-next) {
    background: var(--admin-dashboard-btn-bg-color) !important;
    border-radius: 10px !important;
    min-width: 36px;
    height: 36px;
    border: none;
    box-shadow: var(--admin-dashboard-btn-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pagination-container :deep(.btn-prev:hover),
.pagination-container :deep(.btn-next:hover) {
    color: #38bdf8;
    transform: translateY(-2px);
    box-shadow: var(--admin-dashboard-btn-hover-shadow);
}

.pagination-right {
    display: flex;
    align-items: center;
    gap: 10px;
    position: absolute;
    right: 0;
}

/* 分页信息区域 */
.page-total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

.page-jump {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.page-jump .jump-input {
    width: 50px;
}

.page-jump .jump-input :deep(.el-input__wrapper) {
    background: var(--admin-dashboard-btn-bg-color);
    box-shadow: var(--admin-dashboard-btn-shadow);
    border-radius: 8px;
    padding: 0 8px;
    height: 28px;
}

.page-jump .jump-input :deep(.el-input__inner) {
    text-align: center;
    color: var(--el-text-color-primary);
    height: 28px;
    line-height: 28px;
}

.page-jump .jump-btn {
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    border: none;
    border-radius: 8px;
    padding: 0 12px;
    height: 28px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
    transition: all 0.3s ease;
}

.page-jump .jump-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
}

/* 移动端分页适配 */
@media (max-width: 768px) {
    .pagination-container {
        flex-direction: column;
        gap: 12px;
        padding-bottom: 15px;
    }
    
    .pagination-center {
        order: 0;
    }
    
    .pagination-right {
        position: static;
        width: 100%;
        justify-content: center;
        order: 1;
    }
    
    .page-jump .jump-input {
        width: 45px;
    }
}

.refresh-btn {
    cursor: pointer;
    background: var(--admin-dashboard-btn-bg-color);
    box-shadow: var(--admin-dashboard-btn-shadow);
    color: #38bdf8;
    border: none;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    min-width: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--admin-dashboard-btn-hover-shadow);
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    color: white;
}

.load-more {
    cursor: pointer;
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
    color: white;
    border: none;
    border-radius: 10px;
    height: 36px;
    padding: 0 16px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.load-more:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

:deep(.btn-prev){
    border-radius: 100%;
    position: fixed;
    top: 50%;
    left: 8px;
    scale: 1;
    color: var(--admin-dashboard-btn-color);
}
:deep(.btn-next) {
    border-radius: 100%;
    position: fixed;
    top: 50%;
    right: 8px;
    scale: 1;
    color: var(--admin-dashboard-btn-color);
}
@media (min-width: 768px) {
    :deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) {
        background-color: var(--admin-dashboard-btn-bg-color);
        backdrop-filter: blur(10px);
        box-shadow: var(--admin-dashboard-btn-shadow);
        transition: all 0.3s ease;
    }
    :deep(.el-pagination.is-background .btn-prev:hover), :deep(.el-pagination.is-background .btn-next:hover) {
        transform: translateY(-10%);
        box-shadow: var(--admin-dashboard-btn-hover-shadow);
    }
}

.question-icon {
    margin: 0 3px;
}

.breadcrumb {
    padding: 8px 12px;
    background-color: var(--el-bg-color);
    border-radius: 6px;
    font-size: 0.95em;
    box-shadow: var(--admin-dashboard-stats-shadow);
    transition: all 0.3s ease;
}

.breadcrumb:hover {
    transform: translateY(-1px);
    box-shadow: var(--admin-dashboard-stats-hover-shadow);
}

.breadcrumb-home-icon {
    font-size: 14px;
    color: #38bdf8;
    transition: color 0.2s ease;
}

.breadcrumb-home-icon:hover {
    color: var(--admin-purple);
}

:deep(.el-breadcrumb__item) {
    cursor: pointer;
}
:deep(.el-breadcrumb__inner:hover) {
    color: var(--el-color-primary);
}

/* 移动端目录触发按钮 */
.mobile-directory-trigger {
    display: none;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: all 0.2s ease;
}

.mobile-directory-trigger:active {
    background: var(--el-fill-color);
}

.mobile-directory-icon {
    font-size: 12px;
    color: #38bdf8;
}

.mobile-directory-path {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mobile-directory-arrow {
    font-size: 8px;
    color: var(--el-text-color-secondary);
}

/* 桌面端显示面包屑，隐藏移动端触发器 */
.desktop-only {
    display: block;
}

@media (max-width: 768px) {
    .mobile-directory-trigger {
        display: flex;
    }

    .desktop-only {
        display: none !important;
    }

    .breadcrumb-container {
        padding: 0;
        margin-left: 0;
    }
}

/* 文本预览弹窗样式 */
.text-preview-dialog {
    --el-dialog-bg-color: #24292e;
}

.text-preview-dialog :deep(.el-dialog) {
    max-height: 85vh;
    display: flex;
    flex-direction: column;
}

.text-preview-dialog .el-dialog__header {
    background: #2d2d3d;
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid #3d3d4d;
    flex-shrink: 0;
}

.text-preview-dialog .el-dialog__title {
    color: #c9d1d9;
    font-size: 16px;
    font-weight: 600;
}

.text-preview-dialog :deep(.el-dialog__body) {
    padding: 0;
    background: #24292e;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.text-preview-dialog-content {
    max-height: 55vh;
    overflow: auto;
}

.text-preview-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #64b5f6;
}

.text-preview-loading-container p {
    margin-top: 16px;
    color: #8b949e;
}

.text-preview-error-container {
    padding: 40px 20px;
    text-align: center;
    color: #f85149;
}

.text-preview-code-container {
    padding: 20px;
    background: #24292e;
}

/* VSCode 风格代码编辑器 */
.code-editor {
    display: flex;
    background: #24292e;
    border-radius: 6px;
    overflow: hidden;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 14px;
    line-height: 1.6;
}

.line-numbers {
    flex-shrink: 0;
    padding: 16px 0;
    background: #24292e;
    border-right: 1px solid #30363d;
    text-align: right;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    color: #6e7681;
    min-width: 50px;
}

.line-numbers span {
    display: block;
    padding: 0 16px 0 12px;
    height: 22.4px;
    line-height: 22.4px;
}

.code-content {
    flex: 1;
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    background: #24292e;
}

.code-content code {
    font-family: inherit;
    font-size: inherit;
    line-height: 1.6;
    color: #c9d1d9;
    white-space: pre;
    display: block;
    text-align: left;
}

.code-content code .hljs {
    background: transparent;
    padding: 0;
}

.code-content .hljs {
    background: transparent;
    padding: 0;
}

.text-preview-dialog-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: transparent;
}

.theme-selector-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.theme-label {
    color: #c9d1d9;
    font-size: 14px;
}

.action-buttons-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.text-preview-dialog :deep(.el-dialog__footer) {
    background: transparent;
    border-top: 1px solid #30363d;
    padding: 16px 20px;
}

</style>
