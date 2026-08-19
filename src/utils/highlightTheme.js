let currentThemeLink = null;

export function loadHighlightTheme(themeName) {
    if (currentThemeLink) {
        currentThemeLink.remove();
        currentThemeLink = null;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeName}.min.css`;
    link.onload = () => console.log(`Loaded theme: ${themeName}`);
    link.onerror = () => console.error(`Failed to load theme: ${themeName}`);
    document.head.appendChild(link);
    currentThemeLink = link;
}

export const darkThemes = [
    { value: 'github-dark', label: 'GitHub Dark' },
    { value: 'atom-one-dark', label: 'Atom One Dark' },
    { value: 'tokyo-night-dark', label: 'Tokyo Night Dark' },
    { value: 'obsidian', label: 'Obsidian' },
];
