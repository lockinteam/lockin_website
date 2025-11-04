// Markdown Editor Component
// A Notion-like markdown editor with live preview

const MarkdownEditor = {
    currentEditor: null,
    isFullscreen: false,
    
    // Create a new markdown editor
    create(initialContent = '', placeholder = 'Start typing your notes in markdown...') {
        const editorId = `md-editor-${Date.now()}`;
        
        const html = `
            <div class="markdown-editor-container" id="${editorId}">
                ${this.renderToolbar(editorId)}
                <div class="markdown-editor-layout">
                    <div class="markdown-editor-pane">
                        <div class="markdown-editor-pane-header">
                            <span>Markdown Editor</span>
                        </div>
                        <div class="markdown-editor-textarea-wrapper">
                            <textarea 
                                class="markdown-editor-textarea" 
                                id="${editorId}-textarea"
                                placeholder="${placeholder}"
                            >${initialContent}</textarea>
                        </div>
                    </div>
                    <div class="markdown-editor-pane">
                        <div class="markdown-editor-pane-header">
                            <span>Live Preview</span>
                        </div>
                        <div class="markdown-preview-content" id="${editorId}-preview">
                            ${initialContent ? this.renderMarkdown(initialContent) : this.renderEmptyPreview()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Set up event listeners after rendering
        setTimeout(() => this.initializeEditor(editorId), 0);
        
        return html;
    },
    
    renderToolbar(editorId) {
        return `
            <div class="markdown-toolbar">
                <div class="markdown-toolbar-group">
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertHeading('${editorId}', 1)" title="Heading 1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12h8"></path>
                            <path d="M4 18V6"></path>
                            <path d="M12 18V6"></path>
                            <path d="m17 12 3-3 3 3"></path>
                            <path d="M20 9v12"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertHeading('${editorId}', 2)" title="Heading 2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12h8"></path>
                            <path d="M4 18V6"></path>
                            <path d="M12 18V6"></path>
                            <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertHeading('${editorId}', 3)" title="Heading 3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12h8"></path>
                            <path d="M4 18V6"></path>
                            <path d="M12 18V6"></path>
                            <path d="M17 16c0 2 1.5 3 3 3s3-1 3-3-1.5-3-3-3c1.5 0 3-1 3-3s-1.5-3-3-3-3 1-3 3"></path>
                        </svg>
                    </button>
                </div>
                <div class="markdown-toolbar-group">
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertFormat('${editorId}', 'bold')" title="Bold (Ctrl+B)">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertFormat('${editorId}', 'italic')" title="Italic (Ctrl+I)">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="19" y1="4" x2="10" y2="4"></line>
                            <line x1="14" y1="20" x2="5" y2="20"></line>
                            <line x1="15" y1="4" x2="9" y2="20"></line>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertFormat('${editorId}', 'strikethrough')" title="Strikethrough">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 4H9a3 3 0 0 0-2.83 4"></path>
                            <path d="M14 12a4 4 0 0 1 0 8H6"></path>
                            <line x1="4" y1="12" x2="20" y2="12"></line>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertFormat('${editorId}', 'code')" title="Inline Code">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                    </button>
                </div>
                <div class="markdown-toolbar-group">
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertList('${editorId}', 'unordered')" title="Bullet List">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertList('${editorId}', 'ordered')" title="Numbered List">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="10" y1="6" x2="21" y2="6"></line>
                            <line x1="10" y1="12" x2="21" y2="12"></line>
                            <line x1="10" y1="18" x2="21" y2="18"></line>
                            <path d="M4 6h1v4"></path>
                            <path d="M4 10h2"></path>
                            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertCheckbox('${editorId}')" title="Checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </button>
                </div>
                <div class="markdown-toolbar-group">
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertLink('${editorId}')" title="Insert Link">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertImage('${editorId}')" title="Insert Image">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertCodeBlock('${editorId}')" title="Code Block">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                            <path d="M6 10h2"></path>
                            <path d="M12 10h2"></path>
                            <path d="M18 10h2"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertQuote('${editorId}')" title="Quote">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertHorizontalRule('${editorId}')" title="Horizontal Rule">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                        </svg>
                    </button>
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.insertTable('${editorId}')" title="Insert Table">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="3" y1="15" x2="21" y2="15"></line>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                            <line x1="15" y1="3" x2="15" y2="21"></line>
                        </svg>
                    </button>
                </div>
                <div class="markdown-toolbar-group">
                    <button type="button" class="markdown-toolbar-btn" onclick="MarkdownEditor.toggleFullscreen('${editorId}')" title="Toggle Fullscreen">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },
    
    renderEmptyPreview() {
        return `
            <div class="markdown-preview-empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <p><strong>Preview will appear here</strong></p>
                <p>Start typing to see your formatted notes</p>
            </div>
        `;
    },
    
    initializeEditor(editorId) {
        const textarea = document.getElementById(`${editorId}-textarea`);
        const preview = document.getElementById(`${editorId}-preview`);
        
        if (!textarea || !preview) return;
        
        // Update preview on input
        textarea.addEventListener('input', () => {
            const content = textarea.value;
            preview.innerHTML = content ? this.renderMarkdown(content) : this.renderEmptyPreview();
        });
        
        // Handle keyboard shortcuts
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.insertFormat(editorId, 'bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.insertFormat(editorId, 'italic');
                        break;
                    case 'k':
                        e.preventDefault();
                        this.insertLink(editorId);
                        break;
                }
            }
            
            // Tab handling
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
                textarea.dispatchEvent(new Event('input'));
            }
        });
        
        this.currentEditor = editorId;
    },
    
    // Get current editor content
    getContent(editorId) {
        const textarea = document.getElementById(`${editorId}-textarea`);
        return textarea ? textarea.value : '';
    },
    
    // Set editor content
    setContent(editorId, content) {
        const textarea = document.getElementById(`${editorId}-textarea`);
        const preview = document.getElementById(`${editorId}-preview`);
        if (textarea) {
            textarea.value = content;
            if (preview) {
                preview.innerHTML = content ? this.renderMarkdown(content) : this.renderEmptyPreview();
            }
        }
    },
    
    // Helper to insert text at cursor
    insertAtCursor(editorId, before, after = '', placeholder = '') {
        const textarea = document.getElementById(`${editorId}-textarea`);
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const textToInsert = selectedText || placeholder;
        
        const newText = before + textToInsert + after;
        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        
        // Set cursor position
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = newCursorPos;
        
        textarea.focus();
        textarea.dispatchEvent(new Event('input'));
    },
    
    // Formatting functions
    insertHeading(editorId, level) {
        const hashes = '#'.repeat(level);
        this.insertAtCursor(editorId, `${hashes} `, '', 'Heading');
    },
    
    insertFormat(editorId, type) {
        const formats = {
            bold: { before: '**', after: '**', placeholder: 'bold text' },
            italic: { before: '*', after: '*', placeholder: 'italic text' },
            strikethrough: { before: '~~', after: '~~', placeholder: 'strikethrough text' },
            code: { before: '`', after: '`', placeholder: 'code' }
        };
        
        const format = formats[type];
        if (format) {
            this.insertAtCursor(editorId, format.before, format.after, format.placeholder);
        }
    },
    
    insertList(editorId, type) {
        const prefix = type === 'ordered' ? '1. ' : '- ';
        this.insertAtCursor(editorId, prefix, '', 'List item');
    },
    
    insertCheckbox(editorId) {
        this.insertAtCursor(editorId, '- [ ] ', '', 'Task item');
    },
    
    insertLink(editorId) {
        const textarea = document.getElementById(`${editorId}-textarea`);
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        const linkText = selectedText || prompt('Enter link text:') || 'link text';
        const url = prompt('Enter URL:') || 'https://example.com';
        
        this.insertAtCursor(editorId, `[${linkText}](`, ')', url);
    },
    
    insertImage(editorId) {
        const url = prompt('Enter image URL:') || 'https://example.com/image.jpg';
        const alt = prompt('Enter image description (alt text):') || 'Image';
        
        this.insertAtCursor(editorId, `![${alt}](`, ')', url);
    },
    
    insertCodeBlock(editorId) {
        const language = prompt('Enter language (optional):') || '';
        this.insertAtCursor(editorId, `\`\`\`${language}\n`, '\n\`\`\`', 'code here');
    },
    
    insertQuote(editorId) {
        this.insertAtCursor(editorId, '> ', '', 'Quote text');
    },
    
    insertHorizontalRule(editorId) {
        this.insertAtCursor(editorId, '\n---\n', '', '');
    },
    
    insertTable(editorId) {
        const cols = parseInt(prompt('Number of columns:', '3')) || 3;
        const rows = parseInt(prompt('Number of rows:', '2')) || 2;
        
        let table = '\n|';
        for (let i = 0; i < cols; i++) {
            table += ` Column ${i + 1} |`;
        }
        table += '\n|';
        for (let i = 0; i < cols; i++) {
            table += ' --- |';
        }
        for (let r = 0; r < rows; r++) {
            table += '\n|';
            for (let c = 0; c < cols; c++) {
                table += ' Cell |';
            }
        }
        table += '\n';
        
        this.insertAtCursor(editorId, table, '', '');
    },
    
    toggleFullscreen(editorId) {
        const container = document.getElementById(editorId);
        if (!container) return;
        
        this.isFullscreen = !this.isFullscreen;
        container.classList.toggle('fullscreen', this.isFullscreen);
        
        if (this.isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    },
    
    // Simple markdown to HTML renderer
    renderMarkdown(markdown) {
        if (!markdown) return this.renderEmptyPreview();
        
        let html = markdown;
        
        // Process images and links BEFORE escaping HTML (they contain special chars)
        // Store them temporarily with unique markers that won't be affected by escaping
        const imageMap = new Map();
        const linkMap = new Map();
        
        // Extract and replace images with placeholders
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            const placeholder = `IMAGEPLACEHOLDER${imageMap.size}IMAGEPLACEHOLDER`;
            imageMap.set(placeholder, `<img src="${url}" alt="${alt}" />`);
            return placeholder;
        });
        
        // Extract and replace links with placeholders
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            const placeholder = `LINKPLACEHOLDER${linkMap.size}LINKPLACEHOLDER`;
            linkMap.set(placeholder, `<a href="${url}" target="_blank">${text}</a>`);
            return placeholder;
        });
        
        // Escape HTML
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Code blocks (must come before inline code)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        // Strikethrough
        html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        
        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');
        
        // Checkboxes
        html = html.replace(/^- \[ \] (.*)$/gm, '<ul class="checklist"><li><input type="checkbox" disabled> $1</li></ul>');
        html = html.replace(/^- \[x\] (.*)$/gm, '<ul class="checklist"><li><input type="checkbox" checked disabled> $1</li></ul>');
        
        // Unordered lists
        html = html.replace(/^\* (.*)$/gm, '<ul><li>$1</li></ul>');
        html = html.replace(/^- (.*)$/gm, '<ul><li>$1</li></ul>');
        
        // Ordered lists
        html = html.replace(/^\d+\. (.*)$/gm, '<ol><li>$1</li></ol>');
        
        // Blockquote
        html = html.replace(/^&gt; (.*)$/gm, '<blockquote><p>$1</p></blockquote>');
        
        // Paragraphs (split by double newlines)
        html = html.split('\n\n').map(para => {
            // Don't wrap if already wrapped in a tag
            if (para.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/)) {
                return para;
            }
            return para.trim() ? `<p>${para.replace(/\n/g, '<br>')}</p>` : '';
        }).join('\n');
        
        // Clean up consecutive lists
        html = html.replace(/<\/ul>\s*<ul>/g, '');
        html = html.replace(/<\/ol>\s*<ol>/g, '');
        html = html.replace(/<\/ul>\s*<ul class="checklist">/g, '');
        
        // Tables (basic support)
        html = html.replace(/\n\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
            const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
            const rowsHtml = rows.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        });
        
        // Restore images and links from placeholders
        imageMap.forEach((value, key) => {
            html = html.replace(new RegExp(key, 'g'), value);
        });
        linkMap.forEach((value, key) => {
            html = html.replace(new RegExp(key, 'g'), value);
        });
        
        return html;
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
