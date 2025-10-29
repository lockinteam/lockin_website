// Questions section management

const QuestionsSection = {
    includeInactive: false,
    searchQuery: '',
    selectionMode: false,
    selectAllState: 0, // 0 = select active, 1 = select inactive, 2 = deselect all
    
    async load() {
        UI.showLoading('Loading questions...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.questions.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load papers for selected course if not loaded
            if (AppState.papers.length === 0 || AppState.papers[0]?.course_id !== AppState.filters.questions.courseId) {
                const papersData = await API.getPapers(AppState.filters.questions.courseId, false);
                AppState.setPapers(papersData.data.papers || []);
            }
            
            // Check if a paper is selected
            if (!AppState.filters.questions.paperId) {
                this.renderPaperSelection();
                return;
            }
            
            // Load topics for selected paper if not loaded
            if (AppState.topics.length === 0 || AppState.topics[0]?.paper_id !== AppState.filters.questions.paperId) {
                const topicsData = await API.getTopics(AppState.filters.questions.paperId, false);
                AppState.setTopics(topicsData.data.topics || []);
            }
            
            // Check if a topic is selected
            if (!AppState.filters.questions.topicId) {
                this.renderTopicSelection();
                return;
            }
            
            // Load questions for selected topic
            const data = await API.getQuestions(AppState.filters.questions.topicId, this.includeInactive);
            AppState.setQuestions(data.data.questions || []);
            this.render(data.data.topic);
        } catch (error) {
            UI.showEmpty('Error Loading Questions', error.message);
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
                    <select class="filter-select" id="questionsCourseFilter" onchange="QuestionsSection.onCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Select a Course</h3>
                <p>Choose a course from the dropdown above to view questions.</p>
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
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="questionsCourseFilter" onchange="QuestionsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.questions.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Paper</label>
                    <select class="filter-select" id="questionsPaperFilter" onchange="QuestionsSection.onPaperChange()">
                        <option value="">-- Choose a paper --</option>
                        ${paperOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Select a Paper</h3>
                <p>Choose a paper from the dropdown above to view questions.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    renderTopicSelection() {
        const topics = AppState.topics;
        const papers = AppState.papers;
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        const topicOptions = topics.map(t => ({ value: t.id, label: t.name }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="questionsCourseFilter" onchange="QuestionsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.questions.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="questionsPaperFilter" onchange="QuestionsSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.questions.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Topic</label>
                    <select class="filter-select" id="questionsTopicFilter" onchange="QuestionsSection.onTopicChange()">
                        <option value="">-- Choose a topic --</option>
                        ${topicOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Select a Topic</h3>
                <p>Choose a topic from the dropdown above to view and manage its questions.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(topicInfo) {
        const questions = AppState.questions;
        const courses = AppState.courses;
        const papers = AppState.papers;
        const topics = AppState.topics;
        
        // Apply search filter
        let filteredQuestions = questions;
        if (this.searchQuery) {
            filteredQuestions = questions.filter(q => 
                q.title.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        const topicOptions = topics.map(t => ({ value: t.id, label: t.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Question',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'QuestionsSection.openCreateModal()'
        );
        
        const importBtnHTML = UI.renderActionBtn(
            'Import from CSV',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
            'QuestionsSection.openImportModal()',
            true
        );
        
        const bulkDeleteBtnHTML = this.selectionMode 
            ? `<button class="action-btn" style="background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 2px solid #dc3545;" onclick="QuestionsSection.cancelSelection()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Cancel Selection
               </button>`
            : UI.renderActionBtn(
                'Bulk Delete',
                '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
                'QuestionsSection.enterSelectionMode()',
                true
            );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="questionsSearchInput" placeholder="Search questions..." value="${this.searchQuery}" oninput="QuestionsSection.onSearchChange()">
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="questionsCourseFilter" onchange="QuestionsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.questions.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="questionsPaperFilter" onchange="QuestionsSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.questions.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Topic</label>
                    <select class="filter-select" id="questionsTopicFilter" onchange="QuestionsSection.onTopicChange()">
                        ${topicOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.questions.topicId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveQuestions" ${this.includeInactive ? 'checked' : ''} onchange="QuestionsSection.toggleIncludeInactive()">
                    <label for="includeInactiveQuestions">Show Inactive</label>
                </div>
                <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                    ${importBtnHTML}
                    ${bulkDeleteBtnHTML}
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        // Render bulk action bar if in selection mode
        if (this.selectionMode) {
            const selectedQuestions = questions.filter(q => AppState.selectedQuestionIds.includes(q.id));
            const allActive = selectedQuestions.every(q => q.is_active);
            const allInactive = selectedQuestions.every(q => !q.is_active);
            const mixedState = selectedQuestions.length > 0 && !allActive && !allInactive;
            
            let actionText = '';
            let buttonText = 'Delete Selected';
            if (AppState.selectedQuestionIds.length === 0) {
                actionText = 'Click on questions to select them for bulk deletion';
            } else if (mixedState) {
                actionText = 'Mixed states selected - please select only active or only inactive questions';
            } else if (allActive) {
                actionText = `${AppState.selectedQuestionIds.length} active question(s) selected - will be deactivated`;
                buttonText = 'Deactivate Selected';
            } else {
                actionText = `${AppState.selectedQuestionIds.length} inactive question(s) selected - will be permanently deleted`;
                buttonText = 'Delete Selected';
            }
            
            contentHTML += `
                <div class="bulk-action-bar">
                    <div class="bulk-action-bar-text">${actionText}</div>
                    <div class="bulk-action-bar-buttons">
                        ${this.renderSelectAllButton()}
                        <button class="bulk-action-btn cancel" onclick="QuestionsSection.cancelSelection()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Cancel
                        </button>
                        <button class="bulk-action-btn destructive" onclick="QuestionsSection.handleBulkDelete()" ${mixedState || AppState.selectedQuestionIds.length === 0 ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            ${buttonText}
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (filteredQuestions.length === 0) {
            const message = this.searchQuery 
                ? 'No questions match your search.' 
                : (questions.length === 0 
                    ? "This topic doesn't have any questions yet. Create the first question to get started."
                    : 'No questions found. Try enabling "Show Inactive".');
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>No Questions Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = filteredQuestions.map(question => this.renderQuestionCard(question)).join('');
        contentHTML += `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderQuestionCard(question) {
        const badgeClass = question.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = question.is_active ? 'Active' : 'Inactive';
        const correctAnswer = question.options?.find(o => o.is_correct)?.text || 'None';
        const isSelected = AppState.isQuestionSelected(question.id);
        const selectedClass = isSelected ? 'selected' : '';
        
        const checkboxHTML = this.selectionMode 
            ? `<input type="checkbox" class="selection-checkbox" ${isSelected ? 'checked' : ''} onchange="QuestionsSection.toggleSelection('${question.id}')">`
            : '';
        
        const clickHandler = this.selectionMode 
            ? `onclick="QuestionsSection.toggleSelection('${question.id}')"` 
            : '';
        
        return `
            <div class="content-card ${selectedClass}" ${clickHandler} style="${this.selectionMode ? 'cursor: pointer;' : ''}">
                ${checkboxHTML}
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(question.title)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Options</span>
                        <span class="meta-value">${question.option_count || question.options?.length || 0}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Correct</span>
                        <span class="meta-value">${UI.escapeHtml(correctAnswer)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Sort Order</span>
                        <span class="meta-value">${question.sort_order}</span>
                    </div>
                </div>
                ${!this.selectionMode ? `
                <div class="card-actions">
                    <button class="card-action-btn" onclick="QuestionsSection.openEditModal('${question.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="QuestionsSection.handleDelete('${question.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${question.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('questionsSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render(AppState.findTopicById(AppState.filters.questions.topicId));
        setTimeout(() => {
            const newInput = document.getElementById('questionsSearchInput');
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
    
    async onCourseChange() {
        const courseId = document.getElementById('questionsCourseFilter').value || null;
        AppState.setQuestionsCourseFilter(courseId);
        AppState.setQuestionsPaperFilter(null);
        AppState.setQuestionsTopicFilter(null);
        this.load();
    },
    
    async onPaperChange() {
        const paperId = document.getElementById('questionsPaperFilter').value || null;
        AppState.setQuestionsPaperFilter(paperId);
        AppState.setQuestionsTopicFilter(null);
        this.load();
    },
    
    async onTopicChange() {
        const topicId = document.getElementById('questionsTopicFilter').value || null;
        AppState.setQuestionsTopicFilter(topicId);
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.questions.topicId) {
            UI.showToast('Please select a topic first', 'warning');
            return;
        }
        
        const formHTML = `
            <form id="createQuestionForm" class="modal-form" onsubmit="QuestionsSection.handleCreate(event)">
                ${UI.createFormRow('Question Title', UI.createTextInput('questionTitle', '', 'What is 2 + 2?', true))}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('questionSortOrder', '', '0', 0))}
                <div style="margin-top: 1.5rem; margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.75rem;">Options (2-10 required, mark 1 as correct):</label>
                    <div id="optionsList">
                        <div class="option-item" data-index="0" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="text" placeholder="Option 1" class="option-input" style="flex: 1;" />
                            <label style="white-space: nowrap;"><input type="radio" name="correctOption" value="0" required /> Correct</label>
                        </div>
                        <div class="option-item" data-index="1" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="text" placeholder="Option 2" class="option-input" style="flex: 1;" />
                            <label style="white-space: nowrap;"><input type="radio" name="correctOption" value="1" /> Correct</label>
                        </div>
                    </div>
                    <button type="button" onclick="QuestionsSection.addOption()" class="option-add-btn" style="margin-top: 1rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Option
                    </button>
                </div>
                ${UI.createModalActions('UI.closeModal()', null, 'Create Question')}
            </form>
        `;
        
        UI.openModal('Create New Question', formHTML);
    },
    
    addOption() {
        const list = document.getElementById('optionsList');
        const index = list.children.length;
        if (index >= 10) {
            UI.showToast('Maximum 10 options allowed', 'warning');
            return;
        }
        const optionHTML = `
            <div class="option-item" data-index="${index}" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <input type="text" placeholder="Option ${index + 1}" class="option-input" style="flex: 1;" />
                <label style="white-space: nowrap;"><input type="radio" name="correctOption" value="${index}" /> Correct</label>
                <button type="button" onclick="this.parentElement.remove()" class="option-remove-btn" title="Remove this option">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', optionHTML);
    },
    
    async openEditModal(questionId) {
        // Fetch full question details with options
        try {
            const data = await API.getQuestion(questionId);
            const question = data.data.question;
            
            const formHTML = `
                <form id="editQuestionForm" class="modal-form" onsubmit="QuestionsSection.handleUpdate(event, '${questionId}')">
                    ${UI.createFormRow('Question Title', UI.createTextInput('questionTitle', question.title, '', true))}
                    ${UI.createFormRow('Sort Order', UI.createNumberInput('questionSortOrder', question.sort_order, '', 0))}
                    ${UI.createFormRow(
                        'Status',
                        UI.createSelect('questionStatus', [
                            { value: 'true', label: 'Active' },
                            { value: 'false', label: 'Inactive' }
                        ], question.is_active ? 'true' : 'false')
                    )}
                    <div style="margin-top: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Current Options:</label>
                        ${question.options.map(opt => `<div style="padding: 0.5rem; background: #f5f5f5; margin-bottom: 0.5rem; border-radius: 4px;">${UI.escapeHtml(opt.text)} ${opt.is_correct ? '✓ (Correct)' : ''}</div>`).join('')}
                        <p style="color: var(--color-grey-text); font-size: 0.85rem; margin-top: 0.5rem;">Note: To modify options, delete and recreate the question.</p>
                    </div>
                    ${UI.createModalActions('UI.closeModal()', null, 'Update Question')}
                </form>
            `;
            
            UI.openModal('Edit Question', formHTML);
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const title = document.getElementById('questionTitle').value.trim();
        const sortOrder = parseInt(document.getElementById('questionSortOrder').value) || 0;
        
        // Collect options
        const optionItems = document.querySelectorAll('#optionsList .option-item');
        const options = [];
        const correctIndex = parseInt(document.querySelector('input[name="correctOption"]:checked')?.value);
        
        if (isNaN(correctIndex)) {
            UI.showToast('Please select which option is correct', 'error');
            return;
        }
        
        optionItems.forEach((item, index) => {
            const input = item.querySelector('input[type="text"]');
            const text = input.value.trim();
            if (text) {
                options.push({
                    text: text,
                    is_correct: index === correctIndex
                });
            }
        });
        
        if (!title) {
            UI.showToast('Question title is required', 'error');
            return;
        }
        
        if (options.length < 2) {
            UI.showToast('At least 2 options are required', 'error');
            return;
        }
        
        try {
            await API.createQuestion(AppState.filters.questions.topicId, title, sortOrder, options);
            UI.closeModal();
            UI.showToast('Question created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, questionId) {
        event.preventDefault();
        
        const title = document.getElementById('questionTitle').value.trim();
        const sortOrder = parseInt(document.getElementById('questionSortOrder').value) || 0;
        const isActive = document.getElementById('questionStatus').value === 'true';
        
        if (!title) {
            UI.showToast('Question title is required', 'error');
            return;
        }
        
        try {
            await API.updateQuestion(questionId, { title: title, sort_order: sortOrder, is_active: isActive });
            UI.closeModal();
            UI.showToast('Question updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(questionId) {
        const question = AppState.findQuestionById(questionId);
        if (!question) return;
        
        // Two-stage delete pattern
        if (question.is_active) {
            const confirmMessage = `Deactivate this question?\\n\\nThis will hide the question from users but keep it in the database. You can reactivate it later by editing it.`;
            
            if (!UI.confirm(confirmMessage)) {
                return;
            }
            
            try {
                await API.deleteQuestion(questionId);
                UI.showToast('Question deactivated successfully', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        } else {
            const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\\n\\nDeleting this question will permanently remove it and all its options from the database.\\n\\nThis action CANNOT be undone.\\n\\nAre you absolutely sure?`;
            
            if (!UI.confirm(warningMessage)) {
                return;
            }
            
            try {
                await API.deleteQuestion(questionId);
                UI.showToast('Question deleted permanently', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        }
    },
    
    // Selection mode methods
    enterSelectionMode() {
        this.selectionMode = true;
        this.selectAllState = 0;
        AppState.clearQuestionSelection();
        this.render(AppState.findTopicById(AppState.filters.questions.topicId));
    },
    
    cancelSelection() {
        this.selectionMode = false;
        this.selectAllState = 0;
        AppState.clearQuestionSelection();
        this.render(AppState.findTopicById(AppState.filters.questions.topicId));
    },
    
    toggleSelection(questionId) {
        AppState.toggleQuestionSelection(questionId);
        this.render(AppState.findTopicById(AppState.filters.questions.topicId));
    },
    
    renderSelectAllButton() {
        const questions = AppState.questions;
        const activeQuestions = questions.filter(q => q.is_active).map(q => q.id);
        const inactiveQuestions = questions.filter(q => !q.is_active).map(q => q.id);
        
        let buttonText = '';
        switch(this.selectAllState) {
            case 0:
                buttonText = `Select All Active (${activeQuestions.length})`;
                break;
            case 1:
                buttonText = `Select All Inactive (${inactiveQuestions.length})`;
                break;
            case 2:
                buttonText = 'Deselect All';
                break;
        }
        
        return `
            <button class="bulk-action-btn" onclick="QuestionsSection.cycleSelectAll()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                ${buttonText}
            </button>
        `;
    },
    
    cycleSelectAll() {
        const questions = AppState.questions;
        const activeQuestions = questions.filter(q => q.is_active).map(q => q.id);
        const inactiveQuestions = questions.filter(q => !q.is_active).map(q => q.id);
        
        switch(this.selectAllState) {
            case 0: // Select all active
                AppState.selectAllQuestions(activeQuestions);
                this.selectAllState = 1;
                break;
            case 1: // Select all inactive
                AppState.selectAllQuestions(inactiveQuestions);
                this.selectAllState = 2;
                break;
            case 2: // Deselect all
                AppState.clearQuestionSelection();
                this.selectAllState = 0;
                break;
        }
        
        this.render(AppState.findTopicById(AppState.filters.questions.topicId));
    },
    
    async handleBulkDelete() {
        if (AppState.selectedQuestionIds.length === 0) {
            UI.showToast('No questions selected', 'warning');
            return;
        }
        
        const selectedQuestions = AppState.questions.filter(q => AppState.selectedQuestionIds.includes(q.id));
        const allActive = selectedQuestions.every(q => q.is_active);
        const allInactive = selectedQuestions.every(q => !q.is_active);
        
        if (!allActive && !allInactive) {
            UI.showToast('Please select only active or only inactive questions', 'error');
            return;
        }
        
        const count = AppState.selectedQuestionIds.length;
        
        if (allActive) {
            const confirmMessage = `Deactivate ${count} question(s)?\\n\\nThis will hide them from users but keep them in the database. You can reactivate them later.`;
            
            if (!UI.confirm(confirmMessage)) {
                return;
            }
            
            try {
                await API.bulkDeleteQuestions(AppState.selectedQuestionIds);
                UI.showToast(`${count} question(s) deactivated successfully`, 'success');
                this.cancelSelection();
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        } else {
            const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\\n\\nDeleting ${count} question(s) will permanently remove them and all their options from the database.\\n\\nThis action CANNOT be undone.\\n\\nAre you absolutely sure?`;
            
            if (!UI.confirm(warningMessage)) {
                return;
            }
            
            try {
                await API.bulkDeleteQuestions(AppState.selectedQuestionIds);
                UI.showToast(`${count} question(s) deleted permanently`, 'success');
                this.cancelSelection();
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        }
    },
    
    // CSV Import methods
    openImportModal() {
        if (!AppState.filters.questions.topicId) {
            UI.showToast('Please select a topic first', 'warning');
            return;
        }
        
        const formHTML = `
            <div>
                <p style="color: var(--color-grey-text); margin-bottom: 1.5rem; line-height: 1.6;">
                    Import multiple questions at once using a CSV file. 
                    <a href="csv-format-help.html" target="_blank" class="csv-help-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        View format guide & download template
                    </a>
                </p>
                <input type="file" id="csvFileInput" accept=".csv,.txt" style="display: none;" onchange="QuestionsSection.onFileSelected()">
                <div id="csvDropZone" class="csv-drop-zone" onclick="document.getElementById('csvFileInput').click()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <div class="csv-drop-zone-text">
                        <strong>Click to browse</strong> or drag and drop your CSV file here
                    </div>
                    <div class="csv-drop-zone-hint">Supports .csv and .txt files</div>
                </div>
                <div id="csvFileInfo" style="display: none; margin-top: 1rem; padding: 0.75rem; background: rgba(54, 120, 174, 0.1); border-radius: 8px; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    <span id="csvFileName" style="flex: 1; font-weight: 600; color: var(--color-primary-blue);"></span>
                    <button type="button" onclick="QuestionsSection.clearFile()" style="background: none; border: none; color: var(--color-grey-text); cursor: pointer; padding: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <button type="button" id="parseButton" onclick="QuestionsSection.parseCSVFile()" class="action-btn" style="width: 100%; justify-content: center; margin-top: 1rem; display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Parse & Preview
                </button>
                <div id="csvPreviewArea"></div>
            </div>
        `;
        
        UI.openModal('Import Questions from CSV', formHTML);
        
        // Setup drag and drop
        setTimeout(() => {
            const dropZone = document.getElementById('csvDropZone');
            if (dropZone) {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                });
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.add('drag-over');
                    });
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.remove('drag-over');
                    });
                });
                
                dropZone.addEventListener('drop', (e) => {
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        document.getElementById('csvFileInput').files = files;
                        QuestionsSection.onFileSelected();
                    }
                });
            }
        }, 100);
        
    },
    
    onFileSelected() {
        const fileInput = document.getElementById('csvFileInput');
        const fileInfo = document.getElementById('csvFileInfo');
        const fileName = document.getElementById('csvFileName');
        const parseButton = document.getElementById('parseButton');
        const dropZone = document.getElementById('csvDropZone');
        
        if (fileInput.files && fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
            fileInfo.style.display = 'flex';
            parseButton.style.display = 'block';
            dropZone.style.display = 'none';
        }
    },
    
    clearFile() {
        const fileInput = document.getElementById('csvFileInput');
        const fileInfo = document.getElementById('csvFileInfo');
        const parseButton = document.getElementById('parseButton');
        const dropZone = document.getElementById('csvDropZone');
        const previewArea = document.getElementById('csvPreviewArea');
        
        fileInput.value = '';
        fileInfo.style.display = 'none';
        parseButton.style.display = 'none';
        dropZone.style.display = 'flex';
        previewArea.innerHTML = '';
    },
    
    async parseCSVFile() {
        const fileInput = document.getElementById('csvFileInput');
        const previewArea = document.getElementById('csvPreviewArea');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            UI.showToast('Please select a file first', 'warning');
            return;
        }
        
        const file = fileInput.files[0];
        const text = await file.text();
        
        try {
            const questions = this.parseCSV(text);
            this.renderCSVPreview(questions);
        } catch (error) {
            previewArea.innerHTML = `
                <div class="csv-error">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    },
    
    parseCSV(text) {
        const lines = text.split('\n').map(line => line.trim());
        const questions = [];
        let currentQuestion = null;
        let lineNumber = 0;
        
        for (const line of lines) {
            lineNumber++;
            
            if (line === '') {
                // Blank line - finalize current question
                if (currentQuestion) {
                    // Validate question
                    if (!currentQuestion.title) {
                        throw new Error(`Line ${lineNumber}: Question has no title`);
                    }
                    if (currentQuestion.options.length < 2) {
                        throw new Error(`Question "${currentQuestion.title}" needs at least 2 options`);
                    }
                    const correctCount = currentQuestion.options.filter(o => o.is_correct).length;
                    if (correctCount === 0) {
                        throw new Error(`Question "${currentQuestion.title}" has no correct answer marked with A*:`);
                    }
                    if (correctCount > 1) {
                        throw new Error(`Question "${currentQuestion.title}" has ${correctCount} correct answers, only 1 is allowed`);
                    }
                    
                    questions.push(currentQuestion);
                    currentQuestion = null;
                }
                continue;
            }
            
            if (line.startsWith('Q:')) {
                // New question
                if (currentQuestion) {
                    throw new Error(`Line ${lineNumber}: Found new question before previous one was completed (missing blank line?)`);
                }
                currentQuestion = {
                    title: line.substring(2).trim(),
                    sort_order: questions.length + 1,
                    options: []
                };
            } else if (line.startsWith('A*:')) {
                // Correct answer
                if (!currentQuestion) {
                    throw new Error(`Line ${lineNumber}: Found answer before question (A*: must come after Q:)`);
                }
                currentQuestion.options.push({
                    text: line.substring(3).trim(),
                    is_correct: true
                });
            } else if (line.startsWith('A:')) {
                // Incorrect answer
                if (!currentQuestion) {
                    throw new Error(`Line ${lineNumber}: Found answer before question (A: must come after Q:)`);
                }
                currentQuestion.options.push({
                    text: line.substring(2).trim(),
                    is_correct: false
                });
            } else if (line !== '') {
                throw new Error(`Line ${lineNumber}: Invalid line format. Lines must start with Q:, A:, or A*:`);
            }
        }
        
        // Don't forget the last question if file doesn't end with blank line
        if (currentQuestion) {
            if (!currentQuestion.title) {
                throw new Error(`Last question has no title`);
            }
            if (currentQuestion.options.length < 2) {
                throw new Error(`Question "${currentQuestion.title}" needs at least 2 options`);
            }
            const correctCount = currentQuestion.options.filter(o => o.is_correct).length;
            if (correctCount === 0) {
                throw new Error(`Question "${currentQuestion.title}" has no correct answer marked with A*:`);
            }
            if (correctCount > 1) {
                throw new Error(`Question "${currentQuestion.title}" has ${correctCount} correct answers, only 1 is allowed`);
            }
            questions.push(currentQuestion);
        }
        
        if (questions.length === 0) {
            throw new Error('No questions found in file. Make sure to follow the format: Q: question, A*: correct answer, A: wrong answer');
        }
        
        return questions;
    },
    
    renderCSVPreview(questions) {
        const previewArea = document.getElementById('csvPreviewArea');
        
        const questionsHTML = questions.map((q, index) => `
            <div class="csv-question-preview">
                <strong>Question ${index + 1}: ${UI.escapeHtml(q.title)}</strong>
                <ul>
                    ${q.options.map(opt => `
                        <li class="${opt.is_correct ? 'correct' : ''}">${UI.escapeHtml(opt.text)}</li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
        
        previewArea.innerHTML = `
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(54, 120, 174, 0.2);">
                <h3 style="color: var(--color-primary-blue); margin-bottom: 1rem;">Preview: ${questions.length} Question(s)</h3>
                <div class="csv-preview">
                    ${questionsHTML}
                </div>
                <button type="button" onclick="QuestionsSection.handleCSVImport()" class="action-btn" style="width: 100%; justify-content: center; margin-top: 1rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Import ${questions.length} Question(s)
                </button>
            </div>
        `;
    },
    
    async handleCSVImport() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];
        const text = await file.text();
        
        try {
            const questions = this.parseCSV(text);
            
            // Call bulk create API
            await API.bulkCreateQuestions(AppState.filters.questions.topicId, questions);
            
            UI.closeModal();
            UI.showToast(`Successfully imported ${questions.length} question(s)`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};
