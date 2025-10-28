// Papers section management

const PapersSection = {
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
            
            // Load papers for selected course
            const data = await API.getPapers(AppState.filters.papers.courseId);
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
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
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
        const papers = AppState.papers;
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Paper',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'PapersSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="paperCourseFilter" onchange="PapersSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.papers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (papers.length === 0) {
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <h3>No Papers Found</h3>
                    <p>This course doesn't have any papers yet. Create the first paper to get started.</p>
                    <button class="action-btn" onclick="PapersSection.openCreateModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create Paper
                    </button>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = papers.map(paper => this.renderPaperCard(paper)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderPaperCard(paper) {
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(paper.name)}</h3>
                    ${paper.code ? `<span class="card-badge badge-active">${UI.escapeHtml(paper.code)}</span>` : ''}
                </div>
                <div class="card-meta">
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
                        Delete
                    </button>
                </div>
            </div>
        `;
    },
    
    onCourseChange() {
        const select = document.getElementById('paperCourseFilter');
        AppState.setPapersCourseFilter(select.value || null);
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.selectedCourseId) {
            UI.showToast('Please select a course first', 'warning');
            return;
        }
        
        const formHTML = `
            <form id="createPaperForm" class="modal-form" onsubmit="PapersSection.handleCreate(event)">
                ${UI.createFormRow('Paper Name', UI.createTextInput('paperName', '', 'e.g., Paper 1', true))}
                ${UI.createFormRow('Paper Code', UI.createTextInput('paperCode', '', 'e.g., P1'), 'Optional short code')}
                ${UI.createFormRow('Percentage of Grade', UI.createNumberInput('paperPercentage', '', '50', 0, 100, 0.1), 'Optional: e.g., 50 for 50%')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Paper')}
            </form>
        `;
        
        UI.openModal('Create New Paper', formHTML);
    },
    
    openEditModal(paperId) {
        const paper = AppState.findPaperById(paperId);
        if (!paper) return;
        
        const formHTML = `
            <form id="editPaperForm" class="modal-form" onsubmit="PapersSection.handleUpdate(event, '${paperId}')">
                ${UI.createFormRow('Paper Name', UI.createTextInput('paperName', paper.name, '', true))}
                ${UI.createFormRow('Paper Code', UI.createTextInput('paperCode', paper.code || '', ''), 'Leave empty to remove')}
                ${UI.createFormRow('Percentage of Grade', UI.createNumberInput('paperPercentage', paper.percentage_of_grade || '', '', 0, 100, 0.1))}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Paper')}
            </form>
        `;
        
        UI.openModal('Edit Paper', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('paperName').value.trim();
        const code = document.getElementById('paperCode').value.trim() || null;
        const percentage = document.getElementById('paperPercentage').value;
        const percentageValue = percentage ? parseFloat(percentage) : null;
        
        if (!name) {
            UI.showToast('Paper name is required', 'error');
            return;
        }
        
        try {
            await API.createPaper(AppState.selectedCourseId, name, code, percentageValue);
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
        const percentage = document.getElementById('paperPercentage').value;
        const percentageValue = percentage ? parseFloat(percentage) : null;
        
        if (!name) {
            UI.showToast('Paper name is required', 'error');
            return;
        }
        
        try {
            await API.updatePaper(paperId, { name, code, percentage_of_grade: percentageValue });
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
        
        const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\n\nDeleting "${paper.name}" will also permanently delete ALL ${paper.topics_count || 0} topics associated with it.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`;
        
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
};
