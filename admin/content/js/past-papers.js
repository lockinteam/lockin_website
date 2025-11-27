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
            
            // Load tiers for the selected course
            const tiersData = await API.getTiers(AppState.filters.pastPapers.courseId, true);
            AppState.setTiers(tiersData.data.tiers || []);
            
            // Check if we need to show tier selection
            if (AppState.tiers.length > 0 && !AppState.filters.pastPapers.tierId) {
                this.renderTierSelection();
                return;
            }
            
            // Load papers for selected course/tier if not loaded
            if (AppState.papers.length === 0 || AppState.papers[0]?.course_id !== AppState.filters.pastPapers.courseId) {
                const papersData = await API.getPapers(
                    AppState.filters.pastPapers.courseId,
                    AppState.filters.pastPapers.tierId,
                    false
                );
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
    
    renderTierSelection() {
        const tiers = AppState.tiers.filter(t => t.is_active);
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="pastPapersCourseFilter" onchange="PastPapersSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Tier</label>
                    <select class="filter-select" id="pastPapersTierFilter" onchange="PastPapersSection.onTierChange()">
                        <option value="">-- Choose a tier --</option>
                        ${tierOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Select a Tier</h3>
                <p>Choose a tier from the dropdown above to view past papers.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    renderPaperSelection() {
        const papers = AppState.papers;
        const courses = AppState.courses;
        const tiers = AppState.tiers.filter(t => t.is_active);
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        
        const tierFilterHTML = tiers.length > 0 ? `
            <div class="filter-group" style="flex: 1;">
                <label class="filter-label">Tier</label>
                <select class="filter-select" id="pastPapersTierFilter" onchange="PastPapersSection.onTierChange()">
                    ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.tierId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
        const scrapeAqaBtnHTML = UI.renderActionBtn(
            'Scrape AQA',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>',
            'PastPapersSection.openScrapeAqaModal()',
            'secondary'
        );
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="pastPapersCourseFilter" onchange="PastPapersSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                ${tierFilterHTML}
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Paper</label>
                    <select class="filter-select" id="pastPapersPaperFilter" onchange="PastPapersSection.onPaperChange()">
                        <option value="">-- Choose a paper --</option>
                        ${paperOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-left: auto;">
                    ${scrapeAqaBtnHTML}
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Select a Paper</h3>
                <p>Choose a paper from the dropdown above to view and manage its past papers, or use <strong>Scrape AQA</strong> to bulk import.</p>
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
        
        const tiers = AppState.tiers.filter(t => t.is_active);
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Upload Past Paper',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'PastPapersSection.openCreateModal()'
        );
        
        const scrapeAqaBtnHTML = UI.renderActionBtn(
            'Scrape AQA',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>',
            'PastPapersSection.openScrapeAqaModal()',
            'secondary'
        );
        
        const tierFilterHTML = tiers.length > 0 ? `
            <div class="filter-group" style="flex: 1;">
                <label class="filter-label">Tier</label>
                <select class="filter-select" id="pastPapersTierFilter" onchange="PastPapersSection.onTierChange()">
                    ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.tierId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
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
                ${tierFilterHTML}
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="pastPapersPaperFilter" onchange="PastPapersSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.pastPapers.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                    ${scrapeAqaBtnHTML}
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
        const hasMarkScheme = pastPaper.mark_scheme_url && pastPaper.mark_scheme_url.trim() !== '';
        
        const markSchemeBtn = hasMarkScheme ? `
            <button class="card-action-btn" onclick="window.open('${pastPaper.mark_scheme_url}', '_blank')" title="View Mark Scheme">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Mark Scheme
            </button>
        ` : '';
        
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
                        <span class="meta-label">Mark Scheme</span>
                        <span class="meta-value">${hasMarkScheme ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(pastPaper.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="window.open('${pastPaper.url}', '_blank')" title="View Question Paper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Paper
                    </button>
                    ${markSchemeBtn}
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
        AppState.setPastPapersTierFilter(null);
        AppState.setPastPapersPaperFilter(null);
        this.load();
    },
    
    async onTierChange() {
        const tierId = document.getElementById('pastPapersTierFilter').value || null;
        AppState.setPastPapersTierFilter(tierId);
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
                ${UI.createFormRow('Question Paper PDF', UI.createFileOrUrlInput('pastPaperFile', '', 'application/pdf', 'https://storage.example.com/past-paper.pdf'), 'Upload PDF or enter URL')}
                ${UI.createFormRow('Mark Scheme PDF (Optional)', UI.createFileOrUrlInput('markSchemeFile', '', 'application/pdf', 'https://storage.example.com/mark-scheme.pdf'), 'Upload PDF or enter URL for mark scheme')}
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
                ${UI.createFormRow('Question Paper PDF', UI.createFileOrUrlInput('pastPaperFile', pastPaper.url || '', 'application/pdf', 'https://storage.example.com/past-paper.pdf'), 'Upload PDF or enter URL')}
                ${UI.createFormRow('Mark Scheme PDF (Optional)', UI.createFileOrUrlInput('markSchemeFile', pastPaper.mark_scheme_url || '', 'application/pdf', 'https://storage.example.com/mark-scheme.pdf'), 'Upload PDF or enter URL for mark scheme')}
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
        
        if (!year) {
            UI.showToast('Year is required', 'error');
            return;
        }
        
        try {
            // Get uploaded file info if file mode, otherwise URL
            const fileInput = document.getElementById('pastPaperFileFile');
            const mode = document.getElementById('pastPaperFileMode').value;
            let url, fileSizeValue = null;
            
            if (mode === 'file' && fileInput.files && fileInput.files.length > 0) {
                // Auto-detect file size from uploaded file
                fileSizeValue = fileInput.files[0].size;
            }
            
            url = await UI.getFileOrUrlValue('pastPaperFile');
            
            if (!url) {
                UI.showToast('Please provide a PDF file or URL', 'error');
                return;
            }
            
            // Get mark scheme URL (optional)
            let markSchemeUrl = null;
            try {
                markSchemeUrl = await UI.getFileOrUrlValue('markSchemeFile');
            } catch (e) {
                // Mark scheme is optional, ignore errors
            }
            
            await API.createPastPaper(AppState.filters.pastPapers.paperId, year, url, fileSizeValue, markSchemeUrl);
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
        const isActive = document.getElementById('pastPaperStatus').value === 'true';
        
        if (!year) {
            UI.showToast('Year is required', 'error');
            return;
        }
        
        try {
            // Get uploaded file info if file mode, otherwise URL
            const fileInput = document.getElementById('pastPaperFileFile');
            const mode = document.getElementById('pastPaperFileMode').value;
            let url, fileSizeValue = null;
            
            if (mode === 'file' && fileInput.files && fileInput.files.length > 0) {
                // Auto-detect file size from uploaded file
                fileSizeValue = fileInput.files[0].size;
            }
            
            url = await UI.getFileOrUrlValue('pastPaperFile');
            
            if (!url) {
                UI.showToast('Please provide a PDF file or URL', 'error');
                return;
            }
            
            // Get mark scheme URL (optional) - empty string clears it
            let markSchemeUrl = null;
            try {
                markSchemeUrl = await UI.getFileOrUrlValue('markSchemeFile');
                // If empty, set to empty string to clear on backend
                if (!markSchemeUrl) markSchemeUrl = '';
            } catch (e) {
                // Mark scheme is optional
                markSchemeUrl = '';
            }
            
            await API.updatePastPaper(pastPaperId, { year, url, file_size: fileSizeValue, mark_scheme_url: markSchemeUrl, is_active: isActive });
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
    },
    
    // AQA Scraper functionality
    openScrapeAqaModal() {
        if (!AppState.filters.pastPapers.courseId) {
            UI.showToast('Please select a course first', 'warning');
            return;
        }
        
        // Get papers for the selected course
        const papers = AppState.papers;
        const paperOptions = papers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        const formHTML = `
            <form id="scrapeAqaForm" class="modal-form" onsubmit="PastPapersSection.handleScrapePreview(event)">
                <div class="form-info" style="background: #e8f4fd; border: 1px solid #3678AE; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0; font-size: 0.9rem; color: #193659;">
                        <strong>How to use:</strong><br>
                        1. Go to <a href="https://www.aqa.org.uk/find-past-papers-and-mark-schemes" target="_blank" style="color: #3678AE;">AQA Past Papers</a><br>
                        2. Filter by subject and qualification<br>
                        3. Copy the URL from your browser<br>
                        4. Paste it below, select a paper to import to, and click Preview
                    </p>
                </div>
                ${UI.createFormRow('AQA URL', UI.createTextInput('aqaUrl', '', 'https://www.aqa.org.uk/find-past-papers-and-mark-schemes?subject=Biology&qualification=A-level+Biology'), 'Paste the full AQA search URL here')}
                ${UI.createFormRow('Import to Paper', `<select class="form-input" id="scrapePaperId" required>${paperOptions}</select>`, 'Select which paper to add the past papers to')}
                <div id="scrapePreviewResults"></div>
                ${UI.createModalActions('UI.closeModal()', null, 'Preview')}
            </form>
        `;
        
        UI.openModal('Scrape AQA Past Papers', formHTML);
    },
    
    async handleScrapePreview(event) {
        event.preventDefault();
        
        const url = document.getElementById('aqaUrl').value.trim();
        
        if (!url) {
            UI.showToast('Please enter an AQA URL', 'error');
            return;
        }
        
        if (!url.includes('aqa.org.uk/find-past-papers-and-mark-schemes')) {
            UI.showToast('URL must be from AQA\'s find-past-papers-and-mark-schemes page', 'error');
            return;
        }
        
        const resultsDiv = document.getElementById('scrapePreviewResults');
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 1rem; color: #64748B;">Scraping AQA website... This may take 5-10 seconds.</p>
            </div>
        `;
        
        try {
            const response = await API.scrapeAqaPreview(url);
            
            if (!response.success) {
                throw new Error(response.error || response.message || 'Preview failed');
            }
            
            const stats = response.stats;
            const papers = response.papers || [];
            const excluded = response.excluded_papers || [];
            
            // Build preview HTML
            let previewHTML = `
                <div class="scrape-preview" style="margin-top: 1rem;">
                    <h4 style="margin-bottom: 0.5rem; color: #193659;">Preview Results</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                        <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3678AE;">${stats.total_scraped}</div>
                            <div style="font-size: 0.75rem; color: #64748B;">Total Found</div>
                        </div>
                        <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3678AE;">${stats.relevant_after_filter}</div>
                            <div style="font-size: 0.75rem; color: #64748B;">After Filter</div>
                        </div>
                        <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3678AE;">${stats.grouped_components}</div>
                            <div style="font-size: 0.75rem; color: #64748B;">Grouped</div>
                        </div>
                        <div style="background: #dcfce7; padding: 0.75rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #16a34a;">${stats.would_add}</div>
                            <div style="font-size: 0.75rem; color: #64748B;">Will Add</div>
                        </div>
                    </div>
            `;
            
            if (papers.length > 0) {
                previewHTML += `
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead style="background: #f8fafc; position: sticky; top: 0;">
                                <tr>
                                    <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #e2e8f0;">Year</th>
                                    <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #e2e8f0;">Title</th>
                                    <th style="padding: 0.5rem; text-align: center; border-bottom: 1px solid #e2e8f0;">Mark Scheme</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${papers.slice(0, 20).map(p => `
                                    <tr>
                                        <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${p.year}</td>
                                        <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${p.title || 'Question Paper'}</td>
                                        <td style="padding: 0.5rem; text-align: center; border-bottom: 1px solid #e2e8f0;">${p.mark_scheme_url ? '✓' : '✗'}</td>
                                    </tr>
                                `).join('')}
                                ${papers.length > 20 ? `<tr><td colspan="3" style="padding: 0.5rem; text-align: center; color: #64748B;">... and ${papers.length - 20} more</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            if (excluded.length > 0) {
                previewHTML += `
                    <details style="margin-bottom: 1rem;">
                        <summary style="cursor: pointer; color: #64748B; font-size: 0.85rem;">
                            ${excluded.length} papers excluded (examiner reports, modified papers, etc.)
                        </summary>
                        <div style="max-height: 100px; overflow-y: auto; margin-top: 0.5rem; padding: 0.5rem; background: #fef2f2; border-radius: 4px; font-size: 0.8rem;">
                            ${excluded.slice(0, 10).map(e => `<div>${e.title} (${e.type})</div>`).join('')}
                            ${excluded.length > 10 ? `<div>... and ${excluded.length - 10} more</div>` : ''}
                        </div>
                    </details>
                `;
            }
            
            if (stats.would_add > 0) {
                previewHTML += `
                    <button type="button" class="btn btn-primary" onclick="PastPapersSection.handleScrapeConfirm('${url.replace(/'/g, "\\'")}')" style="width: 100%;">
                        Import ${stats.would_add} Past Papers
                    </button>
                `;
            } else {
                previewHTML += `
                    <div style="text-align: center; padding: 1rem; background: #fef3c7; border-radius: 8px; color: #92400e;">
                        No new papers to add. They may already exist in the database.
                    </div>
                `;
            }
            
            previewHTML += '</div>';
            resultsDiv.innerHTML = previewHTML;
            
        } catch (error) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626;">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    },
    
    async handleScrapeConfirm(url) {
        const paperSelect = document.getElementById('scrapePaperId');
        const paperId = paperSelect ? paperSelect.value : AppState.filters.pastPapers.paperId;
        
        if (!paperId) {
            UI.showToast('Please select a paper to import to', 'error');
            return;
        }
        
        const resultsDiv = document.getElementById('scrapePreviewResults');
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 1rem; color: #64748B;">Importing past papers... This may take a few seconds.</p>
            </div>
        `;
        
        try {
            const response = await API.scrapeAqa(url, paperId);
            
            if (!response.success) {
                throw new Error(response.error || response.message || 'Import failed');
            }
            
            const stats = response.stats;
            
            UI.closeModal();
            UI.showToast(`Successfully imported ${stats.added} past papers (${stats.skipped_existing} skipped as duplicates)`, 'success');
            
            // If we're viewing past papers for the same paper, reload
            if (AppState.filters.pastPapers.paperId === paperId) {
                await this.load();
            }
            
        } catch (error) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626;">
                    <strong>Error:</strong> ${error.message}
                    <br><br>
                    <button type="button" class="btn btn-secondary" onclick="PastPapersSection.openScrapeAqaModal()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
