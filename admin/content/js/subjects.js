// Subjects section management

const SubjectsSection = {
    includeInactive: false,
    
    async load() {
        UI.showLoading('Loading subjects...');
        
        try {
            const data = await API.getSubjects(this.includeInactive);
            AppState.setSubjects(data.data.subjects || []);
            this.render();
        } catch (error) {
            UI.showEmpty('Error Loading Subjects', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    render() {
        const subjects = AppState.subjects;
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Subject',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'SubjectsSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveSubjects" ${this.includeInactive ? 'checked' : ''} onchange="SubjectsSection.toggleIncludeInactive()">
                    <label for="includeInactiveSubjects">Show Inactive Subjects</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (subjects.length === 0) {
            const message = this.includeInactive ? 'No subjects found.' : 'No active subjects found. Try showing inactive subjects.';
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <h3>No Subjects Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = subjects.map(subject => this.renderSubjectCard(subject)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderSubjectCard(subject) {
        const badgeClass = subject.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = subject.is_active ? 'Active' : 'Inactive';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(subject.name)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Code</span>
                        <span class="meta-value">${subject.code ? UI.escapeHtml(subject.code) : '—'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(subject.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="SubjectsSection.openEditModal('${subject.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="SubjectsSection.handleDelete('${subject.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${subject.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load();
    },
    
    openCreateModal() {
        const formHTML = `
            <form id="createSubjectForm" class="modal-form" onsubmit="SubjectsSection.handleCreate(event)">
                ${UI.createFormRow('Subject Name', UI.createTextInput('subjectName', '', 'e.g., Mathematics', true), 'The display name for this subject')}
                ${UI.createFormRow('Subject Code', UI.createTextInput('subjectCode', '', 'e.g., MATH'), 'Optional short code for this subject')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Subject')}
            </form>
        `;
        
        UI.openModal('Create New Subject', formHTML);
    },
    
    openEditModal(subjectId) {
        const subject = AppState.findSubjectById(subjectId);
        if (!subject) return;
        
        const formHTML = `
            <form id="editSubjectForm" class="modal-form" onsubmit="SubjectsSection.handleUpdate(event, '${subjectId}')">
                ${UI.createFormRow('Subject Name', UI.createTextInput('subjectName', subject.name, '', true))}
                ${UI.createFormRow('Subject Code', UI.createTextInput('subjectCode', subject.code || '', ''), 'Leave empty to remove code')}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('subjectStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], subject.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Subject')}
            </form>
        `;
        
        UI.openModal('Edit Subject', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('subjectName').value.trim();
        const code = document.getElementById('subjectCode').value.trim() || null;
        
        if (!name) {
            UI.showToast('Subject name is required', 'error');
            return;
        }
        
        try {
            await API.createSubject(name, code);
            UI.closeModal();
            UI.showToast('Subject created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, subjectId) {
        event.preventDefault();
        
        const name = document.getElementById('subjectName').value.trim();
        const code = document.getElementById('subjectCode').value.trim() || null;
        const isActive = document.getElementById('subjectStatus').value === 'true';
        
        if (!name) {
            UI.showToast('Subject name is required', 'error');
            return;
        }
        
        try {
            await API.updateSubject(subjectId, { name, code, is_active: isActive });
            UI.closeModal();
            UI.showToast('Subject updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(subjectId) {
        const subject = AppState.findSubjectById(subjectId);
        if (!subject) return;
        
        const action = subject.is_active ? 'deactivate' : 'delete';
        if (!UI.confirm(`Are you sure you want to ${action} "${subject.name}"?`)) {
            return;
        }
        
        try {
            await API.deleteSubject(subjectId);
            UI.showToast(`Subject ${action}d successfully`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};
