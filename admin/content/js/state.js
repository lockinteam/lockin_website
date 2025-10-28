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
    
    // Reset
    reset() {
        this.token = null;
        this.currentUser = null;
        this.years = [];
        this.subjects = [];
        this.courses = [];
        this.papers = [];
        this.topics = [];
        this.filters = {
            courses: { yearId: null, subjectId: null },
            papers: { courseId: null },
            topics: { courseId: null, paperId: null }
        };
    }
};
