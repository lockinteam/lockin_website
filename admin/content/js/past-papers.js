// Past Papers section management

const PastPapersSection = {
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading past papers...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.pastPapers.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load papers for selected course if not loaded
            if (AppState.papers.length === 0 || AppState.papers[0]?.course_id !== AppState.filters.pastPapers.courseId) {
                const papersData = await API.getPapers(AppState.filters.pastPapers.courseId, false);
                AppState.setPapers(papersData.data.papers || []);
            }
            
            // Check if a paper is selected
            if (!AppState.filters.pastPapers.paperId) {
                this.renderPaperSelection();
                return;
            }
            
            // Load past papers for selected paper
            const data = await API.getPastPapers(AppState.filters.pastPapers.paperId);
            AppState.setPastPapers(data.data.past_papers || []);
            this.render(data.data.paper);
        } catch (error) {
            UI.showEmpty('Error Loading Past Papers', error.message);
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
                    <select class="filter-select" id="pastPapersCourseFilter" onchange="PastPapersSection.onCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Select a Course</h3>
                <p>Choose a course from the dropdown above to view past papers.</p>
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
                    <select class="filter-select" id="pastPapersCourseFilter" onchange="PastPapersSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Paper</label>
                    <select class="filter-select" id="pastPapersPaperFilter" onchange="PastPapersSection.onPaperChange()">
                        <option value="">-- Choose a paper --</option>
                        ${paperOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Select a Paper</h3>
                <p>Choose a paper from the dropdown above to view and manage its past papers.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(paperInfo) {
        const pastPapers = AppState.pastPapers;
        const courses = AppState.courses;
        const papers = AppState.papers;
        
        // Apply search filter (by year)
        let filteredPastPapers = pastPapers;
        if (this.searchQuery) {
            filteredPastPapers = pastPapers.filter(pp => 
                pp.year.toString().includes(this.searchQuery) ||
                (pp.url && pp.url.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Upload Past Paper',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'PastPapersSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="pastPapersSearchInput" placeholder="Search by year..." value="${this.searchQuery}" oninput="PastPapersSection.onSearchChange()">
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="pastPapersCourseFilter" onchange="PastPapersSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="pastPapersPaperFilter" onchange="PastPapersSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (filteredPastPapers.length === 0) {
            const message = this.searchQuery 
                ? 'No past papers match your search.' 
                : "This paper doesn't have any past papers yet. Upload the first past paper to get started.";
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <h3>No Past Papers Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = filteredPastPapers.map(pastPaper => this.renderPastPaperCard(pastPaper)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderPastPaperCard(pastPaper) {
        const badgeClass = pastPaper.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = pastPaper.is_active ? 'Active' : 'Inactive';
        const fileSize = pastPaper.file_size ? `${(pastPaper.file_size / 1048576).toFixed(2)} MB` : 'Unknown';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${pastPaper.year} Past Paper</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Year</span>
                        <span class="meta-value">${pastPaper.year}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">File Size</span>
                        <span class="meta-value">${fileSize}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(pastPaper.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="window.open('${pastPaper.url}', '_blank')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        View
                    </button>
                    <button class="card-action-btn" onclick="PastPapersSection.openEditModal('${pastPaper.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="PastPapersSection.handleDelete('${pastPaper.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${pastPaper.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('pastPapersSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render(AppState.findPaperById(AppState.filters.pastPapers.paperId));
        setTimeout(() => {
            const newInput = document.getElementById('pastPapersSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    async onCourseChange() {
        const courseId = document.getElementById('pastPapersCourseFilter').value || null;
        AppState.setPastPapersCourseFilter(courseId);
        AppState.setPastPapersPaperFilter(null);
        this.load();
    },
    
    async onPaperChange() {
        const paperId = document.getElementById('pastPapersPaperFilter').value || null;
        AppState.setPastPapersPaperFilter(paperId);
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.pastPapers.paperId) {
            UI.showToast('Please select a paper first', 'warning');
            return;
        }
        
        const formHTML = `
            <form id="createPastPaperForm" class="modal-form" onsubmit="PastPapersSection.handleCreate(event)">
                ${UI.createFormRow('Year', UI.createNumberInput('pastPaperYear', '', '2024', 1900, 2100), 'e.g., 2024')}
                ${UI.createFormRow('URL', UI.createUrlInput('pastPaperUrl', '', 'https://storage.example.com/past-paper.pdf'), 'Full URL to past paper PDF')}
                ${UI.createFormRow('File Size (bytes)', UI.createNumberInput('pastPaperFileSize', '', '', 0), 'Optional')}
                ${UI.createModalActions('UI.closeModal()', null, 'Upload Past Paper')}
            </form>
        `;
        
        UI.openModal('Upload Past Paper', formHTML);
    },
    
    openEditModal(pastPaperId) {
        const pastPaper = AppState.findPastPaperById(pastPaperId);
        if (!pastPaper) return;
        
        const formHTML = `
            <form id="editPastPaperForm" class="modal-form" onsubmit="PastPapersSection.handleUpdate(event, '${pastPaperId}')">
                ${UI.createFormRow('Year', UI.createNumberInput('pastPaperYear', pastPaper.year, '', 1900, 2100))}
                ${UI.createFormRow('URL', UI.createUrlInput('pastPaperUrl', pastPaper.url, ''))}
                ${UI.createFormRow('File Size (bytes)', UI.createNumberInput('pastPaperFileSize', pastPaper.file_size || '', '', 0))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('pastPaperStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], pastPaper.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Past Paper')}
            </form>
        `;
        
        UI.openModal('Edit Past Paper', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const year = parseInt(document.getElementById('pastPaperYear').value);
        const url = document.getElementById('pastPaperUrl').value.trim();
        const fileSize = document.getElementById('pastPaperFileSize').value;
        
        const fileSizeValue = fileSize ? parseInt(fileSize) : null;
        
        if (!year || !url) {
            UI.showToast('Year and URL are required', 'error');
            return;
        }
        
        try {
            await API.createPastPaper(AppState.filters.pastPapers.paperId, year, url, fileSizeValue);
            UI.closeModal();
            UI.showToast('Past paper uploaded successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, pastPaperId) {
        event.preventDefault();
        
        const year = parseInt(document.getElementById('pastPaperYear').value);
        const url = document.getElementById('pastPaperUrl').value.trim();
        const fileSize = document.getElementById('pastPaperFileSize').value;
        const isActive = document.getElementById('pastPaperStatus').value === 'true';
        
        const fileSizeValue = fileSize ? parseInt(fileSize) : null;
        
        if (!year || !url) {
            UI.showToast('Year and URL are required', 'error');
            return;
        }
        
        try {
            await API.updatePastPaper(pastPaperId, { year, url, file_size: fileSizeValue, is_active: isActive });
            UI.closeModal();
            UI.showToast('Past paper updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(pastPaperId) {
        const pastPaper = AppState.findPastPaperById(pastPaperId);
        if (!pastPaper) return;
        
        // Two-stage delete pattern
        if (pastPaper.is_active) {
            const confirmMessage = `Deactivate the ${pastPaper.year} past paper?\\n\\nThis will hide the past paper from users but keep it in the database. You can reactivate it later by editing it.`;
            
            if (!UI.confirm(confirmMessage)) {
                return;
            }
            
            try {
                await API.deletePastPaper(pastPaperId);
                UI.showToast('Past paper deactivated successfully', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        } else {
            const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\\n\\nDeleting the ${pastPaper.year} past paper will permanently remove it from the database.\\n\\nThis action CANNOT be undone.\\n\\nAre you absolutely sure?`;
            
            if (!UI.confirm(warningMessage)) {
                return;
            }
            
            try {
                await API.deletePastPaper(pastPaperId);
                UI.showToast('Past paper deleted permanently', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        }
    }
};
