// Generate section management - AI-powered content generation

const GenerateSection = {
    pollInterval: null,
    pollIntervalMs: 5000, // Poll every 5 seconds
    
    async load() {
        UI.showLoading('Loading generation tasks...');
        
        try {
            await this.loadTasks();
            this.render();
            this.startPolling();
        } catch (error) {
            console.error('Load error:', error);
            UI.showToast('Failed to load generation tasks', 'error');
        }
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
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
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
            UI.showToast('Failed to upload specification: ' + error.message, 'error');
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
    
    // Cleanup on section unload
    cleanup() {
        this.stopPolling();
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
