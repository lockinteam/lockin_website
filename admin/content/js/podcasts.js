// Podcasts section management

const PodcastsSection = {
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading podcasts...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.podcasts.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load papers for selected course if not loaded
            if (AppState.papers.length === 0 || AppState.papers[0]?.course_id !== AppState.filters.podcasts.courseId) {
                const papersData = await API.getPapers(AppState.filters.podcasts.courseId, false);
                AppState.setPapers(papersData.data.papers || []);
            }
            
            // Check if a paper is selected
            if (!AppState.filters.podcasts.paperId) {
                this.renderPaperSelection();
                return;
            }
            
            // Load topics for selected paper if not loaded
            if (AppState.topics.length === 0 || AppState.topics[0]?.paper_id !== AppState.filters.podcasts.paperId) {
                const topicsData = await API.getTopics(AppState.filters.podcasts.paperId, false);
                AppState.setTopics(topicsData.data.topics || []);
            }
            
            // Check if a topic is selected
            if (!AppState.filters.podcasts.topicId) {
                this.renderTopicSelection();
                return;
            }
            
            // Load podcasts for selected topic
            const data = await API.getPodcasts(AppState.filters.podcasts.topicId);
            AppState.setPodcasts(data.data.podcasts || []);
            this.render(data.data.topic);
        } catch (error) {
            UI.showEmpty('Error Loading Podcasts', error.message);
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
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
                <h3>Select a Course</h3>
                <p>Choose a course from the dropdown above to view podcasts.</p>
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
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Paper</label>
                    <select class="filter-select" id="podcastsPaperFilter" onchange="PodcastsSection.onPaperChange()">
                        <option value="">-- Choose a paper --</option>
                        ${paperOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
                <h3>Select a Paper</h3>
                <p>Choose a paper from the dropdown above to view podcasts.</p>
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
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="podcastsPaperFilter" onchange="PodcastsSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Topic</label>
                    <select class="filter-select" id="podcastsTopicFilter" onchange="PodcastsSection.onTopicChange()">
                        <option value="">-- Choose a topic --</option>
                        ${topicOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
                <h3>Select a Topic</h3>
                <p>Choose a topic from the dropdown above to view and manage its podcasts.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(topicInfo) {
        const podcasts = AppState.podcasts;
        const courses = AppState.courses;
        const papers = AppState.papers;
        const topics = AppState.topics;
        
        // Apply search filter
        let filteredPodcasts = podcasts;
        if (this.searchQuery) {
            filteredPodcasts = podcasts.filter(p => 
                p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (p.url && p.url.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: `${c.title} (${c.year_name})` 
        }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        const topicOptions = topics.map(t => ({ value: t.id, label: t.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Podcast',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'PodcastsSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="podcastsSearchInput" placeholder="Search podcasts..." value="${this.searchQuery}" oninput="PodcastsSection.onSearchChange()">
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Paper</label>
                    <select class="filter-select" id="podcastsPaperFilter" onchange="PodcastsSection.onPaperChange()">
                        ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.paperId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Topic</label>
                    <select class="filter-select" id="podcastsTopicFilter" onchange="PodcastsSection.onTopicChange()">
                        ${topicOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.topicId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (filteredPodcasts.length === 0) {
            const message = this.searchQuery 
                ? 'No podcasts match your search.' 
                : "This topic doesn't have any podcasts yet. Create the first podcast to get started.";
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                    <h3>No Podcasts Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = filteredPodcasts.map(podcast => this.renderPodcastCard(podcast)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderPodcastCard(podcast) {
        const badgeClass = podcast.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = podcast.is_active ? 'Active' : 'Inactive';
        const duration = podcast.length_seconds ? `${Math.floor(podcast.length_seconds / 60)}:${(podcast.length_seconds % 60).toString().padStart(2, '0')}` : 'N/A';
        const fileSize = podcast.file_size ? `${(podcast.file_size / 1048576).toFixed(2)} MB` : 'N/A';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(podcast.name)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Duration</span>
                        <span class="meta-value">${duration}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">File Size</span>
                        <span class="meta-value">${fileSize}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(podcast.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="PodcastsSection.openEditModal('${podcast.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="PodcastsSection.handleDelete('${podcast.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${podcast.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('podcastsSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        this.render(AppState.findTopicById(AppState.filters.podcasts.topicId));
        setTimeout(() => {
            const newInput = document.getElementById('podcastsSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    async onCourseChange() {
        const courseId = document.getElementById('podcastsCourseFilter').value || null;
        AppState.setPodcastsCourseFilter(courseId);
        AppState.setPodcastsPaperFilter(null);
        AppState.setPodcastsTopicFilter(null);
        this.load();
    },
    
    async onPaperChange() {
        const paperId = document.getElementById('podcastsPaperFilter').value || null;
        AppState.setPodcastsPaperFilter(paperId);
        AppState.setPodcastsTopicFilter(null);
        this.load();
    },
    
    async onTopicChange() {
        const topicId = document.getElementById('podcastsTopicFilter').value || null;
        AppState.setPodcastsTopicFilter(topicId);
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.podcasts.topicId) {
            UI.showToast('Please select a topic first', 'warning');
            return;
        }
        
        const formHTML = `
            <form id="createPodcastForm" class="modal-form" onsubmit="PodcastsSection.handleCreate(event)">
                ${UI.createFormRow('Podcast Name', UI.createTextInput('podcastName', '', 'e.g., Introduction to Cell Biology', true))}
                ${UI.createFormRow('URL', UI.createUrlInput('podcastUrl', '', 'https://storage.example.com/podcast.mp3'), 'Full URL to podcast file')}
                ${UI.createFormRow('Duration (seconds)', UI.createNumberInput('podcastLength', '', '600', 0), 'Optional')}
                ${UI.createFormRow('File Size (MB)', UI.createNumberInput('podcastFileSize', '', '15', 0), 'Optional')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Podcast')}
            </form>
        `;
        
        UI.openModal('Create New Podcast', formHTML);
    },
    
    openEditModal(podcastId) {
        const podcast = AppState.findPodcastById(podcastId);
        if (!podcast) return;
        
        const formHTML = `
            <form id="editPodcastForm" class="modal-form" onsubmit="PodcastsSection.handleUpdate(event, '${podcastId}')">
                ${UI.createFormRow('Podcast Name', UI.createTextInput('podcastName', podcast.name, '', true))}
                ${UI.createFormRow('URL', UI.createUrlInput('podcastUrl', podcast.url, ''))}
                ${UI.createFormRow('Duration (seconds)', UI.createNumberInput('podcastLength', podcast.length_seconds || '', '', 0))}
                ${UI.createFormRow('File Size (MB)', UI.createNumberInput('podcastFileSize', podcast.file_size ? (podcast.file_size / 1048576).toFixed(2) : '', '', 0))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('podcastStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], podcast.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Podcast')}
            </form>
        `;
        
        UI.openModal('Edit Podcast', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('podcastName').value.trim();
        const url = document.getElementById('podcastUrl').value.trim();
        const length = document.getElementById('podcastLength').value;
        const fileSize = document.getElementById('podcastFileSize').value;
        
        const lengthValue = length ? parseInt(length) : null;
        const fileSizeValue = fileSize ? Math.round(parseFloat(fileSize) * 1048576) : null;
        
        if (!name || !url) {
            UI.showToast('Name and URL are required', 'error');
            return;
        }
        
        try {
            await API.createPodcast(AppState.filters.podcasts.topicId, name, url, lengthValue, fileSizeValue);
            UI.closeModal();
            UI.showToast('Podcast created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, podcastId) {
        event.preventDefault();
        
        const name = document.getElementById('podcastName').value.trim();
        const url = document.getElementById('podcastUrl').value.trim();
        const length = document.getElementById('podcastLength').value;
        const fileSize = document.getElementById('podcastFileSize').value;
        const isActive = document.getElementById('podcastStatus').value === 'true';
        
        const lengthValue = length ? parseInt(length) : null;
        const fileSizeValue = fileSize ? Math.round(parseFloat(fileSize) * 1048576) : null;
        
        if (!name || !url) {
            UI.showToast('Name and URL are required', 'error');
            return;
        }
        
        try {
            await API.updatePodcast(podcastId, { name, url, length_seconds: lengthValue, file_size: fileSizeValue, is_active: isActive });
            UI.closeModal();
            UI.showToast('Podcast updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(podcastId) {
        const podcast = AppState.findPodcastById(podcastId);
        if (!podcast) return;
        
        // Two-stage delete pattern
        if (podcast.is_active) {
            const confirmMessage = `Deactivate "${podcast.name}"?\\n\\nThis will hide the podcast from users but keep it in the database. You can reactivate it later by editing it.`;
            
            if (!UI.confirm(confirmMessage)) {
                return;
            }
            
            try {
                await API.deletePodcast(podcastId);
                UI.showToast('Podcast deactivated successfully', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        } else {
            const warningMessage = `⚠️ WARNING: This is a PERMANENT deletion!\\n\\nDeleting "${podcast.name}" will permanently remove it from the database.\\n\\nThis action CANNOT be undone.\\n\\nAre you absolutely sure?`;
            
            if (!UI.confirm(warningMessage)) {
                return;
            }
            
            try {
                await API.deletePodcast(podcastId);
                UI.showToast('Podcast deleted permanently', 'success');
                await this.load();
            } catch (error) {
                UI.showToast(error.message, 'error');
            }
        }
    }
};
