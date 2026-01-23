// Past Papers section management

const PastPapersSection = {
    searchQuery: '',
    bulkDeleteData: null, // Stores loaded past papers for bulk deletion preview
    
    // Unified Scraper State
    scrapeState: {
        scraperType: null, // 'aqa', 'ocr', or 'pearson'
        step: 0, // 0=select scraper, 1=URL/selection input, 2=mapping, 3=review
        url: '',
        urlMode: 'builder', // 'builder' or 'manual' (AQA only)
        scrapeData: null, // Raw response from scraper
        tierMapping: {}, // { "Higher": "db-tier-uuid" }
        paperMapping: {}, // { "Paper 1": "db-paper-uuid" }
        pastPapersToImport: [], // Flattened list with selection state
        allPapers: [], // All papers for the course (for scraper dropdown)
        // OCR-specific state
        ocrQualificationTypes: [], // List of qualification types (GCSE, A-Level, etc.)
        ocrSelectedTypeId: null,
        ocrQualifications: [], // List of qualifications for selected type
        ocrSelectedQualificationId: null,
        // Pearson/Edexcel-specific state
        pearsonFamilies: [], // List of qualification families (GCSE, A-Level, etc.)
        pearsonSelectedFamily: null,
        pearsonSubjects: [], // List of subjects for selected family
        pearsonSelectedSubject: null, // Object with specification_code
        pearsonExamSeries: [], // List of exam series for selected subject
        pearsonSelectedSeries: null, // Optional filter
    },

    // Utility function to parse size strings like "1.2 MB", "810.4 KB" to bytes
    parseSizeToBytes(sizeStr) {
        if (!sizeStr || typeof sizeStr === 'number') return sizeStr;
        
        const match = sizeStr.match(/^([0-9.]+)\s*(KB|MB|GB|B)?$/i);
        if (!match) return null;
        
        const value = parseFloat(match[1]);
        const unit = (match[2] || 'B').toUpperCase();
        
        const multipliers = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };
        
        return Math.round(value * (multipliers[unit] || 1));
    },

    async applySmartAutofill() {
        const courseId = AppState.filters.pastPapers.courseId;
        if (!courseId) return;

        const course = AppState.courses.find(c => c.id === courseId);
        if (!course) return;
        
        // Extract structured data from course object
        const yearName = course.year_name || ''; // "GCSE", "A-Level", "AS Level", etc.
        const subjectName = course.subject_name || ''; // "Biology", "Chemistry", "Religious Studies", etc.
        const courseTitle = course.title || course.name || ''; // Fallback for matching
        
        console.log('Autofilling scraper for:', courseTitle);
        console.log('Course year:', yearName, '| Course subject:', subjectName);
        
        const scraperType = this.scrapeState.scraperType;
        
        if (scraperType === 'aqa') {
            const qualSelect = document.getElementById('aqaQualLevel');
            const subjectSelect = document.getElementById('aqaSubject');
            
            // 1. Qualification Level Autofill
            // Use course.year_name first, then fallback to text matching
            if (qualSelect) {
                let bestMatch = null;
                let longestMatchLen = 0;

                // Try direct match with year_name first
                if (yearName) {
                    for (let opt of qualSelect.options) {
                        if (!opt.value) continue;
                        
                        const optLower = opt.value.toLowerCase();
                        const yearLower = yearName.toLowerCase();
                        
                        // Check if option matches or is contained in yearName
                        // e.g. "GCSE" matches "GCSE (10/11)" or "A-Level" matches "A-Level"
                        if (optLower === yearLower ||
                            yearLower.startsWith(optLower + ' ') ||
                            yearLower.startsWith(optLower + '(') ||
                            opt.value.replace(/[-\s]/g, '').toLowerCase() === yearName.replace(/[-\s]/g, '').toLowerCase()) {
                            // Keep longest match (prefer "International GCSE" over "GCSE")
                            if (opt.value.length > longestMatchLen) {
                                longestMatchLen = opt.value.length;
                                bestMatch = opt.value;
                            }
                        }
                    }
                }
                
                // Fallback: search in course title
                if (!bestMatch && courseTitle) {
                    let longestMatchLen = 0;
                    for (let opt of qualSelect.options) {
                        if (!opt.value) continue;
                        
                        const saneTarget = opt.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); 
                        const flexibleTarget = saneTarget.replace(/\\-/g, '[-\\s]');
                        const regex = new RegExp(`\\b${flexibleTarget}\\b`, 'i');
                        
                        if (regex.test(courseTitle)) {
                            if (opt.value.length > longestMatchLen) {
                                longestMatchLen = opt.value.length;
                                bestMatch = opt.value;
                            }
                        }
                    }
                }
                
                if (bestMatch) {
                    qualSelect.value = bestMatch;
                    console.log('✓ Autofilled AQA Qualification:', bestMatch);
                } else {
                    console.log('✗ Could not autofill AQA Qualification (no match found)');
                }
            }
            
            // 2. Subject Autofill
            // Use course.subject_name first, then fallback to text matching
            if (subjectSelect) {
                let bestMatch = null;

                // Try direct match with subject_name first
                if (subjectName) {
                    for (let opt of subjectSelect.options) {
                        if (!opt.value) continue;
                        
                        // Direct match or partial match
                        if (opt.value.toLowerCase() === subjectName.toLowerCase() ||
                            opt.value.toLowerCase().includes(subjectName.toLowerCase()) ||
                            subjectName.toLowerCase().includes(opt.value.toLowerCase())) {
                            bestMatch = opt.value;
                            break;
                        }
                    }
                }
                
                // Fallback: search in course title
                if (!bestMatch && courseTitle) {
                    let longestMatchLen = 0;
                    for (let opt of subjectSelect.options) {
                        if (!opt.value) continue;
                        
                        const saneTarget = opt.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const regex = new RegExp(`\\b${saneTarget}\\b`, 'i');
                        
                        if (regex.test(courseTitle)) {
                            if (opt.value.length > longestMatchLen) {
                                longestMatchLen = opt.value.length;
                                bestMatch = opt.value;
                            }
                        }
                    }
                }
                
                if (bestMatch) {
                    subjectSelect.value = bestMatch;
                    console.log('✓ Autofilled AQA Subject:', bestMatch);
                } else {
                    console.log('✗ Could not autofill AQA Subject (no match found)');
                }
            }
            
            // DO NOT autofill Spec Code (as requested)
            
            this.updateBuiltUrl();
            
        } else if (scraperType === 'ocr') {
            // Re-detect level for OCR specifically since it needs mapping
            let level = '';
            if (/\b(A-Level|A Level)\b/i.test(courseTitle)) level = 'A-Level';
            else if (/\b(AS Level)\b/i.test(courseTitle)) level = 'AS Level';
            else if (/\b(GCSE)\b/i.test(courseTitle)) level = 'GCSE';
            
            const typeSelect = document.getElementById('ocrQualType');
            if (typeSelect && level) {
                // Map specific levels for OCR
                let searchLevel = level;
                if (level === 'A-Level') searchLevel = 'AS and A Level';
                
                for(let opt of typeSelect.options) {
                    if (opt.text.toLowerCase().includes(searchLevel.toLowerCase())) {
                        typeSelect.value = opt.value;
                        await this.onOcrQualTypeChange();
                        break;
                    }
                }
            }
            
            // Subject
            const qualSelect = document.getElementById('ocrQualification');
            if (qualSelect && !qualSelect.disabled) {
                 // Get pure subject from course title: remove level, board, code
                 let simpleTitle = courseTitle.replace(/\b(GCSE|A-Level|A Level|AS Level|OCR|AQA|Pearson|Edexcel)\b/gi, '').replace(/[0-9()]/g, '').trim();
                 const words = simpleTitle.split(/\s+/).filter(w => w.length > 2);
                 
                 for(let opt of qualSelect.options) {
                     if (!opt.value) continue;
                     const optText = opt.text.toLowerCase();
                     if (words.length > 0 && words.every(w => optText.includes(w.toLowerCase()))) {
                         qualSelect.value = opt.value;
                         this.onOcrQualificationChange();
                         break;
                     }
                 }
            }
            
        } else if (scraperType === 'pearson') {
            // Re-detect level for Pearson
            let level = '';
            if (/\b(A-Level|A Level)\b/i.test(courseTitle)) level = 'A-Level';
            else if (/\b(GCSE)\b/i.test(courseTitle)) level = 'GCSE';
            else if (/\b(International GCSE|IGCSE)\b/i.test(courseTitle)) level = 'International GCSE';
            else if (/\b(BTEC)\b/i.test(courseTitle)) level = 'BTEC';

            const familySelect = document.getElementById('pearson-family-select');
            if (familySelect && level) {
                 let searchLevel = level;
                 // Pearson map A-Level -> A levels
                 if (level === 'A-Level') searchLevel = 'A Level';

                 for(let opt of familySelect.options) {
                    if (opt.text.toLowerCase().includes(searchLevel.toLowerCase())) {
                        familySelect.value = opt.value;
                        await this.handlePearsonFamilyChange();
                        break;
                    }
                 }
            }
            
            const subjectSelect = document.getElementById('pearson-subject-select');
             if (subjectSelect && !subjectSelect.disabled) {
                 let simpleTitle = courseTitle.replace(/\b(GCSE|A-Level|A Level|AS Level|OCR|AQA|Pearson|Edexcel|International GCSE)\b/gi, '').replace(/[0-9()]/g, '').trim();
                 const words = simpleTitle.split(/\s+/).filter(w => w.length > 2);

                 for(let opt of subjectSelect.options) {
                    if (!opt.value) continue;
                    const optText = opt.text.toLowerCase();
                     if (words.length > 0 && words.every(w => optText.includes(w.toLowerCase()))) {
                         subjectSelect.value = opt.value;
                         await this.handlePearsonSubjectChange();
                         break;
                     }
                 }
             }
        }
    },

    resetScrapeState() {
        this.scrapeState = {
            scraperType: null,
            step: 0,
            url: '',
            urlMode: 'builder',
            allPapers: [],
            ocrQualificationTypes: [],
            ocrSelectedTypeId: null,
            ocrQualifications: [],
            ocrSelectedQualificationId: null,
            pearsonFamilies: [],
            pearsonSelectedFamily: null,
            pearsonSubjects: [],
            pearsonSelectedSubject: null,
            pearsonExamSeries: [],
            pearsonSelectedSeries: null,
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
            'Scrape Past Papers',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>',
            'PastPapersSection.openScraperModal()',
            'secondary'
        );
        
        const deleteAllBtnHTML = UI.renderActionBtn(
            'Delete All for Course',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            'PastPapersSection.openBulkDeleteModal("course")',
            'danger'
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
                <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                    ${deleteAllBtnHTML}
                    ${scrapeAqaBtnHTML}
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Select a Tier</h3>
                <p>Choose a tier from the dropdown above to view past papers, or use <strong>Scrape Past Papers</strong> to bulk import.</p>
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
            'Scrape Past Papers',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>',
            'PastPapersSection.openScraperModal()',
            'secondary'
        );
        
        const deleteAllBtnHTML = UI.renderActionBtn(
            tiers.length > 0 ? 'Delete All for Tier' : 'Delete All for Course',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            `PastPapersSection.openBulkDeleteModal("${tiers.length > 0 ? 'tier' : 'course'}")`,
            'danger'
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
                <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                    ${deleteAllBtnHTML}
                    ${scrapeAqaBtnHTML}
                </div>
            </div>
            <div class="content-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Select a Paper</h3>
                <p>Choose a paper from the dropdown above to view and manage its past papers, or use <strong>Scrape Past Papers</strong> to bulk import.</p>
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
            'Scrape Past Papers',
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>',
            'PastPapersSection.openScraperModal()',
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
        const qpFileSize = pastPaper.file_size ? `${(pastPaper.file_size / 1048576).toFixed(2)} MB` : '—';
        const msFileSize = pastPaper.mark_scheme_file_size ? `${(pastPaper.mark_scheme_file_size / 1048576).toFixed(2)} MB` : '—';
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
                        <span class="meta-label">QP / MS Size</span>
                        <span class="meta-value">${qpFileSize} / ${msFileSize}</span>
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
            
            // Get mark scheme URL and file size (optional)
            let markSchemeUrl = null;
            let markSchemeFileSizeValue = null;
            try {
                const msFileInput = document.getElementById('markSchemeFileFile');
                const msMode = document.getElementById('markSchemeFileMode')?.value;
                if (msMode === 'file' && msFileInput?.files && msFileInput.files.length > 0) {
                    markSchemeFileSizeValue = msFileInput.files[0].size;
                }
                markSchemeUrl = await UI.getFileOrUrlValue('markSchemeFile');
            } catch (e) {
                // Mark scheme is optional, ignore errors
            }
            
            await API.createPastPaper(AppState.filters.pastPapers.paperId, year, url, fileSizeValue, markSchemeUrl, markSchemeFileSizeValue);
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
            
            // Get mark scheme URL and file size (optional) - empty string clears it
            let markSchemeUrl = null;
            let markSchemeFileSizeValue = null;
            try {
                const msFileInput = document.getElementById('markSchemeFileFile');
                const msMode = document.getElementById('markSchemeFileMode')?.value;
                if (msMode === 'file' && msFileInput?.files && msFileInput.files.length > 0) {
                    markSchemeFileSizeValue = msFileInput.files[0].size;
                }
                markSchemeUrl = await UI.getFileOrUrlValue('markSchemeFile');
                // If empty, set to empty string to clear on backend
                if (!markSchemeUrl) markSchemeUrl = '';
            } catch (e) {
                // Mark scheme is optional
                markSchemeUrl = '';
            }
            
            const updatePayload = { year, url, file_size: fileSizeValue, mark_scheme_url: markSchemeUrl, is_active: isActive };
            if (markSchemeFileSizeValue !== null) updatePayload.mark_scheme_file_size = markSchemeFileSizeValue;
            await API.updatePastPaper(pastPaperId, updatePayload);
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
    
    // Bulk Delete functionality for course/tier/paper levels
    async openBulkDeleteModal(level) {
        // level: 'course' | 'tier' | 'paper'
        const courseId = AppState.filters.pastPapers.courseId;
        const tierId = AppState.filters.pastPapers.tierId;
        
        if (!courseId) {
            UI.showToast('Please select a course first', 'warning');
            return;
        }
        
        // Show loading modal
        UI.openModal('Loading Past Papers...', `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: #64748B;">Fetching all past papers for ${level}...</p>
            </div>
        `);
        
        try {
            // Get all papers for this course/tier
            const papersData = await API.getPapers(
                courseId,
                level === 'tier' ? tierId : null,
                true // include inactive
            );
            const papers = papersData.data.papers || [];
            
            // Fetch past papers for each paper
            let allPastPapers = [];
            for (const paper of papers) {
                try {
                    const ppData = await API.getPastPapers(paper.id);
                    const pastPapers = (ppData.data.past_papers || []).map(pp => ({
                        ...pp,
                        paper_name: paper.name,
                        tier_name: paper.tier_name || ''
                    }));
                    allPastPapers = allPastPapers.concat(pastPapers);
                } catch (e) {
                    console.error(`Error fetching past papers for paper ${paper.id}:`, e);
                }
            }
            
            if (allPastPapers.length === 0) {
                UI.closeModal();
                UI.showToast('No past papers found to delete', 'info');
                return;
            }
            
            // Store for later use
            this.bulkDeleteData = {
                level,
                pastPapers: allPastPapers
            };
            
            // Render confirmation modal
            this.renderBulkDeleteConfirmation(level, allPastPapers);
            
        } catch (error) {
            UI.closeModal();
            UI.showToast('Failed to load past papers: ' + error.message, 'error');
        }
    },
    
    renderBulkDeleteConfirmation(level, pastPapers) {
        const course = AppState.courses.find(c => c.id === AppState.filters.pastPapers.courseId);
        const tier = AppState.tiers.find(t => t.id === AppState.filters.pastPapers.tierId);
        
        let levelLabel = '';
        if (level === 'course') {
            levelLabel = `Course: ${UI.formatCourseLabel(course)}`;
        } else if (level === 'tier') {
            levelLabel = `Tier: ${tier?.title || 'Unknown'} (${UI.formatCourseLabel(course)})`;
        }
        
        // Separate active and inactive
        const activePapers = pastPapers.filter(pp => pp.is_active);
        const inactivePapers = pastPapers.filter(pp => !pp.is_active);
        
        // Sort by year
        const sortedPapers = [...pastPapers].sort((a, b) => b.year - a.year);
        
        // Determine button options based on what's present
        const hasActive = activePapers.length > 0;
        const hasInactive = inactivePapers.length > 0;
        
        let actionsHTML = '';
        if (hasActive && hasInactive) {
            // Mixed: deactivate active + delete inactive
            actionsHTML = `
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; flex-wrap: wrap;">
                    <button type="button" class="ghost-btn" onclick="UI.closeModal()">Cancel</button>
                    <button type="button" class="primary-btn" style="background: #f59e0b;" id="bulkDeactivateBtn" onclick="PastPapersSection.executeBulkDelete(false)">
                        <span id="bulkDeactivateBtnText">Deactivate ${activePapers.length} Active + Delete ${inactivePapers.length} Inactive</span>
                        <span id="bulkDeactivateBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Processing...
                        </span>
                    </button>
                    <button type="button" class="primary-btn" style="background: #dc2626;" id="bulkDeleteBtn" onclick="PastPapersSection.executeBulkDelete(true)">
                        <span id="bulkDeleteBtnText">Permanently Delete All ${pastPapers.length}</span>
                        <span id="bulkDeleteBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Deleting...
                        </span>
                    </button>
                </div>
            `;
        } else if (hasActive) {
            // Only active: offer deactivate or permanent delete
            actionsHTML = `
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; flex-wrap: wrap;">
                    <button type="button" class="ghost-btn" onclick="UI.closeModal()">Cancel</button>
                    <button type="button" class="primary-btn" style="background: #f59e0b;" id="bulkDeactivateBtn" onclick="PastPapersSection.executeBulkDelete(false)">
                        <span id="bulkDeactivateBtnText">Deactivate ${activePapers.length} Past Papers</span>
                        <span id="bulkDeactivateBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Deactivating...
                        </span>
                    </button>
                    <button type="button" class="primary-btn" style="background: #dc2626;" id="bulkDeleteBtn" onclick="PastPapersSection.executeBulkDelete(true)">
                        <span id="bulkDeleteBtnText">Permanently Delete ${activePapers.length} Past Papers</span>
                        <span id="bulkDeleteBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Deleting...
                        </span>
                    </button>
                </div>
            `;
        } else {
            // Only inactive: just permanent delete
            actionsHTML = `
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="ghost-btn" onclick="UI.closeModal()">Cancel</button>
                    <button type="button" class="primary-btn" style="background: #dc2626;" id="bulkDeleteBtn" onclick="PastPapersSection.executeBulkDelete(true)">
                        <span id="bulkDeleteBtnText">Permanently Delete ${inactivePapers.length} Past Papers</span>
                        <span id="bulkDeleteBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Deleting...
                        </span>
                    </button>
                </div>
            `;
        }
        
        const formHTML = `
            <div class="bulk-delete-modal">
                <div class="bulk-delete-warning" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <div>
                            <strong style="color: #dc2626;">Warning: Bulk Delete</strong>
                            <p style="color: #7f1d1d; margin: 0.25rem 0 0 0; font-size: 0.9rem;">
                                You are about to delete <strong>${pastPapers.length}</strong> past paper(s) for:<br>
                                <strong>${levelLabel}</strong>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <div style="background: #dcfce7; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #16a34a;">${activePapers.length}</div>
                        <div style="font-size: 0.75rem; color: #166534;">Active</div>
                    </div>
                    <div style="background: #fef2f2; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #dc2626;">${inactivePapers.length}</div>
                        <div style="font-size: 0.75rem; color: #991b1b;">Inactive</div>
                    </div>
                </div>
                
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead style="background: #f8fafc; position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #e2e8f0;">Year</th>
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #e2e8f0;">Paper</th>
                                <th style="padding: 0.5rem; text-align: center; border-bottom: 1px solid #e2e8f0;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedPapers.map(pp => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 0.5rem;">${pp.year}</td>
                                    <td style="padding: 0.5rem;">${pp.tier_name ? pp.tier_name + ' → ' : ''}${pp.paper_name}</td>
                                    <td style="padding: 0.5rem; text-align: center;">
                                        <span class="card-badge ${pp.is_active ? 'badge-active' : 'badge-inactive'}" style="font-size: 0.7rem;">
                                            ${pp.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 1rem; padding: 0.75rem; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; font-size: 0.85rem; color: #92400e;">
                    <strong>Options:</strong><br>
                    • <strong>Deactivate</strong> - Hides items from users but keeps them in the database (can be restored)<br>
                    • <strong>Permanently Delete</strong> - Removes items forever (cannot be undone)
                </div>
                
                ${actionsHTML}
            </div>
        `;
        
        // Update modal content - use #modalContent which contains h2 and .modal-body
        const modalContent = document.getElementById('modalContent');
        modalContent.querySelector('h2').textContent = 'Confirm Bulk Delete';
        modalContent.querySelector('.modal-body').innerHTML = formHTML;
    },
    
    async executeBulkDelete(permanent = false) {
        if (!this.bulkDeleteData || !this.bulkDeleteData.pastPapers.length) {
            UI.showToast('No past papers to delete', 'warning');
            UI.closeModal();
            return;
        }
        
        // Disable all action buttons
        const deactivateBtn = document.getElementById('bulkDeactivateBtn');
        const deleteBtn = document.getElementById('bulkDeleteBtn');
        
        if (deactivateBtn) {
            deactivateBtn.disabled = true;
            if (!permanent) {
                document.getElementById('bulkDeactivateBtnText').style.display = 'none';
                document.getElementById('bulkDeactivateBtnLoading').style.display = 'inline-flex';
            }
        }
        if (deleteBtn) {
            deleteBtn.disabled = true;
            if (permanent) {
                document.getElementById('bulkDeleteBtnText').style.display = 'none';
                document.getElementById('bulkDeleteBtnLoading').style.display = 'inline-flex';
            }
        }
        
        const pastPapers = this.bulkDeleteData.pastPapers;
        
        // Separate by active state
        const activeIds = pastPapers.filter(pp => pp.is_active).map(pp => pp.id);
        const inactiveIds = pastPapers.filter(pp => !pp.is_active).map(pp => pp.id);
        
        let deactivatedCount = 0;
        let deletedCount = 0;
        let errors = [];
        
        try {
            if (permanent) {
                // Permanent delete: first deactivate active ones, then delete all
                if (activeIds.length > 0) {
                    try {
                        // Stage 1: Deactivate active ones
                        await API.bulkDeletePastPapers(activeIds);
                        // Stage 2: Permanently delete them
                        const response = await API.bulkDeletePastPapers(activeIds);
                        deletedCount += response.data?.count || activeIds.length;
                    } catch (e) {
                        errors.push(`Failed to delete active papers: ${e.message}`);
                    }
                }
                
                if (inactiveIds.length > 0) {
                    try {
                        const response = await API.bulkDeletePastPapers(inactiveIds);
                        deletedCount += response.data?.count || inactiveIds.length;
                    } catch (e) {
                        errors.push(`Failed to delete inactive papers: ${e.message}`);
                    }
                }
            } else {
                // Deactivate only: deactivate active ones, delete inactive ones
                if (activeIds.length > 0) {
                    try {
                        const response = await API.bulkDeletePastPapers(activeIds);
                        deactivatedCount = response.data?.count || activeIds.length;
                    } catch (e) {
                        errors.push(`Failed to deactivate active papers: ${e.message}`);
                    }
                }
                
                if (inactiveIds.length > 0) {
                    try {
                        const response = await API.bulkDeletePastPapers(inactiveIds);
                        deletedCount = response.data?.count || inactiveIds.length;
                    } catch (e) {
                        errors.push(`Failed to delete inactive papers: ${e.message}`);
                    }
                }
            }
            
            UI.closeModal();
            this.bulkDeleteData = null;
            
            if (errors.length > 0) {
                UI.showToast(`Completed with errors: ${errors.join('; ')}`, 'warning');
            } else {
                const messages = [];
                if (deactivatedCount > 0) messages.push(`${deactivatedCount} deactivated`);
                if (deletedCount > 0) messages.push(`${deletedCount} permanently deleted`);
                UI.showToast(`Successfully ${messages.join(', ')}`, 'success');
            }
            
            await this.load();
            
        } catch (error) {
            UI.closeModal();
            UI.showToast('Bulk delete failed: ' + error.message, 'error');
        }
    },
    
    // Unified Scraper functionality - Multi-step wizard
    async openScraperModal() {
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
        
        // Start with exam board selection (step 0)
        this.renderScrapeStep0();
    },
    
    renderScrapeStep0() {
        const formHTML = `
            <div id="scrapeWizardContent">
                <div class="scrape-steps-indicator" style="display: flex; margin-bottom: 1.5rem; gap: 0.5rem;">
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">Select Exam Board</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Build Query</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Map Papers</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Import</div>
                </div>
                
                <p style="margin-bottom: 1.5rem; color: #64748B;">
                    Select which exam board you want to scrape past papers from:
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                    <!-- AQA Card -->
                    <div class="scraper-board-card" onclick="PastPapersSection.selectScraperType('aqa')" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.2s; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3678AE; margin-bottom: 0.5rem;">AQA</div>
                        <div style="font-size: 0.85rem; color: #64748B;">Assessment and Qualifications Alliance</div>
                        <div style="margin-top: 1rem; font-size: 0.8rem; color: #94a3b8;">Build URL or paste from aqa.org.uk</div>
                    </div>
                    
                    <!-- OCR Card -->
                    <div class="scraper-board-card" onclick="PastPapersSection.selectScraperType('ocr')" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.2s; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3678AE; margin-bottom: 0.5rem;">OCR</div>
                        <div style="font-size: 0.85rem; color: #64748B;">Oxford, Cambridge and RSA</div>
                        <div style="margin-top: 1rem; font-size: 0.8rem; color: #94a3b8;">Select qualification type & subject</div>
                    </div>
                    
                    <!-- Pearson/Edexcel Card -->
                    <div class="scraper-board-card" onclick="PastPapersSection.selectScraperType('pearson')" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.2s; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3678AE; margin-bottom: 0.5rem;">Pearson</div>
                        <div style="font-size: 0.85rem; color: #64748B;">Edexcel / BTEC / International</div>
                        <div style="margin-top: 1rem; font-size: 0.8rem; color: #94a3b8;">Select qualification & subject</div>
                    </div>
                </div>
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="ghost-btn" onclick="UI.closeModal()">Cancel</button>
                </div>
            </div>
        `;
        
        UI.openModal('Scrape Past Papers', formHTML, 'large');
        
        // Add hover styles
        document.querySelectorAll('.scraper-board-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = '#3678AE';
                card.style.background = '#f8fafc';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = '#e2e8f0';
                card.style.background = '';
            });
        });
    },
    
    selectScraperType(type) {
        this.scrapeState.scraperType = type;
        this.scrapeState.step = 1;
        
        if (type === 'aqa') {
            this.renderAqaStep1();
        } else if (type === 'ocr') {
            this.renderOcrStep1();
        } else if (type === 'pearson') {
            this.renderPearsonStep1();
        }
    },
    
    // AQA URL Builder Data
    aqaData: {
        qualificationLevels: [
            'A-Level', 'Applied General', 'AQA Certificate', 'AS Level', 'ELC', 
            'FCSE', 'Functional Skills', 'GCSE', 'Level One', 'Level Three', 'Level Two'
        ],
        subjects: [
            'Accounting', 'Art and Design', 'Bengali', 'Biology', 'Business', 'Chemistry',
            'Chinese (Mandarin)', 'Citizenship Studies', 'Computer Science', 'Dance',
            'Design and Technology', 'Drama', 'Economics', 'Engineering', 'English',
            'Environmental Science', 'Food Preparation and Nutrition', 'French', 'Geography',
            'German', 'Hebrew (Biblical)', 'Hebrew (Modern)', 'History', 'Italian', 'Law',
            'Mathematics', 'Media Studies', 'Music', 'Panjabi', 'Philosophy', 
            'Physical Education', 'Physics', 'Polish', 'Politics', 'Projects', 'Psychology',
            'Religious Studies', 'Science', 'Sociology', 'Spanish', 'Urdu'
        ],
        specCodes: [
            '1350', '1775', '1830', '5930', '5960', '5970', '7036', '7037', '7041', '7042',
            '7061', '7062', '7127', '7131', '7132', '7135', '7136', '7137', '7138', '7152',
            '7162', '7172', '7181', '7182', '7191', '7192', '7201', '7202', '7203', '7204',
            '7205', '7206', '7237', '7262', '7272', '7356', '7357', '7366', '7367', '7401',
            '7402', '7404', '7405', '7407', '7408', '7447', '7516', '7517', '7552', '7562',
            '7572', '7582', '7637', '7651', '7652', '7661', '7662', '7672', '7677', '7682',
            '7687', '7691', '7692', '7701', '7702', '7707', '7711', '7712', '7716', '7717',
            '7991', '7992', '7993', '8035', '8061', '8062', '8063', '8100', '8132', '8136',
            '8145', '8182', '8192', '8201', '8202', '8203', '8204', '8205', '8206', '8236',
            '8261', '8271', '8300', '8361', '8362', '8365', '8382', '8461', '8462', '8463',
            '8464', '8465', '8525', '8552', '8572', '8582', '8585', '8633', '8638', '8648',
            '8652', '8658', '8662', '8668', '8673', '8678', '8683', '8688', '8692', '8698',
            '8700', '8702', '8720', '8725', '8852', '8958', '8968', '8973', '8998'
        ]
    },
    
    renderAqaStep1() {
        const qualLevelOptions = this.aqaData.qualificationLevels.map(q => 
            `<option value="${q}">${q}</option>`
        ).join('');
        
        const subjectOptions = this.aqaData.subjects.map(s => 
            `<option value="${s}">${s}</option>`
        ).join('');
        
        const specCodeOptions = this.aqaData.specCodes.map(c => 
            `<option value="${c}">${c}</option>`
        ).join('');
        
        const formHTML = `
            <div id="scrapeWizardContent">
                <div class="scrape-steps-indicator" style="display: flex; margin-bottom: 1.5rem; gap: 0.5rem;">
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ AQA</div>
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">Build URL</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Map Papers</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Import</div>
                </div>
                
                <!-- Tab switcher -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <button type="button" class="ghost-btn" id="tabBuilder" onclick="PastPapersSection.switchUrlTab('builder')" style="flex: 1; background: #3678AE; color: white;">Build URL</button>
                    <button type="button" class="ghost-btn" id="tabManual" onclick="PastPapersSection.switchUrlTab('manual')" style="flex: 1;">Paste URL</button>
                </div>
                
                <!-- URL Builder -->
                <div id="urlBuilderSection">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-row">
                            <label class="form-label">Qualification Level</label>
                            <select class="scrape-mapping-select" id="aqaQualLevel" onchange="PastPapersSection.updateBuiltUrl()">
                                <option value="">-- Any --</option>
                                ${qualLevelOptions}
                            </select>
                        </div>
                        <div class="form-row">
                            <label class="form-label">Subject</label>
                            <select class="scrape-mapping-select" id="aqaSubject" onchange="PastPapersSection.updateBuiltUrl()">
                                <option value="">-- Any --</option>
                                ${subjectOptions}
                            </select>
                        </div>
                    </div>
                    <div class="form-row" style="margin-bottom: 1rem;">
                        <label class="form-label">Spec Code (optional)</label>
                        <select class="scrape-mapping-select" id="aqaSpecCode" onchange="PastPapersSection.updateBuiltUrl()">
                            <option value="">-- Any --</option>
                            ${specCodeOptions}
                        </select>
                        <span class="form-hint">Filter by specific specification code (e.g., 8461 for GCSE Biology)</span>
                    </div>
                    <div class="form-row" style="margin-bottom: 1rem;">
                        <label class="form-label">Generated URL</label>
                        <input type="text" class="form-input" id="aqaBuiltUrl" readonly style="background: #f1f5f9; font-family: monospace; font-size: 0.85rem;">
                    </div>
                </div>
                
                <!-- Manual URL Input (hidden by default) -->
                <div id="urlManualSection" style="display: none;">
                    <div class="form-info" style="background: #e8f4fd; border: 1px solid #3678AE; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0; font-size: 0.9rem; color: #193659;">
                            <strong>How to use:</strong><br>
                            1. Go to <a href="https://www.aqa.org.uk/find-past-papers-and-mark-schemes" target="_blank" style="color: #3678AE;">AQA Past Papers</a><br>
                            2. Filter by subject and qualification<br>
                            3. Copy the URL from your browser<br>
                            4. Paste it below
                        </p>
                    </div>
                    <div class="form-row" style="margin-bottom: 1rem;">
                        <label class="form-label">AQA URL</label>
                        <input type="text" class="form-input" id="aqaManualUrl" placeholder="https://www.aqa.org.uk/find-past-papers-and-mark-schemes?subject=Biology&qualification=GCSE+Biology" value="${this.scrapeState.url}">
                    </div>
                </div>
                
                <div id="scrapeError" style="display: none; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626; margin-bottom: 1rem;"></div>
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="ghost-btn" onclick="PastPapersSection.renderScrapeStep0()">← Back</button>
                    <button type="button" class="primary-btn" id="scrapeBtn" onclick="PastPapersSection.handleScrapeAqaUrl()">
                        <span id="scrapeBtnText">Scrape AQA</span>
                        <span id="scrapeBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Scraping...
                        </span>
                    </button>
                </div>
            </div>
        `;
        
        // Update modal content (modal is already open)
        document.querySelector('.modal-body').innerHTML = formHTML;
        
        // Initialize the built URL and try autofill
        setTimeout(() => {
            this.applySmartAutofill();
            this.updateBuiltUrl();
        }, 0);
    },
    
    switchUrlTab(tab) {
        const builderSection = document.getElementById('urlBuilderSection');
        const manualSection = document.getElementById('urlManualSection');
        const tabBuilder = document.getElementById('tabBuilder');
        const tabManual = document.getElementById('tabManual');
        
        if (tab === 'builder') {
            builderSection.style.display = 'block';
            manualSection.style.display = 'none';
            tabBuilder.style.background = '#3678AE';
            tabBuilder.style.color = 'white';
            tabManual.style.background = '';
            tabManual.style.color = '';
        } else {
            builderSection.style.display = 'none';
            manualSection.style.display = 'block';
            tabBuilder.style.background = '';
            tabBuilder.style.color = '';
            tabManual.style.background = '#3678AE';
            tabManual.style.color = 'white';
        }
        
        this.scrapeState.urlMode = tab;
    },
    
    updateBuiltUrl() {
        const qualLevel = document.getElementById('aqaQualLevel')?.value || '';
        const subject = document.getElementById('aqaSubject')?.value || '';
        const specCode = document.getElementById('aqaSpecCode')?.value || '';
        
        let url = 'https://www.aqa.org.uk/find-past-papers-and-mark-schemes?';
        const params = [];
        
        if (qualLevel) {
            // AQA uses both variants (e.g., "A-Level" and "A-level"), so include both
            const qualLevelVariant = qualLevel.replace('-L', '-l'); // A-Level -> A-level, AS Level -> AS level
            if (qualLevel !== qualLevelVariant) {
                params.push(`qualificationLevel=${encodeURIComponent(qualLevel + ';' + qualLevelVariant)}`);
            } else {
                params.push(`qualificationLevel=${encodeURIComponent(qualLevel)}`);
            }
        }
        if (subject) {
            params.push(`subject=${encodeURIComponent(subject)}`);
        }
        if (specCode) {
            params.push(`specCode=${encodeURIComponent(specCode)}`);
        }
        
        // Always add limit for better results
        params.push('limit=500');
        
        url += params.join('&');
        
        const urlInput = document.getElementById('aqaBuiltUrl');
        if (urlInput) {
            urlInput.value = url;
        }
    },
    
    async handleScrapeAqaUrl() {
        // Get URL from the correct source based on active tab
        let url;
        if (this.scrapeState.urlMode === 'manual') {
            url = document.getElementById('aqaManualUrl')?.value.trim() || '';
        } else {
            url = document.getElementById('aqaBuiltUrl')?.value.trim() || '';
        }
        
        const errorDiv = document.getElementById('scrapeError');
        const btn = document.getElementById('scrapeBtn');
        const btnText = document.getElementById('scrapeBtnText');
        const btnLoading = document.getElementById('scrapeBtnLoading');
        
        // Validation
        if (!url) {
            errorDiv.textContent = 'Please build or enter an AQA URL';
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
    
    // OCR Step 1: Select Qualification Type and Subject
    async renderOcrStep1() {
        // First, fetch qualification types if not already loaded
        if (this.scrapeState.ocrQualificationTypes.length === 0) {
            document.querySelector('.modal-body').innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                    <p style="color: #64748B;">Loading OCR qualification types...</p>
                </div>
            `;
            
            try {
                const response = await API.scrapeOcrTypes();
                if (!response.success) {
                    throw new Error(response.error || 'Failed to load qualification types');
                }
                this.scrapeState.ocrQualificationTypes = response.qualification_types || [];
            } catch (error) {
                document.querySelector('.modal-body').innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <div style="color: #dc2626; margin-bottom: 1rem;">⚠️ ${error.message}</div>
                        <button class="ghost-btn" onclick="PastPapersSection.renderScrapeStep0()">← Back</button>
                    </div>
                `;
                return;
            }
        }
        
        const qualTypesOptions = this.scrapeState.ocrQualificationTypes.map(t =>
            `<option value="${t.value}">${t.description}</option>`
        ).join('');
        
        // Build qualifications dropdown (depends on selected type)
        let qualificationsHTML = `
            <div class="form-row" style="margin-bottom: 1rem;">
                <label class="form-label">Subject / Qualification</label>
                <select class="scrape-mapping-select" id="ocrQualification" disabled>
                    <option value="">-- Select qualification type first --</option>
                </select>
                <span class="form-hint">Available qualifications will load after selecting a type</span>
            </div>
        `;
        
        // If type is already selected, show qualifications
        if (this.scrapeState.ocrSelectedTypeId && this.scrapeState.ocrQualifications.length > 0) {
            const groupedQualifications = this.scrapeState.ocrQualifications;
            let qualOptions = '<option value="">-- Select a qualification --</option>';
            
            for (const group of groupedQualifications) {
                if (group.qualifications && group.qualifications.length > 0) {
                    qualOptions += `<optgroup label="${group.group_title}">`;
                    for (const qual of group.qualifications) {
                        const selected = qual.value === this.scrapeState.ocrSelectedQualificationId ? 'selected' : '';
                        qualOptions += `<option value="${qual.value}" ${selected}>${qual.description}</option>`;
                    }
                    qualOptions += '</optgroup>';
                }
            }
            
            qualificationsHTML = `
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Subject / Qualification</label>
                    <select class="scrape-mapping-select" id="ocrQualification" onchange="PastPapersSection.onOcrQualificationChange()">
                        ${qualOptions}
                    </select>
                    <span class="form-hint">Select the specific qualification to scrape past papers for</span>
                </div>
            `;
        }
        
        const formHTML = `
            <div id="scrapeWizardContent">
                <div class="scrape-steps-indicator" style="display: flex; margin-bottom: 1.5rem; gap: 0.5rem;">
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ OCR</div>
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">Select Subject</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Map Papers</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Import</div>
                </div>
                
                <div class="form-info" style="background: #e8f4fd; border: 1px solid #3678AE; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="margin: 0; font-size: 0.9rem; color: #193659;">
                        <strong>OCR Past Papers</strong><br>
                        Select a qualification type (e.g., GCSE, A Level), then choose the specific subject to scrape past papers.
                    </p>
                </div>
                
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Qualification Type</label>
                    <select class="scrape-mapping-select" id="ocrQualType" onchange="PastPapersSection.onOcrQualTypeChange()">
                        <option value="">-- Select qualification type --</option>
                        ${qualTypesOptions}
                    </select>
                </div>
                
                <div id="ocrQualificationsContainer">
                    ${qualificationsHTML}
                </div>
                
                <div id="scrapeError" style="display: none; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626; margin-bottom: 1rem;"></div>
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="ghost-btn" onclick="PastPapersSection.renderScrapeStep0()">← Back</button>
                    <button type="button" class="primary-btn" id="scrapeBtn" onclick="PastPapersSection.handleScrapeOcr()">
                        <span id="scrapeBtnText">Scrape OCR</span>
                        <span id="scrapeBtnLoading" style="display: none;">
                            <span class="loading-spinner-small"></span> Scraping...
                        </span>
                    </button>
                </div>
            </div>
        `;
        
        document.querySelector('.modal-body').innerHTML = formHTML;
        
        // Set selected type if already chosen, otherwise try autofill
        if (this.scrapeState.ocrSelectedTypeId) {
            document.getElementById('ocrQualType').value = this.scrapeState.ocrSelectedTypeId;
        } else {
            setTimeout(() => this.applySmartAutofill(), 0);
        }
    },
    
    async onOcrQualTypeChange() {
        const typeId = parseInt(document.getElementById('ocrQualType').value);
        const container = document.getElementById('ocrQualificationsContainer');
        
        if (!typeId) {
            this.scrapeState.ocrSelectedTypeId = null;
            this.scrapeState.ocrQualifications = [];
            container.innerHTML = `
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Subject / Qualification</label>
                    <select class="scrape-mapping-select" id="ocrQualification" disabled>
                        <option value="">-- Select qualification type first --</option>
                    </select>
                </div>
            `;
            return;
        }
        
        this.scrapeState.ocrSelectedTypeId = typeId;
        
        // Show loading
        container.innerHTML = `
            <div class="form-row" style="margin-bottom: 1rem;">
                <label class="form-label">Subject / Qualification</label>
                <div style="padding: 0.5rem; color: #64748B;"><span class="loading-spinner-small" style="display: inline-block; margin-right: 0.5rem;"></span> Loading qualifications...</div>
            </div>
        `;
        
        try {
            const response = await API.scrapeOcrQualifications(typeId);
            if (!response.success) {
                throw new Error(response.error || 'Failed to load qualifications');
            }
            
            this.scrapeState.ocrQualifications = response.groups || [];
            
            // Build options
            let qualOptions = '<option value="">-- Select a qualification --</option>';
            
            for (const group of this.scrapeState.ocrQualifications) {
                if (group.qualifications && group.qualifications.length > 0) {
                    qualOptions += `<optgroup label="${group.group_title}">`;
                    for (const qual of group.qualifications) {
                        qualOptions += `<option value="${qual.value}">${qual.description}</option>`;
                    }
                    qualOptions += '</optgroup>';
                }
            }
            
            container.innerHTML = `
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Subject / Qualification</label>
                    <select class="scrape-mapping-select" id="ocrQualification" onchange="PastPapersSection.onOcrQualificationChange()">
                        ${qualOptions}
                    </select>
                    <span class="form-hint">Select the specific qualification to scrape past papers for</span>
                </div>
            `;
            
        } catch (error) {
            container.innerHTML = `
                <div class="form-row" style="margin-bottom: 1rem;">
                    <label class="form-label">Subject / Qualification</label>
                    <div style="padding: 0.5rem; color: #dc2626;">Error: ${error.message}</div>
                </div>
            `;
        }
    },
    
    onOcrQualificationChange() {
        const qualId = parseInt(document.getElementById('ocrQualification').value);
        this.scrapeState.ocrSelectedQualificationId = qualId || null;
    },
    
    async handleScrapeOcr() {
        const qualificationId = this.scrapeState.ocrSelectedQualificationId;
        
        const errorDiv = document.getElementById('scrapeError');
        const btn = document.getElementById('scrapeBtn');
        const btnText = document.getElementById('scrapeBtnText');
        const btnLoading = document.getElementById('scrapeBtnLoading');
        
        // Validation
        if (!qualificationId) {
            errorDiv.textContent = 'Please select a qualification type and subject';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Show loading state
        errorDiv.style.display = 'none';
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        
        try {
            const response = await API.scrapeOcr(qualificationId);
            
            if (!response.success) {
                throw new Error(response.error || response.message || 'Scraping failed');
            }
            
            // Store response data
            this.scrapeState.scrapeData = response;
            
            // Check if we have data to work with
            if (!response.discovered_papers?.length && Object.keys(response.grouped_papers || {}).length === 0) {
                throw new Error('No papers found for this qualification. Try a different subject.');
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

    // ========== Pearson Edexcel Scraper Functions ==========
    
    async renderPearsonStep1() {
        this.scrapeState.step = 1;
        
        // Show loading while fetching families
        document.querySelector('.modal-body').innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: #64748B;">Loading Pearson qualification families...</p>
            </div>
        `;
        
        // Load qualification families first
        try {
            const response = await API.scrapePearsonFamilies();
            if (!response.qualification_families || response.qualification_families.length === 0) {
                throw new Error('No qualification families found');
            }
            this.scrapeState.pearsonFamilies = response.qualification_families;
        } catch (error) {
            document.querySelector('.modal-body').innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="color: #dc2626; margin-bottom: 1rem;">⚠️ ${error.message}</div>
                    <button class="ghost-btn" onclick="PastPapersSection.renderScrapeStep0()">← Back</button>
                </div>
            `;
            return;
        }
        
        // Build the family options (each family is an object with value and description)
        const familyOptions = this.scrapeState.pearsonFamilies.map(family => {
            const selected = family.value === this.scrapeState.pearsonSelectedFamily ? 'selected' : '';
            return `<option value="${family.value}" ${selected}>${family.description}</option>`;
        }).join('');
        
        const formHTML = `
            <div class="scrape-step">
                <div class="step-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <button class="ghost-btn" onclick="PastPapersSection.renderScrapeStep0()" style="padding: 0.5rem;">←</button>
                    <h3 style="margin: 0;">Pearson Edexcel - Select Subject</h3>
                </div>
                
                <div class="scrape-form">
                    <div class="form-row" style="margin-bottom: 1rem;">
                        <label class="form-label">Qualification Family</label>
                        <select class="scrape-mapping-select" id="pearson-family-select" onchange="PastPapersSection.handlePearsonFamilyChange()">
                            <option value="">-- Select a qualification family --</option>
                            ${familyOptions}
                        </select>
                    </div>
                    
                    <div class="form-row" id="pearson-subject-group" style="margin-bottom: 1rem; display: none;">
                        <label class="form-label">Subject</label>
                        <select class="scrape-mapping-select" id="pearson-subject-select" onchange="PastPapersSection.handlePearsonSubjectChange()">
                            <option value="">-- Select a subject --</option>
                        </select>
                    </div>
                    
                    <div class="form-row" id="pearson-series-group" style="margin-bottom: 1rem; display: none;">
                        <label class="form-label">Exam Series (Optional)</label>
                        <select class="scrape-mapping-select" id="pearson-series-select">
                            <option value="">All exam series</option>
                        </select>
                        <span class="form-hint">Leave empty to scrape all available exam series</span>
                    </div>
                    
                    <div id="pearson-scrape-error" class="error-message" style="display: none; color: #dc2626; margin-bottom: 1rem;"></div>
                    
                    <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button type="button" class="ghost-btn" onclick="UI.closeModal()">Cancel</button>
                        <button type="button" id="pearson-scrape-btn" class="primary-btn" style="display: none;" onclick="PastPapersSection.handleScrapePearson()">
                            <span class="btn-text">Scrape Past Papers</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="material-icons spinning">refresh</span>
                                Scraping...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelector('.modal-body').innerHTML = formHTML;
        
        // If family was previously selected, restore the selection and trigger change, otherwise try autofill
        if (this.scrapeState.pearsonSelectedFamily) {
            document.getElementById('pearson-family-select').value = this.scrapeState.pearsonSelectedFamily;
            await this.handlePearsonFamilyChange();
        } else {
            setTimeout(() => this.applySmartAutofill(), 0);
        }
    },
    
    async loadPearsonFamilies() {
        // This function is now integrated into renderPearsonStep1
        // Kept for backward compatibility but not used
    },
    
    async handlePearsonFamilyChange() {
        const familySelect = document.getElementById('pearson-family-select');
        const subjectGroup = document.getElementById('pearson-subject-group');
        const subjectSelect = document.getElementById('pearson-subject-select');
        const seriesGroup = document.getElementById('pearson-series-group');
        const scrapeBtn = document.getElementById('pearson-scrape-btn');
        const errorDiv = document.getElementById('pearson-scrape-error');
        
        const selectedFamily = familySelect.value;
        this.scrapeState.pearsonSelectedFamily = selectedFamily;
        
        // Hide downstream elements
        seriesGroup.style.display = 'none';
        scrapeBtn.style.display = 'none';
        errorDiv.style.display = 'none';
        this.scrapeState.pearsonSelectedSubject = null;
        this.scrapeState.pearsonSelectedSeries = null;
        
        if (!selectedFamily) {
            subjectGroup.style.display = 'none';
            return;
        }
        
        // Show and load subjects
        subjectGroup.style.display = 'block';
        subjectSelect.innerHTML = '<option value="">Loading subjects...</option>';
        subjectSelect.disabled = true;
        
        try {
            const response = await API.scrapePearsonSubjects(selectedFamily);
            
            if (response.subjects && response.subjects.length > 0) {
                this.scrapeState.pearsonSubjects = response.subjects;
                
                subjectSelect.innerHTML = '<option value="">-- Select a subject --</option>';
                subjectSelect.disabled = false;
                response.subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.specification_code;
                    option.textContent = `${subject.description} (${subject.specification_code})`;
                    subjectSelect.appendChild(option);
                });
                
                // Restore selection if going back
                if (this.scrapeState.pearsonSelectedSubject) {
                    subjectSelect.value = this.scrapeState.pearsonSelectedSubject;
                    await this.handlePearsonSubjectChange();
                }
            } else {
                subjectSelect.innerHTML = '<option value="">No subjects found</option>';
            }
        } catch (error) {
            errorDiv.textContent = 'Failed to load subjects: ' + error.message;
            errorDiv.style.display = 'block';
            subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
        }
    },
    
    async handlePearsonSubjectChange() {
        const subjectSelect = document.getElementById('pearson-subject-select');
        const seriesGroup = document.getElementById('pearson-series-group');
        const seriesSelect = document.getElementById('pearson-series-select');
        const scrapeBtn = document.getElementById('pearson-scrape-btn');
        const errorDiv = document.getElementById('pearson-scrape-error');
        
        const selectedSubject = subjectSelect.value;
        this.scrapeState.pearsonSelectedSubject = selectedSubject;
        
        // Hide downstream elements
        errorDiv.style.display = 'none';
        this.scrapeState.pearsonSelectedSeries = null;
        
        if (!selectedSubject) {
            seriesGroup.style.display = 'none';
            scrapeBtn.style.display = 'none';
            return;
        }
        
        // Show scrape button immediately (series is optional)
        scrapeBtn.style.display = 'inline-flex';
        
        // Show and load exam series
        seriesGroup.style.display = 'block';
        seriesSelect.innerHTML = '<option value="">Loading exam series...</option>';
        
        try {
            const response = await API.scrapePearsonSeries(selectedSubject);
            
            if (response.exam_series && response.exam_series.length > 0) {
                this.scrapeState.pearsonExamSeries = response.exam_series;
                
                seriesSelect.innerHTML = '<option value="">All exam series</option>';
                response.exam_series.forEach(series => {
                    const option = document.createElement('option');
                    option.value = series.value;
                    option.textContent = series.description;
                    seriesSelect.appendChild(option);
                });
                
                // Restore selection if going back
                if (this.scrapeState.pearsonSelectedSeries) {
                    seriesSelect.value = this.scrapeState.pearsonSelectedSeries;
                }
            } else {
                seriesSelect.innerHTML = '<option value="">No exam series available</option>';
            }
        } catch (error) {
            // Series is optional, so just show empty dropdown
            seriesSelect.innerHTML = '<option value="">All exam series</option>';
        }
    },
    
    async handleScrapePearson() {
        const btn = document.getElementById('pearson-scrape-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoading = btn.querySelector('.btn-loading');
        const errorDiv = document.getElementById('pearson-scrape-error');
        const seriesSelect = document.getElementById('pearson-series-select');
        
        const specificationCode = this.scrapeState.pearsonSelectedSubject;
        const examSeries = seriesSelect.value || null;
        
        this.scrapeState.pearsonSelectedSeries = examSeries;
        
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        errorDiv.style.display = 'none';
        
        try {
            const response = await API.scrapePearson(specificationCode, examSeries);
            
            if (response.grouped_papers) {
                this.scrapeState.scrapeData = response;
                this.renderScrapeStep2();
            } else {
                throw new Error('No papers found for this specification');
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    },
    
    goBackToStep1() {
        this.scrapeState.step = 1;
        this.scrapeState.paperMapping = {};
        
        if (this.scrapeState.scraperType === 'aqa') {
            this.renderAqaStep1();
        } else if (this.scrapeState.scraperType === 'ocr') {
            this.renderOcrStep1();
        } else if (this.scrapeState.scraperType === 'pearson') {
            this.renderPearsonStep1();
        }
    },
    
    // Normalize grouped_papers format to be consistent between AQA and OCR
    // AQA returns: { tier: { paper: [items] } }
    // OCR returns: { paper: [items] } (with tier info in each item)
    // Pearson returns: { tier: { paper: [items] } } (same as AQA)
    // This normalizes both to: { tier: { paper: [items] } }
    normalizeGroupedPapers(groupedPapers, scraperType) {
        if (scraperType === 'aqa' || scraperType === 'pearson') {
            // AQA and Pearson are already in the correct format
            return groupedPapers;
        } else if (scraperType === 'ocr') {
            // OCR format: { paper: [items with optional tier field] }
            // Need to restructure into: { tier: { paper: [items] } }
            const normalized = {};
            
            for (const [paperName, items] of Object.entries(groupedPapers)) {
                for (const item of items) {
                    // OCR items may have tier field (null if no tier)
                    const tierName = item.tier || 'No Tier';
                    
                    if (!normalized[tierName]) {
                        normalized[tierName] = {};
                    }
                    if (!normalized[tierName][paperName]) {
                        normalized[tierName][paperName] = [];
                    }
                    normalized[tierName][paperName].push(item);
                }
            }
            
            return normalized;
        }
        
        return groupedPapers;
    },
    
    renderScrapeStep2() {
        const data = this.scrapeState.scrapeData;
        const stats = data.stats || {};
        const rawGroupedPapers = data.grouped_papers || {};
        
        // Normalize the grouped papers structure
        const groupedPapers = this.normalizeGroupedPapers(rawGroupedPapers, this.scrapeState.scraperType);
        
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
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ ${this.scrapeState.scraperType.toUpperCase()}</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ Query</div>
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">Map Papers</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #e2e8f0; color: #64748B; border-radius: 4px;">Import</div>
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
                    <button type="button" class="ghost-btn" onclick="PastPapersSection.goBackToStep1()">← Back</button>
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
        const rawGroupedPapers = data.grouped_papers || {};
        const groupedPapers = this.normalizeGroupedPapers(rawGroupedPapers, this.scrapeState.scraperType);
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
                
                // Handle Pearson's format differently (individual documents vs paired papers)
                if (this.scrapeState.scraperType === 'pearson') {
                    // Pearson: Group individual documents by year/session
                    const byYearSession = {};
                    
                    for (const doc of papersList) {
                        const key = `${doc.year}-${doc.session}`;
                        if (!byYearSession[key]) {
                            byYearSession[key] = {
                                year: doc.year,
                                session: doc.session,
                                question_paper_url: null,
                                mark_scheme_url: null,
                                question_paper_size: null,
                                mark_scheme_size: null
                            };
                        }
                        
                        if (doc.document_type === 'question_paper' && doc.url) {
                            byYearSession[key].question_paper_url = doc.url;
                            byYearSession[key].question_paper_size = doc.size || null;
                        } else if (doc.document_type === 'mark_scheme' && doc.url) {
                            byYearSession[key].mark_scheme_url = doc.url;
                            byYearSession[key].mark_scheme_size = doc.size || null;
                        }
                    }
                    
                    // Now create past paper entries from the grouped data
                    for (const grouped of Object.values(byYearSession)) {
                        if (!grouped.question_paper_url) continue; // Must have at least a question paper
                        
                        this.scrapeState.pastPapersToImport.push({
                            id: `temp-${idCounter++}`,
                            selected: true,
                            year: grouped.year,
                            session: grouped.session || '',
                            scrapedTier: scrapedTier,
                            scrapedPaper: scrapedPaper,
                            dbPaperId: dbPaperId,
                            dbTierId: dbTierId || null,
                            dbPaperName: dbPaper?.name || scrapedPaper,
                            dbTierName: dbTier?.title || '',
                            questionPaperUrl: grouped.question_paper_url,
                            markSchemeUrl: grouped.mark_scheme_url || '',
                            fileSize: grouped.question_paper_size,
                            markSchemeFileSize: grouped.mark_scheme_size
                        });
                    }
                } else {
                    // AQA/OCR: Papers are already grouped with question_paper_url and mark_scheme_url
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
                            markSchemeUrl: paper.mark_scheme_url || '',
                            // File sizes: AQA uses file_size, OCR uses question_paper_file_size
                            fileSize: paper.file_size || paper.question_paper_file_size || null,
                            markSchemeFileSize: paper.mark_scheme_file_size || null
                        });
                    }
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
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ ${this.scrapeState.scraperType.toUpperCase()}</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ Query</div>
                    <div class="step-indicator" style="flex: 1; text-align: center; padding: 0.5rem; background: #dcfce7; color: #16a34a; border-radius: 4px;">✓ Mapped</div>
                    <div class="step-indicator active" style="flex: 1; text-align: center; padding: 0.5rem; background: #3678AE; color: white; border-radius: 4px;">Import</div>
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
            const paperData = {
                year: pp.year,
                session: pp.session || null,
                url: pp.questionPaperUrl,
                mark_scheme_url: pp.markSchemeUrl || null,
                file_size: this.parseSizeToBytes(pp.fileSize),
                mark_scheme_file_size: this.parseSizeToBytes(pp.markSchemeFileSize)
            };
            paperGroups[pp.dbPaperId].push(paperData);
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
