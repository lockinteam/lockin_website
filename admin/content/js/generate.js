// Generate section management - AI-powered content generation

const GenerateSection = {
    pollInterval: null,
    pollIntervalMs: 5000, // Poll every 5 seconds
    currentView: 'tasks', // 'tasks', 'prompts', or 'models'
    
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
                task.status.startsWith(status.replace('_', ' ')) || task.status === status
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
        const activeTasks = AppState.generateTasks.filter(task => 
            ['info_generating', 'content_generating', 'generating_papers'].some(status => 
                task.status.startsWith(status.replace('_', ' ')) || task.status === status
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
            this.render();
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    },
    
    render() {
        const tasks = AppState.generateTasks;
        
        const viewTabsHTML = `
            <div class="content-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem;">
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
                <p class="form-description">Upload a course specification PDF to extract course information and generate content using AI.</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <label class="filter-label" style="margin-bottom: 0.5rem; display: block;">Specification PDF</label>
                    <input type="file" id="specFileInput" accept="application/pdf" style="display: none;" onchange="GenerateSection.onSpecFileSelected()">
                    <div id="specDropZone" class="csv-drop-zone" onclick="document.getElementById('specFileInput').click()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <div class="csv-drop-zone-text">
                            <strong>Click to browse</strong> or drag and drop your PDF file here
                        </div>
                        <div class="csv-drop-zone-hint">Maximum file size: 100MB (admin limit)</div>
                    </div>
                    <div id="specFilePreview" style="display: none; margin-top: 1rem; padding: 0.75rem; background: rgba(54, 120, 174, 0.1); border-radius: 8px; align-items: center; gap: 0.5rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <div style="flex: 1;">
                            <div id="specFileName" style="font-weight: 600; color: var(--color-primary-blue);"></div>
                            <div id="specFileSize" style="font-size: 0.875rem; color: var(--color-grey-text); margin-top: 0.25rem;"></div>
                        </div>
                        <button type="button" onclick="GenerateSection.clearSpecFile()" style="background: none; border: none; color: var(--color-grey-text); cursor: pointer; padding: 0.25rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                
                ${UI.createModalActions(
                    'UI.closeModal()',
                    'document.getElementById("generateCreateForm").requestSubmit()',
                    'Upload & Extract Info',
                    false
                )}
            </form>
        `;
        
        UI.openModal('Create Generation Task', formHTML);
        
        // Setup drag and drop
        setTimeout(() => {
            const dropZone = document.getElementById('specDropZone');
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
                        document.getElementById('specFileInput').files = files;
                        GenerateSection.onSpecFileSelected();
                    }
                });
            }
        }, 100);
    },
    
    onSpecFileSelected() {
        const fileInput = document.getElementById('specFileInput');
        const filePreview = document.getElementById('specFilePreview');
        const fileName = document.getElementById('specFileName');
        const fileSize = document.getElementById('specFileSize');
        const dropZone = document.getElementById('specDropZone');
        const file = fileInput.files[0];
        
        if (!file) {
            filePreview.style.display = 'none';
            if (dropZone) dropZone.style.display = 'flex';
            return;
        }
        
        // Validate file type
        if (file.type !== 'application/pdf') {
            UI.showToast('Please select a PDF file', 'error');
            fileInput.value = '';
            return;
        }
        
        // Validate file size (100MB for admins)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            UI.showToast('File size exceeds 100MB limit', 'error');
            fileInput.value = '';
            return;
        }
        
        // Show preview
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        filePreview.style.display = 'flex';
        if (dropZone) dropZone.style.display = 'none';
    },
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
    
    clearSpecFile() {
        const fileInput = document.getElementById('specFileInput');
        const filePreview = document.getElementById('specFilePreview');
        const dropZone = document.getElementById('specDropZone');
        
        fileInput.value = '';
        filePreview.style.display = 'none';
        if (dropZone) dropZone.style.display = 'flex';
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
    
    async handleUploadSpec(event) {
        event.preventDefault();
        
        const fileInput = document.getElementById('specFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            UI.showToast('Please select a file', 'error');
            return;
        }
        
        try {
            // Show loading state in modal (don't close it)
            this.showModalLoading('Uploading specification...');
            
            // Use the same upload method as other sections
            const uploadResult = await API.uploadFile(file);
            
            console.log('Upload result in generate.js:', uploadResult);
            
            // Update loading message
            this.showModalLoading('Extracting course information with AI...');
            
            // Extract course info using the file_url from upload
            const infoData = await API.generateInfo(uploadResult.file_url);
            
            // Reload tasks in background
            await this.loadTasks();
            
            // Show the editable form in the same modal with the extracted info
            this.openStartGenerationModal(infoData.data.task_id, infoData.data);
            
        } catch (error) {
            console.error('Upload/Generate error details:', error);
            // Format error message for better readability
            const errorMessage = error.message.replace(/\n\n/g, '\n').replace(/Details: /, '\n');
            UI.showToast(errorMessage, 'error', 8000); // Show for 8 seconds due to longer message
            UI.closeModal();
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
                    
                    ${UI.createFormRow(
                        'Description',
                        UI.createTextarea('description', courseInfo.description || '', 'Course description', 6)
                    )}
                    
                    ${UI.createFormRow(
                        'Specification URL',
                        UI.createUrlInput('linkToSpec', taskData.specification?.url || '', 'Optional: override specification URL'),
                        'Leave blank to use uploaded PDF'
                    )}
                    
                    <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-top: 1rem;">
                        <strong>What happens next:</strong>
                        <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.8;">
                            <li>Course will be created in the database</li>
                            <li>AI will generate papers, topics, notes, and questions</li>
                            <li>Generation runs in the background (~5-15 minutes)</li>
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
                link_to_specification: linkToSpec || null
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
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 0.5rem;">
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
            // Group prompts by stage
            const stageOrder = ['course_info', 'papers_topics', 'notes', 'questions'];
            const stageLabels = {
                'course_info': 'Course Info Extraction',
                'papers_topics': 'Papers & Topics Structure',
                'notes': 'Notes Generation',
                'questions': 'Questions Generation'
            };
            
            const groupedPrompts = {};
            stageOrder.forEach(stage => {
                groupedPrompts[stage] = prompts.filter(p => p.stage === stage);
            });
            
            let sectionsHTML = '';
            stageOrder.forEach(stage => {
                const stagePrompts = groupedPrompts[stage];
                if (stagePrompts.length > 0) {
                    const cardsHTML = stagePrompts.map(p => this.renderPromptCard(p)).join('');
                    sectionsHTML += `
                        <div style="margin-bottom: 2rem;">
                            <h3 style="color: var(--color-text-primary); font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">
                                ${stageLabels[stage]}
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
        const models = AppState.models;
        
        const viewTabsHTML = `
            <div class="content-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem;">
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
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (models.length === 0) {
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
    
    // Cleanup on section unload
    cleanup() {
        this.stopPolling();
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
