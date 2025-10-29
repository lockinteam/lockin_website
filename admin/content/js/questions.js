// Questions section management

const QuestionsSection = {
    includeInactive: false,
    searchQuery: '',
    
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
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
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
        contentHTML = `
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
        
        return `
            <div class="content-card">
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
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Options (2-10 required, mark 1 as correct):</label>
                    <div id="optionsList">
                        <div class="option-item" data-index="0">
                            <input type="text" placeholder="Option 1" class="filter-select" style="flex: 1; margin-right: 0.5rem;" />
                            <label><input type="radio" name="correctOption" value="0" required /> Correct</label>
                        </div>
                        <div class="option-item" data-index="1">
                            <input type="text" placeholder="Option 2" class="filter-select" style="flex: 1; margin-right: 0.5rem;" />
                            <label><input type="radio" name="correctOption" value="1" /> Correct</label>
                        </div>
                    </div>
                    <button type="button" onclick="QuestionsSection.addOption()" class="action-btn-secondary" style="margin-top: 0.5rem;">Add Option</button>
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
            <div class="option-item" data-index="${index}" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                <input type="text" placeholder="Option ${index + 1}" class="filter-select" style="flex: 1;" />
                <label style="white-space: nowrap;"><input type="radio" name="correctOption" value="${index}" /> Correct</label>
                <button type="button" onclick="this.parentElement.remove()" class="card-action-btn destructive" style="padding: 0.4rem 0.8rem;">Remove</button>
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
    }
};
