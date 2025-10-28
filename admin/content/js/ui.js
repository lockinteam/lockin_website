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
                ${actionBtn.text}
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
    renderActionBtn(text, icon, onClick, secondary = false) {
        const classes = secondary ? 'action-btn action-btn-secondary' : 'action-btn';
        return `
            <button class="${classes}" onclick="${onClick}">
                ${icon}
                <span>${text}</span>
            </button>
        `;
    },
    
    // Modal functions
    openModal(title, contentHTML) {
        if (!this.elements.modalContent || !this.elements.modalOverlay) return;
        
        this.elements.modalContent.innerHTML = `
            <h2>${title}</h2>
            ${contentHTML}
        `;
        this.elements.modalOverlay.hidden = false;
    },
    
    closeModal() {
        if (!this.elements.modalOverlay || !this.elements.modalContent) return;
        
        this.elements.modalOverlay.hidden = true;
        this.elements.modalContent.innerHTML = '';
    },
    
    // Toast notification
    showToast(message, type = 'info') {
        if (!this.elements.toast) return;
        
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast toast-${type}`;
        this.elements.toast.hidden = false;
        
        setTimeout(() => {
            this.elements.toast.hidden = true;
        }, 3000);
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
