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
                // Include detailed error information if available
                let errorMessage = data.message || 'Request failed';
                if (data.error) {
                    errorMessage += '\n\nDetails: ' + data.error;
                }
                throw new Error(errorMessage);
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
    
    // Tiers
    async getTiers(courseId, includeInactive = false) {
        return this.request('/admin/tiers', 'POST', { course_id: courseId, include_inactive: includeInactive });
    },
    
    async getTier(tierId) {
        return this.request('/admin/tiers/get', 'POST', { tier_id: tierId });
    },
    
    async createTier(courseId, title, code = null, sortOrder = 0) {
        const body = { course_id: courseId, title };
        if (code) body.code = code;
        if (sortOrder !== null) body.sort_order = sortOrder;
        return this.request('/admin/tiers/create', 'POST', body);
    },
    
    async updateTier(tierId, updates) {
        return this.request('/admin/tiers/update', 'PUT', { tier_id: tierId, ...updates });
    },
    
    async deleteTier(tierId) {
        return this.request('/admin/tiers/delete', 'DELETE', { tier_id: tierId });
    },
    
    // Papers
    async getPapers(courseId, tierId = null, includeInactive = false) {
        const body = { course_id: courseId, include_inactive: includeInactive };
        if (tierId) body.tier_id = tierId;
        return this.request('/admin/papers', 'POST', body);
    },
    
    async getPaper(paperId) {
        return this.request('/admin/papers/get', 'POST', { paper_id: paperId });
    },
    
    async createPaper(courseId, name, tierId = null, code = null, percentageOfGrade = null) {
        const body = { course_id: courseId, name };
        if (tierId) body.tier_id = tierId;
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
    // Topics now belong to tiers, not papers directly
    // Can filter by tier_id, course_id, or paper_id (only ONE allowed)
    async getTopics(filters = {}, includeInactive = false) {
        const body = { include_inactive: includeInactive };
        // API only accepts ONE of: tier_id, course_id, or paper_id
        // Priority: paper_id (most specific) > tier_id > course_id
        if (filters.paperId) {
            body.paper_id = filters.paperId;
        } else if (filters.tierId) {
            body.tier_id = filters.tierId;
        } else if (filters.courseId) {
            body.course_id = filters.courseId;
        }
        return this.request('/admin/topics', 'POST', body);
    },
    
    async getTopic(topicId) {
        return this.request('/admin/topics/get', 'POST', { topic_id: topicId });
    },
    
    // Topics are created with tier_id (required), optionally linked to papers
    async createTopic(tierId, name, sortOrder = 0, paperIds = [], isOptional = false) {
        const body = { tier_id: tierId, name, sort_order: sortOrder, is_optional: isOptional };
        if (paperIds && paperIds.length > 0) body.paper_ids = paperIds;
        return this.request('/admin/topics/create', 'POST', body);
    },
    
    async updateTopic(topicId, updates) {
        return this.request('/admin/topics/update', 'PUT', { topic_id: topicId, ...updates });
    },
    
    async deleteTopic(topicId) {
        return this.request('/admin/topics/delete', 'DELETE', { topic_id: topicId });
    },
    
    // Link/unlink topics from papers (many-to-many relationship)
    async linkTopicToPaper(topicId, paperId, sortOrder = 0) {
        return this.request('/admin/topics/link', 'POST', { topic_id: topicId, paper_id: paperId, sort_order: sortOrder });
    },
    
    async unlinkTopicFromPaper(topicId, paperId) {
        return this.request('/admin/topics/unlink', 'DELETE', { topic_id: topicId, paper_id: paperId });
    },
    
    // Notes
    async getNotes(topicId, includeInactive = false) {
        return this.request('/admin/notes', 'POST', { topic_id: topicId, include_inactive: includeInactive });
    },
    
    async createNote(topicId, content) {
        return this.request('/admin/notes/create', 'POST', { topic_id: topicId, content });
    },
    
    async updateNote(noteId, updates) {
        return this.request('/admin/notes/update', 'PUT', { note_id: noteId, ...updates });
    },
    
    async deleteNote(noteId) {
        return this.request('/admin/notes/delete', 'DELETE', { note_id: noteId });
    },
    
    // Questions
    async getQuestions(topicId, includeInactive = false) {
        return this.request('/admin/questions', 'POST', { topic_id: topicId, include_inactive: includeInactive });
    },
    
    async getQuestion(questionId) {
        return this.request('/admin/questions/get', 'POST', { question_id: questionId });
    },
    
    async createQuestion(topicId, title, sortOrder, options) {
        return this.request('/admin/questions/create', 'POST', { 
            topic_id: topicId, 
            title: title, 
            sort_order: sortOrder,
            options 
        });
    },
    
    async updateQuestion(questionId, updates) {
        return this.request('/admin/questions/update', 'POST', { question_id: questionId, ...updates });
    },
    
    async deleteQuestion(questionId) {
        return this.request('/admin/questions/delete', 'DELETE', { question_id: questionId });
    },
    
    async bulkCreateQuestions(topicId, questions) {
        return this.request('/admin/questions/bulk_create', 'POST', { 
            topic_id: topicId, 
            questions 
        });
    },
    
    async bulkDeleteQuestions(questionIds) {
        return this.request('/admin/questions/bulk_delete', 'DELETE', { question_ids: questionIds });
    },
    
    // Podcasts
    async getPodcasts(topicId) {
        return this.request('/admin/podcasts', 'POST', { topic_id: topicId });
    },
    
    async createPodcast(topicId, name, url, lengthSeconds = null, fileSize = null, script = null) {
        const body = { topic_id: topicId, name, url };
        if (lengthSeconds !== null) body.length_seconds = lengthSeconds;
        if (fileSize !== null) body.file_size = fileSize;
        if (script !== null) body.script = script;
        return this.request('/admin/podcasts/create', 'POST', body);
    },
    
    async updatePodcast(podcastId, updates) {
        return this.request('/admin/podcasts/update', 'PUT', { podcast_id: podcastId, ...updates });
    },
    
    async deletePodcast(podcastId) {
        return this.request('/admin/podcasts/delete', 'DELETE', { podcast_id: podcastId });
    },
    
    // Past Papers
    async getPastPapers(paperId) {
        return this.request('/admin/past_papers', 'POST', { paper_id: paperId });
    },
    
    async createPastPaper(paperId, year, url, fileSize = null, markSchemeUrl = null, markSchemeFileSize = null) {
        const body = { paper_id: paperId, year, url };
        if (fileSize !== null) body.file_size = fileSize;
        if (markSchemeUrl) body.mark_scheme_url = markSchemeUrl;
        if (markSchemeFileSize !== null) body.mark_scheme_file_size = markSchemeFileSize;
        return this.request('/admin/past_papers/create', 'POST', body);
    },
    
    async updatePastPaper(pastPaperId, updates) {
        return this.request('/admin/past_papers/update', 'PUT', { past_paper_id: pastPaperId, ...updates });
    },
    
    async deletePastPaper(pastPaperId) {
        return this.request('/admin/past_papers/delete', 'DELETE', { past_paper_id: pastPaperId });
    },
    
    // AQA Scraper
    async scrapeAqaPreview(url) {
        return this.request('/admin/past_papers/scrape_aqa', 'POST', { url, fetch_sizes: true });
    },
    
    // OCR Scraper
    async scrapeOcrTypes() {
        return this.request('/admin/past_papers/scrape_ocr/types', 'POST', {});
    },
    
    async scrapeOcrQualifications(typeId) {
        return this.request('/admin/past_papers/scrape_ocr/qualifications', 'POST', { type_id: typeId });
    },
    
    async scrapeOcr(qualificationId) {
        return this.request('/admin/past_papers/scrape_ocr', 'POST', { qualification_id: qualificationId });
    },
    
    async bulkCreatePastPapers(paperId, pastPapers) {
        return this.request('/admin/past_papers/bulk_create', 'POST', { 
            paper_id: paperId, 
            past_papers: pastPapers 
        });
    },
    
    async bulkDeletePastPapers(pastPaperIds) {
        return this.request('/admin/past_papers/bulk_delete', 'DELETE', { past_paper_ids: pastPaperIds });
    },
    
    // File Upload (Admin)
    async uploadFile(file, onProgress = null) {
        const token = AppState.getToken();
        console.log(`[Upload] Starting upload for ${file.name} (${file.size} bytes)`);
        
        try {
            // Step 1: Get presigned URL
            console.log('[Upload] Requesting presigned URL...');
            const presignController = new AbortController();
            const presignTimeout = setTimeout(() => presignController.abort(), 10000); // 10s timeout for API
            
            let presignResponse;
            try {
                presignResponse = await fetch(`${this.baseUrl}/admin/upload/presign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token,
                        filename: file.name,
                        content_type: file.type,
                        file_size: file.size
                    }),
                    signal: presignController.signal
                });
            } finally {
                clearTimeout(presignTimeout);
            }
            
            const presignData = await presignResponse.json();
            console.log('[Upload] Presign response:', presignData);
            
            // Check if presign was successful - response HAS a success wrapper
            if (!presignData.success || !presignData.data.presigned_url || !presignData.data.object_key) {
                console.error('[Upload] Presign data invalid:', presignData);
                throw new Error(presignData.message || 'Failed to get presigned URL');
            }
            
            // Step 2: Upload file to R2
            console.log('[Upload] Uploading to R2...');
            // Use AbortController for timeout (30s per MB, min 60s)
            const controller = new AbortController();
            const timeoutMs = Math.max(60000, Math.ceil(file.size / 1024 / 1024) * 30000);
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            let uploadResponse;
            try {
                uploadResponse = await fetch(presignData.data.presigned_url, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                    signal: controller.signal
                });
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Upload timed out after ${timeoutMs/1000}s`);
                }
                throw error;
            } finally {
                clearTimeout(timeoutId);
            }
            
            if (!uploadResponse.ok) {
                throw new Error(`Failed to upload file to storage: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }
            console.log('[Upload] R2 upload successful');
            
            // Step 3: Complete upload and save metadata
            console.log('[Upload] Completing upload...');
            const completeBody = {
                token,
                object_key: presignData.data.object_key,
                filename: file.name,
                content_type: file.type,
                file_size: file.size
            };
            
            const completeController = new AbortController();
            const completeTimeout = setTimeout(() => completeController.abort(), 10000); // 10s timeout for API
            
            let completeResponse;
            try {
                completeResponse = await fetch(`${this.baseUrl}/admin/upload/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(completeBody),
                    signal: completeController.signal
                });
            } finally {
                clearTimeout(completeTimeout);
            }
            
            const completeData = await completeResponse.json();
            console.log('[Upload] Complete response:', completeData);
            
            // Check if complete was successful - response has nested data structure
            if (!completeData.success || !completeData.data || !completeData.data.file_id) {
                console.error('[Upload] Complete data invalid:', completeData);
                throw new Error(completeData.message || 'Failed to complete upload');
            }
            
            return {
                success: true,
                file_url: completeData.data.file_url || presignData.data.public_url,
                file_id: completeData.data.file_id,
                file_size: file.size
            };
        } catch (error) {
            console.error('[Upload] Error details:', error);
            throw error;
        }
    },
    
    // Generate (AI Content Generation)
    async adminPresignUpload(filename, contentType, fileSize) {
        return await this.request('/admin/upload/presign', 'POST', {
            filename: filename,
            content_type: contentType,
            file_size: fileSize
        });
    },
    
    async adminCompleteUpload(objectKey, originalFilename, contentType, fileSize) {
        return await this.request('/admin/upload/complete', 'POST', {
            object_key: objectKey,
            original_filename: originalFilename,
            content_type: contentType,
            file_size: fileSize
        });
    },
    
    async generateInfo(specificationUrl) {
        return await this.request('/admin/generate/info', 'POST', {
            url: specificationUrl
        });
    },
    
    async generateContent(taskId, courseInfo) {
        const body = {
            task_id: taskId,
            course_title: courseInfo.course_title,
            year_id: courseInfo.year_id,
            subject_id: courseInfo.subject_id,
            subject_name: courseInfo.subject_name,
            subject_code: courseInfo.subject_code,
            description: courseInfo.description,
            link_to_specification: courseInfo.link_to_specification,
            tiers: courseInfo.tiers
        };
        // Only include generate_podcasts if explicitly set (defaults to true on backend)
        if (courseInfo.generate_podcasts !== undefined) {
            body.generate_podcasts = courseInfo.generate_podcasts;
        }
        return await this.request('/admin/generate/content', 'POST', body);
    },

    async generateIndividual(topicIds, options = {}) {
        return await this.request('/admin/generate/individual', 'POST', {
            topic_ids: topicIds,
            generate_notes: options.generateNotes || false,
            generate_podcast_scripts: options.generatePodcastScripts || false,
            generate_questions: options.generateQuestions || false,
            replace_existing: options.replaceExisting || false
        });
    },

    async getGenerateStatus(taskId) {
        const response = await this.request('/admin/generate/status', 'POST', {
            task_id: taskId
        });
        return response.data;
    },
    
    async listGenerateTasks(filters = {}) {
        const body = {};
        if (filters.status) body.status = filters.status;
        if (filters.created_by) body.created_by = filters.created_by;
        if (filters.limit) body.limit = filters.limit;
        if (filters.offset) body.offset = filters.offset;
        if (filters.sort) body.sort = filters.sort;
        
        const response = await this.request('/admin/generate/list', 'POST', body);
        return response.data;
    },
    
    async cancelGenerate(taskId) {
        return await this.request('/admin/generate/cancel', 'DELETE', {
            task_id: taskId
        });
    },
    
    // Generate Prompts
    async getGeneratePrompts(filters = {}) {
        const body = {};
        if (filters.stage) body.stage = filters.stage;
        if (filters.includeInactive !== undefined) body.include_inactive = filters.includeInactive;
        
        const response = await this.request('/admin/generate/prompts/fetch', 'POST', body);
        return response.data;
    },
    
    async updateGeneratePrompt(promptId, updates) {
        return await this.request('/admin/generate/prompts/edit', 'PUT', {
            prompt_id: promptId,
            ...updates
        });
    },
    
    // Models Management
    async getModels(filters = {}) {
        const body = {};
        if (filters.provider) body.provider = filters.provider;
        if (filters.includeInactive !== undefined) body.include_inactive = filters.includeInactive;
        
        const response = await this.request('/admin/models/fetch', 'POST', body);
        return response.data;
    },
    
    async createModel(modelData) {
        return await this.request('/admin/models/create', 'POST', modelData);
    },
    
    async updateModel(modelId, updates) {
        return await this.request('/admin/models/edit', 'PUT', {
            model_id: modelId,
            ...updates
        });
    },
    
    async deleteModel(modelId) {
        return await this.request('/admin/models/delete', 'DELETE', {
            model_id: modelId
        });
    },
    
    // Generation Tasks Management
    async deleteGenerationTask(taskId, deleteContent = false) {
        return await this.request('/admin/generate/delete', 'DELETE', {
            task_id: taskId,
            delete_content: deleteContent
        });
    }
};

// Intellectual Property of Hugisoft (hugisoft.com)
// Intellectual Property of Hugisoft (hugisoft.com)
