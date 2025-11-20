// Global state management for content management

const AppState = {
    // Auth
    token: null,
    currentUser: null,
    
    // Current section
    activeSection: 'years',
    
    // Data cache
    years: [],
    subjects: [],
    courses: [],
    tiers: [],
    papers: [],
    topics: [],
    notes: [],
    podcasts: [],
    pastPapers: [],
    questions: [],
    
    // Generate tasks
    generateTasks: [],
    
    // Generate prompts
    generatePrompts: [],
    
    // AI Models
    models: [],
    
    // Question selection state
    selectedQuestionIds: [],
    
    // Section-specific filters (not shared between sections)
    filters: {
        courses: {
            yearId: null,
            subjectId: null
        },
        tiers: {
            courseId: null
        },
        papers: {
            courseId: null,
            tierId: null
        },
        topics: {
            courseId: null,
            tierId: null,
            paperId: null
        },
        notes: {
            courseId: null,
            tierId: null,
            paperId: null,
            topicId: null
        },
        podcasts: {
            courseId: null,
            tierId: null,
            paperId: null,
            topicId: null
        },
        pastPapers: {
            courseId: null,
            tierId: null,
            paperId: null
        },
        questions: {
            courseId: null,
            tierId: null,
            paperId: null,
            topicId: null
        }
    },
    
    // UI state
    isLoading: false,
    
    // Getters
    getToken() {
        if (!this.token) {
            this.token = sessionStorage.getItem('admin_token');
        }
        return this.token;
    },
    
    getCurrentUser() {
        if (!this.currentUser) {
            const userData = sessionStorage.getItem('admin_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        }
        return this.currentUser;
    },
    
    // Setters
    setToken(token) {
        this.token = token;
        if (token) {
            sessionStorage.setItem('admin_token', token);
        } else {
            sessionStorage.removeItem('admin_token');
        }
    },
    
    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            sessionStorage.setItem('admin_user', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('admin_user');
        }
    },
    
    // Section management
    setActiveSection(section) {
        this.activeSection = section;
    },
    
    // Data setters
    setYears(years) {
        this.years = years || [];
    },
    
    setSubjects(subjects) {
        this.subjects = subjects || [];
    },
    
    setCourses(courses) {
        this.courses = courses || [];
    },
    
    setTiers(tiers) {
        this.tiers = tiers || [];
    },
    
    setPapers(papers) {
        this.papers = papers || [];
    },
    
    setTopics(topics) {
        this.topics = topics || [];
    },
    
    setNotes(notes) {
        this.notes = notes || [];
    },
    
    setPodcasts(podcasts) {
        this.podcasts = podcasts || [];
    },
    
    setPastPapers(pastPapers) {
        this.pastPapers = pastPapers || [];
    },
    
    setQuestions(questions) {
        this.questions = questions;
    },
    
    setGenerateTasks(tasks) {
        this.generateTasks = tasks;
    },
    
    setGeneratePrompts(prompts) {
        this.generatePrompts = prompts;
    },
    
    setModels(models) {
        this.models = models;
    },
    
    // Question selection management
    toggleQuestionSelection(questionId) {
        const index = this.selectedQuestionIds.indexOf(questionId);
        if (index > -1) {
            this.selectedQuestionIds.splice(index, 1);
        } else {
            this.selectedQuestionIds.push(questionId);
        }
    },
    
    selectAllQuestions(questionIds) {
        this.selectedQuestionIds = [...questionIds];
    },
    
    clearQuestionSelection() {
        this.selectedQuestionIds = [];
    },
    
    isQuestionSelected(questionId) {
        return this.selectedQuestionIds.includes(questionId);
    },
    
    // Section-specific filter management
    setCoursesYearFilter(yearId) {
        this.filters.courses.yearId = yearId;
    },
    
    setCoursesSubjectFilter(subjectId) {
        this.filters.courses.subjectId = subjectId;
    },
    
    setTiersCourseFilter(courseId) {
        this.filters.tiers.courseId = courseId;
    },
    
    setPapersCourseFilter(courseId) {
        this.filters.papers.courseId = courseId;
        // Reset tier selection when course changes
        this.filters.papers.tierId = null;
    },
    
    setPapersTierFilter(tierId) {
        this.filters.papers.tierId = tierId;
    },
    
    setTopicsCourseFilter(courseId) {
        this.filters.topics.courseId = courseId;
        // Reset tier and paper selection when course changes
        this.filters.topics.tierId = null;
        this.filters.topics.paperId = null;
    },
    
    setTopicsTierFilter(tierId) {
        this.filters.topics.tierId = tierId;
        // Reset paper selection when tier changes
        this.filters.topics.paperId = null;
    },
    
    setTopicsPaperFilter(paperId) {
        this.filters.topics.paperId = paperId;
    },
    
    // Notes filter setters
    setNotesCourseFilter(courseId) {
        this.filters.notes.courseId = courseId;
        this.filters.notes.tierId = null;
        this.filters.notes.paperId = null;
        this.filters.notes.topicId = null;
    },
    
    setNotesTierFilter(tierId) {
        this.filters.notes.tierId = tierId;
        this.filters.notes.paperId = null;
        this.filters.notes.topicId = null;
    },
    
    setNotesPaperFilter(paperId) {
        this.filters.notes.paperId = paperId;
        this.filters.notes.topicId = null;
    },
    
    setNotesTopicFilter(topicId) {
        this.filters.notes.topicId = topicId;
    },
    
    // Podcasts filter setters
    setPodcastsCourseFilter(courseId) {
        this.filters.podcasts.courseId = courseId;
        this.filters.podcasts.tierId = null;
        this.filters.podcasts.paperId = null;
        this.filters.podcasts.topicId = null;
    },
    
    setPodcastsTierFilter(tierId) {
        this.filters.podcasts.tierId = tierId;
        this.filters.podcasts.paperId = null;
        this.filters.podcasts.topicId = null;
    },
    
    setPodcastsPaperFilter(paperId) {
        this.filters.podcasts.paperId = paperId;
        this.filters.podcasts.topicId = null;
    },
    
    setPodcastsTopicFilter(topicId) {
        this.filters.podcasts.topicId = topicId;
    },
    
    // Past Papers filter setters
    setPastPapersCourseFilter(courseId) {
        this.filters.pastPapers.courseId = courseId;
        this.filters.pastPapers.tierId = null;
        this.filters.pastPapers.paperId = null;
    },
    
    setPastPapersTierFilter(tierId) {
        this.filters.pastPapers.tierId = tierId;
        this.filters.pastPapers.paperId = null;
    },
    
    setPastPapersPaperFilter(paperId) {
        this.filters.pastPapers.paperId = paperId;
    },
    
    // Questions filter setters
    setQuestionsCourseFilter(courseId) {
        this.filters.questions.courseId = courseId;
        this.filters.questions.tierId = null;
        this.filters.questions.paperId = null;
        this.filters.questions.topicId = null;
    },
    
    setQuestionsTierFilter(tierId) {
        this.filters.questions.tierId = tierId;
        this.filters.questions.paperId = null;
        this.filters.questions.topicId = null;
    },
    
    setQuestionsPaperFilter(paperId) {
        this.filters.questions.paperId = paperId;
        this.filters.questions.topicId = null;
    },
    
    setQuestionsTopicFilter(topicId) {
        this.filters.questions.topicId = topicId;
    },
    
    // Find helpers
    findYearById(id) {
        return this.years.find(y => y.id === id);
    },
    
    findSubjectById(id) {
        return this.subjects.find(s => s.id === id);
    },
    
    findCourseById(id) {
        return this.courses.find(c => c.id === id);
    },
    
    findTierById(id) {
        return this.tiers.find(t => t.id === id);
    },
    
    findPaperById(id) {
        return this.papers.find(p => p.id === id);
    },
    
    findTopicById(id) {
        return this.topics.find(t => t.id === id);
    },
    
    findNoteById(id) {
        return this.notes.find(n => n.id === id);
    },
    
    findPodcastById(id) {
        return this.podcasts.find(p => p.id === id);
    },
    
    findPastPaperById(id) {
        return this.pastPapers.find(pp => pp.id === id);
    },
    
    findQuestionById(id) {
        return this.questions.find(q => q.id === id);
    },
    
    // Reset
    reset() {
        this.token = null;
        this.currentUser = null;
        this.years = [];
        this.subjects = [];
        this.courses = [];
        this.tiers = [];
        this.papers = [];
        this.topics = [];
        this.notes = [];
        this.podcasts = [];
        this.pastPapers = [];
        this.questions = [];
        this.selectedQuestionIds = [];
        this.filters = {
            courses: { yearId: null, subjectId: null },
            tiers: { courseId: null },
            papers: { courseId: null, tierId: null },
            topics: { courseId: null, tierId: null, paperId: null },
            notes: { courseId: null, tierId: null, paperId: null, topicId: null },
            podcasts: { courseId: null, tierId: null, paperId: null, topicId: null },
            pastPapers: { courseId: null, tierId: null, paperId: null },
            questions: { courseId: null, tierId: null, paperId: null, topicId: null }
        };
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
