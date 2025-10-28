// Topics section management

const TopicsSection = {
    includeInactive: false,
    
    async load() {
        UI.showLoading('Loading topics...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.topics.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load papers for selected course if not loaded
            if (!AppState.filters.topics.paperId || AppState.papers.length === 0) {
                const papersData = await API.getPapers(AppState.filters.topics.courseId);
                AppState.setPapers(papersData.data.papers || []);
            }
            
            // Check if a paper is selected
            if (!AppState.filters.topics.paperId) {
                this.renderPaperSelection();
                return;
            }
            
            // Load topics for selected paper
            const data = await API.getTopics(AppState.filters.topics.paperId, this.includeInactive);
            AppState.setTopics(data.data.topics || []);
            this.render(data.data.paper);
        } catch (error) {
            UI.showEmpty('Error Loading Topics', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    renderCourseSelection() {
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <h3>Select a Course</h3>
                <p>Choose a course from the dropdown above, then select a paper to view topics.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    renderPaperSelection() {
        const papers = AppState.papers;
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="topicPaperFilter" onchange="TopicsSection.onPaperChange()">
                        <option value="">-- Choose a paper --</option>
                        ${paperOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <h3>Select a Paper</h3>
                <p>Choose a paper from the dropdown above to view and manage its topics.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(paperInfo) {
        const topics = AppState.topics;
        const courses = AppState.courses;
        const papers = AppState.papers;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Topic',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'TopicsSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="topicPaperFilter" onchange="TopicsSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveTopics" ${this.includeInactive ? 'checked' : ''} onchange="TopicsSection.toggleIncludeInactive()">
                    <label for="includeInactiveTopics">Show Inactive</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (topics.length === 0) {
            const message = this.includeInactive ? 'No topics found for this paper.' : 'No active topics found. Try showing inactive topics.';
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <h3>No Topics Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = topics.map(topic => this.renderTopicCard(topic)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderTopicCard(topic) {
        const badgeClass = topic.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = topic.is_active ? 'Active' : 'Inactive';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(topic.name)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Sort Order</span>
                        <span class="meta-value">${topic.sort_order}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Notes</span>
                        <span class="meta-value">${topic.notes_count || 0} ${topic.has_notes ? '✓' : ''}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Questions</span>
                        <span class="meta-value">${topic.questions_count || 0} ${topic.has_questions ? '✓' : ''}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Podcasts</span>
                        <span class="meta-value">${topic.podcasts_count || 0} ${topic.has_podcast ? '✓' : ''}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="TopicsSection.openEditModal('${topic.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="TopicsSection.handleDelete('${topic.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${topic.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    async onCourseChange() {
        const select = document.getElementById('topicCourseFilter');
        AppState.setTopicsCourseFilter(select.value || null);
        this.load();
    },
    
    async onPaperChange() {
        const select = document.getElementById('topicPaperFilter');
        AppState.setTopicsPaperFilter(select.value || null);
        this.load();
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.selectedPaperId) {
            UI.showToast('Please select a paper first', 'warning');
            return;
        }
        
        const formHTML = `
            <form id="createTopicForm" class="modal-form" onsubmit="TopicsSection.handleCreate(event)">
                ${UI.createFormRow('Topic Name', UI.createTextInput('topicName', '', 'e.g., Introduction to Algebra', true))}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('topicSortOrder', '0', '0', 0), 'Lower numbers appear first')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Topic')}
            </form>
        `;
        
        UI.openModal('Create New Topic', formHTML);
    },
    
    openEditModal(topicId) {
        const topic = AppState.findTopicById(topicId);
        if (!topic) return;
        
        const formHTML = `
            <form id="editTopicForm" class="modal-form" onsubmit="TopicsSection.handleUpdate(event, '${topicId}')">
                ${UI.createFormRow('Topic Name', UI.createTextInput('topicName', topic.name, '', true))}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('topicSortOrder', topic.sort_order, '', 0))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('topicStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], topic.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Topic')}
            </form>
        `;
        
        UI.openModal('Edit Topic', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('topicName').value.trim();
        const sortOrder = parseInt(document.getElementById('topicSortOrder').value) || 0;
        
        if (!name) {
            UI.showToast('Topic name is required', 'error');
            return;
        }
        
        try {
            await API.createTopic(AppState.selectedPaperId, name, sortOrder);
            UI.closeModal();
            UI.showToast('Topic created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, topicId) {
        event.preventDefault();
        
        const name = document.getElementById('topicName').value.trim();
        const sortOrder = parseInt(document.getElementById('topicSortOrder').value) || 0;
        const isActive = document.getElementById('topicStatus').value === 'true';
        
        if (!name) {
            UI.showToast('Topic name is required', 'error');
            return;
        }
        
        try {
            await API.updateTopic(topicId, { name, sort_order: sortOrder, is_active: isActive });
            UI.closeModal();
            UI.showToast('Topic updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(topicId) {
        const topic = AppState.findTopicById(topicId);
        if (!topic) return;
        
        const action = topic.is_active ? 'deactivate' : 'permanently delete';
        const message = topic.is_active 
            ? `Deactivate "${topic.name}"? You can reactivate it later.`
            : `Permanently delete "${topic.name}"? This cannot be undone.`;
        
        if (!UI.confirm(message)) {
            return;
        }
        
        try {
            await API.deleteTopic(topicId);
            UI.showToast(`Topic ${action}d successfully`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};
