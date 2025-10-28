// Years section management

const YearsSection = {
    includeInactive: false,
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading years...');
        
        try {
            const data = await API.getYears(this.includeInactive);
            AppState.setYears(data.data.years || []);
            this.render();
        } catch (error) {
            UI.showEmpty('Error Loading Years', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    render() {
        let years = AppState.years;
        
        // Apply search filter
        if (this.searchQuery) {
            years = years.filter(y => 
                y.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Year',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'YearsSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="yearSearchInput" placeholder="Search years..." value="${this.searchQuery}" oninput="YearsSection.onSearchChange()">
                </div>
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveYears" ${this.includeInactive ? 'checked' : ''} onchange="YearsSection.toggleIncludeInactive()">
                    <label for="includeInactiveYears">Show Inactive</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (years.length === 0) {
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h3>No Years Found</h3>
                    <p>Create your first academic year to get started.</p>
                </div>
            `;
        } else {
            const cardsHTML = years.map(year => this.renderYearCard(year)).join('');
            contentHTML = `
                <div class="content-grid">
                    ${cardsHTML}
                </div>
            `;
        }
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    onSearchChange() {
        const input = document.getElementById('yearSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render();
        // Restore focus and cursor position
        setTimeout(() => {
            const newInput = document.getElementById('yearSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load();
    },
    
    renderYearCard(year) {
        const badgeClass = year.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = year.is_active ? 'Active' : 'Inactive';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(year.name)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Sort Order</span>
                        <span class="meta-value">${year.sort_order}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(year.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="YearsSection.openEditModal('${year.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="YearsSection.handleDelete('${year.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${year.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    openCreateModal() {
        const formHTML = `
            <form id="createYearForm" class="modal-form" onsubmit="YearsSection.handleCreate(event)">
                ${UI.createFormRow('Year Name', UI.createTextInput('yearName', '', 'e.g., GCSE (10/11)', true), 'The display name for this academic year')}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('sortOrder', '0', '0', 0), 'Lower numbers appear first in lists')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Year')}
            </form>
        `;
        
        UI.openModal('Create New Year', formHTML);
    },
    
    openEditModal(yearId) {
        const year = AppState.findYearById(yearId);
        if (!year) return;
        
        const formHTML = `
            <form id="editYearForm" class="modal-form" onsubmit="YearsSection.handleUpdate(event, '${yearId}')">
                ${UI.createFormRow('Year Name', UI.createTextInput('yearName', year.name, '', true))}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('sortOrder', year.sort_order, '', 0))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('yearStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], year.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Year')}
            </form>
        `;
        
        UI.openModal('Edit Year', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('yearName').value.trim();
        const sortOrder = parseInt(document.getElementById('sortOrder').value) || 0;
        
        if (!name) {
            UI.showToast('Year name is required', 'error');
            return;
        }
        
        try {
            await API.createYear(name, sortOrder);
            UI.closeModal();
            UI.showToast('Year created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, yearId) {
        event.preventDefault();
        
        const name = document.getElementById('yearName').value.trim();
        const sortOrder = parseInt(document.getElementById('sortOrder').value) || 0;
        const isActive = document.getElementById('yearStatus').value === 'true';
        
        if (!name) {
            UI.showToast('Year name is required', 'error');
            return;
        }
        
        try {
            await API.updateYear(yearId, { name, sort_order: sortOrder, is_active: isActive });
            UI.closeModal();
            UI.showToast('Year updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(yearId) {
        const year = AppState.findYearById(yearId);
        if (!year) return;
        
        const action = year.is_active ? 'deactivate' : 'delete';
        if (!UI.confirm(`Are you sure you want to ${action} "${year.name}"?`)) {
            return;
        }
        
        try {
            await API.deleteYear(yearId);
            UI.showToast(`Year ${action}d successfully`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};
