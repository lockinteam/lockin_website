// API layer for all backend communication

const API = {
    baseUrl: 'https://backend.lockin.tech',
    
    // Helper method for making requests
    async request(endpoint, method = 'POST', body = null) {
        const token = AppState.getToken();
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            // Always include token in body for POST/PUT/DELETE
            options.body = JSON.stringify({
                token,
                ...body
            });
        }
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    // Auth
    async verifyToken() {
        return this.request('/auth/verify_token', 'POST', {});
    },
    
    async logout() {
        return this.request('/auth/logout', 'POST', {});
    },
    
    // Years
    async getYears(includeInactive = true) {
        return this.request('/admin/years', 'POST', { include_inactive: includeInactive });
    },
    
    async createYear(name, sortOrder = 0) {
        return this.request('/admin/years/create', 'POST', { name, sort_order: sortOrder });
    },
    
    async updateYear(yearId, updates) {
        return this.request('/admin/years/update', 'PUT', { year_id: yearId, ...updates });
    },
    
    async deleteYear(yearId) {
        return this.request('/admin/years/delete', 'DELETE', { year_id: yearId });
    },
    
    // Subjects
    async getSubjects(includeInactive = false) {
        return this.request('/admin/subjects', 'POST', { include_inactive: includeInactive });
    },
    
    async createSubject(name, code = null) {
        const body = { name };
        if (code) body.code = code;
        return this.request('/admin/subjects/create', 'POST', body);
    },
    
    async updateSubject(subjectId, updates) {
        return this.request('/admin/subjects/update', 'PUT', { subject_id: subjectId, ...updates });
    },
    
    async deleteSubject(subjectId) {
        return this.request('/admin/subjects/delete', 'DELETE', { subject_id: subjectId });
    },
    
    // Courses
    async getCourses(filters = {}) {
        const body = {};
        if (filters.yearId) body.year_id = filters.yearId;
        if (filters.subjectId) body.subject_id = filters.subjectId;
        if (filters.includeInactive !== undefined) body.include_inactive = filters.includeInactive;
        return this.request('/admin/courses', 'POST', body);
    },
    
    async getCourse(courseId) {
        return this.request('/admin/courses/get', 'POST', { course_id: courseId });
    },
    
    async createCourse(yearId, subjectId, title, description = null, linkToSpec = null) {
        const body = { year_id: yearId, subject_id: subjectId, title };
        if (description) body.description = description;
        if (linkToSpec) body.link_to_specification = linkToSpec;
        return this.request('/admin/courses/create', 'POST', body);
    },
    
    async updateCourse(courseId, updates) {
        return this.request('/admin/courses/update', 'PUT', { course_id: courseId, ...updates });
    },
    
    async deleteCourse(courseId) {
        return this.request('/admin/courses/delete', 'DELETE', { course_id: courseId });
    },
    
    // Papers
    async getPapers(courseId, includeInactive = false) {
        return this.request('/admin/papers', 'POST', { course_id: courseId, include_inactive: includeInactive });
    },
    
    async getPaper(paperId) {
        return this.request('/admin/papers/get', 'POST', { paper_id: paperId });
    },
    
    async createPaper(courseId, name, code = null, percentageOfGrade = null) {
        const body = { course_id: courseId, name };
        if (code) body.code = code;
        if (percentageOfGrade !== null) body.percentage_of_grade = percentageOfGrade;
        return this.request('/admin/papers/create', 'POST', body);
    },
    
    async updatePaper(paperId, updates) {
        return this.request('/admin/papers/update', 'PUT', { paper_id: paperId, ...updates });
    },
    
    async deletePaper(paperId) {
        return this.request('/admin/papers/delete', 'DELETE', { paper_id: paperId });
    },
    
    // Topics
    async getTopics(paperId, includeInactive = false) {
        return this.request('/admin/topics', 'POST', { paper_id: paperId, include_inactive: includeInactive });
    },
    
    async getTopic(topicId) {
        return this.request('/admin/topics/get', 'POST', { topic_id: topicId });
    },
    
    async createTopic(paperId, name, sortOrder = 0) {
        return this.request('/admin/topics/create', 'POST', { paper_id: paperId, name, sort_order: sortOrder });
    },
    
    async updateTopic(topicId, updates) {
        return this.request('/admin/topics/update', 'PUT', { topic_id: topicId, ...updates });
    },
    
    async deleteTopic(topicId) {
        return this.request('/admin/topics/delete', 'DELETE', { topic_id: topicId });
    }
};
