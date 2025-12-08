/**
 * Articles System - Lockin.tech
 * JavaScript for loading, filtering, and displaying student articles
 */

// Global state
let articlesData = [];
let currentFilters = {
    category: 'all',
    level: 'all',
    search: ''
};

// Category display names
const categoryNames = {
    'study-tips': 'Study Tips',
    'exam-prep': 'Exam Prep',
    'subject-guides': 'Subject Guides',
    'wellbeing': 'Wellbeing',
    'revision': 'Revision'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Check if we're on the listing page or article page
    const isArticlePage = window.location.pathname.includes('article.html');
    
    try {
        await loadArticles();
        
        if (isArticlePage) {
            displayArticle();
        } else {
            setupFilters();
            displayArticles();
        }
    } catch (error) {
        console.error('Error initializing articles:', error);
        showError('Failed to load articles. Please try again later.');
    }
}

/**
 * Load articles from JSON file
 */
async function loadArticles() {
    try {
        const response = await fetch('content/articles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        articlesData = await response.json();
        
        // Sort by date (newest first)
        articlesData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading articles:', error);
        throw error;
    }
}

/**
 * Set up filter event listeners
 */
function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            displayArticles();
        });
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', (e) => {
            currentFilters.level = e.target.value;
            displayArticles();
        });
    }
    
    if (searchInput) {
        // Debounced search
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentFilters.search = e.target.value.toLowerCase().trim();
                displayArticles();
            }, 300);
        });
    }
}

/**
 * Filter articles based on current filters
 */
function filterArticles() {
    return articlesData.filter(article => {
        // Category filter
        if (currentFilters.category !== 'all' && article.category !== currentFilters.category) {
            return false;
        }
        
        // Level filter
        if (currentFilters.level !== 'all') {
            if (!article.levels || !article.levels.includes(currentFilters.level)) {
                return false;
            }
        }
        
        // Search filter
        if (currentFilters.search) {
            const searchTerms = currentFilters.search.split(' ');
            const searchableText = `${article.title} ${article.excerpt} ${article.category} ${article.tags?.join(' ') || ''}`.toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        }
        
        return true;
    });
}

/**
 * Display articles in the grid
 */
