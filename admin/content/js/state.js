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
    papers: [],
    topics: [],
    notes: [],
    podcasts: [],
    pastPapers: [],
    questions: [],
    
    // Question selection state
    selectedQuestionIds: [],
    
    // Section-specific filters (not shared between sections)
    filters: {
        courses: {
            yearId: null,
            subjectId: null
        },
        papers: {
            courseId: null
        },
        topics: {
            courseId: null,
            paperId: null
        },
        notes: {
            courseId: null,
            paperId: null,
            topicId: null
        },
        podcasts: {
            courseId: null,
            paperId: null,
            topicId: null
        },
        pastPapers: {
            courseId: null,
            paperId: null
        },
        questions: {
            courseId: null,
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
    
    setPapersCourseFilter(courseId) {
        this.filters.papers.courseId = courseId;
    },
    
    setTopicsCourseFilter(courseId) {
        this.filters.topics.courseId = courseId;
        // Reset paper selection when course changes
        this.filters.topics.paperId = null;
    },
    
    setTopicsPaperFilter(paperId) {
        this.filters.topics.paperId = paperId;
    },
    
    // Notes filter setters
    setNotesCourseFilter(courseId) {
        this.filters.notes.courseId = courseId;
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
        this.filters.pastPapers.paperId = null;
    },
    
    setPastPapersPaperFilter(paperId) {
        this.filters.pastPapers.paperId = paperId;
    },
    
    // Questions filter setters
    setQuestionsCourseFilter(courseId) {
        this.filters.questions.courseId = courseId;
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
        this.papers = [];
        this.topics = [];
        this.notes = [];
        this.podcasts = [];
        this.pastPapers = [];
        this.questions = [];
        this.selectedQuestionIds = [];
        this.filters = {
            courses: { yearId: null, subjectId: null },
            papers: { courseId: null },
            topics: { courseId: null, paperId: null },
            notes: { courseId: null, paperId: null, topicId: null },
            podcasts: { courseId: null, paperId: null, topicId: null },
            pastPapers: { courseId: null, paperId: null },
            questions: { courseId: null, paperId: null, topicId: null }
        };
    }
};
