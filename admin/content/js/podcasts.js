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
            
            // Load tiers for the selected course
            const tiersData = await API.getTiers(AppState.filters.podcasts.courseId, true);
            AppState.setTiers(tiersData.data.tiers || []);
            
            // Check if we need to show tier selection
            if (AppState.tiers.length > 0 && !AppState.filters.podcasts.tierId) {
                this.renderTierSelection();
                return;
            }
            
            // Load papers for selected course/tier if not loaded
            if (AppState.papers.length === 0 || AppState.papers[0]?.course_id !== AppState.filters.podcasts.courseId) {
                const papersData = await API.getPapers(
                    AppState.filters.podcasts.courseId,
                    AppState.filters.podcasts.tierId,
                    false
                );
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
        const courseOptions = courses.map(c => ({ value: c.id, label: UI.formatCourseLabel(c) }));
        
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
    
    renderTierSelection() {
        const tiers = AppState.tiers.filter(t => t.is_active);
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: UI.formatCourseLabel(c) 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Tier</label>
                    <select class="filter-select" id="podcastsTierFilter" onchange="PodcastsSection.onTierChange()">
                        <option value="">-- Choose a tier --</option>
                        ${tierOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
                <h3>Select a Tier</h3>
                <p>Choose a tier from the dropdown above to view podcasts.</p>
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
                <select class="filter-select" id="podcastsTierFilter" onchange="PodcastsSection.onTierChange()">
                    ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.tierId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                ${tierFilterHTML}
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
        const tiers = AppState.tiers.filter(t => t.is_active);
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: UI.formatCourseLabel(c) 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        const topicOptions = topics.map(t => ({ value: t.id, label: t.name }));
        
        const tierFilterHTML = tiers.length > 0 ? `
            <div class="filter-group" style="flex: 1;">
                <label class="filter-label">Tier</label>
                <select class="filter-select" id="podcastsTierFilter" onchange="PodcastsSection.onTierChange()">
                    ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.tierId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="podcastsCourseFilter" onchange="PodcastsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                ${tierFilterHTML}
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
            label: UI.formatCourseLabel(c) 
        }));
        
        const tiers = AppState.tiers.filter(t => t.is_active);
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const paperOptions = papers.map(p => ({ value: p.id, label: p.name }));
        const topicOptions = topics.map(t => ({ value: t.id, label: t.name }));
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Podcast',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'PodcastsSection.openCreateModal()'
        );
        
        const tierFilterHTML = tiers.length > 0 ? `
            <div class="filter-group" style="flex: 1;">
                <label class="filter-label">Tier</label>
                <select class="filter-select" id="podcastsTierFilter" onchange="PodcastsSection.onTierChange()">
                    ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.podcasts.tierId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
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
                ${tierFilterHTML}
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
        
        // Audio player HTML
        const audioPlayerHTML = podcast.url ? `
            <div class="podcast-player" style="margin-top: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                <audio id="audio-${podcast.id}" src="${UI.escapeHtml(podcast.url)}" preload="metadata" style="display: none;"></audio>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <button class="play-btn" id="playBtn-${podcast.id}" onclick="PodcastsSection.togglePlay('${podcast.id}')" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: #3678AE; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg id="playIcon-${podcast.id}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <svg id="pauseIcon-${podcast.id}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display: none;">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    </button>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.25rem;">
                        <input type="range" id="progress-${podcast.id}" class="audio-progress" value="0" min="0" max="100" style="width: 100%; cursor: pointer; accent-color: #3678AE;" onchange="PodcastsSection.seekAudio('${podcast.id}', this.value)" oninput="PodcastsSection.seekAudio('${podcast.id}', this.value)">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b;">
                            <span id="currentTime-${podcast.id}">0:00</span>
                            <span id="duration-${podcast.id}">${duration}</span>
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <div style="margin-top: 0.75rem; padding: 0.75rem; background: #fef2f2; border-radius: 8px; color: #991b1b; font-size: 0.85rem;">
                No audio URL available
            </div>
        `;
        
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
                ${audioPlayerHTML}
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
    
    // Audio player controls
    currentlyPlaying: null,
    
    togglePlay(podcastId) {
        const audio = document.getElementById(`audio-${podcastId}`);
        const playIcon = document.getElementById(`playIcon-${podcastId}`);
        const pauseIcon = document.getElementById(`pauseIcon-${podcastId}`);
        
        if (!audio) return;
        
        // Stop any currently playing audio
        if (this.currentlyPlaying && this.currentlyPlaying !== podcastId) {
            const prevAudio = document.getElementById(`audio-${this.currentlyPlaying}`);
            const prevPlayIcon = document.getElementById(`playIcon-${this.currentlyPlaying}`);
            const prevPauseIcon = document.getElementById(`pauseIcon-${this.currentlyPlaying}`);
            if (prevAudio) {
                prevAudio.pause();
                if (prevPlayIcon) prevPlayIcon.style.display = 'block';
                if (prevPauseIcon) prevPauseIcon.style.display = 'none';
            }
        }
        
        if (audio.paused) {
            audio.play().then(() => {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                this.currentlyPlaying = podcastId;
                this.startProgressUpdate(podcastId);
            }).catch(err => {
                UI.showToast('Failed to play audio: ' + err.message, 'error');
            });
        } else {
            audio.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            this.currentlyPlaying = null;
        }
    },
    
    seekAudio(podcastId, value) {
        const audio = document.getElementById(`audio-${podcastId}`);
        if (!audio || !audio.duration) return;
        
        const time = (value / 100) * audio.duration;
        audio.currentTime = time;
        this.updateTimeDisplay(podcastId, time, audio.duration);
    },
    
    startProgressUpdate(podcastId) {
        const audio = document.getElementById(`audio-${podcastId}`);
        if (!audio) return;
        
        const updateProgress = () => {
            if (audio.paused) return;
            
            const progress = document.getElementById(`progress-${podcastId}`);
            const currentTimeEl = document.getElementById(`currentTime-${podcastId}`);
            
            if (progress && audio.duration) {
                progress.value = (audio.currentTime / audio.duration) * 100;
            }
            
            if (currentTimeEl) {
                this.updateTimeDisplay(podcastId, audio.currentTime, audio.duration);
            }
            
            if (!audio.paused) {
                requestAnimationFrame(updateProgress);
            }
        };
        
        // Setup ended event
        audio.onended = () => {
            const playIcon = document.getElementById(`playIcon-${podcastId}`);
            const pauseIcon = document.getElementById(`pauseIcon-${podcastId}`);
            const progress = document.getElementById(`progress-${podcastId}`);
            
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (progress) progress.value = 0;
            this.updateTimeDisplay(podcastId, 0, audio.duration);
            this.currentlyPlaying = null;
        };
        
        requestAnimationFrame(updateProgress);
    },
    
    updateTimeDisplay(podcastId, currentTime, duration) {
        const currentTimeEl = document.getElementById(`currentTime-${podcastId}`);
        const durationEl = document.getElementById(`duration-${podcastId}`);
        
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(currentTime);
        }
        if (durationEl && duration) {
            durationEl.textContent = formatTime(duration);
        }
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
        AppState.setPodcastsTierFilter(null);
        AppState.setPodcastsPaperFilter(null);
        AppState.setPodcastsTopicFilter(null);
        this.load();
    },
    
    async onTierChange() {
        const tierId = document.getElementById('podcastsTierFilter').value || null;
        AppState.setPodcastsTierFilter(tierId);
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
                ${UI.createFormRow('Audio File', UI.createFileOrUrlInput('podcastFile', '', 'audio/*', 'https://storage.example.com/podcast.mp3'), 'Upload audio or enter URL')}
                ${UI.createFormRow('Duration (seconds)', UI.createNumberInput('podcastLength', '', '600', 0), 'Optional - leave blank to auto-detect from file')}
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
                ${UI.createFormRow('Audio File', UI.createFileOrUrlInput('podcastFile', podcast.url || '', 'audio/*', 'https://storage.example.com/podcast.mp3'), 'Upload audio or enter URL')}
                ${UI.createFormRow('Duration (seconds)', UI.createNumberInput('podcastLength', podcast.length_seconds || '', '', 0), 'Optional')}
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
        const length = document.getElementById('podcastLength').value;
        
        let lengthValue = length ? parseInt(length) : null;
        
        if (!name) {
            UI.showToast('Podcast name is required', 'error');
            return;
        }
        
        try {
            // Get uploaded file info if file mode, otherwise URL
            const fileInput = document.getElementById('podcastFileFile');
            const mode = document.getElementById('podcastFileMode').value;
            let url, fileSizeValue = null;
            
            if (mode === 'file' && fileInput.files && fileInput.files.length > 0) {
                // Auto-detect file size from uploaded file
                fileSizeValue = fileInput.files[0].size;
                
                // Auto-detect duration from audio file if not manually entered
                if (!lengthValue) {
                    try {
                        lengthValue = await this.getAudioDuration(fileInput.files[0]);
                    } catch (error) {
                        console.warn('Could not determine audio duration:', error);
                    }
                }
            }
            
            url = await UI.getFileOrUrlValue('podcastFile');
            
            if (!url) {
                UI.showToast('Please provide an audio file or URL', 'error');
                return;
            }
            
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
        const length = document.getElementById('podcastLength').value;
        const isActive = document.getElementById('podcastStatus').value === 'true';
        
        let lengthValue = length ? parseInt(length) : null;
        
        if (!name) {
            UI.showToast('Podcast name is required', 'error');
            return;
        }
        
        try {
            // Get uploaded file info if file mode, otherwise URL
            const fileInput = document.getElementById('podcastFileFile');
            const mode = document.getElementById('podcastFileMode').value;
            let url, fileSizeValue = null;
            
            if (mode === 'file' && fileInput.files && fileInput.files.length > 0) {
                // Auto-detect file size from uploaded file
                fileSizeValue = fileInput.files[0].size;
                
                // Auto-detect duration from audio file if not manually entered
                if (!lengthValue) {
                    try {
                        lengthValue = await this.getAudioDuration(fileInput.files[0]);
                    } catch (error) {
                        console.warn('Could not determine audio duration:', error);
                    }
                }
            }
            
            url = await UI.getFileOrUrlValue('podcastFile');
            
            if (!url) {
                UI.showToast('Please provide an audio file or URL', 'error');
                return;
            }
            
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
    },
    
    // Helper method to get audio duration from file
    async getAudioDuration(file) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const objectUrl = URL.createObjectURL(file);
            
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(objectUrl);
                if (audio.duration === Infinity || isNaN(audio.duration)) {
                    reject(new Error('Could not determine duration'));
                } else {
                    resolve(Math.round(audio.duration));
                }
            });
            
            audio.addEventListener('error', () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not load audio file'));
            });
            
            audio.src = objectUrl;
        });
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
