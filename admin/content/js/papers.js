// Papers section management

const PapersSection = {
    includeInactive: true,
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading papers...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.papers.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load tiers for the selected course
            const tiersData = await API.getTiers(AppState.filters.papers.courseId, true);
            AppState.setTiers(tiersData.data.tiers || []);
            
            // Load papers for selected course and optional tier
            const data = await API.getPapers(
                AppState.filters.papers.courseId, 
                AppState.filters.papers.tierId, 
                this.includeInactive
            );
            AppState.setPapers(data.data.papers || []);
            this.render(data.data.course);
        } catch (error) {
            UI.showEmpty('Error Loading Papers', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    renderCourseSelection() {
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ value: c.id, label: `${c.title} (${c.year_name})` }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Course</label>
                    <select class="filter-select" id="paperCourseFilter" onchange="PapersSection.onCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.papers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3>Select a Course</h3>
                <p>Choose a course from the dropdown above to view and manage its papers.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(courseInfo) {
        const papers = AppState.papers; // Don't filter here - display what was loaded
        const courses = AppState.courses;
        
        // Apply search filter only
        let filteredPapers = papers;
        if (this.searchQuery) {
            filteredPapers = papers.filter(p => 
                p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (p.code && p.code.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }
        
        // Sort: active items first, then inactive items at the end
        filteredPapers.sort((a, b) => {
            if (a.is_active !== b.is_active) {
                return b.is_active - a.is_active; // active (true/1) comes before inactive (false/0)
            }
            return a.name.localeCompare(b.name); // then alphabetically by name
        });
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const tierOptions = [{ value: '', label: 'All Tiers' }].concat(
            AppState.tiers.filter(t => t.is_active).map(t => ({ value: t.id, label: t.title }))
        );
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Paper',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'PapersSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="paperSearchInput" placeholder="Search papers..." value="${this.searchQuery}" oninput="PapersSection.onSearchChange()">
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="paperCourseFilter" onchange="PapersSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.papers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Tier</label>
                    <select class="filter-select" id="paperTierFilter" onchange="PapersSection.onTierChange()" ${AppState.tiers.length === 0 ? 'disabled' : ''}>
                        ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === (AppState.filters.papers.tierId || '') ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactivePapers" ${this.includeInactive ? 'checked' : ''} onchange="PapersSection.toggleIncludeInactive()">
                    <label for="includeInactivePapers">Show Inactive</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (filteredPapers.length === 0) {
            const message = this.searchQuery 
                ? 'No papers match your search.' 
                : (papers.length === 0 
                    ? "This course doesn't have any papers yet. Create the first paper to get started."
                    : 'No papers found. Try enabling "Show Inactive".');
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <h3>No Papers Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = filteredPapers.map(paper => this.renderPaperCard(paper)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderPaperCard(paper) {
        const tier = paper.tier_id ? AppState.findTierById(paper.tier_id) : null;
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(paper.name)}</h3>
                    ${paper.code ? `<span class="card-badge badge-active">${UI.escapeHtml(paper.code)}</span>` : ''}
                    ${paper.is_active ? '<span class="card-badge badge-active">Active</span>' : '<span class="card-badge badge-inactive">Inactive</span>'}
                </div>
                <div class="card-meta">
                    ${tier ? `
                    <div class="meta-row">
                        <span class="meta-label">Tier</span>
                        <span class="meta-value">${UI.escapeHtml(tier.title)}</span>
                    </div>` : ''}
                    <div class="meta-row">
                        <span class="meta-label">Topics</span>
                        <span class="meta-value">${paper.topics_count || 0}</span>
                    </div>
                    ${paper.percentage_of_grade !== null ? `
                    <div class="meta-row">
                        <span class="meta-label">% of Grade</span>
                        <span class="meta-value">${paper.percentage_of_grade}%</span>
                    </div>` : ''}
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(paper.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="PapersSection.openEditModal('${paper.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="PapersSection.handleDelete('${paper.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${paper.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('paperSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render(AppState.findCourseById(AppState.filters.papers.courseId));
        // Restore focus and cursor position
        setTimeout(() => {
            const newInput = document.getElementById('paperSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load(); // Reload data from API with new filter
    },
    
    onCourseChange() {
        const courseId = document.getElementById('paperCourseFilter').value || null;
        AppState.setPapersCourseFilter(courseId);
        this.load();
    },
    
    onTierChange() {
        const tierId = document.getElementById('paperTierFilter').value || null;
        AppState.setPapersTierFilter(tierId);
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.papers.courseId) {
            UI.showToast('Please select a course first', 'warning');
            return;
        }
        
        const tierOptions = [{ value: '', label: 'None (No Tier)' }].concat(
            AppState.tiers.filter(t => t.is_active).map(t => ({ value: t.id, label: t.title }))
        );
        
        const tierSelectHTML = tierOptions.length > 1 ? UI.createFormRow(
            'Tier',
            UI.createSelect('paperTier', tierOptions, ''),
            'Optional: Assign this paper to a tier'
        ) : '';
        
        const formHTML = `
            <form id="createPaperForm" class="modal-form" onsubmit="PapersSection.handleCreate(event)">
                ${UI.createFormRow('Paper Name', UI.createTextInput('paperName', '', 'e.g., Paper 1', true))}
                ${UI.createFormRow('Paper Code', UI.createTextInput('paperCode', '', 'e.g., P1'), 'Optional short code')}
                ${tierSelectHTML}
                ${UI.createFormRow('Percentage of Grade', UI.createNumberInput('paperPercentage', '', '50', 0, 100, 0.1), 'Optional: e.g., 50 for 50%')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Paper')}
            </form>
        `;
        
        UI.openModal('Create New Paper', formHTML);
    },
    
    openEditModal(paperId) {
        const paper = AppState.findPaperById(paperId);
        if (!paper) return;
        
        const tierOptions = [{ value: '', label: 'None (No Tier)' }].concat(
            AppState.tiers.filter(t => t.is_active).map(t => ({ value: t.id, label: t.title }))
        );
        
        const tierSelectHTML = tierOptions.length > 1 ? UI.createFormRow(
            'Tier',
            UI.createSelect('paperTier', tierOptions, paper.tier_id || ''),
            'Optional: Assign this paper to a tier'
        ) : '';
        
        const formHTML = `
            <form id="editPaperForm" class="modal-form" onsubmit="PapersSection.handleUpdate(event, '${paperId}')">
                ${UI.createFormRow('Paper Name', UI.createTextInput('paperName', paper.name, '', true))}
                ${UI.createFormRow('Paper Code', UI.createTextInput('paperCode', paper.code || '', ''), 'Leave empty to remove')}
                ${tierSelectHTML}
                ${UI.createFormRow('Percentage of Grade', UI.createNumberInput('paperPercentage', paper.percentage_of_grade || '', '', 0, 100, 0.1))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('paperStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], paper.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Paper')}
            </form>
        `;
        
        UI.openModal('Edit Paper', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('paperName').value.trim();
        const code = document.getElementById('paperCode').value.trim() || null;
        const tierElement = document.getElementById('paperTier');
        const tierId = tierElement ? (tierElement.value || null) : null;
        const percentage = document.getElementById('paperPercentage').value;
        const percentageValue = percentage ? parseFloat(percentage) : null;
        
        if (!name) {
            UI.showToast('Paper name is required', 'error');
            return;
        }
        
        try {
            await API.createPaper(AppState.filters.papers.courseId, name, tierId, code, percentageValue);
            UI.closeModal();
            UI.showToast('Paper created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, paperId) {
        event.preventDefault();
        
        const name = document.getElementById('paperName').value.trim();
        const code = document.getElementById('paperCode').value.trim() || null;
        const tierElement = document.getElementById('paperTier');
        const tierId = tierElement ? (tierElement.value || null) : null;
        const percentage = document.getElementById('paperPercentage').value;
        const percentageValue = percentage ? parseFloat(percentage) : null;
        const isActive = document.getElementById('paperStatus').value === 'true';
        
        if (!name) {
            UI.showToast('Paper name is required', 'error');
            return;
        }
        
        try {
            await API.updatePaper(paperId, { name, code, tier_id: tierId, percentage_of_grade: percentageValue, is_active: isActive });
            UI.closeModal();
            UI.showToast('Paper updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(paperId) {
        const paper = AppState.findPaperById(paperId);
        if (!paper) return;
        
        // Two-stage delete pattern
        if (paper.is_active) {
            // First delete - soft delete (deactivate)
            const confirmMessage = `Deactivate "${paper.name}"?\n\nThis will hide the paper from users but keep it in the database. You can reactivate it later by editing it.`;
            
            if (!UI.confirm(confirmMessage)) {
                return;
            }
            
            try {
                const response = await API.deletePaper(paperId);
                UI.showToast('Paper deactivated successfully', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        } else {
            // Second delete - permanent delete with CASCADE warning
            const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\n\nDeleting "${paper.name}" will permanently remove it from the database and also delete ALL ${paper.topics_count || 0} topics associated with it (CASCADE).\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`;
            
            if (!UI.confirm(warningMessage)) {
                return;
            }
            
            try {
                await API.deletePaper(paperId);
                UI.showToast('Paper and all its topics deleted permanently', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        }
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
