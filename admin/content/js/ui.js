// UI helper functions and components

const UI = {
    // Elements
    elements: {
        contentArea: null,
        modalOverlay: null,
        modalContent: null,
        modalCloseBtn: null,
        toast: null
    },
    
    // Format course label for dropdowns: "GCSE Biology - AQA (1891)"
    formatCourseLabel(course) {
        return `${course.year_name} ${course.subject_name} - ${course.title}`;
    },
    
    // Initialize elements
    init() {
        this.elements.contentArea = document.getElementById('contentArea');
        this.elements.modalOverlay = document.getElementById('modalOverlay');
        this.elements.modalContent = document.getElementById('modalContent');
        this.elements.modalCloseBtn = document.getElementById('modalCloseBtn');
        this.elements.toast = document.getElementById('toast');
        
        // Setup modal close handlers
        this.elements.modalCloseBtn?.addEventListener('click', () => this.closeModal());
        this.elements.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.closeModal();
            }
        });
    },
    
    // Show loading state
    showLoading(message = 'Loading content...') {
        if (!this.elements.contentArea) return;
        
        this.elements.contentArea.innerHTML = `
            <div class="content-loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    },
    
    // Show empty state
    showEmpty(title, message, actionBtn = null) {
        if (!this.elements.contentArea) return;
        
        const actionHTML = actionBtn ? `
            <button class="action-btn" onclick="${actionBtn.onClick}">
                ${actionBtn.icon || ''}
                <span>${actionBtn.text}</span>
            </button>
        ` : '';
        
        this.elements.contentArea.innerHTML = `
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>${title}</h3>
                <p>${message}</p>
                ${actionHTML}
            </div>
        `;
    },
    
    // Render content header
    renderHeader(title, subtitle) {
        return `
            <div class="content-header">
                <h1 class="content-title">${title}</h1>
                <p class="content-subtitle">${subtitle}</p>
            </div>
        `;
    },
    
    // Render action button
    // variant: false = primary, true = secondary, 'secondary' = secondary, 'danger' = danger (red)
    renderActionBtn(text, icon, onClick, variant = false) {
        let classes = 'action-btn';
        if (variant === true || variant === 'secondary') {
            classes = 'action-btn action-btn-secondary';
        } else if (variant === 'danger') {
            classes = 'action-btn action-btn-danger';
        }
        // Escape double quotes in onClick to prevent HTML attribute issues
        const escapedOnClick = onClick.replace(/"/g, '&quot;');
        return `
            <button class="${classes}" onclick="${escapedOnClick}">
                ${icon}
                <span>${text}</span>
            </button>
        `;
    },
    
    // Create file upload input with URL alternative
    createFileOrUrlInput(fieldId, currentUrl = '', accept = '*/*', urlPlaceholder = 'https://example.com/file') {
        const hasUrl = currentUrl && currentUrl.trim();
        return `
            <div class="file-or-url-input">
                <div class="input-mode-switch">
                    <button type="button" class="mode-btn ${!hasUrl ? 'active' : ''}" onclick="UI.switchInputMode('${fieldId}', 'file')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        Upload File
                    </button>
                    <button type="button" class="mode-btn ${hasUrl ? 'active' : ''}" onclick="UI.switchInputMode('${fieldId}', 'url')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Enter URL
                    </button>
                </div>
                <div class="input-mode-content">
                    <div class="input-mode-panel ${!hasUrl ? 'active' : ''}" data-mode="file">
                        <input type="file" id="${fieldId}File" class="file-input" accept="${accept}" onchange="UI.handleFileSelected('${fieldId}')">
                        <div class="file-upload-area" onclick="document.getElementById('${fieldId}File').click()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            <p class="upload-text">Click to select or drag and drop</p>
                            <p class="upload-hint">Max 100MB for admins</p>
                        </div>
                        <div class="file-selected-info" id="${fieldId}FileInfo" style="display: none;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            <span class="file-name"></span>
                            <button type="button" class="file-remove-btn" onclick="UI.clearFileSelection('${fieldId}')">&times;</button>
                        </div>
                    </div>
                    <div class="input-mode-panel ${hasUrl ? 'active' : ''}" data-mode="url">
                        <input type="url" id="${fieldId}Url" class="form-input" placeholder="${urlPlaceholder}" value="${currentUrl}">
                    </div>
                </div>
                <input type="hidden" id="${fieldId}Mode" value="${hasUrl ? 'url' : 'file'}">
            </div>
        `;
    },
    
    switchInputMode(fieldId, mode) {
        const container = document.querySelector(`#${fieldId}Url`).closest('.file-or-url-input');
        const modeButtons = container.querySelectorAll('.mode-btn');
        const modePanels = container.querySelectorAll('.input-mode-panel');
        const modeInput = document.getElementById(`${fieldId}Mode`);
        
        modeButtons.forEach((btn, idx) => {
            if ((idx === 0 && mode === 'file') || (idx === 1 && mode === 'url')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        modePanels.forEach(panel => {
            if (panel.dataset.mode === mode) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        modeInput.value = mode;
    },
    
    handleFileSelected(fieldId) {
        const fileInput = document.getElementById(`${fieldId}File`);
        const fileInfo = document.getElementById(`${fieldId}FileInfo`);
        const fileName = fileInfo?.querySelector('.file-name');
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (fileName) {
                fileName.textContent = `${file.name} (${(file.size / 1048576).toFixed(2)} MB)`;
            }
            if (fileInfo) {
                fileInfo.style.display = 'flex';
            }
        }
    },
    
    clearFileSelection(fieldId) {
        const fileInput = document.getElementById(`${fieldId}File`);
        const fileInfo = document.getElementById(`${fieldId}FileInfo`);
        
        if (fileInput) fileInput.value = '';
        if (fileInfo) fileInfo.style.display = 'none';
    },
    
    async getFileOrUrlValue(fieldId) {
        const mode = document.getElementById(`${fieldId}Mode`).value;
        
        if (mode === 'url') {
            const urlInput = document.getElementById(`${fieldId}Url`);
            return urlInput.value.trim();
        } else {
            const fileInput = document.getElementById(`${fieldId}File`);
            if (!fileInput.files || fileInput.files.length === 0) {
                return null;
            }
            
            // Upload file and return URL
            this.showToast('Uploading file...', 'info');
            try {
                const result = await API.uploadFile(fileInput.files[0]);
                this.showToast('File uploaded successfully', 'success');
                return result.file_url;
            } catch (error) {
                this.showToast('File upload failed: ' + error.message, 'error');
                throw error;
            }
        }
    },
    
    // Modal functions
    openModal(title, contentHTML, size = 'default') {
        if (!this.elements.modalContent || !this.elements.modalOverlay) return;
        
        // Apply size class to modal
        const modal = this.elements.modalOverlay.querySelector('.modal');
        if (modal) {
            modal.classList.remove('modal-large', 'modal-xlarge', 'modal-small');
            if (size === 'large') modal.classList.add('modal-large');
            else if (size === 'xlarge') modal.classList.add('modal-xlarge');
            else if (size === 'small') modal.classList.add('modal-small');
        }
        
        this.elements.modalContent.innerHTML = `
            <h2>${title}</h2>
            <div class="modal-body">${contentHTML}</div>
        `;
        this.elements.modalOverlay.hidden = false;
    },
    
    closeModal() {
        if (!this.elements.modalOverlay || !this.elements.modalContent) return;
        
        // Clean up fullscreen if active
        if (typeof MarkdownEditor !== 'undefined' && MarkdownEditor.isFullscreen) {
            document.body.style.overflow = '';
            MarkdownEditor.isFullscreen = false;
        }
        
        this.elements.modalOverlay.hidden = true;
        this.elements.modalContent.innerHTML = '';
    },
    
    // Toast notification
    showToast(message, type = 'info', duration = 3000) {
        if (!this.elements.toast) return;
        
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast toast-${type}`;
        this.elements.toast.hidden = false;
        
        setTimeout(() => {
            this.elements.toast.hidden = true;
        }, duration);
    },
    
    // Form helpers
    createFormRow(label, inputHTML, hint = null) {
        return `
            <div class="form-row">
                <label>${label}</label>
                ${inputHTML}
                ${hint ? `<p class="form-hint">${hint}</p>` : ''}
            </div>
        `;
    },
    
    createTextInput(id, value = '', placeholder = '', required = false) {
        return `<input type="text" id="${id}" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
    },
    
    createNumberInput(id, value = '', placeholder = '', min = null, max = null, step = null) {
        const minAttr = min !== null ? `min="${min}"` : '';
        const maxAttr = max !== null ? `max="${max}"` : '';
        const stepAttr = step !== null ? `step="${step}"` : '';
        return `<input type="number" id="${id}" value="${value}" placeholder="${placeholder}" ${minAttr} ${maxAttr} ${stepAttr}>`;
    },
    
    createUrlInput(id, value = '', placeholder = '') {
        return `<input type="url" id="${id}" value="${value}" placeholder="${placeholder}">`;
    },
    
    createTextarea(id, value = '', placeholder = '', rows = 4) {
        return `<textarea id="${id}" placeholder="${placeholder}" rows="${rows}">${value}</textarea>`;
    },
    
    createSelect(id, options, selectedValue = '') {
        const optionsHTML = options.map(opt => 
            `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`
        ).join('');
        return `<select id="${id}">${optionsHTML}</select>`;
    },
    
    createModalActions(onCancel, onSubmit, submitText = 'Save', submitDisabled = false) {
        return `
            <div class="modal-actions">
                <button type="button" class="ghost-btn" onclick="${onCancel}">Cancel</button>
                <button type="submit" class="primary-btn" ${submitDisabled ? 'disabled' : ''}>${submitText}</button>
            </div>
        `;
    },
    
    // Confirmation dialog
    confirm(message) {
        return window.confirm(message);
    },
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Format date
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
