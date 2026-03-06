// Generate section management - AI-powered content generation

const GenerateSection = {
    pollInterval: null,
    pollIntervalMs: 5000, // Poll every 5 seconds
    currentView: 'tasks', // 'tasks', 'prompts', 'models', or 'localTts'
    modelSearchQuery: '', // Search query for models
    
    // Local TTS state
    localTtsVoices: [],
    localTtsLanguages: [],
    localTtsApiUrl: 'http://127.0.0.1:8880',
    localTtsHealthy: false,
    
    async load() {
        if (this.currentView === 'tasks') {
            UI.showLoading('Loading generation tasks...');
            try {
                await this.loadTasks();
                this.render();
                this.startPolling();
            } catch (error) {
                console.error('Load error:', error);
                UI.showToast('Failed to load generation tasks', 'error');
            }
        } else if (this.currentView === 'prompts') {
            UI.showLoading('Loading AI prompts...');
            try {
                await this.loadPrompts();
                await this.loadModels(); // Load models for dropdown
                this.renderPrompts();
            } catch (error) {
                console.error('Load error:', error);
                UI.showToast('Failed to load AI prompts', 'error');
            }
        } else if (this.currentView === 'models') {
            UI.showLoading('Loading AI models...');
            try {
                await this.loadModels();
                this.renderModels();
            } catch (error) {
                console.error('Load error:', error);
                UI.showToast('Failed to load AI models', 'error');
            }
        } else if (this.currentView === 'localTts') {
            UI.showLoading('Checking local TTS server...');
            try {
                await this.loadLocalTts();
            } catch (error) {
                console.error('Load error:', error);
                this.renderLocalTtsOffline();
            }
        }
    },
    
    async loadPrompts() {
        const data = await API.getGeneratePrompts();
        AppState.setGeneratePrompts(data.prompts);
    },
    
    async loadModels() {
        const data = await API.getModels();
        AppState.setModels(data.models);
    },
    
    switchView(view) {
        this.currentView = view;
        if (view === 'tasks') {
            this.stopPolling();
        }
        // Clear search when leaving models view
        if (view !== 'models') {
            this.modelSearchQuery = '';
        }
        this.load();
    },
    
    async loadTasks() {
        const data = await API.listGenerateTasks();
        AppState.setGenerateTasks(data.tasks);
    },
    
    startPolling() {
        // Clear existing interval
        this.stopPolling();
        
        // Check if there are any active tasks
        const activeTasks = AppState.generateTasks.filter(task => 
            ['info_generating', 'content_generating', 'generating_papers', 
             'generating_notes', 'generating_questions'].some(status => 
                task.status.startsWith(status)
            )
        );
        
        if (activeTasks.length > 0) {
            this.pollInterval = setInterval(() => this.pollActiveTasks(), this.pollIntervalMs);
        }
    },
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    },
    
    async pollActiveTasks() {
        // Safety check: stop polling if we are no longer in the generate section
        if (AppState.activeSection !== 'generate') {
            this.stopPolling();
            return;
        }

        const activeTasks = AppState.generateTasks.filter(task => 
            ['info_generating', 'content_generating', 'generating_papers', 
             'generating_notes', 'generating_questions'].some(status => 
                task.status.startsWith(status)
            )
        );
        
        if (activeTasks.length === 0) {
            this.stopPolling();
            return;
        }
        
        try {
            // Poll each active task
            for (const task of activeTasks) {
                const statusData = await API.getGenerateStatus(task.task_id);
                
                // Update task in state
                const taskIndex = AppState.generateTasks.findIndex(t => t.task_id === task.task_id);
                if (taskIndex !== -1) {
                    AppState.generateTasks[taskIndex] = {
                        ...AppState.generateTasks[taskIndex],
                        ...statusData
                    };
                }
            }
            
            // Re-render to show updates
            // Only render if we are still in the generate section (double check)
            if (AppState.activeSection === 'generate') {
                this.render();
            }
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    },
    
    render() {
        const tasks = AppState.generateTasks;
        
        const viewTabsHTML = `
            <div class="content-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="action-btn ${this.currentView === 'tasks' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('tasks')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        Generation Tasks
                    </button>
                    <button class="action-btn ${this.currentView === 'prompts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('prompts')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        AI Prompts
                    </button>
                    <button class="action-btn ${this.currentView === 'models' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('models')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9.66-9H16m-8 0H1.34M17.66 17.66l-4.24-4.24m-2.83 0l-4.24 4.24M17.66 6.34l-4.24 4.24m-2.83 0l-4.24-4.24"></path></svg>
                        AI Models
                    </button>
                    <button class="action-btn ${this.currentView === 'localTts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('localTts')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        Local TTS
                    </button>
                </div>
            </div>
        `;
        
        const createBtnHTML = UI.renderActionBtn(
            'Create New Generation',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
            'GenerateSection.openCreateModal()'
        );
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Status</label>
                    <select class="filter-select" id="generateStatusFilter" onchange="GenerateSection.onStatusFilterChange()">
                        <option value="">All Tasks</option>
                        <option value="info_complete">Ready to Generate</option>
                        <option value="content_generating">Generating</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Sort By</label>
                    <select class="filter-select" id="generateSortFilter" onchange="GenerateSection.onSortChange()">
                        <option value="created_at_desc">Newest First</option>
                        <option value="created_at_asc">Oldest First</option>
                        <option value="status">By Status</option>
                        <option value="course_title">By Course Title</option>
                    </select>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (tasks.length === 0) {
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <h3>No Generation Tasks</h3>
                    <p>Create your first AI-powered course generation task by uploading a specification PDF.</p>
                </div>
            `;
        } else {
            const cardsHTML = tasks.map(task => this.renderTaskCard(task)).join('');
            contentHTML = `<div class="content-grid">${cardsHTML}</div>`;
        }
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + filtersHTML + contentHTML;
    },
    
    renderTaskCard(task) {
        const statusInfo = this.getStatusInfo(task.status);
        const progressHTML = this.renderProgress(task);
        
        const createdDate = new Date(task.created_at).toLocaleString();
        const duration = task.duration_seconds 
            ? this.formatDuration(task.duration_seconds)
            : 'In progress...';
        
        let actionsHTML = '';
        
        if (task.status === 'info_complete') {
            actionsHTML = `
                <button class="card-action-btn" onclick="GenerateSection.openStartGenerationModal('${task.task_id}')" title="Start Content Generation">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Start Generation
                </button>
                <button class="card-action-btn destructive" onclick="GenerateSection.handleDeleteTask('${task.task_id}', false)" title="Delete Task">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                </button>
            `;
        } else if (['content_generating', 'generating_papers', 'generating_notes', 'generating_questions'].some(s => task.status === s || task.status.includes(s))) {
            actionsHTML = `
                <button class="card-action-btn" onclick="GenerateSection.viewTaskDetails('${task.task_id}')" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Details
                </button>
                <button class="card-action-btn destructive" onclick="GenerateSection.handleCancel('${task.task_id}')" title="Cancel Generation">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Cancel
                </button>
            `;
        } else if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
            actionsHTML = `
                <button class="card-action-btn" onclick="GenerateSection.viewTaskDetails('${task.task_id}')" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Details
                </button>
                <button class="card-action-btn destructive" onclick="GenerateSection.handleDeleteTask('${task.task_id}', ${task.course_id ? 'true' : 'false'})" title="Delete Task${task.course_id ? ' & Content' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                </button>
            `;
        } else {
            actionsHTML = `
                <button class="card-action-btn" onclick="GenerateSection.viewTaskDetails('${task.task_id}')" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Details
                </button>
            `;
        }
        
        return `
            <div class="content-card generate-task-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${UI.escapeHtml(task.course_title || 'Extracting info...')}</h3>
                        <span class="card-badge badge-${statusInfo.class}">${statusInfo.label}</span>
                    </div>
                </div>
                <div class="card-meta">
                    ${task.subject_name ? `
                        <div class="meta-row">
                            <span class="meta-label">Subject:</span>
                            <span class="meta-value">${UI.escapeHtml(task.subject_name)}</span>
                        </div>
                    ` : ''}
                    <div class="meta-row">
                        <span class="meta-label">Specification:</span>
                        <span class="meta-value">${UI.escapeHtml(task.specification_filename || 'N/A')}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${createdDate}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Duration:</span>
                        <span class="meta-value">${duration}</span>
                    </div>
                    ${task.progress && task.progress.total_topics ? `
                        <div class="meta-row">
                            <span class="meta-label">Progress:</span>
                            <span class="meta-value">
                                ${task.progress.completed_notes || 0} notes, 
                                ${task.progress.completed_questions || 0} questions
                                ${task.progress.completed_podcast_scripts !== undefined && task.progress.completed_podcast_scripts !== null ? `, ${task.progress.completed_podcast_scripts} scripts` : ''}
                                ${task.progress.completed_podcast_audio !== undefined && task.progress.completed_podcast_audio !== null ? `, ${task.progress.completed_podcast_audio} audio` : ''}
                            </span>
                        </div>
                    ` : ''}
                    ${task.metrics && task.metrics.estimated_cost ? `
                        <div class="meta-row">
                            <span class="meta-label">Estimated Cost:</span>
                            <span class="meta-value">$${task.metrics.estimated_cost.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
                ${progressHTML}
                ${task.error ? `
                    <div class="task-error">
                        <strong>Error:</strong> ${UI.escapeHtml(task.error)}
                    </div>
                ` : ''}
                <div class="card-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
    },
    
    renderProgress(task) {
        if (!task.progress) return '';
        
        const progress = task.progress;
        const percentage = progress.percentage || 0;
        
        // Debug logging
        console.log('Rendering progress for task:', task.task_id, {
            completed_notes: progress.completed_notes,
            completed_questions: progress.completed_questions,
            completed_podcast_scripts: progress.completed_podcast_scripts,
            completed_podcast_audio: progress.completed_podcast_audio,
            total_topics: progress.total_topics
        });
        
        return `
            <div class="task-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-stats">
                    <span>${percentage.toFixed(1)}% complete</span>
                    ${progress.current_task ? `<span class="progress-current">${UI.escapeHtml(progress.current_task)}</span>` : ''}
                </div>
                ${progress.completed_notes !== undefined ? `
                    <div class="progress-details">
                        <span>Notes: ${progress.completed_notes}/${progress.total_topics}</span>
                        <span>Questions: ${progress.completed_questions}/${progress.total_topics}</span>
                        ${progress.completed_podcast_scripts !== undefined && progress.completed_podcast_scripts !== null ? `<span>Scripts: ${progress.completed_podcast_scripts}/${progress.total_topics}</span>` : ''}
                        ${progress.completed_podcast_audio !== undefined && progress.completed_podcast_audio !== null ? `<span>Audio: ${progress.completed_podcast_audio}/${progress.total_topics}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    getStatusInfo(status) {
        const statusMap = {
            'pending': { label: 'Pending', class: 'inactive' },
            'info_generating': { label: 'Extracting Info', class: 'active' },
            'info_complete': { label: 'Ready to Generate', class: 'active' },
            'content_generating': { label: 'Generating', class: 'active' },
            'generating_papers': { label: 'Creating Structure', class: 'active' },
            'completed': { label: 'Completed', class: 'active' },
            'failed': { label: 'Failed', class: 'inactive' },
            'cancelled': { label: 'Cancelled', class: 'inactive' }
        };
        
        // Handle dynamic statuses like "generating_notes_uuid"
        if (status && status.startsWith('generating_notes')) {
            return { label: 'Generating Notes', class: 'active' };
        }
        if (status && status.startsWith('generating_podcast_scripts')) {
            return { label: 'Generating Podcast Scripts', class: 'active' };
        }
        if (status && status.startsWith('generating_podcast_audio')) {
            return { label: 'Generating Podcast Audio', class: 'active' };
        }
        if (status && status.startsWith('generating_questions')) {
            return { label: 'Generating Questions', class: 'active' };
        }
        
        return statusMap[status] || { label: status, class: 'inactive' };
    },
    
    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    },
    
    onStatusFilterChange() {
        // Reload with filter
        this.loadTasks();
    },
    
    onSortChange() {
        // Reload with sort
        this.loadTasks();
    },
    
    openCreateModal() {
        const formHTML = `
            <form id="generateCreateForm" onsubmit="GenerateSection.handleUploadSpec(event); return false;">
                <h2>Create New Generation Task</h2>
                <p class="form-description">Upload a course specification PDF or provide a URL to extract course information and generate content using AI.</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <label class="filter-label" style="margin-bottom: 0.5rem; display: block;">Specification PDF</label>
                    ${UI.createFileOrUrlInput('specInput', '', 'application/pdf', 'https://example.com/specification.pdf')}
                </div>
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("generateCreateForm").requestSubmit()',
                    'Extract Info',
                    false
                )}
            </form>
        `;
        
        UI.openModal('Create Generation Task', formHTML);
    },
    
    async handleUploadSpec(event) {
        event.preventDefault();
        
        try {
            // Get specification URL (either from file upload or direct URL input)
            const specificationUrl = await UI.getFileOrUrlValue('specInput');
            
            if (!specificationUrl) {
                UI.showToast('Please provide a specification file or URL', 'error');
                return;
            }
            
            // Show loading state in modal (don't close it)
            this.showModalLoading('Extracting course information with AI...');
            
            // Extract course info using the specification URL
            const infoData = await API.generateInfo(specificationUrl);
            
            // Reload tasks in background
            await this.loadTasks();
            
            // Show the editable form in the same modal with the extracted info
            this.openStartGenerationModal(infoData.data.task_id, infoData.data);
            
        } catch (error) {
            console.error('Generate info error details:', error);
            // Format error message for better readability
            const errorMessage = error.message.replace(/\n\n/g, '\n').replace(/Details: /, '\n');
            UI.showToast(errorMessage, 'error', 8000); // Show for 8 seconds due to longer message
            UI.closeModal();
        }
    },
    
    showModalLoading(message) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <div class="content-loading" style="padding: 3rem 1rem;">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    },
    
    renderTiersInputs(tiers) {
        if (!tiers || tiers.length === 0) return '';
        
        return tiers.map((tier, index) => `
            <div class="tier-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <input type="text" name="tierTitle_${index}" class="filter-select" value="${UI.escapeHtml(tier.title)}" placeholder="Tier Title" style="flex: 2;" required>
                <input type="text" name="tierCode_${index}" class="filter-select" value="${UI.escapeHtml(tier.code || '')}" placeholder="Code" style="flex: 1;">
                <button type="button" class="action-btn destructive" onclick="this.parentElement.remove()" style="padding: 0.5rem;">&times;</button>
            </div>
        `).join('');
    },

    addTierRow() {
        const container = document.getElementById('tiersContainer');
        if (!container) return;
        
        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'tier-row';
        div.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
        div.innerHTML = `
            <input type="text" name="tierTitle_${index}" class="filter-select" value="" placeholder="Tier Title" style="flex: 2;" required>
            <input type="text" name="tierCode_${index}" class="filter-select" value="" placeholder="Code" style="flex: 1;">
            <button type="button" class="action-btn destructive" onclick="this.parentElement.remove()" style="padding: 0.5rem;">&times;</button>
        `;
        container.appendChild(div);
    },
    
    toggleTtsSettings() {
        const checkbox = document.getElementById('genPodcastAudioOption');
        const container = document.getElementById('ttsSettingsContainer');
        if (checkbox && container) {
            container.style.display = checkbox.checked ? 'block' : 'none';
        }
    },

    async openStartGenerationModal(taskId, taskData = null) {
        try {
            // Use provided taskData or fetch it
            if (!taskData) {
                taskData = await API.getGenerateStatus(taskId);
            }
            console.log('Task data for form:', taskData);
            const courseInfo = taskData.course_info || {};
            console.log('Course info for form:', courseInfo);
            
            // Load available TTS voices
            let voicesData = null;
            try {
                voicesData = await API.getGenerateVoices();
                console.log('Loaded TTS voices:', voicesData);
                // Validate voice data structure
                if (voicesData && voicesData.voices && voicesData.voices.length > 0) {
                    console.log(`Found ${voicesData.voices.length} voices:`, voicesData.voices.map(v => `${v.voice_id || v.id} (${v.display_name || v.name})`));
                } else {
                    console.warn('No voices returned from API');
                    voicesData = null;
                }
            } catch (error) {
                console.error('Could not load TTS voices:', error);
                voicesData = null;
            }
            
            // Get years and subjects for dropdowns
            const yearsData = await API.getYears(false); // only active
            const subjectsData = await API.getSubjects(false);
            
            const years = yearsData.data?.years || yearsData.years || [];
            const subjects = subjectsData.data?.subjects || subjectsData.subjects || [];
            
            const yearOptions = years.map(y => ({ 
                value: y.id, 
                label: y.name,
                selected: y.id === courseInfo.year_id
            }));
            
            const subjectOptions = [
                { value: '', label: '-- Create New Subject --', selected: !courseInfo.subject_id },
                ...subjects.map(s => ({ 
                    value: s.id, 
                    label: `${s.name}${s.code ? ` (${s.code})` : ''}`,
                    selected: s.id === courseInfo.subject_id
                }))
            ];
            
            const formHTML = `
                <form id="generateStartForm" onsubmit="GenerateSection.handleStartGeneration(event, '${taskId}'); return false;">
                    <h2>Review & Start Generation</h2>
                    <p class="form-description">Review the extracted course information and make any edits before starting AI content generation.</p>
                    
                    ${UI.createFormRow(
                        'Course Title',
                        UI.createTextInput('courseTitle', courseInfo.course_title || '', 'Enter course title', true)
                    )}
                    
                    ${UI.createFormRow(
                        'Year Level',
                        UI.createSelect('yearId', yearOptions, courseInfo.year_id || '', true)
                    )}
                    
                    ${UI.createFormRow(
                        'Subject',
                        UI.createSelect('subjectId', subjectOptions, courseInfo.subject_id || '', false) +
                        `<div id="newSubjectFields" style="display: ${courseInfo.subject_id ? 'none' : 'block'}; margin-top: 0.5rem;">
                            ${UI.createTextInput('subjectName', courseInfo.subject_name || '', 'Subject name', false)}
                            ${UI.createTextInput('subjectCode', courseInfo.subject_code || '', 'Subject code (optional)', false)}
                        </div>
                        <script>
                            document.getElementById('subjectId').addEventListener('change', function() {
                                document.getElementById('newSubjectFields').style.display = 
                                    this.value === '' ? 'block' : 'none';
                            });
                        </script>`
                    )}
                    
                    <div class="form-row">
                        <label class="filter-label">Tiers</label>
                        <div id="tiersContainer">
                            ${this.renderTiersInputs(courseInfo.tiers || [])}
                        </div>
                        <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.addTierRow()" style="margin-top: 0.5rem; font-size: 0.8rem; padding: 0.25rem 0.5rem;">+ Add Tier</button>
                        <p class="form-help">Define the tiers for this course (e.g., Foundation, Higher).</p>
                    </div>

                    ${UI.createFormRow(
                        'Description',
                        UI.createTextarea('description', courseInfo.description || '', 'Course description', 6)
                    )}
                    
                    ${UI.createFormRow(
                        'Specification URL',
                        UI.createUrlInput('linkToSpec', taskData.specification?.url || '', 'Optional: override specification URL'),
                        'Leave blank to use uploaded PDF'
                    )}
                    
                    <div class="form-row">
                        <label class="filter-label">Generation Options</label>
                        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                            <label class="option-checkbox">
                                <input type="checkbox" name="generatePodcasts" id="genPodcastsOption" checked>
                                <span>Generate Podcast Scripts</span>
                            </label>
                            ${voicesData ? `
                                <label class="option-checkbox">
                                    <input type="checkbox" name="generatePodcastAudio" id="genPodcastAudioOption" onchange="GenerateSection.toggleTtsSettings()">
                                    <span>Generate Podcast Audio (Inworld TTS)</span>
                                </label>
                            ` : ''}
                        </div>
                        <p class="form-help">Podcast scripts can be generated first, then converted to audio using TTS.</p>
                    </div>
                    
                    ${voicesData ? `
                        <div id="ttsSettingsContainer" style="display: none; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 1rem;">
                            <h4 style="margin-bottom: 1rem; font-size: 0.95rem; color: var(--color-text-primary);">TTS Voice Settings</h4>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label class="filter-label">Speaker 1 Voice</label>
                                    <select class="filter-select" id="speaker1Voice">
                                        ${voicesData.voices.map(v => {
                                            const voiceId = v.voice_id || v.id;
                                            const displayName = v.display_name || v.name || 'Unknown';
                                            const isDefault = voiceId === 'Clive';
                                            return `<option value="${voiceId}" ${isDefault ? 'selected' : ''} title="${v.description || ''}">${displayName}</option>`;
                                        }).join('')}
                                    </select>
                                    <p class="form-help" style="font-size: 0.8rem; margin-top: 0.25rem; color: var(--color-grey-text);">Hover over options to see voice descriptions</p>
                                </div>
                                <div>
                                    <label class="filter-label">Speaker 2 Voice</label>
                                    <select class="filter-select" id="speaker2Voice">
                                        ${voicesData.voices.map(v => {
                                            const voiceId = v.voice_id || v.id;
                                            const displayName = v.display_name || v.name || 'Unknown';
                                            const isDefault = voiceId === 'Wendy';
                                            return `<option value="${voiceId}" ${isDefault ? 'selected' : ''} title="${v.description || ''}">${displayName}</option>`;
                                        }).join('')}
                                    </select>
                                    <p class="form-help" style="font-size: 0.8rem; margin-top: 0.25rem; color: var(--color-grey-text);">Hover over options to see voice descriptions</p>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label class="filter-label">Speaker 1 Speed: <span id="speaker1SpeedValue">1.0</span>x</label>
                                    <input type="range" class="form-range" id="speaker1Speed" value="1.0" min="0.5" max="2.0" step="0.1" oninput="document.getElementById('speaker1SpeedValue').textContent = this.value">
                                </div>
                                <div>
                                    <label class="filter-label">Speaker 2 Speed: <span id="speaker2SpeedValue">1.0</span>x</label>
                                    <input type="range" class="form-range" id="speaker2Speed" value="1.0" min="0.5" max="2.0" step="0.1" oninput="document.getElementById('speaker2SpeedValue').textContent = this.value">
                                </div>
                                <div>
                                    <label class="filter-label">Pause Between Turns: <span id="pauseBetweenTurnsValue">0.3</span>s</label>
                                    <input type="range" class="form-range" id="pauseBetweenTurns" value="0.3" min="0.0" max="5.0" step="0.1" oninput="document.getElementById('pauseBetweenTurnsValue').textContent = this.value">
                                </div>
                            </div>
                            
                            ${voicesData.recommended_pairs && voicesData.recommended_pairs.length > 0 ? `
                                <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border-left: 3px solid rgb(59, 130, 246);">
                                    <strong style="font-size: 0.85rem; color: rgb(59, 130, 246);">💡 Recommended Voice Pairs:</strong>
                                    <div style="font-size: 0.85rem; margin-top: 0.25rem; color: var(--color-grey-text);">
                                        ${voicesData.recommended_pairs.map(pair => `${pair.speaker1} + ${pair.speaker2}`).join(', ')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 1rem;">
                        <strong>What happens next:</strong>
                        <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.8;">
                            <li>Course will be created in the database</li>
                            <li>AI will generate papers & topics structure</li>
                            <li>AI will generate notes for each topic</li>
                            <li>AI will generate practice questions</li>
                            ${voicesData && document.getElementById('genPodcastAudioOption')?.checked ? `
                                <li>AI will generate podcast scripts</li>
                                <li>TTS will convert scripts to audio files</li>
                            ` : `<li>AI will generate podcast scripts (if enabled)</li>`}
                            <li>Generation runs in the background (~5-20 minutes)</li>
                            <li>You can monitor progress in real-time</li>
                        </ul>
                    </div>
                    
                    ${UI.createModalActions(
                        'UI.closeModal()',
                        'document.getElementById("generateStartForm").requestSubmit()',
                        'Start Content Generation',
                        false
                    )}
                </form>
            `;
            
            // Update modal content instead of opening new modal
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.innerHTML = formHTML;
            } else {
                UI.openModal('Review & Start Generation', formHTML);
            }
            
        } catch (error) {
            console.error('Error opening start modal:', error);
            UI.showToast('Failed to load task details', 'error');
        }
    },
    
    async handleStartGeneration(event, taskId) {
        event.preventDefault();
        
        const form = event.target;
        const courseTitle = form.courseTitle.value.trim();
        const yearId = form.yearId.value;
        const subjectId = form.subjectId.value;
        const description = form.description.value.trim();
        const linkToSpec = form.linkToSpec.value.trim();
        
        // Validate
        if (!courseTitle || !yearId || !description) {
            UI.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Collect tiers
        const tiers = [];
        const tierContainer = document.getElementById('tiersContainer');
        if (tierContainer) {
            const rows = tierContainer.querySelectorAll('.tier-row');
            rows.forEach((row, index) => {
                const titleInput = row.querySelector(`input[name^="tierTitle"]`);
                const codeInput = row.querySelector(`input[name^="tierCode"]`);
                
                if (titleInput && titleInput.value.trim()) {
                    tiers.push({
                        title: titleInput.value.trim(),
                        code: codeInput ? codeInput.value.trim() : null,
                        sort_order: index
                    });
                }
            });
        }
        
        if (tiers.length === 0) {
             UI.showToast('At least one tier is required', 'error');
             return;
        }
        
        // If creating new subject, get name
        let subjectName = null;
        let subjectCode = null;
        if (!subjectId) {
            subjectName = form.subjectName.value.trim();
            if (!subjectName) {
                UI.showToast('Please enter subject name or select existing subject', 'error');
                return;
            }
            subjectCode = form.subjectCode.value.trim() || null;
        }
        
        // Get generate_podcasts option BEFORE closing the modal (DOM elements get removed)
        const generatePodcasts = document.getElementById('genPodcastsOption')?.checked ?? true;
        
        // Get TTS audio generation options BEFORE closing modal
        const generatePodcastAudio = document.getElementById('genPodcastAudioOption')?.checked ?? false;
        const ttsParams = {};
        
        if (generatePodcastAudio) {
            ttsParams.generate_podcast_audio = true;
            ttsParams.speaker1_voice_id = document.getElementById('speaker1Voice')?.value;
            ttsParams.speaker2_voice_id = document.getElementById('speaker2Voice')?.value;
            ttsParams.speaker1_speed = parseFloat(document.getElementById('speaker1Speed')?.value || '1.0');
            ttsParams.speaker2_speed = parseFloat(document.getElementById('speaker2Speed')?.value || '1.0');
            ttsParams.pause_between_turns = parseFloat(document.getElementById('pauseBetweenTurns')?.value || '0.3');
        }
        
        try {
            UI.closeModal();
            UI.showLoading('Starting content generation...');
            
            const data = await API.generateContent(taskId, {
                course_title: courseTitle,
                year_id: yearId,
                subject_id: subjectId || null,
                subject_name: subjectName,
                subject_code: subjectCode,
                description: description,
                link_to_specification: linkToSpec || null,
                tiers: tiers,
                generate_podcasts: generatePodcasts,
                ...ttsParams
            });
            
            UI.showToast('Content generation started successfully', 'success');
            
            // Reload tasks and start polling
            await this.loadTasks();
            this.render();
            this.startPolling();
            
        } catch (error) {
            console.error('Start generation error:', error);
            UI.showToast('Failed to start generation', 'error');
        }
    },
    
    async viewTaskDetails(taskId) {
        try {
            const taskData = await API.getGenerateStatus(taskId);
            
            const statusInfo = this.getStatusInfo(taskData.status);
            const createdDate = new Date(taskData.timestamps.created_at).toLocaleString();
            const progressHTML = this.renderProgress(taskData);
            
            let timestampsHTML = '';
            if (taskData.timestamps) {
                const ts = taskData.timestamps;
                timestampsHTML = `
                    <div class="meta-row">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${new Date(ts.created_at).toLocaleString()}</span>
                    </div>
                    ${ts.started_at ? `
                        <div class="meta-row">
                            <span class="meta-label">Started:</span>
                            <span class="meta-value">${new Date(ts.started_at).toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${ts.info_completed_at ? `
                        <div class="meta-row">
                            <span class="meta-label">Info Extracted:</span>
                            <span class="meta-value">${new Date(ts.info_completed_at).toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${ts.content_started_at ? `
                        <div class="meta-row">
                            <span class="meta-label">Generation Started:</span>
                            <span class="meta-value">${new Date(ts.content_started_at).toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${ts.completed_at ? `
                        <div class="meta-row">
                            <span class="meta-label">Completed:</span>
                            <span class="meta-value">${new Date(ts.completed_at).toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${ts.estimated_completion ? `
                        <div class="meta-row">
                            <span class="meta-label">Estimated Completion:</span>
                            <span class="meta-value">${new Date(ts.estimated_completion).toLocaleString()}</span>
                        </div>
                    ` : ''}
                `;
            }
            
            // Extract configuration details
            const courseInfo = taskData.course_info || {};
            const tiersCount = courseInfo.tiers ? courseInfo.tiers.length : (taskData.tiers_count || 0);
            const genPodcasts = courseInfo.generate_podcasts !== false; // Default true
            const genAudio = courseInfo.generate_podcast_audio === true;
            
            const configHTML = `
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <strong>Configuration</strong>
                    <div class="card-meta" style="margin-top: 0.5rem;">
                        <div class="meta-row">
                            <span class="meta-label">Description:</span>
                            <span class="meta-value" style="white-space: pre-wrap;">${UI.escapeHtml(courseInfo.description || 'N/A')}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Tiers:</span>
                            <span class="meta-value">${tiersCount} tiers defined</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Podcast Scripts:</span>
                            <span class="meta-value">${genPodcasts ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Podcast Audio:</span>
                            <span class="meta-value">${genAudio ? 'Enabled (Inworld TTS)' : 'Disabled'}</span>
                        </div>
                        ${genAudio ? `
                            <div class="meta-row">
                                <span class="meta-label">Voices:</span>
                                <span class="meta-value">
                                    ${courseInfo.speaker1_voice_id || 'Default'} & ${courseInfo.speaker2_voice_id || 'Default'}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            const detailsHTML = `
                <div class="task-details-modal">
                    <h2>${UI.escapeHtml(taskData.course_title || 'Generation Task')}</h2>
                    <span class="card-badge badge-${statusInfo.class}" style="margin-bottom: 1rem; display: inline-block;">${statusInfo.label}</span>
                    
                    <div class="card-meta">
                        ${taskData.subject_name ? `
                            <div class="meta-row">
                                <span class="meta-label">Subject:</span>
                                <span class="meta-value">${UI.escapeHtml(taskData.subject_name)}</span>
                            </div>
                        ` : ''}
                        <div class="meta-row">
                            <span class="meta-label">Created By:</span>
                            <span class="meta-value">${UI.escapeHtml(taskData.created_by)}</span>
                        </div>
                        ${taskData.specification ? `
                            <div class="meta-row">
                                <span class="meta-label">Specification:</span>
                                <span class="meta-value">
                                    <a href="${taskData.specification.url}" target="_blank">${UI.escapeHtml(taskData.specification.filename)}</a>
                                </span>
                            </div>
                        ` : ''}
                        ${timestampsHTML}
                    </div>
                    
                    ${progressHTML}
                    
                    ${configHTML}
                    
                    ${taskData.metrics ? `
                        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                            <strong>Metrics</strong>
                            <div class="card-meta" style="margin-top: 0.5rem;">
                                <div class="meta-row">
                                    <span class="meta-label">API Calls:</span>
                                    <span class="meta-value">${taskData.metrics.total_api_calls || 0}</span>
                                </div>
                                ${taskData.metrics.total_tokens_used ? `
                                    <div class="meta-row">
                                        <span class="meta-label">Tokens Used:</span>
                                        <span class="meta-value">${taskData.metrics.total_tokens_used.toLocaleString()}</span>
                                    </div>
                                ` : ''}
                                <div class="meta-row">
                                    <span class="meta-label">Estimated Cost:</span>
                                    <span class="meta-value">$${(taskData.metrics.estimated_cost || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${taskData.error ? `
                        <div class="task-error" style="margin-top: 1rem;">
                            <strong>Error:</strong> ${UI.escapeHtml(taskData.error)}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end;">
                        ${taskData.course_id && (taskData.status === 'completed' || taskData.status === 'failed') ? `
                            <button class="action-btn" onclick="GenerateSection.openIndividualGenerateModal('${taskData.course_id}', '${UI.escapeHtml(taskData.course_title || 'Course')}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                Generate for Topics
                            </button>
                        ` : ''}
                        <button class="action-btn action-btn-secondary" onclick="UI.closeModal()">Close</button>
                    </div>
                </div>
            `;
            
            UI.openModal('Task Details', detailsHTML);
            
        } catch (error) {
            console.error('Error loading task details:', error);
            UI.showToast('Failed to load task details', 'error');
        }
    },
    
    // Individual Topic Generation
    async openIndividualGenerateModal(courseId, courseTitle) {
        UI.closeModal();
        
        // Show loading modal
        UI.openModal('Generate for Topics', `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: #64748B;">Loading topics for ${UI.escapeHtml(courseTitle)}...</p>
            </div>
        `);
        
        try {
            // Load tiers for this course
            const tiersData = await API.getTiers(courseId, false);
            const tiers = tiersData.data?.tiers || [];
            
            // Load voices
            let voicesData = null;
            try {
                voicesData = await API.getGenerateVoices();
            } catch (error) {
                console.error('Could not load TTS voices:', error);
            }
            
            if (tiers.length === 0) {
                UI.openModal('Generate for Topics', `
                    <div class="content-empty" style="padding: 2rem;">
                        <h3>No Tiers Found</h3>
                        <p>This course doesn't have any tiers with topics yet.</p>
                        <button class="action-btn action-btn-secondary" onclick="UI.closeModal()">Close</button>
                    </div>
                `);
                return;
            }
            
            // Load topics for each tier
            const tiersWithTopics = [];
            for (const tier of tiers) {
                const topicsData = await API.getTopics({ tierId: tier.id }, true);
                tiersWithTopics.push({
                    ...tier,
                    topics: topicsData.data?.topics || []
                });
            }
            
            // Check if there are any topics at all
            const totalTopics = tiersWithTopics.reduce((sum, t) => sum + t.topics.length, 0);
            if (totalTopics === 0) {
                UI.openModal('Generate for Topics', `
                    <div class="content-empty" style="padding: 2rem;">
                        <h3>No Topics Found</h3>
                        <p>This course doesn't have any topics yet.</p>
                        <button class="action-btn action-btn-secondary" onclick="UI.closeModal()">Close</button>
                    </div>
                `);
                return;
            }
            
            // Build the modal content
            this.renderIndividualGenerateModal(courseId, courseTitle, tiersWithTopics, voicesData);
            
        } catch (error) {
            console.error('Error loading topics:', error);
            UI.showToast('Failed to load topics: ' + error.message, 'error');
            UI.closeModal();
        }
    },
    
    renderIndividualGenerateModal(courseId, courseTitle, tiersWithTopics, voicesData) {
        // Build tier sections with topics
        let tiersHTML = '';
        for (const tier of tiersWithTopics) {
            if (tier.topics.length === 0) continue;
            
            const topicsHTML = tier.topics.map(topic => {
                const notesCount = topic.notes_count || 0;
                const questionsCount = topic.questions_count || 0;
                const hasPodcastScript = topic.has_podcast_script || false;
                const hasPodcastFile = topic.has_podcast_file || false;
                const hasContent = notesCount > 0 || questionsCount > 0 || hasPodcastScript || hasPodcastFile;
                
                return `
                    <label class="individual-topic-item ${hasContent ? 'has-content' : 'no-content'}">
                        <input type="checkbox" name="topicIds" value="${topic.id}" class="topic-checkbox">
                        <div class="topic-info">
                            <span class="topic-name">${UI.escapeHtml(topic.name)}</span>
                            <div class="topic-stats">
                                <span class="stat ${notesCount > 0 ? 'has' : 'empty'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                    ${notesCount} notes
                                </span>
                                <span class="stat ${hasPodcastScript ? 'has' : 'empty'}" title="Podcast Script">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Script
                                </span>
                                <span class="stat ${hasPodcastFile ? 'has' : 'empty'}" title="Podcast Audio">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                                    Audio
                                </span>
                                <span class="stat ${questionsCount > 0 ? 'has' : 'empty'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                    ${questionsCount} questions
                                </span>
                            </div>
                        </div>
                    </label>
                `;
            }).join('');
            
            tiersHTML += `
                <div class="tier-section">
                    <div class="tier-header">
                        <label class="tier-select-all">
                            <input type="checkbox" class="tier-checkbox" data-tier="${tier.id}" onchange="GenerateSection.toggleTierTopics(this, '${tier.id}')">
                            <span class="tier-title">${UI.escapeHtml(tier.title)}</span>
                            <span class="tier-count">(${tier.topics.length} topics)</span>
                        </label>
                    </div>
                    <div class="tier-topics" id="tier-topics-${tier.id}">
                        ${topicsHTML}
                    </div>
                </div>
            `;
        }
        
        // TTS Settings HTML
        let ttsSettingsHTML = '';
        if (voicesData) {
            ttsSettingsHTML = `
                <div id="indivTtsSettingsContainer" style="display: none; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 1rem; width: 100%;">
                    <h4 style="margin-bottom: 1rem; font-size: 0.95rem; color: var(--color-text-primary);">TTS Voice Settings</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label class="filter-label">Speaker 1 Voice</label>
                            <select class="filter-select" id="indivSpeaker1Voice">
                                ${voicesData.voices.map(v => {
                                    const voiceId = v.voice_id || v.id;
                                    const displayName = v.display_name || v.name || 'Unknown';
                                    const isDefault = voiceId === 'Clive';
                                    return `<option value="${voiceId}" ${isDefault ? 'selected' : ''} title="${v.description || ''}">${displayName}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="filter-label">Speaker 2 Voice</label>
                            <select class="filter-select" id="indivSpeaker2Voice">
                                ${voicesData.voices.map(v => {
                                    const voiceId = v.voice_id || v.id;
                                    const displayName = v.display_name || v.name || 'Unknown';
                                    const isDefault = voiceId === 'Wendy';
                                    return `<option value="${voiceId}" ${isDefault ? 'selected' : ''} title="${v.description || ''}">${displayName}</option>`;
                                }).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div>
                            <label class="filter-label">Speaker 1 Speed: <span id="indivSpeaker1SpeedValue">1.0</span>x</label>
                            <input type="range" class="form-range" id="indivSpeaker1Speed" value="1.0" min="0.5" max="2.0" step="0.1" oninput="document.getElementById('indivSpeaker1SpeedValue').textContent = this.value">
                        </div>
                        <div>
                            <label class="filter-label">Speaker 2 Speed: <span id="indivSpeaker2SpeedValue">1.0</span>x</label>
                            <input type="range" class="form-range" id="indivSpeaker2Speed" value="1.0" min="0.5" max="2.0" step="0.1" oninput="document.getElementById('indivSpeaker2SpeedValue').textContent = this.value">
                        </div>
                        <div>
                            <label class="filter-label">Pause: <span id="indivPauseValue">0.3</span>s</label>
                            <input type="range" class="form-range" id="indivPause" value="0.3" min="0.0" max="5.0" step="0.1" oninput="document.getElementById('indivPauseValue').textContent = this.value">
                        </div>
                    </div>
                </div>
            `;
        }

        const formHTML = `
            <form id="individualGenerateForm" onsubmit="GenerateSection.handleIndividualGenerate(event); return false;">
                <h2>Generate Content for Topics</h2>
                <p class="form-description">Select specific topics to generate notes, podcast scripts, and/or questions for <strong>${UI.escapeHtml(courseTitle)}</strong>.</p>
                
                <div class="individual-gen-options" style="margin-bottom: 1.5rem;">
                    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                        <label class="option-checkbox">
                            <input type="checkbox" name="generateNotes" id="genNotes" checked>
                            <span>Generate Notes</span>
                        </label>
                        <label class="option-checkbox">
                            <input type="checkbox" name="generatePodcastScripts" id="genPodcastScripts" checked>
                            <span>Generate Podcast Scripts</span>
                        </label>
                        ${voicesData ? `
                        <label class="option-checkbox">
                            <input type="checkbox" name="generatePodcastAudio" id="genPodcastAudio" onchange="document.getElementById('indivTtsSettingsContainer').style.display = this.checked ? 'block' : 'none'">
                            <span>Generate Podcast Audio</span>
                        </label>
                        ` : ''}
                        <label class="option-checkbox">
                            <input type="checkbox" name="generateQuestions" id="genQuestions" checked>
                            <span>Generate Questions</span>
                        </label>
                        <label class="option-checkbox warning">
                            <input type="checkbox" name="replaceExisting" id="replaceExisting">
                            <span>Replace Existing Content</span>
                        </label>
                    </div>
                    ${ttsSettingsHTML}
                </div>
                
                <div class="selection-controls" style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.selectAllTopics(true)" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">Select All</button>
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.selectAllTopics(false)" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">Deselect All</button>
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.selectTopicsWithoutContent()" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">Select Without Content</button>
                    <span class="selection-count" id="selectionCount" style="margin-left: auto; font-size: 0.9rem; color: var(--color-grey-text);">0 topics selected</span>
                </div>
                
                <div class="topics-container" style="max-height: 400px; overflow-y: auto; border: 1px solid rgba(187, 202, 220, 0.5); border-radius: 10px; padding: 0.5rem;">
                    ${tiersHTML}
                </div>
                
                <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; margin-top: 1rem; border-left: 4px solid rgb(245, 158, 11);">
                    <strong style="color: rgb(180, 120, 0);">⚠️ Note:</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.6; font-size: 0.875rem;">
                        <li>Generation is synchronous and may take several minutes</li>
                        <li>If "Replace Existing" is checked, current content will be deleted first</li>
                        <li>Rate limited to 10 requests per minute</li>
                    </ul>
                </div>
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("individualGenerateForm").requestSubmit()',
                    'Start Generation',
                    false
                )}
            </form>
        `;
        
        const modalContent = document.getElementById('modalContent');
        if (modalContent) {
            modalContent.innerHTML = formHTML;
        } else {
            UI.openModal('Generate for Topics', formHTML);
        }
        
        // Add change listeners to update selection count
        this.setupTopicSelectionListeners();
    },
    
    setupTopicSelectionListeners() {
        const checkboxes = document.querySelectorAll('.topic-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => this.updateSelectionCount());
        });
        this.updateSelectionCount();
    },
    
    updateSelectionCount() {
        const checked = document.querySelectorAll('.topic-checkbox:checked').length;
        const countEl = document.getElementById('selectionCount');
        if (countEl) {
            countEl.textContent = `${checked} topic${checked !== 1 ? 's' : ''} selected`;
        }
    },
    
    toggleTierTopics(tierCheckbox, tierId) {
        const tierContainer = document.getElementById(`tier-topics-${tierId}`);
        if (!tierContainer) return;
        
        const topicCheckboxes = tierContainer.querySelectorAll('.topic-checkbox');
        topicCheckboxes.forEach(cb => {
            cb.checked = tierCheckbox.checked;
        });
        this.updateSelectionCount();
    },
    
    selectAllTopics(select) {
        const checkboxes = document.querySelectorAll('.topic-checkbox');
        checkboxes.forEach(cb => cb.checked = select);
        
        // Also update tier checkboxes
        const tierCheckboxes = document.querySelectorAll('.tier-checkbox');
        tierCheckboxes.forEach(cb => cb.checked = select);
        
        this.updateSelectionCount();
    },
    
    selectTopicsWithoutContent() {
        const items = document.querySelectorAll('.individual-topic-item');
        items.forEach(item => {
            const checkbox = item.querySelector('.topic-checkbox');
            if (checkbox) {
                checkbox.checked = item.classList.contains('no-content');
            }
        });
        
        // Update tier checkboxes based on their topics
        const tierCheckboxes = document.querySelectorAll('.tier-checkbox');
        tierCheckboxes.forEach(tierCb => {
            const tierId = tierCb.dataset.tier;
            const tierContainer = document.getElementById(`tier-topics-${tierId}`);
            if (tierContainer) {
                const topicCbs = tierContainer.querySelectorAll('.topic-checkbox');
                const allChecked = Array.from(topicCbs).every(cb => cb.checked);
                tierCb.checked = allChecked && topicCbs.length > 0;
            }
        });
        
        this.updateSelectionCount();
    },
    
    async handleIndividualGenerate(event) {
        event.preventDefault();
        
        // Get selected topics
        const selectedTopics = Array.from(document.querySelectorAll('.topic-checkbox:checked')).map(cb => cb.value);
        
        if (selectedTopics.length === 0) {
            UI.showToast('Please select at least one topic', 'error');
            return;
        }
        
        // Get options
        const generateNotes = document.getElementById('genNotes')?.checked || false;
        const generatePodcastScripts = document.getElementById('genPodcastScripts')?.checked || false;
        const generatePodcastAudio = document.getElementById('genPodcastAudio')?.checked || false;
        const generateQuestions = document.getElementById('genQuestions')?.checked || false;
        const replaceExisting = document.getElementById('replaceExisting')?.checked || false;
        
        if (!generateNotes && !generatePodcastScripts && !generatePodcastAudio && !generateQuestions) {
            UI.showToast('Please select at least one content type to generate', 'error');
            return;
        }
        
        // Collect TTS settings if audio generation is enabled
        const ttsSettings = {};
        if (generatePodcastAudio) {
            ttsSettings.generatePodcastAudio = true;
            ttsSettings.speaker1VoiceId = document.getElementById('indivSpeaker1Voice')?.value;
            ttsSettings.speaker2VoiceId = document.getElementById('indivSpeaker2Voice')?.value;
            ttsSettings.speaker1Speed = parseFloat(document.getElementById('indivSpeaker1Speed')?.value || '1.0');
            ttsSettings.speaker2Speed = parseFloat(document.getElementById('indivSpeaker2Speed')?.value || '1.0');
            ttsSettings.pauseBetweenTurns = parseFloat(document.getElementById('indivPause')?.value || '0.3');
        }
        
        // Confirm if replacing existing content
        if (replaceExisting) {
            if (!UI.confirm(`⚠️ WARNING: This will DELETE existing content for ${selectedTopics.length} topic(s) before regenerating.\\n\\nAre you sure you want to continue?`)) {
                return;
            }
        }
        
        try {
            UI.closeModal();
            UI.showLoading(`Generating content for ${selectedTopics.length} topic(s)... This may take several minutes.`);
            
            const result = await API.generateIndividual(selectedTopics, {
                generateNotes,
                generatePodcastScripts,
                generateQuestions,
                replaceExisting,
                ...ttsSettings
            });
            
            // Show results
            const data = result.data;
            const successCount = data.results?.filter(r => !r.error).length || 0;
            const errorCount = data.errors || 0;
            
            if (errorCount === 0) {
                UI.showToast(`Successfully generated content for ${successCount} topic(s). Notes: ${data.notes_generated}, Scripts: ${data.podcast_scripts_generated || 0}, Audio: ${data.podcast_audio_generated || 0}, Questions: ${data.total_questions}`, 'success');
            } else {
                UI.showToast(`Completed with ${errorCount} error(s). Notes: ${data.notes_generated}, Scripts: ${data.podcast_scripts_generated || 0}, Audio: ${data.podcast_audio_generated || 0}, Questions: ${data.total_questions}`, 'warning');
            }
            
            // Show detailed results modal
            this.showIndividualGenerateResults(data);
            
        } catch (error) {
            console.error('Individual generation error:', error);
            
            // Check for specific error about missing page ranges
            if (error.message && error.message.includes('missing page range')) {
                this.showMissingPageRangesError(error);
            } else {
                UI.showToast('Generation failed: ' + error.message, 'error');
            }
        }
    },
    
    showMissingPageRangesError(error) {
        // Parse the error to extract topic names if available
        let topicsList = '';
        let hint = 'Re-run full course generation to populate page ranges for all topics.';
        
        // Try to extract details from error message
        // Error format: "Cannot generate content: X topic(s) are missing page range data..."
        // Details may include topics_missing_page_ranges array
        
        const modalHTML = `
            <div class="individual-results">
                <h2 style="color: var(--color-error);">Generation Failed</h2>
                
                <div style="padding: 1.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid var(--color-error); margin: 1rem 0;">
                    <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-error); flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <div>
                            <strong style="color: var(--color-error);">Missing Page Range Data</strong>
                            <p style="margin: 0.5rem 0 0; color: var(--color-text-primary); font-size: 0.9rem;">
                                ${UI.escapeHtml(error.message)}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 1rem;">
                    <strong>Why does this happen?</strong>
                    <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--color-grey-text);">
                        Individual topic generation requires page range data (start_page, end_page) to extract the relevant portion of the specification PDF. This data is only populated during full course generation.
                    </p>
                </div>
                
                <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; margin-top: 1rem; border-left: 4px solid rgb(59, 130, 246);">
                    <strong style="color: rgb(59, 130, 246);">💡 Solution</strong>
                    <p style="margin: 0.5rem 0 0; font-size: 0.875rem;">
                        Run a full course generation first. This will analyze the specification PDF and store the page ranges for each topic. After that, you can use individual generation to regenerate specific topics.
                    </p>
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="action-btn action-btn-secondary" onclick="UI.closeModal()">Close</button>
                </div>
            </div>
        `;
        
        UI.openModal('Generation Error', modalHTML);
    },
    
    showIndividualGenerateResults(data) {
        const results = data.results || [];
        
        const resultsHTML = results.map(r => {
            const statusClass = r.error ? 'error' : 'success';
            const statusIcon = r.error 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            
            return `
                <div class="result-item ${statusClass}">
                    <span class="result-icon">${statusIcon}</span>
                    <div class="result-info">
                        <span class="result-topic">${UI.escapeHtml(r.topic_name)}</span>
                        <span class="result-tier">${UI.escapeHtml(r.tier_title || '')}</span>
                    </div>
                    <div class="result-details">
                        ${r.error ? `<span class="error-text">${UI.escapeHtml(r.error)}</span>` : `
                            ${r.notes_generated ? '<span class="gen-badge notes">Notes ✓</span>' : ''}
                            ${r.podcast_script_generated ? '<span class="gen-badge scripts">Script ✓</span>' : ''}
                            ${r.podcast_audio_generated ? '<span class="gen-badge audio">Audio ✓</span>' : ''}
                            ${r.questions_generated ? `<span class="gen-badge questions">${r.questions_count} Questions</span>` : ''}
                        `}
                    </div>
                </div>
            `;
        }).join('');
        
        const modalHTML = `
            <div class="individual-results">
                <h2>Generation Results</h2>
                <div class="results-summary">
                    <div class="summary-stat">
                        <span class="stat-value">${data.topics_processed || 0}</span>
                        <span class="stat-label">Topics Processed</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data.notes_generated || 0}</span>
                        <span class="stat-label">Notes Generated</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data.podcast_scripts_generated || 0}</span>
                        <span class="stat-label">Scripts Generated</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data.podcast_audio_generated || 0}</span>
                        <span class="stat-label">Audio Generated</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${data.total_questions || 0}</span>
                        <span class="stat-label">Questions Generated</span>
                    </div>
                    <div class="summary-stat ${data.errors > 0 ? 'has-errors' : ''}">
                        <span class="stat-value">${data.errors || 0}</span>
                        <span class="stat-label">Errors</span>
                    </div>
                </div>
                
                <div class="results-list" style="max-height: 300px; overflow-y: auto; margin-top: 1rem;">
                    ${resultsHTML}
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="action-btn action-btn-secondary" onclick="UI.closeModal()">Close</button>
                </div>
            </div>
        `;
        
        UI.openModal('Generation Results', modalHTML);
    },

    async handleCancel(taskId) {
        if (!UI.confirm('Are you sure you want to cancel this generation task? Partial progress will be preserved.')) {
            return;
        }
        
        try {
            await API.cancelGenerate(taskId);
            UI.showToast('Generation task cancelled', 'success');
            
            // Reload tasks
            await this.loadTasks();
            this.render();
            
        } catch (error) {
            console.error('Cancel error:', error);
            UI.showToast('Failed to cancel task', 'error');
        }
    },
    
    async handleDeleteTask(taskId, hasContent) {
        const task = AppState.generateTasks.find(t => t.task_id === taskId);
        const taskTitle = task ? (task.course_title || 'this task') : 'this task';
        
        if (hasContent) {
            // Show modal with option to delete content
            const formHTML = `
                <form id="deleteTaskForm" onsubmit="GenerateSection.confirmDeleteTask('${taskId}'); return false;">
                    <h2>Delete Generation Task</h2>
                    <p class="form-description">
                        This task has generated a course: <strong>${UI.escapeHtml(taskTitle)}</strong>
                    </p>
                    
                    <div style="margin: 1.5rem 0;">
                        <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; padding: 1rem; background: rgba(245, 86, 86, 0.1); border-radius: 8px; border: 2px solid rgba(245, 86, 86, 0.3);">
                            <input type="checkbox" id="deleteContentCheckbox" style="margin-top: 0.25rem;">
                            <div>
                                <div style="font-weight: 600; color: var(--color-error); margin-bottom: 0.25rem;">Also delete all generated content</div>
                                <div style="font-size: 0.875rem; color: var(--color-grey-text);">
                                    This will permanently delete the course, papers, topics, notes, questions, and all related content. This action cannot be undone.
                                </div>
                            </div>
                        </label>
                    </div>
                    
                    <p style="font-size: 0.875rem; color: var(--color-grey-text); margin-top: 1rem;">
                        If you uncheck this option, only the task record will be deleted. The generated content will remain in the system.
                    </p>
                    
                    ${UI.createModalActions(
                        'UI.closeModal()',
                        'document.getElementById("deleteTaskForm").requestSubmit()',
                        'Delete Task',
                        false
                    )}
                </form>
            `;
            
            UI.openModal('Delete Generation Task', formHTML);
        } else {
            // Simple deletion without content
            if (!UI.confirm(`Are you sure you want to delete the task for "${taskTitle}"?`)) {
                return;
            }
            
            await this.executeDeleteTask(taskId, false);
        }
    },
    
    async confirmDeleteTask(taskId) {
        const deleteContent = document.getElementById('deleteContentCheckbox')?.checked || false;
        UI.closeModal();
        await this.executeDeleteTask(taskId, deleteContent);
    },
    
    async executeDeleteTask(taskId, deleteContent) {
        try {
            await API.deleteGenerationTask(taskId, deleteContent);
            UI.showToast(
                deleteContent 
                    ? 'Task and all generated content deleted successfully' 
                    : 'Task deleted successfully',
                'success'
            );
            
            // Reload tasks
            await this.loadTasks();
            this.render();
            
        } catch (error) {
            console.error('Delete error:', error);
            UI.showToast(error.message || 'Failed to delete task', 'error');
        }
    },
    
    // Prompts Management
    renderPrompts() {
        const prompts = AppState.generatePrompts;
        
        const viewTabsHTML = `
            <div class="content-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="action-btn ${this.currentView === 'tasks' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('tasks')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            Generation Tasks
                        </button>
                        <button class="action-btn ${this.currentView === 'prompts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('prompts')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            AI Prompts
                        </button>
                        <button class="action-btn ${this.currentView === 'models' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('models')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9.66-9H16m-8 0H1.34M17.66 17.66l-4.24-4.24m-2.83 0l-4.24 4.24M17.66 6.34l-4.24 4.24m-2.83 0l-4.24-4.24"></path></svg>
                            AI Models
                        </button>
                        <button class="action-btn ${this.currentView === 'localTts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('localTts')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                            Local TTS
                        </button>
                    </div>
                    <button class="action-btn" onclick="GenerateSection.openBulkChangeModelModal()" title="Change model for all prompts">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                        Bulk Change Model
                    </button>
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (prompts.length === 0) {
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <h3>No AI Prompts Found</h3>
                    <p>System prompts control how AI generates content.</p>
                </div>
            `;
        } else {
            // Group prompts by stage - dynamically handle any stage
            const knownStageOrder = ['course_info', 'papers_topics', 'notes', 'podcast_script', 'questions', 'podcasts'];
            const stageLabels = {
                'course_info': 'Course Info Extraction',
                'papers_topics': 'Papers & Topics Structure',
                'notes': 'Notes Generation',
                'podcast_script': 'Podcast Script Generation',
                'questions': 'Questions Generation',
                'podcasts': 'Podcast Generation'
            };
            
            // Get all unique stages from prompts
            const allStages = [...new Set(prompts.map(p => p.stage))];
            
            // Sort stages: known stages first (in order), then unknown stages alphabetically
            const stageOrder = [
                ...knownStageOrder.filter(s => allStages.includes(s)),
                ...allStages.filter(s => !knownStageOrder.includes(s)).sort()
            ];
            
            const groupedPrompts = {};
            stageOrder.forEach(stage => {
                groupedPrompts[stage] = prompts.filter(p => p.stage === stage);
            });
            
            let sectionsHTML = '';
            stageOrder.forEach(stage => {
                const stagePrompts = groupedPrompts[stage];
                if (stagePrompts.length > 0) {
                    // Use known label or generate a readable label from the stage name
                    const stageLabel = stageLabels[stage] || stage
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ') + ' Generation';
                    const cardsHTML = stagePrompts.map(p => this.renderPromptCard(p)).join('');
                    sectionsHTML += `
                        <div style="margin-bottom: 2rem;">
                            <h3 style="color: var(--color-text-primary); font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">
                                ${stageLabel}
                            </h3>
                            <div class="content-grid">${cardsHTML}</div>
                        </div>
                    `;
                }
            });
            
            contentHTML = sectionsHTML;
        }
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + contentHTML;
    },
    
    renderPromptCard(prompt) {
        const statusBadge = prompt.is_active 
            ? '<span class="card-badge badge-active">Active</span>'
            : '<span class="card-badge badge-inactive">Inactive</span>';
        
        const createdDate = new Date(prompt.created_at).toLocaleString();
        const previewText = prompt.prompt_template.substring(0, 150) + (prompt.prompt_template.length > 150 ? '...' : '');
        const modelTitle = prompt.model ? prompt.model.title : 'Unknown Model';
        const modelProvider = prompt.model ? prompt.model.provider : '';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${UI.escapeHtml(prompt.name)}</h3>
                        ${statusBadge}
                    </div>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Model:</span>
                        <span class="meta-value">${UI.escapeHtml(modelTitle)}${modelProvider ? ` <span style="color: var(--color-grey-text); text-transform: capitalize;">(${UI.escapeHtml(modelProvider)})</span>` : ''}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Stage:</span>
                        <span class="meta-value">${UI.escapeHtml(prompt.stage)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${createdDate}</span>
                    </div>
                </div>
                <div class="card-description">
                    <strong>Prompt Preview:</strong><br>
                    ${UI.escapeHtml(previewText)}
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="GenerateSection.openEditPromptModal('${prompt.id}')" title="Edit Prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    ${prompt.is_active ? `
                        <button class="card-action-btn" onclick="GenerateSection.handleTogglePromptStatus('${prompt.id}', false)" title="Deactivate Prompt">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                            Deactivate
                        </button>
                    ` : `
                        <button class="card-action-btn" onclick="GenerateSection.handleTogglePromptStatus('${prompt.id}', true)" title="Activate Prompt">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Activate
                        </button>
                    `}
                </div>
            </div>
        `;
    },
    
    openEditPromptModal(promptId) {
        const prompt = AppState.generatePrompts.find(p => p.id === promptId);
        if (!prompt) {
            UI.showToast('Prompt not found', 'error');
            return;
        }
        
        // Build model options from loaded models
        const modelOptions = AppState.models
            .filter(m => m.is_active)
            .map(m => ({
                value: m.id,
                label: `${m.title} (${m.provider})`,
                selected: m.id === prompt.model_id
            }));
        
        const formHTML = `
            <form id="editPromptForm" onsubmit="GenerateSection.handleUpdatePrompt(event, '${promptId}'); return false;">
                <h2>Edit AI Prompt</h2>
                <p class="form-description">Modify the prompt template or model used for AI content generation. Changes take effect for new generation tasks.</p>
                
                ${UI.createFormRow(
                    'Prompt Name',
                    `<input type="text" class="filter-select" value="${UI.escapeHtml(prompt.name)}" disabled style="background: var(--bg-secondary); cursor: not-allowed;">`
                )}
                
                ${UI.createFormRow(
                    'Generation Stage',
                    `<input type="text" class="filter-select" value="${UI.escapeHtml(prompt.stage)}" disabled style="background: var(--bg-secondary); cursor: not-allowed;">`
                )}
                
                ${UI.createFormRow(
                    'AI Model',
                    UI.createSelect('modelId', modelOptions, prompt.model_id)
                )}
                
                ${UI.createFormRow(
                    'Prompt Template',
                    `<textarea id="promptTemplate" class="filter-select" rows="15" style="font-family: 'Courier New', monospace; font-size: 0.875rem; line-height: 1.6; resize: vertical;" required>${UI.escapeHtml(prompt.prompt_template)}</textarea>`,
                    'Use markdown formatting and placeholders as needed. Be specific and clear.'
                )}
                
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 1rem;">
                    <strong>Tips:</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.8; font-size: 0.875rem;">
                        <li>Be specific about output format and structure</li>
                        <li>Include examples when helpful</li>
                        <li>Test changes with a generation task</li>
                        <li>Keep prompts focused on single responsibility</li>
                    </ul>
                </div>
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("editPromptForm").requestSubmit()',
                    'Save Changes',
                    false
                )}
            </form>
        `;
        
        UI.openModal('Edit Prompt', formHTML);
    },
    
    async handleUpdatePrompt(event, promptId) {
        event.preventDefault();
        
        const form = event.target;
        const modelId = form.modelId.value;
        const promptTemplate = form.promptTemplate.value.trim();
        
        if (!promptTemplate) {
            UI.showToast('Prompt template cannot be empty', 'error');
            return;
        }
        
        try {
            UI.closeModal();
            UI.showLoading('Updating prompt...');
            
            const data = await API.updateGeneratePrompt(promptId, {
                prompt_template: promptTemplate,
                model_id: modelId
            });
            
            UI.showToast('Prompt updated successfully', 'success');
            
            // Reload prompts
            await this.loadPrompts();
            this.renderPrompts();
            
        } catch (error) {
            console.error('Update prompt error:', error);
            UI.showToast('Failed to update prompt: ' + error.message, 'error');
        }
    },
    
    async handleTogglePromptStatus(promptId, newStatus) {
        const action = newStatus ? 'activate' : 'deactivate';
        if (!UI.confirm(`Are you sure you want to ${action} this prompt?`)) {
            return;
        }
        
        try {
            UI.showLoading(`${action === 'activate' ? 'Activating' : 'Deactivating'} prompt...`);
            
            await API.updateGeneratePrompt(promptId, {
                is_active: newStatus
            });
            
            UI.showToast(`Prompt ${action}d successfully`, 'success');
            
            // Reload prompts
            await this.loadPrompts();
            this.renderPrompts();
            
        } catch (error) {
            console.error('Toggle prompt status error:', error);
            UI.showToast(`Failed to ${action} prompt: ` + error.message, 'error');
        }
    },
    
    openBulkChangeModelModal() {
        const activePrompts = AppState.generatePrompts.filter(p => p.is_active);
        
        if (activePrompts.length === 0) {
            UI.showToast('No active prompts to update', 'info');
            return;
        }
        
        // Build model options from active models
        const modelOptions = AppState.models
            .filter(m => m.is_active)
            .map(m => ({
                value: m.id,
                label: `${m.title} (${m.provider})`
            }));
        
        if (modelOptions.length === 0) {
            UI.showToast('No active models available', 'error');
            return;
        }
        
        const formHTML = `
            <form id="bulkChangeModelForm" onsubmit="GenerateSection.handleBulkChangeModel(event); return false;">
                <h2>Bulk Change Model</h2>
                <p class="form-description">Change the AI model for all active prompts at once. This affects future generation tasks.</p>
                
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 1.5rem;">
                    <strong>Active Prompts (${activePrompts.length}):</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.8;">
                        ${activePrompts.map(p => `<li>${UI.escapeHtml(p.name)} - Currently using ${UI.escapeHtml(p.model.title)}</li>`).join('')}
                    </ul>
                </div>
                
                ${UI.createFormRow(
                    'New Model',
                    UI.createSelect('modelId', modelOptions, '', true),
                    'All active prompts will be updated to use this model'
                )}
                
                <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; margin-top: 1rem; border-left: 4px solid rgb(245, 158, 11);">
                    <strong style="color: rgb(245, 158, 11);">⚠️ Warning:</strong>
                    <p style="margin: 0.5rem 0 0; font-size: 0.875rem;">This will update all ${activePrompts.length} active prompts. Make sure you've tested the new model before applying this change to production prompts.</p>
                </div>
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("bulkChangeModelForm").requestSubmit()',
                    'Update All Prompts',
                    false
                )}
            </form>
        `;
        
        UI.openModal('Bulk Change Model', formHTML);
    },
    
    async handleBulkChangeModel(event) {
        event.preventDefault();
        
        const form = event.target;
        const modelId = form.modelId.value;
        
        if (!modelId) {
            UI.showToast('Please select a model', 'error');
            return;
        }
        
        const activePrompts = AppState.generatePrompts.filter(p => p.is_active);
        
        if (!UI.confirm(`Are you sure you want to update all ${activePrompts.length} active prompts to use this model?`)) {
            return;
        }
        
        try {
            UI.closeModal();
            UI.showLoading(`Updating ${activePrompts.length} prompts...`);
            
            let successCount = 0;
            let failCount = 0;
            
            // Update each prompt
            for (const prompt of activePrompts) {
                try {
                    await API.updateGeneratePrompt(prompt.id, {
                        model_id: modelId
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to update prompt ${prompt.id}:`, error);
                    failCount++;
                }
            }
            
            // Show results
            if (failCount === 0) {
                UI.showToast(`Successfully updated all ${successCount} prompts`, 'success');
            } else {
                UI.showToast(`Updated ${successCount} prompts, ${failCount} failed`, 'error');
            }
            
            // Reload prompts
            await this.loadPrompts();
            this.renderPrompts();
            
        } catch (error) {
            console.error('Bulk change model error:', error);
            UI.showToast('Failed to update prompts: ' + error.message, 'error');
        }
    },
    
    // Models Management
    renderModels() {
        const allModels = AppState.models;
        
        // Filter models based on search query
        const searchQuery = this.modelSearchQuery.toLowerCase();
        const models = allModels.filter(model => {
            if (!searchQuery) return true;
            return (
                model.title.toLowerCase().includes(searchQuery) ||
                model.model_name.toLowerCase().includes(searchQuery) ||
                model.provider.toLowerCase().includes(searchQuery) ||
                (model.description && model.description.toLowerCase().includes(searchQuery))
            );
        });
        
        const viewTabsHTML = `
            <div class="content-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="action-btn ${this.currentView === 'tasks' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('tasks')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        Generation Tasks
                    </button>
                    <button class="action-btn ${this.currentView === 'prompts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('prompts')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        AI Prompts
                    </button>
                    <button class="action-btn ${this.currentView === 'models' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('models')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9.66-9H16m-8 0H1.34M17.66 17.66l-4.24-4.24m-2.83 0l-4.24 4.24M17.66 6.34l-4.24 4.24m-2.83 0l-4.24-4.24"></path></svg>
                        AI Models
                    </button>
                    <button class="action-btn ${this.currentView === 'localTts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('localTts')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        Local TTS
                    </button>
                </div>
            </div>
        `;
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Model',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'GenerateSection.openCreateModelModal()'
        );
        
        const actionsHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="modelSearchInput" placeholder="Search models..." value="${UI.escapeHtml(this.modelSearchQuery)}" oninput="GenerateSection.onModelSearchChange()">
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (models.length === 0) {
            if (this.modelSearchQuery) {
                // No search results
                contentHTML = `
                    <div class="content-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <h3>No Models Found</h3>
                        <p>No models match your search query "${UI.escapeHtml(this.modelSearchQuery)}"</p>
                        <button class="action-btn" onclick="GenerateSection.modelSearchQuery = ''; GenerateSection.renderModels();">
                            Clear Search
                        </button>
                    </div>
                `;
            } else {
                // No models at all
                contentHTML = `
                    <div class="content-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m9.66-9H16m-8 0H1.34M17.66 17.66l-4.24-4.24m-2.83 0l-4.24 4.24M17.66 6.34l-4.24 4.24m-2.83 0l-4.24-4.24"></path>
                        </svg>
                        <h3>No AI Models Found</h3>
                        <p>Configure AI models to use for content generation.</p>
                    </div>
                `;
            }
        } else {
            // Group models by provider
            const providers = [...new Set(models.map(m => m.provider))].sort();
            let sectionsHTML = '';
            
            providers.forEach(provider => {
                const providerModels = models.filter(m => m.provider === provider);
                const cardsHTML = providerModels.map(m => this.renderModelCard(m)).join('');
                sectionsHTML += `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: var(--color-text-primary); font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; text-transform: capitalize;">
                            ${UI.escapeHtml(provider)} Models
                        </h3>
                        <div class="content-grid">${cardsHTML}</div>
                    </div>
                `;
            });
            
            contentHTML = sectionsHTML;
        }
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + actionsHTML + contentHTML;
    },
    
    onModelSearchChange() {
        const input = document.getElementById('modelSearchInput');
        if (!input) return;
        this.modelSearchQuery = input.value;
        this.renderModels();
        // Restore focus after re-render
        setTimeout(() => {
            const newInput = document.getElementById('modelSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(input.value.length, input.value.length);
            }
        }, 0);
    },
    
    renderModelCard(model) {
        const statusBadge = model.is_active 
            ? '<span class="card-badge badge-active">Active</span>'
            : '<span class="card-badge badge-inactive">Inactive</span>';
        
        const createdDate = new Date(model.created_at).toLocaleString();
        const rpdText = model.rpd ? model.rpd.toLocaleString() : 'Unlimited';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${UI.escapeHtml(model.title)}</h3>
                        ${statusBadge}
                    </div>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Model Name:</span>
                        <span class="meta-value"><code>${UI.escapeHtml(model.model_name)}</code></span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Provider:</span>
                        <span class="meta-value" style="text-transform: capitalize;">${UI.escapeHtml(model.provider)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">RPM Limit:</span>
                        <span class="meta-value">${model.rpm} requests/min</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">RPD Limit:</span>
                        <span class="meta-value">${rpdText}</span>
                    </div>
                    ${model.added_by_username ? `
                        <div class="meta-row">
                            <span class="meta-label">Added By:</span>
                            <span class="meta-value">${UI.escapeHtml(model.added_by_username)}</span>
                        </div>
                    ` : ''}
                    <div class="meta-row">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${createdDate}</span>
                    </div>
                </div>
                ${model.description ? `
                    <div class="card-description">
                        ${UI.escapeHtml(model.description)}
                    </div>
                ` : ''}
                <div class="card-actions">
                    <button class="card-action-btn" onclick="GenerateSection.openEditModelModal('${model.id}')" title="Edit Model">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    ${model.is_active ? `
                        <button class="card-action-btn destructive" onclick="GenerateSection.handleDeleteModel('${model.id}')" title="Delete Model">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    ` : `
                        <button class="card-action-btn" onclick="GenerateSection.handleToggleModelStatus('${model.id}', true)" title="Reactivate Model">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Reactivate
                        </button>
                    `}
                </div>
            </div>
        `;
    },
    
    openCreateModelModal() {
        const formHTML = `
            <form id="createModelForm" onsubmit="GenerateSection.handleCreateModel(event); return false;">
                <h2>Create AI Model</h2>
                <p class="form-description">Add a new AI model configuration for content generation.</p>
                
                ${UI.createFormRow(
                    'Model Title',
                    UI.createTextInput('title', '', 'e.g., Gemini 2.5 Flash', true)
                )}
                
                ${UI.createFormRow(
                    'Model Name',
                    UI.createTextInput('modelName', '', 'e.g., gemini-2.5-flash', true),
                    'Exact API model identifier (must be unique)'
                )}
                
                ${UI.createFormRow(
                    'Provider',
                    UI.createTextInput('provider', '', 'e.g., google, openai, anthropic', true)
                )}
                
                ${UI.createFormRow(
                    'RPM (Requests Per Minute)',
                    UI.createNumberInput('rpm', '', 'e.g., 10', 1, null, 1),
                    'Rate limit for requests per minute'
                )}
                
                ${UI.createFormRow(
                    'RPD (Requests Per Day)',
                    UI.createNumberInput('rpd', '', 'Leave blank for unlimited', 0, null, 1),
                    'Optional daily request limit'
                )}
                
                ${UI.createFormRow(
                    'Description',
                    UI.createTextarea('description', '', 'Model capabilities and use cases', 3)
                )}
                
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("createModelForm").requestSubmit()',
                    'Create Model',
                    false
                )}
            </form>
        `;
        
        UI.openModal('Create Model', formHTML);
    },
    
    async handleCreateModel(event) {
        event.preventDefault();
        
        const form = event.target;
        const title = form.title.value.trim();
        const modelName = form.modelName.value.trim();
        const provider = form.provider.value.trim();
        const rpm = parseInt(form.rpm.value);
        const rpd = form.rpd.value ? parseInt(form.rpd.value) : null;
        const description = form.description.value.trim();
        
        if (!title || !modelName || !provider || !rpm) {
            UI.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            UI.closeModal();
            UI.showLoading('Creating model...');
            
            await API.createModel({
                title,
                model_name: modelName,
                provider,
                rpm,
                rpd,
                description: description || undefined
            });
            
            UI.showToast('Model created successfully', 'success');
            
            // Reload models
            await this.loadModels();
            this.renderModels();
            
        } catch (error) {
            console.error('Create model error:', error);
            UI.showToast('Failed to create model: ' + error.message, 'error');
        }
    },
    
    openEditModelModal(modelId) {
        const model = AppState.models.find(m => m.id === modelId);
        if (!model) {
            UI.showToast('Model not found', 'error');
            return;
        }
        
        const formHTML = `
            <form id="editModelForm" onsubmit="GenerateSection.handleUpdateModel(event, '${modelId}'); return false;">
                <h2>Edit AI Model</h2>
                <p class="form-description">Update model configuration. Changes take effect immediately.</p>
                
                ${UI.createFormRow(
                    'Model Title',
                    UI.createTextInput('title', model.title, 'e.g., Gemini 2.5 Flash', true)
                )}
                
                ${UI.createFormRow(
                    'Model Name',
                    UI.createTextInput('modelName', model.model_name, 'e.g., gemini-2.5-flash', true),
                    'Exact API model identifier (must be unique)'
                )}
                
                ${UI.createFormRow(
                    'Provider',
                    UI.createTextInput('provider', model.provider, 'e.g., google, openai, anthropic', true)
                )}
                
                ${UI.createFormRow(
                    'RPM (Requests Per Minute)',
                    UI.createNumberInput('rpm', model.rpm, 'e.g., 10', 1, null, 1),
                    'Rate limit for requests per minute'
                )}
                
                ${UI.createFormRow(
                    'RPD (Requests Per Day)',
                    UI.createNumberInput('rpd', model.rpd || '', 'Leave blank for unlimited', 0, null, 1),
                    'Optional daily request limit'
                )}
                
                ${UI.createFormRow(
                    'Description',
                    UI.createTextarea('description', model.description || '', 'Model capabilities and use cases', 3)
                )}
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("editModelForm").requestSubmit()',
                    'Save Changes',
                    false
                )}
            </form>
        `;
        
        UI.openModal('Edit Model', formHTML);
    },
    
    async handleUpdateModel(event, modelId) {
        event.preventDefault();
        
        const form = event.target;
        const title = form.title.value.trim();
        const modelName = form.modelName.value.trim();
        const provider = form.provider.value.trim();
        const rpm = parseInt(form.rpm.value);
        const rpd = form.rpd.value ? parseInt(form.rpd.value) : null;
        const description = form.description.value.trim();
        
        if (!title || !modelName || !provider || !rpm) {
            UI.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            UI.closeModal();
            UI.showLoading('Updating model...');
            
            await API.updateModel(modelId, {
                title,
                model_name: modelName,
                provider,
                rpm,
                rpd,
                description: description || undefined
            });
            
            UI.showToast('Model updated successfully', 'success');
            
            // Reload models
            await this.loadModels();
            this.renderModels();
            
        } catch (error) {
            console.error('Update model error:', error);
            UI.showToast('Failed to update model: ' + error.message, 'error');
        }
    },
    
    async handleDeleteModel(modelId) {
        const model = AppState.models.find(m => m.id === modelId);
        if (!model) {
            UI.showToast('Model not found', 'error');
            return;
        }
        
        if (!UI.confirm(`Are you sure you want to delete "${model.title}"? Make sure no active prompts are using this model.`)) {
            return;
        }
        
        try {
            UI.showLoading('Deleting model...');
            
            await API.deleteModel(modelId);
            
            UI.showToast('Model deleted successfully', 'success');
            
            // Reload models
            await this.loadModels();
            this.renderModels();
            
        } catch (error) {
            console.error('Delete model error:', error);
            UI.showToast('Failed to delete model: ' + error.message, 'error');
        }
    },
    
    async handleToggleModelStatus(modelId, newStatus) {
        try {
            UI.showLoading(`${newStatus ? 'Reactivating' : 'Deactivating'} model...`);
            
            await API.updateModel(modelId, {
                is_active: newStatus
            });
            
            UI.showToast(`Model ${newStatus ? 'reactivated' : 'deactivated'} successfully`, 'success');
            
            // Reload models
            await this.loadModels();
            this.renderModels();
            
        } catch (error) {
            console.error('Toggle model status error:', error);
            UI.showToast('Failed to update model status: ' + error.message, 'error');
        }
    },
    
    // ========================================
    // LOCAL TTS PODCAST GENERATION
    // ========================================
    
    async loadLocalTts() {
        // Check if local TTS server is healthy by fetching voices
        try {
            const response = await fetch(`${this.localTtsApiUrl}/voices`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!response.ok) {
                throw new Error('TTS server returned error');
            }
            
            const data = await response.json();
            this.localTtsVoices = data.voices || [];
            this.localTtsLanguages = data.languages || [];
            this.localTtsHealthy = true;
            
            // Load courses for selection
            const coursesData = await API.getCourses({ includeInactive: false });
            AppState.setCourses(coursesData.data?.courses || []);
            
            this.renderLocalTts();
        } catch (error) {
            console.error('Local TTS health check failed:', error);
            this.localTtsHealthy = false;
            this.localTtsVoices = [];
            this.localTtsLanguages = [];
            this.renderLocalTtsOffline();
        }
    },
    
    renderLocalTtsOffline() {
        const viewTabsHTML = this.getLocalTtsViewTabs();
        
        const contentHTML = `
            <div class="content-empty" style="padding: 3rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .38-.03.75-.08 1.12"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <h3 style="color: #ef4444;">Local TTS Server Offline</h3>
                <p style="max-width: 400px; margin: 1rem auto;">
                    Cannot connect to the local Kokoro TTS server at <code>${this.localTtsApiUrl}</code>
                </p>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; max-width: 500px; text-align: left;">
                    <strong>To start the TTS server:</strong>
                    <ol style="margin: 0.5rem 0 0 1.5rem; line-height: 1.8;">
                        <li>Navigate to the local_tts directory</li>
                        <li>Run: <code>python server.py</code></li>
                        <li>Wait for "Server running on http://127.0.0.1:8880"</li>
                    </ol>
                </div>
                <button class="action-btn" onclick="GenerateSection.load()" style="margin-top: 1.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg>
                    Retry Connection
                </button>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + contentHTML;
    },
    
    getLocalTtsViewTabs() {
        return `
            <div class="content-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="action-btn ${this.currentView === 'tasks' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('tasks')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        Generation Tasks
                    </button>
                    <button class="action-btn ${this.currentView === 'prompts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('prompts')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        AI Prompts
                    </button>
                    <button class="action-btn ${this.currentView === 'models' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('models')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9.66-9H16m-8 0H1.34M17.66 17.66l-4.24-4.24m-2.83 0l-4.24 4.24M17.66 6.34l-4.24 4.24m-2.83 0l-4.24-4.24"></path></svg>
                        AI Models
                    </button>
                    <button class="action-btn ${this.currentView === 'localTts' ? '' : 'action-btn-secondary'}" onclick="GenerateSection.switchView('localTts')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        Local TTS
                    </button>
                </div>
            </div>
        `;
    },
    
    renderLocalTts() {
        const viewTabsHTML = this.getLocalTtsViewTabs();
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({
            value: c.id,
            label: UI.formatCourseLabel(c)
        }));
        
        const statusHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #f0fdf4; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #22c55e;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span style="color: #166534; font-weight: 500;">Local TTS Server Online</span>
                <span style="color: #15803d; font-size: 0.85rem; margin-left: auto;">${this.localTtsVoices.length} voices available</span>
            </div>
        `;
        
        const formHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Course</label>
                    <select class="filter-select" id="localTtsCourseSelect" onchange="GenerateSection.onLocalTtsCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
        
        const emptyHTML = `
            <div class="content-empty" style="padding: 2rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <h3>Generate Podcast Audio</h3>
                <p>Select a course to generate podcast audio from existing scripts using local TTS.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + statusHTML + formHTML + emptyHTML;
    },
    
    async onLocalTtsCourseChange() {
        const courseId = document.getElementById('localTtsCourseSelect').value;
        if (!courseId) {
            this.renderLocalTts();
            return;
        }
        
        // Show loading state
        const contentArea = UI.elements.contentArea;
        const existingContent = contentArea.innerHTML;
        
        // Find the content-empty div and replace with loading
        const emptyDiv = contentArea.querySelector('.content-empty');
        if (emptyDiv) {
            emptyDiv.innerHTML = `
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: #64748B;">Loading topics with podcast scripts...</p>
            `;
        }
        
        try {
            // Get course info
            const courseData = await API.getCourse(courseId);
            const course = courseData.data?.course;
            
            // Load tiers for this course
            const tiersData = await API.getTiers(courseId, false);
            const tiers = tiersData.data?.tiers || [];
            
            if (tiers.length === 0) {
                this.renderLocalTtsNoTiers();
                return;
            }
            
            // Load topics for each tier and check for podcast scripts
            const tiersWithTopics = [];
            for (const tier of tiers) {
                const topicsData = await API.getTopics({ tierId: tier.id }, false);
                const topics = topicsData.data?.topics || [];
                
                // Optimization: Use flags from getTopics directly to avoid N+1 requests
                // We don't need the podcast ID or script preview at this stage
                const topicsWithPodcastInfo = topics.map(topic => {
                    // Check flags from getTopics response
                    // Fallback to false if undefined (though API should return them)
                    const hasScript = typeof topic.has_podcast_script !== 'undefined' 
                        ? topic.has_podcast_script 
                        : false;
                        
                    const hasAudio = typeof topic.has_podcast_file !== 'undefined'
                        ? topic.has_podcast_file
                        : false;
                    
                    return {
                        ...topic,
                        hasScript: hasScript,
                        hasAudio: hasAudio,
                        // We don't have these yet, but we'll fetch them during generation
                        scriptPodcastId: null, 
                        scriptPreview: null,
                        existingAudioUrl: null
                    };
                });
                
                tiersWithTopics.push({
                    ...tier,
                    topics: topicsWithPodcastInfo
                });
            }
            
            this.renderLocalTtsTopicSelection(course, tiersWithTopics);
            
        } catch (error) {
            console.error('Error loading course topics:', error);
            UI.showToast('Failed to load course topics: ' + error.message, 'error');
        }
    },
    
    renderLocalTtsNoTiers() {
        const viewTabsHTML = this.getLocalTtsViewTabs();
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + `
            <div class="content-empty" style="padding: 2rem;">
                <h3>No Tiers Found</h3>
                <p>This course doesn't have any tiers with topics yet.</p>
                <button class="action-btn action-btn-secondary" onclick="GenerateSection.renderLocalTts()">Back</button>
            </div>
        `;
    },
    
    renderLocalTtsTopicSelection(course, tiersWithTopics) {
        const viewTabsHTML = this.getLocalTtsViewTabs();
        
        // Build voice options with flags and clear gender labels
        const voicePrefixMap = {
            'af': { flag: '🇺🇸', lang: 'American', gender: '♀ Female' },
            'am': { flag: '🇺🇸', lang: 'American', gender: '♂ Male' },
            'bf': { flag: '🇬🇧', lang: 'British', gender: '♀ Female' },
            'bm': { flag: '🇬🇧', lang: 'British', gender: '♂ Male' },
            'jf': { flag: '🇯🇵', lang: 'Japanese', gender: '♀ Female' },
            'jm': { flag: '🇯🇵', lang: 'Japanese', gender: '♂ Male' },
            'zf': { flag: '🇨🇳', lang: 'Chinese', gender: '♀ Female' },
            'zm': { flag: '🇨🇳', lang: 'Chinese', gender: '♂ Male' },
            'kf': { flag: '🇰🇷', lang: 'Korean', gender: '♀ Female' },
            'km': { flag: '🇰🇷', lang: 'Korean', gender: '♂ Male' },
            'ff': { flag: '🇫🇷', lang: 'French', gender: '♀ Female' },
            'fm': { flag: '🇫🇷', lang: 'French', gender: '♂ Male' },
            'df': { flag: '🇩🇪', lang: 'German', gender: '♀ Female' },
            'dm': { flag: '🇩🇪', lang: 'German', gender: '♂ Male' },
            'sf': { flag: '🇪🇸', lang: 'Spanish', gender: '♀ Female' },
            'sm': { flag: '🇪🇸', lang: 'Spanish', gender: '♂ Male' },
            'if': { flag: '🇮🇹', lang: 'Italian', gender: '♀ Female' },
            'im': { flag: '🇮🇹', lang: 'Italian', gender: '♂ Male' },
            'pf': { flag: '🇧🇷', lang: 'Portuguese', gender: '♀ Female' },
            'pm': { flag: '🇧🇷', lang: 'Portuguese', gender: '♂ Male' }
        };
        
        const voiceOptions = this.localTtsVoices.map(v => {
            const prefix = v.substring(0, 2);
            const info = voicePrefixMap[prefix];
            const voiceName = v.substring(3).charAt(0).toUpperCase() + v.substring(4);
            let label = info 
                ? `${info.flag} ${info.gender} - ${voiceName} (${info.lang})`
                : v;
            return { value: v, label, prefix };
        });
        
        // Sort voices: group by language, then by gender (female first), then by name
        voiceOptions.sort((a, b) => {
            const aInfo = voicePrefixMap[a.prefix] || { lang: 'ZZZ', gender: '' };
            const bInfo = voicePrefixMap[b.prefix] || { lang: 'ZZZ', gender: '' };
            if (aInfo.lang !== bInfo.lang) return aInfo.lang.localeCompare(bInfo.lang);
            if (aInfo.gender !== bInfo.gender) return aInfo.gender.localeCompare(bInfo.gender);
            return a.value.localeCompare(b.value);
        });
        
        // Build language options with flags
        const langFlagMap = {
            'en-us': '🇺🇸', 'en-gb': '🇬🇧', 'ja': '🇯🇵', 'zh': '🇨🇳',
            'ko': '🇰🇷', 'fr-fr': '🇫🇷', 'de': '🇩🇪', 'es': '🇪🇸',
            'it': '🇮🇹', 'pt-br': '🇧🇷'
        };
        const languageOptions = this.localTtsLanguages.map(lang => ({
            code: lang.code,
            label: `${langFlagMap[lang.code] || '🌐'} ${lang.name}`
        }));
        
        // Count topics with scripts
        let topicsWithScripts = 0;
        let topicsWithoutScripts = 0;
        let topicsWithExistingAudio = 0;
        
        tiersWithTopics.forEach(tier => {
            tier.topics.forEach(topic => {
                if (topic.hasScript) {
                    topicsWithScripts++;
                    if (topic.hasAudio) topicsWithExistingAudio++;
                } else {
                    topicsWithoutScripts++;
                }
            });
        });
        
        // Build tier sections with topics
        let tiersHTML = '';
        for (const tier of tiersWithTopics) {
            if (tier.topics.length === 0) continue;
            
            const topicsHTML = tier.topics.map(topic => {
                const hasScript = topic.hasScript;
                const hasAudio = topic.hasAudio;
                
                let statusBadge = '';
                let itemClass = 'individual-topic-item';
                let disabled = '';
                let tooltip = '';
                
                if (!hasScript) {
                    itemClass += ' disabled no-script';
                    disabled = 'disabled';
                    statusBadge = '<span class="topic-status-badge no-script" title="No podcast script available">No Script</span>';
                    tooltip = 'title="Cannot generate audio: No podcast script available for this topic"';
                } else if (hasAudio) {
                    itemClass += ' has-audio';
                    statusBadge = '<span class="topic-status-badge has-audio" title="Already has audio - will be replaced">Has Audio</span>';
                }
                
                return `
                    <label class="${itemClass}" ${tooltip}>
                        <input type="checkbox" name="topicIds" value="${topic.id}" 
                            data-podcast-id="${topic.scriptPodcastId || ''}"
                            class="topic-checkbox" ${disabled} ${!hasScript ? 'disabled' : ''}>
                        <div class="topic-info">
                            <span class="topic-name">${UI.escapeHtml(topic.name)}</span>
                            ${statusBadge}
                        </div>
                    </label>
                `;
            }).join('');
            
            tiersHTML += `
                <div class="tier-section">
                    <div class="tier-header">
                        <label class="tier-select-all">
                            <input type="checkbox" class="tier-checkbox" data-tier="${tier.id}" onchange="GenerateSection.toggleLocalTtsTierTopics(this, '${tier.id}')">
                            <span class="tier-title">${UI.escapeHtml(tier.title)}</span>
                            <span class="tier-count">(${tier.topics.filter(t => t.hasScript).length}/${tier.topics.length} with scripts)</span>
                        </label>
                    </div>
                    <div class="tier-topics" id="local-tts-tier-${tier.id}">
                        ${topicsHTML}
                    </div>
                </div>
            `;
        }
        
        const formHTML = `
            <form id="localTtsGenerateForm" onsubmit="GenerateSection.handleLocalTtsGenerate(event); return false;">
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #f0fdf4; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #22c55e;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span style="color: #166534; font-weight: 500;">Local TTS Server Online</span>
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.renderLocalTts()" style="margin-left: auto; padding: 0.25rem 0.75rem; font-size: 0.85rem;">
                        ← Back to Course Selection
                    </button>
                </div>
                
                <h3 style="margin-bottom: 0.5rem;">${UI.escapeHtml(course.title)}</h3>
                <p style="color: #64748b; margin-bottom: 1.5rem;">Generate podcast audio from existing scripts for <strong>${course.year_name} ${course.subject_name}</strong></p>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #22c55e;">${topicsWithScripts}</div>
                        <div style="font-size: 0.85rem; color: #64748b;">With Scripts</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #f59e0b;">${topicsWithExistingAudio}</div>
                        <div style="font-size: 0.85rem; color: #64748b;">Already Have Audio</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #94a3b8;">${topicsWithoutScripts}</div>
                        <div style="font-size: 0.85rem; color: #64748b;">No Script</div>
                    </div>
                </div>
                
                <div style="background: #fff; border: 1px solid rgba(187, 202, 220, 0.5); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 1rem; color: #1e293b;">Voice Settings</h4>
                    
                    <div style="margin-bottom: 1rem;">
                        <label class="filter-label">Language</label>
                        <select class="filter-select" id="localTtsLanguage" style="max-width: 250px;">
                            ${languageOptions.map(l => `<option value="${l.code}" ${l.code === 'en-gb' ? 'selected' : ''}>${l.label}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label class="filter-label">Speaker 1 Voice</label>
                            <select class="filter-select" id="localTtsSpeaker1Voice">
                                ${voiceOptions.map(v => `<option value="${v.value}" ${v.value === 'optimal_uk_female' ? 'selected' : ''}>${v.label}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="filter-label">Speaker 1 Speed: <span id="localTtsSpeaker1SpeedValue">1.0</span>x</label>
                            <input type="range" class="form-range" id="localTtsSpeaker1Speed" value="1.0" min="0.5" max="2.0" step="0.05" oninput="document.getElementById('localTtsSpeaker1SpeedValue').textContent = this.value">
                        </div>
                        <div>
                            <label class="filter-label">Speaker 2 Voice</label>
                            <select class="filter-select" id="localTtsSpeaker2Voice">
                                ${voiceOptions.map(v => `<option value="${v.value}" ${v.value === 'optimal_uk_male' ? 'selected' : ''}>${v.label}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="filter-label">Speaker 2 Speed: <span id="localTtsSpeaker2SpeedValue">1.0</span>x</label>
                            <input type="range" class="form-range" id="localTtsSpeaker2Speed" value="1.0" min="0.5" max="2.0" step="0.05" oninput="document.getElementById('localTtsSpeaker2SpeedValue').textContent = this.value">
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <label class="filter-label">Pause Between Speakers: <span id="localTtsPauseDurationValue">0.3</span>s</label>
                        <input type="range" class="form-range" id="localTtsPauseDuration" value="0.3" min="0.1" max="1.5" step="0.1" style="max-width: 300px;" oninput="document.getElementById('localTtsPauseDurationValue').textContent = this.value">
                    </div>
                </div>
                
                <div class="selection-controls" style="margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.selectAllLocalTtsTopics(true)" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">Select All With Scripts</button>
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.selectAllLocalTtsTopics(false)" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">Deselect All</button>
                    <button type="button" class="action-btn action-btn-secondary" onclick="GenerateSection.selectLocalTtsTopicsWithoutAudio()" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">Select Without Audio</button>
                    <span class="selection-count" id="localTtsSelectionCount" style="margin-left: auto; font-size: 0.9rem; color: var(--color-grey-text);">0 topics selected</span>
                </div>
                
                <div class="topics-container" style="max-height: 350px; overflow-y: auto; border: 1px solid rgba(187, 202, 220, 0.5); border-radius: 10px; padding: 0.5rem;">
                    ${tiersHTML}
                </div>
                
                <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; margin-top: 1rem; border-left: 4px solid rgb(245, 158, 11);">
                    <strong style="color: rgb(180, 120, 0);">⚠️ Note:</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.6; font-size: 0.875rem;">
                        <li>Audio generation runs locally and may take ~1-2 seconds per minute of audio</li>
                        <li>Topics with existing audio will have their podcast URL replaced</li>
                        <li>Generated audio will be automatically uploaded to storage</li>
                    </ul>
                </div>
                
                ${UI.createModalActions(
                    'GenerateSection.renderLocalTts()',
                    'document.getElementById("localTtsGenerateForm").requestSubmit()',
                    'Generate Podcast Audio',
                    false
                )}
            </form>
        `;
        
        UI.elements.contentArea.innerHTML = viewTabsHTML + formHTML;
        
        // Setup selection listeners
        this.setupLocalTtsSelectionListeners();
    },
    
    setupLocalTtsSelectionListeners() {
        const checkboxes = document.querySelectorAll('#localTtsGenerateForm .topic-checkbox:not([disabled])');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => this.updateLocalTtsSelectionCount());
        });
        this.updateLocalTtsSelectionCount();
    },
    
    updateLocalTtsSelectionCount() {
        const checked = document.querySelectorAll('#localTtsGenerateForm .topic-checkbox:checked').length;
        const countEl = document.getElementById('localTtsSelectionCount');
        if (countEl) {
            countEl.textContent = `${checked} topic${checked !== 1 ? 's' : ''} selected`;
        }
    },
    
    toggleLocalTtsTierTopics(tierCheckbox, tierId) {
        const tierContainer = document.getElementById(`local-tts-tier-${tierId}`);
        if (!tierContainer) return;
        
        const topicCheckboxes = tierContainer.querySelectorAll('.topic-checkbox:not([disabled])');
        topicCheckboxes.forEach(cb => {
            cb.checked = tierCheckbox.checked;
        });
        this.updateLocalTtsSelectionCount();
    },
    
    selectAllLocalTtsTopics(select) {
        const checkboxes = document.querySelectorAll('#localTtsGenerateForm .topic-checkbox:not([disabled])');
        checkboxes.forEach(cb => cb.checked = select);
        
        // Update tier checkboxes
        const tierCheckboxes = document.querySelectorAll('#localTtsGenerateForm .tier-checkbox');
        tierCheckboxes.forEach(cb => cb.checked = select);
        
        this.updateLocalTtsSelectionCount();
    },
    
    selectLocalTtsTopicsWithoutAudio() {
        const items = document.querySelectorAll('#localTtsGenerateForm .individual-topic-item');
        items.forEach(item => {
            const checkbox = item.querySelector('.topic-checkbox:not([disabled])');
            if (checkbox) {
                // Select only if it doesn't have audio (no has-audio class)
                checkbox.checked = !item.classList.contains('has-audio');
            }
        });
        
        // Update tier checkboxes
        const tierCheckboxes = document.querySelectorAll('#localTtsGenerateForm .tier-checkbox');
        tierCheckboxes.forEach(tierCb => {
            const tierId = tierCb.dataset.tier;
            const tierContainer = document.getElementById(`local-tts-tier-${tierId}`);
            if (tierContainer) {
                const enabledCbs = tierContainer.querySelectorAll('.topic-checkbox:not([disabled])');
                const allChecked = Array.from(enabledCbs).every(cb => cb.checked);
                tierCb.checked = allChecked && enabledCbs.length > 0;
            }
        });
        
        this.updateLocalTtsSelectionCount();
    },
    
    async handleLocalTtsGenerate(event) {
        event.preventDefault();
        
        // Get selected topics with their podcast IDs
        const selectedCheckboxes = Array.from(document.querySelectorAll('#localTtsGenerateForm .topic-checkbox:checked'));
        
        if (selectedCheckboxes.length === 0) {
            UI.showToast('Please select at least one topic', 'error');
            return;
        }
        
        const selectedTopics = selectedCheckboxes.map(cb => ({
            topicId: cb.value,
            podcastId: cb.dataset.podcastId
        }));
        
        // Get voice settings
        const language = document.getElementById('localTtsLanguage').value;
        const speaker1Voice = document.getElementById('localTtsSpeaker1Voice').value;
        const speaker1Speed = parseFloat(document.getElementById('localTtsSpeaker1Speed').value) || 1.0;
        const speaker2Voice = document.getElementById('localTtsSpeaker2Voice').value;
        const speaker2Speed = parseFloat(document.getElementById('localTtsSpeaker2Speed').value) || 1.0;
        const pauseDuration = parseFloat(document.getElementById('localTtsPauseDuration').value) || 0.3;
        
        // Confirm
        if (!UI.confirm(`Generate podcast audio for ${selectedTopics.length} topic(s)?\\n\\nThis will:\\n• Generate audio using local TTS\\n• Upload audio files to storage\\n• Update podcast entries with new audio URLs\\n\\nTopics with existing audio will be replaced.`)) {
            return;
        }
        
        // Start generation
        await this.executeLocalTtsGeneration(selectedTopics, {
            language,
            speaker1Voice,
            speaker1Speed,
            speaker2Voice,
            speaker2Speed,
            pauseDuration
        });
    },
    
    async executeLocalTtsGeneration(selectedTopics, settings) {
        const totalTopics = selectedTopics.length;
        let completed = 0;
        let errors = 0;
        const results = [];
        
        // Show progress modal
        UI.openModal('Generating Podcast Audio', `
            <div id="localTtsProgressContainer">
                <p style="margin-bottom: 1rem;">Generating audio for ${totalTopics} topic(s)...</p>
                <div class="progress-bar-container" style="height: 24px; background: #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;">
                    <div id="localTtsProgressBar" style="height: 100%; background: linear-gradient(90deg, #3678AE, #5BA0D0); width: 0%; transition: width 0.3s ease;"></div>
                </div>
                <div id="localTtsProgressText" style="text-align: center; color: #64748b; font-size: 0.9rem;">0 / ${totalTopics} completed</div>
                <div id="localTtsCurrentTopic" style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: #94a3b8;">Preparing...</div>
                <div id="localTtsErrorLog" style="margin-top: 1rem; max-height: 150px; overflow-y: auto;"></div>
            </div>
        `);
        
        const progressBar = document.getElementById('localTtsProgressBar');
        const progressText = document.getElementById('localTtsProgressText');
        const currentTopicEl = document.getElementById('localTtsCurrentTopic');
        const errorLog = document.getElementById('localTtsErrorLog');
        
        for (const { topicId } of selectedTopics) {
            let topicName = `Topic ${topicId.substring(0, 8)}...`;
            let currentStep = 'initializing';
            
            try {
                // Update current topic display
                currentTopicEl.textContent = `Processing topic ${completed + 1} of ${totalTopics}...`;
                
                // Step 1: Fetch podcast script
                currentStep = 'fetching script';
                const podcastData = await API.getPodcasts(topicId);
                const podcasts = podcastData.data?.podcasts || [];
                
                // Find the podcast with a script (since we didn't pass an ID)
                const podcast = podcasts.find(p => p.script && p.script.trim().length > 0);
                
                if (!podcast || !podcast.script) {
                    throw new Error('Podcast script not found');
                }
                
                const targetPodcastId = podcast.id;
                
                topicName = podcastData.data?.topic?.name || topicName;
                currentTopicEl.textContent = `Generating audio for: ${topicName}`;
                
                // Step 2: Generate audio using local TTS
                currentStep = 'generating audio';
                console.log(`Generating audio for topic ${topicId}...`);
                const audioBlob = await this.generateLocalTtsAudio(podcast.script, settings);
                console.log(`Audio generated. Size: ${audioBlob.size} bytes`);
                
                if (audioBlob.size === 0) {
                    throw new Error('Generated audio is empty');
                }
                
                // Step 3: Upload audio to storage
                currentStep = 'uploading audio';
                currentTopicEl.textContent = `Uploading audio for: ${topicName}`;
                const fileName = `podcast_${topicId}_${Date.now()}.mp3`;
                const file = new File([audioBlob], fileName, { type: 'audio/mpeg' });
                console.log(`Starting upload for ${fileName}...`);
                
                const uploadResult = await API.uploadFile(file);
                console.log('Upload successful');
                
                // Step 4: Update podcast with new URL
                currentStep = 'updating podcast';
                const audioUrl = uploadResult.file_url;
                const fileSizeBytes = audioBlob.size;
                
                // Get audio duration
                let durationSeconds = null;
                try {
                    durationSeconds = await this.getAudioBlobDuration(audioBlob);
                } catch (e) {
                    console.warn('Could not determine audio duration:', e);
                }
                
                await API.updatePodcast(targetPodcastId, {
                    url: audioUrl,
                    file_size: fileSizeBytes,
                    length_seconds: durationSeconds
                });
                
                results.push({ topicId, topicName, success: true });
                completed++;
                
            } catch (error) {
                console.error(`Error processing topic ${topicId} (${currentStep}):`, error);
                errors++;
                completed++;
                
                const errorMsg = `${currentStep}: ${error.message}`;
                results.push({ topicId, topicName, success: false, error: errorMsg });
                
                // Show error in log
                if (errorLog) {
                    errorLog.innerHTML += `<div style="color: #ef4444; font-size: 0.85rem; padding: 0.25rem 0;">❌ Error: ${UI.escapeHtml(error.message)}</div>`;
                }
            }
            
            // Update progress
            const percent = Math.round((completed / totalTopics) * 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.textContent = `${completed} / ${totalTopics} completed`;
        }
        
        // Show completion
        this.showLocalTtsResults(results, completed, errors);
    },
    
    async generateLocalTtsAudio(script, settings) {
        const response = await fetch(`${this.localTtsApiUrl}/v1/audio/podcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                script: script,
                speaker1_voice: settings.speaker1Voice,
                speaker1_speed: settings.speaker1Speed,
                speaker2_voice: settings.speaker2Voice,
                speaker2_speed: settings.speaker2Speed,
                lang: settings.language || 'en-us',
                pause_duration: settings.pauseDuration,
                output_format: 'mp3'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `TTS generation failed (${response.status})`);
        }
        
        return await response.blob();
    },
    
    async getAudioBlobDuration(blob) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const objectUrl = URL.createObjectURL(blob);
            
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
                reject(new Error('Could not load audio'));
            });
            
            audio.src = objectUrl;
        });
    },
    
    showLocalTtsResults(results, completed, errors) {
        const successCount = completed - errors;
        
        const resultsHTML = results.map(r => {
            const statusClass = r.success ? 'success' : 'error';
            const statusIcon = r.success 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            
            return `
                <div class="result-item ${statusClass}">
                    <span class="result-icon">${statusIcon}</span>
                    <div class="result-info">
                        <span class="result-topic">${UI.escapeHtml(r.topicName || r.topicId)}</span>
                    </div>
                    <div class="result-details">
                        ${r.success ? '<span class="gen-badge notes">Audio ✓</span>' : `<span class="error-text">${UI.escapeHtml(r.error)}</span>`}
                    </div>
                </div>
            `;
        }).join('');
        
        const modalHTML = `
            <div class="individual-results">
                <h2>Local TTS Generation Complete</h2>
                <div class="results-summary">
                    <div class="summary-stat">
                        <span class="stat-value">${completed}</span>
                        <span class="stat-label">Topics Processed</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${successCount}</span>
                        <span class="stat-label">Audio Generated</span>
                    </div>
                    <div class="summary-stat ${errors > 0 ? 'has-errors' : ''}">
                        <span class="stat-value">${errors}</span>
                        <span class="stat-label">Errors</span>
                    </div>
                </div>
                
                <div class="results-list" style="max-height: 300px; overflow-y: auto; margin-top: 1rem;">
                    ${resultsHTML}
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="action-btn action-btn-secondary" onclick="UI.closeModal(); GenerateSection.load();">Close</button>
                </div>
            </div>
        `;
        
        UI.openModal('Generation Results', modalHTML);
    },
    
    // Cleanup on section unload
    cleanup() {
        this.stopPolling();
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
