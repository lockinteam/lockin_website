// Topics section management
// Topics now belong to TIERS, not papers directly.
// Topics can be linked to multiple papers within the same tier via junction table.
// Hierarchy: Course → Tier → Topics → Content (Notes, Questions, Podcasts)

const TopicsSection = {
    includeInactive: true,
    searchQuery: '',
    
    async load() {
        UI.showLoading('Loading topics...');
        
        try {
            // Load courses for filter if not already loaded
            if (AppState.courses.length === 0) {
                const coursesData = await API.getCourses({ includeInactive: false });
                AppState.setCourses(coursesData.data.courses || []);
            }
            
            // Check if a course is selected
            if (!AppState.filters.topics.courseId) {
                this.renderCourseSelection();
                return;
            }
            
            // Load tiers for the selected course
            const tiersData = await API.getTiers(AppState.filters.topics.courseId, true);
            AppState.setTiers(tiersData.data.tiers || []);
            
            // Check if we need to show tier selection (tier is REQUIRED for topics)
            if (AppState.tiers.length > 0 && !AppState.filters.topics.tierId) {
                this.renderTierSelection();
                return;
            }
            
            // If course has no tiers, show message to create tiers first
            if (AppState.tiers.length === 0) {
                this.renderNoTiersMessage();
                return;
            }
            
            // Load papers for selected tier (optional filter, for display/linking)
            const papersData = await API.getPapers(
                AppState.filters.topics.courseId,
                AppState.filters.topics.tierId,
                false
            );
            AppState.setPapers(papersData.data.papers || []);
            
            // Load topics for selected tier (or filter by paper if selected)
            const filters = { tierId: AppState.filters.topics.tierId };
            if (AppState.filters.topics.paperId) {
                filters.paperId = AppState.filters.topics.paperId;
            }
            const data = await API.getTopics(filters, this.includeInactive);
            AppState.setTopics(data.data.topics || []);
            this.render(data.data);
        } catch (error) {
            UI.showEmpty('Error Loading Topics', error.message);
            UI.showToast(error.message, 'error');
        }
    },
    
    renderCourseSelection() {
        const courses = AppState.courses;
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: UI.formatCourseLabel(c) 
        }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 1;">
                    <label class="filter-label">Select Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        <option value="">-- Choose a course --</option>
                        ${courseOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <h3>Select a Course</h3>
                <p>Choose a course from the dropdown above, then select a tier to view topics.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },

    renderTierSelection() {
        const courses = AppState.courses;
        const tiers = AppState.tiers.filter(t => t.is_active);
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: UI.formatCourseLabel(c) 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Select Tier</label>
                    <select class="filter-select" id="topicTierFilter" onchange="TopicsSection.onTierChange()">
                        <option value="">-- Choose a tier --</option>
                        ${tierOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <h3>Select a Tier</h3>
                <p>Topics belong to tiers. Choose a tier from the dropdown above to view and manage its topics.</p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    renderNoTiersMessage() {
        const courses = AppState.courses;
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: UI.formatCourseLabel(c) 
        }));
        
        const selectionHTML = `
            <div class="content-filters">
                <div class="filter-group">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <h3>No Tiers Found</h3>
                <p>This course doesn't have any tiers yet. Topics belong to tiers, so you need to create tiers first.</p>
                <p style="margin-top: 10px;"><a href="#" onclick="ContentManagement.showSection('tiers'); return false;" style="color: var(--accent-primary);">Go to Tiers section to create tiers →</a></p>
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = selectionHTML;
    },
    
    render(contextData) {
        let topics = AppState.topics;
        
        // Apply search filter
        if (this.searchQuery) {
            topics = topics.filter(t => 
                t.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        // Apply inactive filter (already handled by includeInactive in load)
        // But for immediate UI updates after toggle, filter here too
        if (!this.includeInactive) {
            topics = topics.filter(t => t.is_active);
        }
        
        // Sort: active items first, then inactive items at the end
        topics.sort((a, b) => {
            if (a.is_active !== b.is_active) {
                return b.is_active - a.is_active; // active (true/1) comes before inactive (false/0)
            }
            return a.sort_order - b.sort_order; // then by sort_order
        });
        const courses = AppState.courses;
        const papers = AppState.papers;
        const tiers = AppState.tiers.filter(t => t.is_active);
        
        const courseOptions = courses.map(c => ({ 
            value: c.id, 
            label: UI.formatCourseLabel(c) 
        }));
        
        const tierOptions = tiers.map(t => ({ value: t.id, label: t.title }));
        
        // Paper filter is optional - shows all topics in tier by default
        const paperOptions = [{ value: '', label: 'All Papers' }].concat(
            papers.map(p => ({ value: p.id, label: p.name }))
        );
        
        const createBtnHTML = UI.renderActionBtn(
            'Create Topic',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'TopicsSection.openCreateModal()'
        );
        
        const tierFilterHTML = tiers.length > 0 ? `
            <div class="filter-group">
                <label class="filter-label">Tier</label>
                <select class="filter-select" id="topicTierFilter" onchange="TopicsSection.onTierChange()">
                    ${tierOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.tierId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
        const paperFilterHTML = papers.length > 0 ? `
            <div class="filter-group">
                <label class="filter-label">Filter by Paper</label>
                <select class="filter-select" id="topicPaperFilter" onchange="TopicsSection.onPaperChange()">
                    ${paperOptions.map(opt => `<option value="${opt.value}" ${opt.value === (AppState.filters.topics.paperId || '') ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        ` : '';
        
        const filtersHTML = `
            <div class="content-filters">
                <div class="filter-group" style="flex: 2;">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-select" id="topicSearchInput" placeholder="Search topics..." value="${this.searchQuery}" oninput="TopicsSection.onSearchChange()">
                </div>
                <div class="filter-group">
                    <label class="filter-label">Course</label>
                    <select class="filter-select" id="topicCourseFilter" onchange="TopicsSection.onCourseChange()">
                        ${courseOptions.map(opt => `<option value="${opt.value}" ${opt.value === AppState.filters.topics.courseId ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                ${tierFilterHTML}
                ${paperFilterHTML}
                <div class="filter-checkbox-group">
                    <input type="checkbox" id="includeInactiveTopics" ${this.includeInactive ? 'checked' : ''} onchange="TopicsSection.toggleIncludeInactive()">
                    <label for="includeInactiveTopics">Show Inactive</label>
                </div>
                <div style="margin-left: auto;">
                    ${createBtnHTML}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        
        if (topics.length === 0) {
            const message = this.includeInactive ? 'No topics found for this tier.' : 'No active topics found. Try showing inactive topics.';
            contentHTML = `
                <div class="content-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <h3>No Topics Found</h3>
                    <p>${message}</p>
                </div>
            `;
            UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
            return;
        }
        
        const cardsHTML = topics.map(topic => this.renderTopicCard(topic)).join('');
        contentHTML = `
            <div class="content-grid">
                ${cardsHTML}
            </div>
        `;
        
        UI.elements.contentArea.innerHTML = filtersHTML + contentHTML;
    },
    
    renderTopicCard(topic) {
        const badgeClass = topic.is_active ? 'badge-active' : 'badge-inactive';
        const badgeText = topic.is_active ? 'Active' : 'Inactive';
        
        // Optional badge
        const optionalBadge = topic.is_optional 
            ? '<span class="card-badge badge-optional" style="background-color: var(--accent-primary); color: white; margin-left: 0.5rem;">Optional</span>' 
            : '';
        
        // Show linked papers if available
        const linkedPapers = topic.papers || [];
        const linkedPapersText = linkedPapers.length > 0 
            ? linkedPapers.map(p => p.name || p.code).join(', ')
            : 'Not linked to any paper';
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">${UI.escapeHtml(topic.name)}</h3>
                    <div class="card-badges"><span class="card-badge ${badgeClass}">${badgeText}</span>${optionalBadge}</div>
                </div>
                <div class="card-meta">
                    <div class="meta-row">
                        <span class="meta-label">Sort Order</span>
                        <span class="meta-value">${topic.sort_order}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Linked Papers</span>
                        <span class="meta-value" title="${UI.escapeHtml(linkedPapersText)}">${linkedPapers.length > 0 ? linkedPapers.length + ' paper(s)' : 'None'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Notes</span>
                        <span class="meta-value">${topic.notes_count || 0} ${topic.has_notes ? '✓' : ''}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Questions</span>
                        <span class="meta-value">${topic.questions_count || 0} ${topic.has_questions ? '✓' : ''}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Podcasts</span>
                        <span class="meta-value">${topic.podcasts_count || 0} ${topic.has_podcast ? '✓' : ''}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="TopicsSection.openEditModal('${topic.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="card-action-btn destructive" onclick="TopicsSection.handleDelete('${topic.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        ${topic.is_active ? 'Deactivate' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    },
    
    onSearchChange() {
        const input = document.getElementById('topicSearchInput');
        const cursorPosition = input.selectionStart;
        this.searchQuery = input.value;
        const filters = { tierId: AppState.filters.topics.tierId };
        if (AppState.filters.topics.paperId) {
            filters.paperId = AppState.filters.topics.paperId;
        }
        this.render({ tier_id: AppState.filters.topics.tierId });
        // Restore focus and cursor position
        setTimeout(() => {
            const newInput = document.getElementById('topicSearchInput');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    },
    
    async onCourseChange() {
        const select = document.getElementById('topicCourseFilter');
        AppState.setTopicsCourseFilter(select.value || null);
        this.load();
    },
    
    async onTierChange() {
        const select = document.getElementById('topicTierFilter');
        AppState.setTopicsTierFilter(select.value || null);
        // Clear paper selection when tier changes
        AppState.setTopicsPaperFilter(null);
        // Clear papers list to force reload
        AppState.setPapers([]);
        this.load();
    },
    
    async onPaperChange() {
        const select = document.getElementById('topicPaperFilter');
        AppState.setTopicsPaperFilter(select.value || null);
        this.load();
    },
    
    toggleIncludeInactive() {
        this.includeInactive = !this.includeInactive;
        this.load();
    },
    
    openCreateModal() {
        if (!AppState.filters.topics.tierId) {
            UI.showToast('Please select a tier first', 'warning');
            return;
        }
        
        // Get papers for this tier to allow optional linking
        const papers = AppState.papers;
        const paperCheckboxes = papers.length > 0 ? papers.map(p => `
            <label class="checkbox-label">
                <input type="checkbox" name="topicPapers" value="${p.id}">
                ${UI.escapeHtml(p.name)}${p.code ? ` (${UI.escapeHtml(p.code)})` : ''}
            </label>
        `).join('') : '<p style="color: var(--text-secondary);">No papers in this tier yet.</p>';
        
        const formHTML = `
            <form id="createTopicForm" class="modal-form" onsubmit="TopicsSection.handleCreate(event)">
                ${UI.createFormRow('Topic Name', UI.createTextInput('topicName', '', 'e.g., Introduction to Algebra', true))}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('topicSortOrder', '0', '0', 0), 'Lower numbers appear first')}
                ${UI.createFormRow('Optional Topic', `
                    <label class="checkbox-label">
                        <input type="checkbox" id="topicIsOptional" name="topicIsOptional">
                        Mark as optional (students can choose to include/exclude this topic)
                    </label>
                `, 'Optional topics can be selected by students when enrolling')}
                ${papers.length > 0 ? UI.createFormRow('Link to Papers', `<div class="checkbox-group">${paperCheckboxes}</div>`, 'Optional: Select papers to link this topic to') : ''}
                ${UI.createModalActions('UI.closeModal()', null, 'Create Topic')}
            </form>
        `;
        
        UI.openModal('Create New Topic', formHTML);
    },
    
    openEditModal(topicId) {
        const topic = AppState.findTopicById(topicId);
        if (!topic) return;
        
        // Get papers for this tier
        const papers = AppState.papers;
        const linkedPaperIds = (topic.papers || []).map(p => p.id);
        
        const paperCheckboxes = papers.length > 0 ? papers.map(p => `
            <label class="checkbox-label">
                <input type="checkbox" name="topicPapers" value="${p.id}" ${linkedPaperIds.includes(p.id) ? 'checked' : ''}>
                ${UI.escapeHtml(p.name)}${p.code ? ` (${UI.escapeHtml(p.code)})` : ''}
            </label>
        `).join('') : '<p style="color: var(--text-secondary);">No papers in this tier yet.</p>';
        
        const formHTML = `
            <form id="editTopicForm" class="modal-form" onsubmit="TopicsSection.handleUpdate(event, '${topicId}')">
                ${UI.createFormRow('Topic Name', UI.createTextInput('topicName', topic.name, '', true))}
                ${UI.createFormRow('Sort Order', UI.createNumberInput('topicSortOrder', topic.sort_order, '', 0))}
                ${UI.createFormRow(
                    'Status',
                    UI.createSelect('topicStatus', [
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ], topic.is_active ? 'true' : 'false')
                )}
                ${UI.createFormRow('Optional Topic', `
                    <label class="checkbox-label">
                        <input type="checkbox" id="topicIsOptional" name="topicIsOptional" ${topic.is_optional ? 'checked' : ''}>
                        Mark as optional (students can choose to include/exclude this topic)
                    </label>
                `, 'Optional topics can be selected by students when enrolling')}
                ${papers.length > 0 ? UI.createFormRow('Linked Papers', `<div class="checkbox-group">${paperCheckboxes}</div>`, 'Select papers to link this topic to') : ''}
                ${UI.createModalActions('UI.closeModal()', null, 'Update Topic')}
            </form>
        `;
        
        UI.openModal('Edit Topic', formHTML);
    },
    
    async handleCreate(event) {
        event.preventDefault();
        
        const name = document.getElementById('topicName').value.trim();
        const sortOrder = parseInt(document.getElementById('topicSortOrder').value) || 0;
        const isOptional = document.getElementById('topicIsOptional')?.checked || false;
        
        // Get selected paper IDs
        const paperCheckboxes = document.querySelectorAll('input[name="topicPapers"]:checked');
        const paperIds = Array.from(paperCheckboxes).map(cb => cb.value);
        
        if (!name) {
            UI.showToast('Topic name is required', 'error');
            return;
        }
        
        try {
            await API.createTopic(AppState.filters.topics.tierId, name, sortOrder, paperIds, isOptional);
            UI.closeModal();
            UI.showToast('Topic created successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleUpdate(event, topicId) {
        event.preventDefault();
        
        const name = document.getElementById('topicName').value.trim();
        const sortOrder = parseInt(document.getElementById('topicSortOrder').value) || 0;
        const isActive = document.getElementById('topicStatus').value === 'true';
        const isOptional = document.getElementById('topicIsOptional')?.checked || false;
        
        // Get selected paper IDs
        const paperCheckboxes = document.querySelectorAll('input[name="topicPapers"]:checked');
        const paperIds = Array.from(paperCheckboxes).map(cb => cb.value);
        
        if (!name) {
            UI.showToast('Topic name is required', 'error');
            return;
        }
        
        try {
            await API.updateTopic(topicId, { name, sort_order: sortOrder, is_active: isActive, is_optional: isOptional, paper_ids: paperIds });
            UI.closeModal();
            UI.showToast('Topic updated successfully', 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    },
    
    async handleDelete(topicId) {
        const topic = AppState.findTopicById(topicId);
        if (!topic) return;
        
        const action = topic.is_active ? 'deactivate' : 'permanently delete';
        const message = topic.is_active 
            ? `Deactivate "${topic.name}"? You can reactivate it later.`
            : `Permanently delete "${topic.name}"? This cannot be undone.`;
        
        if (!UI.confirm(message)) {
            return;
        }
        
        try {
            await API.deleteTopic(topicId);
            UI.showToast(`Topic ${action}d successfully`, 'success');
            await this.load();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
