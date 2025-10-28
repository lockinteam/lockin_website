// Notes section management

const NotesSection = {
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading notes...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.notes.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load papers for selected course if not loaded
            if (AppState.papers.length === 0 || AppState.papers[0]?.course_id !== AppState.filters.notes.courseId) {
                const papersData = await API.getPapers(AppState.filters.notes.courseId, false);
                AppState.setPapers(papersData.data.papers || []);
            }
            
            // Check if a paper is selected
            if (!AppState.filters.notes.paperId) {
                this.renderPaperSelection();
                return;
            }
            
            // Load topics for selected paper if not loaded
            if (AppState.topics.length === 0 || AppState.topics[0]?.paper_id !== AppState.filters.notes.paperId) {
                const topicsData = await API.getTopics(AppState.filters.notes.paperId, false);
                AppState.setTopics(topicsData.data.topics || []);
            }
            
            // Check if a topic is selected
            if (!AppState.filters.notes.topicId) {
                this.renderTopicSelection();
                return;
            }
            
            // Load all notes (active and inactive) for selected topic
            const data = await API.getNotes(AppState.filters.notes.topicId, true);
            AppState.setNotes(data.data.notes || []);
            this.render(data.data.topic);
        } catch (error) {
            UI.showEmpty('Error Loading Notes', error.message);
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
                    <select class="filter-select" id="notesCourseFilter" onchange="NotesSection.onCourseChange()">
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
                <p>Choose a course from the dropdown above to view notes.</p>
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
                    <select class="filter-select" id="notesCourseFilter" onchange="NotesSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.notes.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Paper</label>
                    <select class="filter-select" id="notesPaperFilter" onchange="NotesSection.onPaperChange()">
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
                <p>Choose a paper from the dropdown above to view notes.</p>
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
                    <select class="filter-select" id="notesCourseFilter" onchange="NotesSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.notes.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="notesPaperFilter" onchange="NotesSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.notes.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Topic</label>
                    <select class="filter-select" id="notesTopicFilter" onchange="NotesSection.onTopicChange()">
                        <option value="">-- Choose a topic --</option>
                        ${topicOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <h3>Select a Topic</h3>
                <p>Choose a topic from the dropdown above to view and manage its notes.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(topicInfo) {
        const notes = AppState.notes;
        const courses = AppState.courses;
        const papers = AppState.papers;
        const topics = AppState.topics;
        
        // Apply search filter
        let filteredNotes = notes;
        if (this.searchQuery) {
            filteredNotes = notes.filter(n => 
                n.content.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        const topicOptions = topics.map(t => ({ value: t.id, label: t.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Notes',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'NotesSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="notesSearchInput" placeholder="Search notes..." value="${this.searchQuery}" oninput="NotesSection.onSearchChange()">
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="notesCourseFilter" onchange="NotesSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.notes.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="notesPaperFilter" onchange="NotesSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.notes.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Topic</label>
                    <select class="filter-select" id="notesTopicFilter" onchange="NotesSection.onTopicChange()">
                        ${topicOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.notes.topicId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (filteredNotes.length === 0) {
            const message = this.searchQuery 
                ? 'No notes match your search.' 
                : "This topic doesn't have any notes yet. Create the first note to get started.";
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <h3>No Notes Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = filteredNotes.map(note => this.renderNoteCard(note)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderNoteCard(note) {
        const preview = note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '');
        const badgeClass = note.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = note.is_active ? 'Active' : 'Inactive';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">Note</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-description">
                    ${UI.escapeHtml(preview)}
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Length</span>
                        <span class="meta-value">${note.content.length} chars</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(note.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="NotesSection.openEditModal('${note.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="NotesSection.handleDelete('${note.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${note.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('notesSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render(AppState.findTopicById(AppState.filters.notes.topicId));
        // Restore focus and cursor position
        setTimeout(() => {
            const newInput = document.getElementById('notesSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    async onCourseChange() {
        const courseId = document.getElementById('notesCourseFilter').value || null;
        AppState.setNotesCourseFilter(courseId);
        AppState.setNotesPaperFilter(null);
        AppState.setNotesTopicFilter(null);
        this.load();
    },
    
    async onPaperChange() {
        const paperId = document.getElementById('notesPaperFilter').value || null;
        AppState.setNotesPaperFilter(paperId);
        AppState.setNotesTopicFilter(null);
        this.load();
    },
    
    async onTopicChange() {
        const topicId = document.getElementById('notesTopicFilter').value || null;
        AppState.setNotesTopicFilter(topicId);
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.notes.topicId) {
            UI.showToast('Please select a topic first', 'warning');
            return;
        }
        
        const formHTML = `
            <form id="createNoteForm" class="modal-form" onsubmit="NotesSection.handleCreate(event)">
                ${UI.createFormRow('Content', UI.createTextarea('noteContent', '', 'Enter detailed notes content...', 15), 'Markdown formatting supported')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Notes')}
            </form>
        `;
        
        UI.openModal('Create New Notes', formHTML);
    },
    
    openEditModal(noteId) {
        const note = AppState.findNoteById(noteId);
        if (!note) return;
        
        const formHTML = `
            <form id="editNoteForm" class="modal-form" onsubmit="NotesSection.handleUpdate(event, '${noteId}')">
                ${UI.createFormRow('Content', UI.createTextarea('noteContent', note.content, '', 15))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('noteStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], note.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Notes')}
            </form>
        `;
        
        UI.openModal('Edit Notes', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const content = document.getElementById('noteContent').value.trim();
        
        if (!content) {
            UI.showToast('Content is required', 'error');
            return;
        }
        
        try {
            await API.createNote(AppState.filters.notes.topicId, content);
            UI.closeModal();
            UI.showToast('Notes created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, noteId) {
        event.preventDefault();
        
        const content = document.getElementById('noteContent').value.trim();
        const isActive = document.getElementById('noteStatus').value === 'true';
        
        if (!content) {
            UI.showToast('Content is required', 'error');
            return;
        }
        
        try {
            await API.updateNote(noteId, { content, is_active: isActive });
            UI.closeModal();
            UI.showToast('Notes updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(noteId) {
        const note = AppState.findNoteById(noteId);
        if (!note) return;
        
        // Two-stage delete pattern
        if (note.is_active) {
            // First delete - soft delete (deactivate)
            const confirmMessage = `Deactivate this note?\\n\\nThis will hide the note from users but keep it in the database. You can reactivate it later by editing it.`;
            
            if (!UI.confirm(confirmMessage)) {
                return;
            }
            
            try {
                await API.deleteNote(noteId);
                UI.showToast('Note deactivated successfully', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        } else {
            // Second delete - permanent delete
            const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\\n\\nDeleting this note will permanently remove it from the database.\\n\\nThis action CANNOT be undone.\\n\\nAre you absolutely sure?`;
            
            if (!UI.confirm(warningMessage)) {
                return;
            }
            
            try {
                await API.deleteNote(noteId);
                UI.showToast('Note deleted permanently', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        }
    }
};
