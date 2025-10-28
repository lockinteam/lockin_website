// Main content management controller

const ContentManagement = {
    async init() {
        // Initialize UI elements
        UI.init();
        
        // Check authentication
        const token = AppState.getToken();
        if (!token) {
            this.redirectToLogin();
            return;
        }
        
        try {
            // Verify token and permissions
            const data = await API.verifyToken();
            
            if (!data.success || !(data.user.role === 'admin' || data.user.role === 'owner')) {
                throw new Error('Insufficient permissions');
            }
            
            AppState.setCurrentUser(data.user);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial section (years by default)
            await this.loadSection('years');
            
        } catch (error) {
            console.error('Init error:', error);
            UI.showToast('Session expired or insufficient permissions', 'error');
            setTimeout(() => this.redirectToLogin(), 2000);
        }
    },
    
    setupEventListeners() {
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Back to dashboard button
        const backBtn = document.getElementById('backToDashboardBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/admin/';
            });
        }
    },
    
    async switchSection(section) {
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.section === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Load section
        await this.loadSection(section);
    },
    
    async loadSection(section) {
        AppState.setActiveSection(section);
        
        try {
            switch (section) {
                case 'years':
                    await YearsSection.load();
                    break;
                case 'subjects':
                    await SubjectsSection.load();
                    break;
                case 'courses':
                    await CoursesSection.load();
                    break;
                case 'papers':
                    await PapersSection.load();
                    break;
                case 'topics':
                    await TopicsSection.load();
                    break;
                case 'notes':
                    await NotesSection.load();
                    break;
                case 'podcasts':
                    await PodcastsSection.load();
                    break;
                case 'pastPapers':
                    await PastPapersSection.load();
                    break;
                case 'questions':
                    await QuestionsSection.load();
                    break;
                default:
                    UI.showEmpty('Section Not Found', `The section "${section}" is not available.`);
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            UI.showEmpty(`Error Loading ${section}`, error.message);
        }
    },
    
    async logout() {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        AppState.reset();
        this.redirectToLogin();
    },
    
    redirectToLogin() {
        window.location.href = '/admin/login/';
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ContentManagement.init());
} else {
    ContentManagement.init();
}
