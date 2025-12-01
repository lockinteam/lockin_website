// Past Papers section management

const PastPapersSection = {
    searchQuery: '',
    
    // AQA Scraper State
    scrapeState: {
        step: 1, // 1=URL input, 2=mapping, 3=review
        url: '',
        scrapeData: null, // Raw response from scrape_aqa
        tierMapping: {}, // { "Higher": "db-tier-uuid" }
        paperMapping: {}, // { "Paper 1": "db-paper-uuid" }
        pastPapersToImport: [], // Flattened list with selection state
        allPapers: [], // All papers for the course (for scraper dropdown)
    },
    
    resetScrapeState() {
        this.scrapeState = {
            step: 1,
            url: '',
            scrapeData: null,
            tierMapping: {},
            paperMapping: {},
            pastPapersToImport: [],
            allPapers: [],
        };
    },
    
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
        const courseOptions = courses.map(c => ({ value: c.id, label: UI.formatCourseLabel(c) }));
        
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
            label: UI.formatCourseLabel(c) 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
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
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Tier</label>
                    <select class="filter-select" id="pastPapersTierFilter" onchange="PastPapersSection.onTierChange()">
                        <option value="">-- Choose a tier --</option>
                        ${tierOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
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
                <h3>Select a Tier</h3>
                <p>Choose a tier from the dropdown above to view past papers, or use <strong>Scrape AQA</strong> to bulk import.</p>
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
            label: UI.formatCourseLabel(c) 
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
            label: UI.formatCourseLabel(c) 
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
                <div class="card-actions" style="flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; flex: 1;">
                        <button class="card-action-btn" onclick="window.open('${pastPaper.url}', '_blank')" title="View Question Paper" style="flex: 1;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            QP
                        </button>
                        <button class="card-action-btn ${hasMarkScheme ? '' : 'disabled'}" ${hasMarkScheme ? `onclick="window.open('${pastPaper.mark_scheme_url}', '_blank')"` : 'disabled'} title="${hasMarkScheme ? 'View Mark Scheme' : 'No Mark Scheme'}" style="flex: 1;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                            MS
                        </button>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex: 1;">
                        <button class="card-action-btn" onclick="PastPapersSection.openEditModal('${pastPaper.id}')" title="Edit" style="flex: 1;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                        </button>
                        <button class="card-action-btn destructive" onclick="PastPapersSection.handleDelete('${pastPaper.id}')" title="${pastPaper.is_active ? 'Deactivate' : 'Delete'}" style="flex: 1;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            ${pastPaper.is_active ? 'Off' : 'Del'}
                        </button>
                    </div>
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
    
    // AQA Scraper functionality - Multi-step wizard
    async openScrapeAqaModal() {
        if (!AppState.filters.pastPapers.courseId) {
            UI.showToast('Please select a course first', 'warning');
            return;
        }
        
        this.resetScrapeState();
        
        // Load ALL papers for this course (regardless of tier) into scrapeState.allPapers
        // This doesn't affect AppState.papers which is used for the main tier-filtered view
        try {
            const papersData = await API.getPapers(
                AppState.filters.pastPapers.courseId,
                null, // No tier filter - get all papers
                false
            );
            this.scrapeState.allPapers = papersData.data.papers || [];
        } catch (error) {
            UI.showToast('Failed to load papers: ' + error.message, 'error');
            return;
        }
        
        this.renderScrapeStep1();
    },
    
    renderScrapeStep1() {
        const formHTML = `
            <div id="scrapeWizardContent">
                <div class="scrape-steps-indicator" style="display: flex; margin-bottom: 1.5rem; gap: 0.5rem;">
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">1. Enter URL</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">2. Map Tiers/Papers</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">3. Review & Import</div>
                </div>
                
                <div class="form-info" style="background: #e8f4fd; border: 1px solid #3678AE; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0; font-size: 0.9rem; color: #193659;">
                        <strong>How to use:</strong><br>
                        1. Go to <a href="https://www.aqa.org.uk/find-past-papers-and-mark-schemes" target="_blank" style="color: #3678AE;">AQA Past Papers</a><br>
                        2. Filter by subject and qualification<br>
                        3. Copy the URL from your browser<br>
                        4. Paste it below and click "Scrape AQA"
                    </p>
                </div>
                
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">AQA URL</label>
                    <input type="text" class="form-input" id="aqaUrl" placeholder="https://www.aqa.org.uk/find-past-papers-and-mark-schemes?subject=Biology&qualification=GCSE+Biology" value="${this.scrapeState.url}">
                    <span class="form-hint">Paste the full AQA search URL here</span>
                </div>
                
                <div id="scrapeError" style="display: none; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626; margin-bottom: 1rem;"></div>
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="ghost-btn" onclick="UI.closeModal()">Cancel</button>
                    <button type="button" class="primary-btn" id="scrapeBtn" onclick="PastPapersSection.handleScrapeUrl()">
                        <span id="scrapeBtnText">Scrape AQA</span>
                        <span id="scrapeBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Scraping...
                        </span>
                    </button>
                </div>
            </div>
        `;
        
        UI.openModal('Scrape AQA Past Papers', formHTML, 'large');
    },
    
    async handleScrapeUrl() {
        const url = document.getElementById('aqaUrl').value.trim();
        const errorDiv = document.getElementById('scrapeError');
        const btn = document.getElementById('scrapeBtn');
        const btnText = document.getElementById('scrapeBtnText');
        const btnLoading = document.getElementById('scrapeBtnLoading');
        
        // Validation
        if (!url) {
            errorDiv.textContent = 'Please enter an AQA URL';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (!url.includes('aqa.org.uk/find-past-papers-and-mark-schemes')) {
            errorDiv.textContent = 'URL must be from AQA\'s find-past-papers-and-mark-schemes page';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Show loading state
        errorDiv.style.display = 'none';
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        
        try {
            const response = await API.scrapeAqaPreview(url);
            
            if (!response.success) {
                throw new Error(response.error || response.message || 'Scraping failed');
            }
            
            // Store response data
            this.scrapeState.url = url;
            this.scrapeState.scrapeData = response;
            
            // Check if we have data to work with
            if (!response.discovered_tiers?.length && !response.discovered_papers?.length) {
                throw new Error('No papers found on this page. Try a different search filter.');
            }
            
            // Proceed to step 2
            this.scrapeState.step = 2;
            this.renderScrapeStep2();
            
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    },
    
    renderScrapeStep2() {
        const data = this.scrapeState.scrapeData;
        const stats = data.stats || {};
        const groupedPapers = data.grouped_papers || {};
        
        // Get DB tiers and ALL papers for this course (from scrapeState.allPapers, not AppState.papers)
        const dbTiers = AppState.tiers.filter(t => t.is_active);
        const dbPapers = this.scrapeState.allPapers.filter(p => p.is_active !== false);
        
        // Build paper options grouped by tier for the dropdown
        // Format: "Tier Name - Paper Name" with value "tierId|paperId"
        const buildPaperOptions = () => {
            let options = '<option value="">-- Skip this paper --</option>';
            
            // Group DB papers by tier
            dbTiers.forEach(tier => {
                const tierPapers = dbPapers.filter(p => p.tier_id === tier.id);
                if (tierPapers.length > 0) {
                    options += `<optgroup label="${tier.title}">`;
                    tierPapers.forEach(paper => {
                        options += `<option value="${tier.id}|${paper.id}">${tier.title} → ${paper.name}</option>`;
                    });
                    options += '</optgroup>';
                }
            });
            
            // Also add papers without tier (if any)
            const noTierPapers = dbPapers.filter(p => !p.tier_id);
            if (noTierPapers.length > 0) {
                options += `<optgroup label="No Tier">`;
                noTierPapers.forEach(paper => {
                    options += `<option value="|${paper.id}">${paper.name}</option>`;
                });
                options += '</optgroup>';
            }
            
            return options;
        };
        
        const paperOptionsHTML = buildPaperOptions();
        
        // Count total scraped items for each tier
        const tierStats = {};
        for (const [scrapedTier, papersObj] of Object.entries(groupedPapers)) {
            let count = 0;
            for (const [scrapedPaper, papersList] of Object.entries(papersObj)) {
                count += papersList.length;
            }
            tierStats[scrapedTier] = count;
        }
        
        // Pre-populate mappings with best-guess matches
        // New mapping format: mapping key is "scrapedTier|scrapedPaper", value is "dbTierId|dbPaperId"
        if (!this.scrapeState.paperMapping || Object.keys(this.scrapeState.paperMapping).length === 0) {
            this.scrapeState.paperMapping = {};
            
            for (const [scrapedTier, papersObj] of Object.entries(groupedPapers)) {
                // Try to match scraped tier to DB tier
                const matchedTier = dbTiers.find(t => 
                    t.title.toLowerCase().includes(scrapedTier.toLowerCase()) ||
                    scrapedTier.toLowerCase().includes(t.title.toLowerCase())
                );
                
                for (const scrapedPaper of Object.keys(papersObj)) {
                    // Try to match scraped paper to DB paper
                    const matchedPaper = dbPapers.find(p => {
                        const pName = p.name.toLowerCase();
                        const sPaper = scrapedPaper.toLowerCase();
                        return pName === sPaper || 
                               pName.includes(sPaper) || 
                               sPaper.includes(pName) ||
                               (pName.includes('paper') && sPaper.includes('paper') && 
                                pName.replace(/\D/g, '') === sPaper.replace(/\D/g, ''));
                    });
                    
                    if (matchedPaper && matchedTier) {
                        const key = `${scrapedTier}|${scrapedPaper}`;
                        this.scrapeState.paperMapping[key] = `${matchedTier.id}|${matchedPaper.id}`;
                    }
                }
            }
        }
        
        // Build the mapping UI grouped by scraped tier
        const buildTierSections = () => {
            let html = '';
            
            for (const [scrapedTier, papersObj] of Object.entries(groupedPapers)) {
                const scrapedPapers = Object.keys(papersObj);
                const paperCount = tierStats[scrapedTier];
                
                html += `
                    <div class="scrape-tier-section">
                        <div class="scrape-tier-header">
                            <span class="scrape-tier-title">${scrapedTier}</span>
                            <span class="scrape-tier-badge">${paperCount} past paper${paperCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="scrape-tier-papers">
                            ${scrapedPapers.map(scrapedPaper => {
                                const yearCount = papersObj[scrapedPaper].length;
                                const mappingKey = `${scrapedTier}|${scrapedPaper}`;
                                return `
                                    <div class="scrape-paper-row">
                                        <div class="scrape-paper-info">
                                            <span class="scrape-paper-name">"${scrapedPaper}"</span>
                                            <span class="scrape-paper-count">${yearCount} year${yearCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div class="scrape-paper-mapping">
                                            <span class="mapping-arrow">→</span>
                                            <select class="scrape-mapping-select" data-mapping-key="${mappingKey}">
                                                ${paperOptionsHTML}
                                            </select>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            
            return html;
        };
        
        const formHTML = `
            <div id="scrapeWizardContent">
                <div class="scrape-steps-indicator" style="display: flex; margin-bottom: 1.5rem; gap: 0.5rem;">
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ 1. Enter URL</div>
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">2. Map Papers</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">3. Review & Import</div>
                </div>
                
                <!-- Stats Summary -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1.5rem;">
                    <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #3678AE;">${stats.total_scraped || 0}</div>
                        <div style="font-size: 0.75rem; color: #64748B;">Total Past Papers Scraped</div>
                    </div>
                    <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #3678AE;">${Object.keys(groupedPapers).length}</div>
                        <div style="font-size: 0.75rem; color: #64748B;">Tiers Found</div>
                    </div>
                </div>
                
                <p style="margin-bottom: 1rem; color: #64748B; font-size: 0.9rem;">
                    For each scraped paper, select which database paper it should be imported as. Papers are grouped by tier.
                </p>
                
                <!-- Mapping Sections by Tier -->
                <div class="scrape-mapping-container">
                    ${buildTierSections()}
                </div>
                
                <div id="mappingError" style="display: none; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626; margin-bottom: 1rem;"></div>
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="ghost-btn" onclick="PastPapersSection.renderScrapeStep1()">← Back</button>
                    <button type="button" class="primary-btn" onclick="PastPapersSection.handleMappingComplete()">Continue →</button>
                </div>
            </div>
        `;
        
        // Update modal content
        document.querySelector('.modal-body').innerHTML = formHTML;
        
        // Set pre-populated values
        setTimeout(() => {
            document.querySelectorAll('.scrape-mapping-select').forEach(select => {
                const key = select.dataset.mappingKey;
                if (this.scrapeState.paperMapping[key]) {
                    select.value = this.scrapeState.paperMapping[key];
                }
            });
        }, 0);
    },
    
    handleMappingComplete() {
        const errorDiv = document.getElementById('mappingError');
        
        // Collect paper mappings (new format: "scrapedTier|scrapedPaper" -> "dbTierId|dbPaperId")
        this.scrapeState.paperMapping = {};
        document.querySelectorAll('.scrape-mapping-select').forEach(select => {
            const key = select.dataset.mappingKey;
            if (select.value) {
                this.scrapeState.paperMapping[key] = select.value;
            }
        });
        
        // Validate at least one paper is mapped
        if (Object.keys(this.scrapeState.paperMapping).length === 0) {
            errorDiv.textContent = 'Please map at least one paper to continue';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Generate flattened past papers list
        this.generatePastPapersList();
        
        if (this.scrapeState.pastPapersToImport.length === 0) {
            errorDiv.textContent = 'No past papers to import with current mappings. Please map more papers.';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Proceed to step 3
        this.scrapeState.step = 3;
        this.renderScrapeStep3();
    },
    
    generatePastPapersList() {
        const data = this.scrapeState.scrapeData;
        const groupedPapers = data.grouped_papers || {};
        const paperMapping = this.scrapeState.paperMapping;
        
        this.scrapeState.pastPapersToImport = [];
        let idCounter = 1;
        
        for (const [scrapedTier, papersObj] of Object.entries(groupedPapers)) {
            for (const [scrapedPaper, papersList] of Object.entries(papersObj)) {
                const mappingKey = `${scrapedTier}|${scrapedPaper}`;
                const mappingValue = paperMapping[mappingKey];
                
                if (!mappingValue) continue;
                
                // Parse the mapping value: "dbTierId|dbPaperId"
                const [dbTierId, dbPaperId] = mappingValue.split('|');
                if (!dbPaperId) continue;
                
                const dbPaper = this.scrapeState.allPapers.find(p => p.id === dbPaperId);
                const dbTier = dbTierId ? AppState.tiers.find(t => t.id === dbTierId) : null;
                
                for (const paper of papersList) {
                    if (!paper.question_paper_url) continue;
                    
                    this.scrapeState.pastPapersToImport.push({
                        id: `temp-${idCounter++}`,
                        selected: true,
                        year: paper.year,
                        session: paper.session || '',
                        scrapedTier: scrapedTier,
                        scrapedPaper: scrapedPaper,
                        dbPaperId: dbPaperId,
                        dbTierId: dbTierId || null,
                        dbPaperName: dbPaper?.name || scrapedPaper,
                        dbTierName: dbTier?.title || '',
                        questionPaperUrl: paper.question_paper_url,
                        markSchemeUrl: paper.mark_scheme_url || ''
                    });
                }
            }
        }
        
        // Sort by year descending, then by tier, then by paper name
        this.scrapeState.pastPapersToImport.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            if (a.dbTierName !== b.dbTierName) return a.dbTierName.localeCompare(b.dbTierName);
            return a.dbPaperName.localeCompare(b.dbPaperName);
        });
    },
    
    renderScrapeStep3() {
        const pastPapers = this.scrapeState.pastPapersToImport;
        const selectedCount = pastPapers.filter(p => p.selected).length;
        
        const formHTML = `
            <div id="scrapeWizardContent">
                <div class="scrape-steps-indicator" style="display: flex; margin-bottom: 1.5rem; gap: 0.5rem;">
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ 1. Enter URL</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ 2. Map Tiers/Papers</div>
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">3. Review & Import</div>
                </div>
                
                <!-- Selection Controls -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <strong>${pastPapers.length}</strong> past papers found • <strong id="selectedCount">${selectedCount}</strong> selected
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="button" class="ghost-btn btn-sm" onclick="PastPapersSection.toggleAllPastPapers(true)">Select All</button>
                        <button type="button" class="ghost-btn btn-sm" onclick="PastPapersSection.toggleAllPastPapers(false)">Deselect All</button>
                    </div>
                </div>
                
                <!-- Past Papers List -->
                <div id="pastPapersReviewList" style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                    ${this.renderPastPapersReviewList()}
                </div>
                
                <div id="importError" style="display: none; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626; margin: 1rem 0;"></div>
                <div id="importProgress" style="display: none; padding: 1rem; background: #e8f4fd; border-radius: 8px; margin: 1rem 0;"></div>
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" class="ghost-btn" onclick="PastPapersSection.scrapeState.step = 2; PastPapersSection.renderScrapeStep2();">← Back</button>
                    <button type="button" class="primary-btn" id="importBtn" onclick="PastPapersSection.handleBulkImport()">
                        <span id="importBtnText">Import <span id="importCount">${selectedCount}</span> Past Papers</span>
                        <span id="importBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Importing...
                        </span>
                    </button>
                </div>
            </div>
        `;
        
        // Update modal content
        document.querySelector('.modal-body').innerHTML = formHTML;
    },
    
    renderPastPapersReviewList() {
        const pastPapers = this.scrapeState.pastPapersToImport;
        
        if (pastPapers.length === 0) {
            return '<div style="padding: 2rem; text-align: center; color: #64748B;">No past papers to display</div>';
        }
        
        return pastPapers.map((pp, index) => `
            <div class="past-paper-review-item" style="display: flex; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; ${!pp.selected ? 'opacity: 0.5; background: #f8fafc;' : ''}">
                <input type="checkbox" class="pp-checkbox" data-index="${index}" ${pp.selected ? 'checked' : ''} onchange="PastPapersSection.togglePastPaper(${index})" style="margin-right: 1rem;">
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #193659;">
                        ${pp.year}${pp.session ? ` ${pp.session}` : ''} — ${pp.dbTierName ? `${pp.dbTierName} → ` : ''}${pp.dbPaperName}
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem;">
                        Scraped: ${pp.scrapedTier} / ${pp.scrapedPaper}
                    </div>
                    <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.25rem;">
                        QP: <a href="${pp.questionPaperUrl}" target="_blank" style="color: #3678AE;">View</a>
                        ${pp.markSchemeUrl ? ` | MS: <a href="${pp.markSchemeUrl}" target="_blank" style="color: #3678AE;">View</a>` : ' | MS: ❌ Not found'}
                    </div>
                </div>
                <button type="button" class="ghost-btn btn-sm" onclick="PastPapersSection.openEditPastPaperModal(${index})" style="margin-left: 0.5rem;">Edit</button>
            </div>
        `).join('');
    },
    
    togglePastPaper(index) {
        this.scrapeState.pastPapersToImport[index].selected = !this.scrapeState.pastPapersToImport[index].selected;
        this.updateSelectedCount();
        
        // Update visual state of item
        const item = document.querySelectorAll('.past-paper-review-item')[index];
        if (this.scrapeState.pastPapersToImport[index].selected) {
            item.style.opacity = '1';
            item.style.background = '';
        } else {
            item.style.opacity = '0.5';
            item.style.background = '#f8fafc';
        }
    },
    
    toggleAllPastPapers(selected) {
        this.scrapeState.pastPapersToImport.forEach((pp, index) => {
            pp.selected = selected;
        });
        this.updateSelectedCount();
        document.getElementById('pastPapersReviewList').innerHTML = this.renderPastPapersReviewList();
    },
    
    updateSelectedCount() {
        const selectedCount = this.scrapeState.pastPapersToImport.filter(p => p.selected).length;
        document.getElementById('selectedCount').textContent = selectedCount;
        document.getElementById('importCount').textContent = selectedCount;
        
        // Disable import button if nothing selected
        document.getElementById('importBtn').disabled = selectedCount === 0;
    },
    
    openEditPastPaperModal(index) {
        const pp = this.scrapeState.pastPapersToImport[index];
        const dbPapers = this.scrapeState.allPapers.filter(p => p.is_active !== false);
        
        const paperOptionsHTML = dbPapers.map(p => 
            `<option value="${p.id}" ${p.id === pp.dbPaperId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
        
        const editHTML = `
            <div class="modal-form">
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Year</label>
                    <input type="number" class="form-input" id="editPpYear" value="${pp.year}" min="1900" max="2100">
                </div>
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Import to Paper</label>
                    <select class="form-input" id="editPpPaperId">${paperOptionsHTML}</select>
                </div>
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Question Paper URL</label>
                    <input type="url" class="form-input" id="editPpQpUrl" value="${pp.questionPaperUrl}">
                </div>
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Mark Scheme URL (Optional)</label>
                    <input type="url" class="form-input" id="editPpMsUrl" value="${pp.markSchemeUrl}">
                </div>
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="ghost-btn" onclick="PastPapersSection.closeEditPastPaperModal()">Cancel</button>
                    <button type="button" class="primary-btn" onclick="PastPapersSection.saveEditPastPaper(${index})">Save Changes</button>
                </div>
            </div>
        `;
        
        // Create inline edit modal
        const overlay = document.createElement('div');
        overlay.id = 'editPpOverlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;';
        overlay.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 1.5rem; max-width: 500px; width: 90%;">
                <h3 style="margin: 0 0 1rem 0; color: #193659;">Edit Past Paper</h3>
                ${editHTML}
            </div>
        `;
        document.body.appendChild(overlay);
    },
    
    closeEditPastPaperModal() {
        const overlay = document.getElementById('editPpOverlay');
        if (overlay) overlay.remove();
    },
    
    saveEditPastPaper(index) {
        const pp = this.scrapeState.pastPapersToImport[index];
        
        pp.year = parseInt(document.getElementById('editPpYear').value);
        pp.dbPaperId = document.getElementById('editPpPaperId').value;
        pp.dbPaperName = this.scrapeState.allPapers.find(p => p.id === pp.dbPaperId)?.name || pp.scrapedPaper;
        pp.questionPaperUrl = document.getElementById('editPpQpUrl').value;
        pp.markSchemeUrl = document.getElementById('editPpMsUrl').value;
        
        this.closeEditPastPaperModal();
        document.getElementById('pastPapersReviewList').innerHTML = this.renderPastPapersReviewList();
    },
    
    async handleBulkImport() {
        const selectedPapers = this.scrapeState.pastPapersToImport.filter(p => p.selected);
        
        if (selectedPapers.length === 0) {
            document.getElementById('importError').textContent = 'Please select at least one past paper to import';
            document.getElementById('importError').style.display = 'block';
            return;
        }
        
        const btn = document.getElementById('importBtn');
        const btnText = document.getElementById('importBtnText');
        const btnLoading = document.getElementById('importBtnLoading');
        const progressDiv = document.getElementById('importProgress');
        const errorDiv = document.getElementById('importError');
        
        // Group selected papers by dbPaperId
        const paperGroups = {};
        selectedPapers.forEach(pp => {
            if (!paperGroups[pp.dbPaperId]) {
                paperGroups[pp.dbPaperId] = [];
            }
            paperGroups[pp.dbPaperId].push({
                year: pp.year,
                url: pp.questionPaperUrl,
                mark_scheme_url: pp.markSchemeUrl || null
            });
        });
        
        // Show loading state
        errorDiv.style.display = 'none';
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        progressDiv.style.display = 'block';
        
        let totalAdded = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const groupKeys = Object.keys(paperGroups);
        
        try {
            for (let i = 0; i < groupKeys.length; i++) {
                const paperId = groupKeys[i];
                const pastPapers = paperGroups[paperId];
                const paperName = this.scrapeState.allPapers.find(p => p.id === paperId)?.name || 'Unknown';
                
                progressDiv.innerHTML = `
                    <div style="color: #193659;">
                        <strong>Importing to ${paperName}...</strong><br>
                        Progress: ${i + 1}/${groupKeys.length} paper groups
                    </div>
                `;
                
                try {
                    const response = await API.bulkCreatePastPapers(paperId, pastPapers);
                    
                    if (response.success) {
                        totalAdded += response.data?.count || pastPapers.length;
                    }
                } catch (error) {
                    console.error(`Error importing to paper ${paperId}:`, error);
                    totalErrors++;
                }
            }
            
            // Success!
            UI.closeModal();
            
            if (totalErrors > 0) {
                UI.showToast(`Imported ${totalAdded} past papers with ${totalErrors} errors`, 'warning');
            } else {
                UI.showToast(`Successfully imported ${totalAdded} past papers!`, 'success');
            }
            
            // Reload if we're viewing past papers for one of the imported papers
            if (AppState.filters.pastPapers.paperId && paperGroups[AppState.filters.pastPapers.paperId]) {
                await this.load();
            }
            
        } catch (error) {
            errorDiv.textContent = `Import failed: ${error.message}`;
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            progressDiv.style.display = 'none';
        }
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