function displayArticles() {
    const articlesGrid = document.getElementById('articlesGrid');
    const featuredContainer = document.getElementById('featuredArticle');
    
    if (!articlesGrid) return;
    
    const filteredArticles = filterArticles();
    
    // Show/hide featured article only when no filters are active
    const noFiltersActive = currentFilters.category === 'all' && 
                           currentFilters.level === 'all' && 
                           currentFilters.search === '';
    
    if (featuredContainer) {
        if (noFiltersActive && filteredArticles.length > 0) {
            const featured = filteredArticles.find(a => a.featured) || filteredArticles[0];
            featuredContainer.innerHTML = createFeaturedCard(featured);
            featuredContainer.style.display = 'block';
        } else {
            featuredContainer.style.display = 'none';
        }
    }
    
    // Get articles for the grid (exclude featured if shown)
    let gridArticles = filteredArticles;
    if (noFiltersActive && featuredContainer && filteredArticles.length > 0) {
        const featuredId = (filteredArticles.find(a => a.featured) || filteredArticles[0]).id;
        gridArticles = filteredArticles.filter(a => a.id !== featuredId);
    }
    
    if (gridArticles.length === 0) {
        articlesGrid.innerHTML = `
            <div class="no-results">
                <h3>No articles found</h3>
                <p>Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }
    
    articlesGrid.innerHTML = gridArticles.map(article => createArticleCard(article)).join('');
}

/**
 * Create featured article card HTML
 */
function createFeaturedCard(article) {
    const imageUrl = article.image || 'content/images/placeholder.jpg';
    const levelBadges = article.levels?.map(l => l.toUpperCase()).join(' & ') || '';
    
    return `
        <a href="article.html?id=${article.id}" class="featured-card">
            <div class="featured-content">
                <span class="featured-badge">Featured</span>
                <h2 class="featured-title">${escapeHtml(article.title)}</h2>
                <p class="featured-excerpt">${escapeHtml(article.excerpt)}</p>
                <div class="featured-meta">
                    <span>${formatDate(article.date)}</span>
                    <span>•</span>
                    <span>${article.readTime || '5 min read'}</span>
                    ${levelBadges ? `<span>•</span><span>${levelBadges}</span>` : ''}
                </div>
            </div>
            <img src="${imageUrl}" alt="${escapeHtml(article.title)}" class="featured-image" onerror="this.style.display='none'">
        </a>
    `;
}

/**
 * Create article card HTML
 */
function createArticleCard(article) {
    const imageUrl = article.image || 'content/images/placeholder.jpg';
    const categoryClass = `category-${article.category}`;
    const categoryName = categoryNames[article.category] || article.category;
    const levelBadges = article.levels?.map(l => `<span class="level-badge">${l.toUpperCase()}</span>`).join('') || '';
    
    return `
        <a href="article.html?id=${article.id}" class="article-card">
            <img src="${imageUrl}" alt="${escapeHtml(article.title)}" class="article-card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22400%22 height=%22200%22/%3E%3Ctext fill=%22%23CBD5E1%22 font-family=%22sans-serif%22 font-size=%2220%22 x=%22150%22 y=%22105%22%3ELockin%3C/text%3E%3C/svg%3E'">
            <div class="article-card-content">
                <span class="article-card-category ${categoryClass}">${categoryName}</span>
                <h3 class="article-card-title">${escapeHtml(article.title)}</h3>
                <p class="article-card-excerpt">${escapeHtml(article.excerpt)}</p>
                <div class="article-card-meta">
                    <span>${formatDate(article.date)} • ${article.readTime || '5 min read'}</span>
                    <span class="article-card-level">${levelBadges}</span>
                </div>
            </div>
        </a>
    `;
}

/**
 * Display individual article
 */
function displayArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    const articleContent = document.getElementById('articleContent');
    const relatedArticles = document.getElementById('relatedArticles');
    
    if (!articleId || !articleContent) {
        showError('Article not found');
        return;
    }
    
    const article = articlesData.find(a => a.id === articleId);
    
    if (!article) {
        showError('Article not found');
        return;
    }
    
    // Update page title
    document.title = `${article.title} - Lockin.tech`;
    
    // Render article
    const categoryClass = `category-${article.category}`;
    const categoryName = categoryNames[article.category] || article.category;
    const levelBadges = article.levels?.map(l => l.toUpperCase()).join(' & ') || '';
    
    articleContent.innerHTML = `
        <div class="article-header">
            <span class="article-category-badge ${categoryClass}">${categoryName}</span>
            <h1 class="article-title">${escapeHtml(article.title)}</h1>
            <div class="article-meta">
                <span class="article-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${formatDate(article.date)}
                </span>
                <span class="article-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${article.readTime || '5 min read'}
                </span>
                ${levelBadges ? `
                <span class="article-meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                    ${levelBadges}
                </span>
                ` : ''}
            </div>
        </div>
        <div class="article-body">
            ${article.content}
        </div>
    `;
    
    // Display related articles
    if (relatedArticles) {
        displayRelatedArticles(article, relatedArticles);
    }
}

/**
 * Display related articles
 */
function displayRelatedArticles(currentArticle, container) {
    // Find related articles (same category or shared tags)
    const related = articlesData
        .filter(a => a.id !== currentArticle.id)
        .filter(a => {
            // Same category
            if (a.category === currentArticle.category) return true;
            // Shared tags
            if (a.tags && currentArticle.tags) {
                return a.tags.some(tag => currentArticle.tags.includes(tag));
            }
            return false;
        })
        .slice(0, 3);
    
    if (related.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    const relatedHtml = related.map(article => `
        <a href="article.html?id=${article.id}" class="related-card">
            <img src="${article.image || 'content/images/placeholder.jpg'}" alt="${escapeHtml(article.title)}" class="related-card-image" onerror="this.style.display='none'">
            <div class="related-card-content">
                <h4 class="related-card-title">${escapeHtml(article.title)}</h4>
                <span class="related-card-meta">${formatDate(article.date)} • ${article.readTime || '5 min read'}</span>
            </div>
        </a>
    `).join('');
    
    container.querySelector('.related-grid').innerHTML = relatedHtml;
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('articlesGrid') || document.getElementById('articleContent');
    if (container) {
        container.innerHTML = `
            <div class="no-results">
                <h3>Error</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
