// 动态加载 highlight.js 主题的工具函数

let currentThemeLink = null;

/**
 * 动态加载 highlight.js 主题
 * @param {string} themeName - 主题名称（不带 .css 后缀）
 */
export function loadHighlightTheme(themeName) {
  // 移除旧的主题样式
  if (currentThemeLink) {
    currentThemeLink.remove();
  }

  // 创建新的 link 元素加载主题
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.id = 'hljs-theme';
  // 使用 CDN 加载主题
  link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeName}.min.css`;

  link.onload = () => {
    console.log(`✅ Theme ${themeName} loaded successfully`);
  };

  link.onerror = () => {
    console.error(`❌ Failed to load theme ${themeName}`);
  };

  document.head.appendChild(link);
  currentThemeLink = link;
}

/**
 * 可用的暗色主题列表
 */
export const darkThemes = [
  { value: 'github-dark', label: 'GitHub Dark' },
  { value: 'atom-one-dark', label: 'Atom One Dark' },
  { value: 'tokyo-night-dark', label: 'Tokyo Night Dark' },
  { value: 'obsidian', label: 'Obsidian' },
];
