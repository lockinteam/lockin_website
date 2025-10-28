// Courses section management

const CoursesSection = {
    includeInactive: false,
    
    async load() {
        UI.showLoading('Loading courses...');
        
        try {
            // Load years and subjects for filters if not already loaded
            if (AppState.years.length === 0) {
                const yearsData = await API.getYears(false); // Only active years
                AppState.setYears(yearsData.data.years || []);
            }
            if (AppState.subjects.length === 0) {
                const subjectsData = await API.getSubjects(false); // Only active subjects
                AppState.setSubjects(subjectsData.data.subjects || []);
            }
            
            // Load courses with filters
            const filters = {
                yearId: AppState.filters.courses.yearId,
                subjectId: AppState.filters.courses.subjectId,
                includeInactive: this.includeInactive
            };
            
            const data = await API.getCourses(filters);
            AppState.setCourses(data.data.courses || []);
            this.render();
        } catch (error) {
            UI.showEmpty('Error Loading Courses', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    render() {
        const courses = AppState.courses;
        const years = AppState.years;
        const subjects = AppState.subjects;
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Course',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'CoursesSection.openCreateModal()'
        );
        
        const yearOptions = [
            { value: '', label: 'All Years' },
            ...years.map(y => ({ value: y.id, label: y.name }))
        ];
        
        const subjectOptions = [
            { value: '', label: 'All Subjects' },
            ...subjects.map(s => ({ value: s.id, label: s.name }))
        ];
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Year</label>
                    <select class="filter-select" id="courseYearFilter" onchange="CoursesSection.onYearFilterChange()">
                        ${yearOptions.map(opt => `<option value="${opt.value}" ${opt.value === (AppState.filters.courses.yearId || '') ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Subject</label>
                    <select class="filter-select" id="courseSubjectFilter" onchange="CoursesSection.onSubjectFilterChange()">
                        ${subjectOptions.map(opt => `<option value="${opt.value}" ${opt.value === (AppState.filters.courses.subjectId || '') ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveCourses" ${this.includeInactive ? 'checked' : ''} onchange="CoursesSection.toggleIncludeInactive()">
                    <label for="includeInactiveCourses">Show Inactive</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (courses.length === 0) {
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                    <h3>No Courses Found</h3>
                    <p>No courses match your current filters. Try adjusting the filters or create a new course.</p>
                    <button class="action-btn" onclick="CoursesSection.openCreateModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create Course
                    </button>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = courses.map(course => this.renderCourseCard(course)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderCourseCard(course) {
        const badgeClass = course.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = course.is_active ? 'Active' : 'Inactive';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(course.title)}</h3>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                ${course.description ? `<p class="card-description">${UI.escapeHtml(course.description)}</p>` : ''}
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Year</span>
                        <span class="meta-value">${course.year_name ? UI.escapeHtml(course.year_name) : '—'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Subject</span>
                        <span class="meta-value">${course.subject_name ? UI.escapeHtml(course.subject_name) : '—'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${UI.formatDate(course.created_at)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="CoursesSection.openEditModal('${course.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="CoursesSection.handleDelete('${course.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${course.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onYearFilterChange() {
        const select = document.getElementById('courseYearFilter');
        AppState.setCoursesYearFilter(select.value || null);
        this.load();
    },
    
    onSubjectFilterChange() {
        const select = document.getElementById('courseSubjectFilter');
        AppState.setCoursesSubjectFilter(select.value || null);
        this.load();
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load();
    },
    
    openCreateModal() {
        const years = AppState.years;
        const subjects = AppState.subjects;
        
        if (years.length === 0 || subjects.length === 0) {
            UI.showToast('Please create at least one year and one subject first', 'warning');
            return;
        }
        
        const yearOptions = years.map(y => ({ value: y.id, label: y.name }));
        const subjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));
        
        const formHTML = `
            <form id="createCourseForm" class="modal-form" onsubmit="CoursesSection.handleCreate(event)">
                ${UI.createFormRow('Course Title', UI.createTextInput('courseTitle', '', 'e.g., GCSE Mathematics Higher Tier', true))}
                ${UI.createFormRow('Year', UI.createSelect('courseYear', yearOptions))}
                ${UI.createFormRow('Subject', UI.createSelect('courseSubject', subjectOptions))}
                ${UI.createFormRow('Description', UI.createTextarea('courseDescription', '', 'Optional course description'))}
                ${UI.createFormRow('Specification Link', UI.createUrlInput('courseSpecLink', '', 'https://example.com/spec'), 'Optional link to course specification')}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Course')}
            </form>
        `;
        
        UI.openModal('Create New Course', formHTML);
    },
    
    openEditModal(courseId) {
        const course = AppState.findCourseById(courseId);
        if (!course) return;
        
        const formHTML = `
            <form id="editCourseForm" class="modal-form" onsubmit="CoursesSection.handleUpdate(event, '${courseId}')">
                ${UI.createFormRow('Course Title', UI.createTextInput('courseTitle', course.title, '', true))}
                ${UI.createFormRow('Description', UI.createTextarea('courseDescription', course.description || '', 'Optional course description'))}
                ${UI.createFormRow('Specification Link', UI.createUrlInput('courseSpecLink', course.link_to_specification || '', 'https://example.com/spec'))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('courseStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], course.is_active ? 'true' : 'false')
                )}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Course')}
            </form>
        `;
        
        UI.openModal('Edit Course', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const title = document.getElementById('courseTitle').value.trim();
        const yearId = document.getElementById('courseYear').value;
        const subjectId = document.getElementById('courseSubject').value;
        const description = document.getElementById('courseDescription').value.trim() || null;
        const specLink = document.getElementById('courseSpecLink').value.trim() || null;
        
        if (!title || !yearId || !subjectId) {
            UI.showToast('Title, year, and subject are required', 'error');
            return;
        }
        
        try {
            await API.createCourse(yearId, subjectId, title, description, specLink);
            UI.closeModal();
            UI.showToast('Course created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, courseId) {
        event.preventDefault();
        
        const title = document.getElementById('courseTitle').value.trim();
        const description = document.getElementById('courseDescription').value.trim() || null;
        const specLink = document.getElementById('courseSpecLink').value.trim() || null;
        const isActive = document.getElementById('courseStatus').value === 'true';
        
        if (!title) {
            UI.showToast('Course title is required', 'error');
            return;
        }
        
        try {
            await API.updateCourse(courseId, { 
                title, 
                description, 
                link_to_specification: specLink, 
                is_active: isActive 
            });
            UI.closeModal();
            UI.showToast('Course updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(courseId) {
        const course = AppState.findCourseById(courseId);
        if (!course) return;
        
        const action = course.is_active ? 'deactivate' : 'delete';
        if (!UI.confirm(`Are you sure you want to ${action} "${course.title}"?`)) {
            return;
        }
        
        try {
            await API.deleteCourse(courseId);
            UI.showToast(`Course ${action}d successfully`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};
