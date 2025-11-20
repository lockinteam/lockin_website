// Tiers section management

const TiersSection = {
    includeInactive: true,
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading tiers...');
        
        try {
            // Load all courses for filter dropdown
            const coursesData = await API.getCourses({ includeInactive: true });
            AppState.setCourses(coursesData.data.courses || []);
            
            const courseId = AppState.filters.tiers.courseId;
            
            // If no course is selected but courses exist, auto-select the first one
            if (!courseId && AppState.courses.length > 0) {
                AppState.setTiersCourseFilter(AppState.courses[0].id);
            }
            
            if (AppState.filters.tiers.courseId) {
                const data = await API.getTiers(AppState.filters.tiers.courseId, this.includeInactive);
                AppState.setTiers(data.data.tiers || []);
            } else {
                AppState.setTiers([]);
            }
            
            this.render();
        } catch (error) {
            UI.showEmpty('Error Loading Tiers', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    render() {
        let tiers = AppState.tiers;
        
        // Apply search filter
        if (this.searchQuery) {
            tiers = tiers.filter(t => 
                t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (t.code && t.code.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }
        
        // Sort: active items first, then inactive items at the end
        tiers.sort((a, b) => {
            if (a.is_active !== b.is_active) {
                return b.is_active - a.is_active;
            }
            // Sort by sort_order, then by title
            if (a.sort_order !== b.sort_order) {
                return a.sort_order - b.sort_order;
            }
            return a.title.localeCompare(b.title);
        });
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Tier',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'TiersSection.openCreateModal()'
        );
        
        const courseOptions = AppState.courses.map(c => ({
            value: c.id,
            label: `${c.title} (${c.year_name})`
        }));
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="tierCourseFilter" onchange="TiersSection.onCourseFilterChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.tiers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="tierSearchInput" placeholder="Search tiers..." value="${this.searchQuery}" oninput="TiersSection.onSearchChange()">
                </div>
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveTiers" ${this.includeInactive ? 'checked' : ''} onchange="TiersSection.toggleIncludeInactive()">
                    <label for="includeInactiveTiers">Show Inactive</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (!AppState.filters.tiers.courseId) {
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <h3>Select a Course</h3>
                    <p>Please select a course to view its tiers</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        if (tiers.length === 0) {
            const message = this.includeInactive ? 'No tiers found for this course.' : 'No active tiers found. Try showing inactive tiers.';
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <h3>No Tiers Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = tiers.map(tier => this.renderTierCard(tier)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderTierCard(tier) {
        const badgeClass = tier.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = tier.is_active ? 'Active' : 'Inactive';
        
        const course = AppState.findCourseById(tier.course_id);
        const courseName = course ? course.title : 'Unknown Course';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(tier.title)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Course</span>
                        <span class="meta-value">${UI.escapeHtml(courseName)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Code</span>
                        <span class="meta-value">${tier.code ? UI.escapeHtml(tier.code) : '—'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Sort Order</span>
                        <span class="meta-value">${tier.sort_order}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(tier.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="TiersSection.openEditModal('${tier.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="TiersSection.handleDelete('${tier.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${tier.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('tierSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render();
        // Restore focus and cursor position
        setTimeout(() => {
            const newInput = document.getElementById('tierSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    onCourseFilterChange() {
        const select = document.getElementById('tierCourseFilter');
        AppState.setTiersCourseFilter(select.value);
        this.load();
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.tiers.courseId) {
            UI.showToast('Please select a course first', 'error');
            return;
        }
        
        const formHTML = `
            <form id="createTierForm" class="modal-form" onsubmit="TiersSection.handleCreate(event)">
                ${UI.createFormRow('Tier Title', UI.createTextInput('tierTitle', '', 'e.g., Foundation, AS Level, Core', true), 'The display name for this tier')}
                ${UI.createFormRow('Tier Code', UI.createTextInput('tierCode', '', 'e.g., FOUND, AS'), 'Optional short code for this tier')}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('tierSortOrder', '0', true), 'Display order (lower numbers appear first)')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Tier')}
            </form>
        `;
        
        UI.openModal('Create New Tier', formHTML);
    },
    
    openEditModal(tierId) {
        const tier = AppState.findTierById(tierId);
        if (!tier) return;
        
        const formHTML = `
            <form id="editTierForm" class="modal-form" onsubmit="TiersSection.handleUpdate(event, '${tierId}')">
                ${UI.createFormRow('Tier Title', UI.createTextInput('tierTitle', tier.title, '', true))}
                ${UI.createFormRow('Tier Code', UI.createTextInput('tierCode', tier.code || '', ''), 'Leave empty to remove code')}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('tierSortOrder', tier.sort_order.toString(), true))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('tierStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], tier.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Tier')}
            </form>
        `;
        
        UI.openModal('Edit Tier', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const title = document.getElementById('tierTitle').value.trim();
        const code = document.getElementById('tierCode').value.trim() || null;
        const sortOrder = parseInt(document.getElementById('tierSortOrder').value);
        
        if (!title) {
            UI.showToast('Tier title is required', 'error');
            return;
        }
        
        if (isNaN(sortOrder)) {
            UI.showToast('Sort order must be a number', 'error');
            return;
        }
        
        try {
            await API.createTier(AppState.filters.tiers.courseId, title, code, sortOrder);
            UI.closeModal();
            UI.showToast('Tier created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, tierId) {
        event.preventDefault();
        
        const title = document.getElementById('tierTitle').value.trim();
        const code = document.getElementById('tierCode').value.trim() || null;
        const sortOrder = parseInt(document.getElementById('tierSortOrder').value);
        const isActive = document.getElementById('tierStatus').value === 'true';
        
        if (!title) {
            UI.showToast('Tier title is required', 'error');
            return;
        }
        
        if (isNaN(sortOrder)) {
            UI.showToast('Sort order must be a number', 'error');
            return;
        }
        
        try {
            await API.updateTier(tierId, { title, code, sort_order: sortOrder, is_active: isActive });
            UI.closeModal();
            UI.showToast('Tier updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(tierId) {
        const tier = AppState.findTierById(tierId);
        if (!tier) return;
        
        const action = tier.is_active ? 'deactivate' : 'delete';
        if (!UI.confirm(`Are you sure you want to ${action} "${tier.title}"? ${!tier.is_active ? 'This will permanently delete the tier and all its papers.' : ''}`)) {
            return;
        }
        
        try {
            await API.deleteTier(tierId);
            UI.showToast(`Tier ${action}d successfully`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
