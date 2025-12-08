// Global variables
let resultsData = [];
let allSubjects = [];
let subjectStats = {};
let currentSort = 'popularity';
let currentExamType = 'A-Level'; // 'A-Level' or 'GCSE'

// Load CSV data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCSVData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('focus', () => {
        if (searchInput.value) handleSearchInput();
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-section')) {
            document.getElementById('suggestions').classList.remove('active');
        }
    });
    
    // Toggle include old subjects checkbox and exam type filter
    document.addEventListener('change', (e) => {
        if (e.target.id === 'includeOldSubjects' || e.target.name === 'examType') {
            if (e.target.name === 'examType') {
                currentExamType = e.target.value;
            }
            displayHomePage();
        }
    });
}

// Load and parse CSV data
async function loadCSVData() {
    try {
        const response = await fetch('results.csv');
        const csvText = await response.text();
        parseCSV(csvText);
        extractSubjects();
        calculateSubjectStats();
        displayHomePage();
    } catch (error) {
        console.error('Error loading CSV:', error);
        showError('Failed to load data. Please refresh the page.');
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headerLine = parseCSVLine(lines[0]);
    const headers = headerLine.map(h => h.trim());
    
    console.log('CSV Headers:', headers);
    
    resultsData = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        // Skip invalid rows
        if (values.length < headers.length) {
            console.warn(`Skipping line ${i}: insufficient columns`);
            continue;
        }
        if (values[0] && (values[0].includes('National percentage') || values[0] === 'exam_type')) {
            continue;
        }
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        // Only add rows with valid subject and year
        // Also filter out aggregate subjects
        if (row.subject && 
            row.year && 
            !isNaN(parseInt(row.year)) &&
            row.exam_type &&
            !row.subject.includes('All subjects') &&
            !row.subject.includes('All other subjects') &&
            !row.subject.includes('TOTAL')) {
            resultsData.push(row);
        }
    }
    
    console.log(`Parsed ${resultsData.length} valid rows`);
}

// Parse CSV line handling commas in quotes
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// Extract unique subjects
function extractSubjects() {
    const subjectSet = new Set();
    resultsData.forEach(row => {
        if (row.subject && row.subject.length > 0) {
            // Store subject with exam type for proper filtering
            const key = `${row.exam_type}:${row.subject}`;
            subjectSet.add(key);
        }
    });
    allSubjects = Array.from(subjectSet).sort();
}

// Calculate subject statistics
function calculateSubjectStats() {
    subjectStats = {};
    
    allSubjects.forEach(subjectKey => {
        const [examType, subject] = subjectKey.split(':');
        const subjectData = resultsData.filter(row => row.exam_type === examType && row.subject === subject);
        
        // Skip if no data found for this subject
        if (subjectData.length === 0) {
            console.warn(`No data found for ${subjectKey}`);
            return;
        }
        
        const latestData = subjectData.sort((a, b) => parseInt(b.year) - parseInt(a.year))[0];
        
        // Skip if latestData is undefined
        if (!latestData) {
            console.warn(`No latest data for ${subjectKey}`);
            return;
        }
        
        subjectStats[subjectKey] = {
            examType: examType,
            subject: subject,
            latestYear: latestData.year,
            candidates: parseInt(latestData.candidates) || 0,
            topGrades: calculateTopGrades(latestData),
            yearCount: new Set(subjectData.map(d => d.year)).size,
            gradeSystem: latestData.grade_system
        };
    });
}

// Display home page with all subjects
function displayHomePage() {
    const resultsContainer = document.getElementById('resultsContainer');
    const navigationBar = document.getElementById('navigationBar');
    
    navigationBar.style.display = 'none';
    
    // Filter by exam type
    let filteredSubjects = allSubjects.filter(key => key.startsWith(currentExamType + ':'));
    
    // Prepare sorted subjects list - filter out subjects without stats
    let sortedSubjects = filteredSubjects.filter(key => subjectStats[key] !== undefined);
    
    if (currentSort === 'popularity') {
        sortedSubjects.sort((a, b) => {
            const aStats = subjectStats[a];
            const bStats = subjectStats[b];
            if (!aStats || !bStats) return 0;
            return bStats.candidates - aStats.candidates;
        });
    } else {
        // Alphabetical sort
        sortedSubjects.sort((a, b) => {
            const aStats = subjectStats[a];
            const bStats = subjectStats[b];
            if (!aStats || !bStats) return 0;
            return aStats.subject.localeCompare(bStats.subject);
        });
    }
    
    // Filter out subjects without 2025 data if needed
    const includeOld = document.getElementById('includeOldSubjects')?.checked;
    if (!includeOld) {
        const subjects2025 = new Set(resultsData.filter(row => row.year === '2025').map(r => `${r.exam_type}:${r.subject}`));
        sortedSubjects = sortedSubjects.filter(subjectKey => subjects2025.has(subjectKey));
    }
    
    const examTypeLabel = currentExamType === 'A-Level' ? 'A-Level Subjects' : 'GCSE Subjects';
    
    let html = `
        <div class="home-page">
            <div class="home-header">
                <h2>${examTypeLabel} (${sortedSubjects.length})</h2>
                <div class="exam-type-controls">
                    <label>Exam Type:</label>
                    <label class="radio-label"><input type="radio" name="examType" value="A-Level" ${currentExamType === 'A-Level' ? 'checked' : ''}> A-Level</label>
                    <label class="radio-label"><input type="radio" name="examType" value="GCSE" ${currentExamType === 'GCSE' ? 'checked' : ''}> GCSE</label>
                </div>
                <div class="sort-controls">
                    <label>Sort by:</label>
                    <button id="sortAlpha" class="sort-btn ${currentSort === 'alpha' ? 'active' : ''}" onclick="sortSubjects('alpha')">Alphabetical</button>
                    <button id="sortPop" class="sort-btn ${currentSort === 'popularity' ? 'active' : ''}" onclick="sortSubjects('popularity')">Popularity</button>
                </div>
                <div class="filter-controls">
                    <label><input type="checkbox" id="includeOldSubjects" ${includeOld ? 'checked' : ''}> Include old subjects</label>
                </div>
            </div>
            <div class="subjects-list">
    `;
    
    sortedSubjects.forEach(subjectKey => {
        const stats = subjectStats[subjectKey];
        if (!stats) return; // Skip if no stats available
        
        const subject = stats.subject;
        const examType = stats.examType;
        html += `
            <div class="subject-card" onclick="selectSubject('${subjectKey.replace(/'/g, "\\'")}')">
                <div class="subject-card-name">${subject}</div>
                <div class="subject-card-badge">${examType} - ${stats.gradeSystem}</div>
                <div class="subject-card-stats">
                    <div class="subject-card-stat">
                        <span class="stat-label">Candidates</span>
                        <span class="stat-value">${formatNumber(stats.candidates)}</span>
                    </div>
                    <div class="subject-card-stat">
                        <span class="stat-label">Top Grades</span>
                        <span class="stat-value">${stats.topGrades}%</span>
                    </div>
                    <div class="subject-card-stat">
                        <span class="stat-label">Years</span>
                        <span class="stat-value">${stats.yearCount}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
}

// Sort subjects
function sortSubjects(sortType) {
    currentSort = sortType;
    displayHomePage();
}

// Show home page
function showHomePage() {
    document.getElementById('searchInput').value = '';
    displayHomePage();
}

// Handle search input
function handleSearchInput(e) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const suggestionsDiv = document.getElementById('suggestions');
    
    if (!searchTerm) {
        suggestionsDiv.classList.remove('active');
        return;
    }
    
    const matches = allSubjects.filter(subjectKey => {
        const [examType, subject] = subjectKey.split(':');
        return subject.toLowerCase().includes(searchTerm);
    }).slice(0, 15);
    
    if (matches.length > 0) {
        suggestionsDiv.innerHTML = matches.map(subjectKey => {
            const [examType, subject] = subjectKey.split(':');
            return `<div class="suggestion-item" onclick="selectSubject('${subjectKey.replace(/'/g, "\\'")}')">
                <span class="suggestion-name">${subject}</span>
                <span class="suggestion-badge">${examType}</span>
            </div>`;
        }).join('');
        suggestionsDiv.classList.add('active');
    } else {
        suggestionsDiv.innerHTML = '<div class="suggestion-item">No subjects found</div>';
        suggestionsDiv.classList.add('active');
    }
}

// Select a subject
function selectSubject(subjectKey) {
    const [examType, subject] = subjectKey.split(':');
    document.getElementById('searchInput').value = subject;
    document.getElementById('suggestions').classList.remove('active');
    displaySubjectData(subjectKey);
}

// Get grade labels based on grade system
function getGradeLabels(gradeSystem) {
    switch(gradeSystem) {
        case 'A*-U':
            return ['A*', 'A', 'B', 'C', 'D', 'E', 'N'];
        case '9-1':
            return ['9', '8', '7', '6', '5', '4', '3', '2', '1'];
        case 'A*-G':
            return ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
        default:
            return [];
    }
}

// Get grades from row based on grade system
function getGradesFromRow(row) {
    const labels = getGradeLabels(row.grade_system);
    const grades = {};
    labels.forEach((label, i) => {
        const val = row[`g${i+1}`];
        if (val && val !== '') {
            grades[label] = val;
        }
    });
    return grades;
}

// Get grades for chart - handles conversion between grade systems
function getGradesForChart(row, targetSystem) {
    const rowGrades = getGradesFromRow(row);
    
    // If same system or not GCSE, return as-is
    if (row.grade_system === targetSystem || row.exam_type !== 'GCSE') {
        return rowGrades;
    }
    
    // Convert A*-G to 9-1 for display
    if (row.grade_system === 'A*-G' && targetSystem === '9-1') {
        return {
            '9': rowGrades['A*'] || '',
            '8': (parseFloat(rowGrades['A*'] || 0) * 0.3 + parseFloat(rowGrades['A'] || 0) * 0.7).toFixed(1),
            '7': rowGrades['A'] || '',
            '6': (parseFloat(rowGrades['B'] || 0) * 0.6 + parseFloat(rowGrades['C'] || 0) * 0.4).toFixed(1),
            '5': (parseFloat(rowGrades['B'] || 0) * 0.4 + parseFloat(rowGrades['C'] || 0) * 0.6).toFixed(1),
            '4': rowGrades['C'] || '',
            '3': (parseFloat(rowGrades['D'] || 0) * 0.6 + parseFloat(rowGrades['E'] || 0) * 0.4).toFixed(1),
            '2': (parseFloat(rowGrades['E'] || 0) * 0.5 + parseFloat(rowGrades['F'] || 0) * 0.5).toFixed(1),
            '1': (parseFloat(rowGrades['F'] || 0) * 0.3 + parseFloat(rowGrades['G'] || 0) * 0.7).toFixed(1)
        };
    }
    
    return rowGrades;
}

// Get original grade label for tooltip
function getOriginalGrade(targetGrade, originalSystem) {
    if (originalSystem === 'A*-G') {
        const mapping = {
            '9': 'A*', '8': 'A*-A', '7': 'A', '6': 'B-C',
            '5': 'B-C', '4': 'C', '3': 'D-E', '2': 'E-F', '1': 'F-G'
        };
        return mapping[targetGrade] || targetGrade;
    }
    return targetGrade;
}

// Helper function to get grade system note
function getGradeSystemNote(gradeSystem, examType) {
    if (gradeSystem === 'A*-U') {
        return 'A* grades were introduced in 2010. Years before 2010 show only A-E grades.';
    } else if (gradeSystem === '9-1') {
        return 'GCSE 9-1 grading system introduced in 2017. Grade 9 is the highest, grade 1 is the lowest passing grade.';
    } else if (gradeSystem === 'A*-G') {
        return 'Legacy GCSE A*-G grading system (used before 2017 reforms).';
    }
    return '';
}

// Helper function to generate table headers dynamically
function generateTableHeaders(gradeSystem) {
    const labels = getGradeLabels(gradeSystem);
    return labels.map(label => `<th class="number-col">${label}</th>`).join('');
}

// Generate dynamic grade legend
function generateGradeLegend(grades) {
    const colors = ['#2d3748', '#4a5568', '#718096', '#a0aec0', '#cbd5e0', '#e2e8f0', '#f7fafc', '#edf2f7', '#e2e8f0'];
    return grades.map((grade, i) => `
        <span style="display: inline-block; margin: 0 8px;">
            <span style="display: inline-block; width: 12px; height: 12px; background: ${colors[i % colors.length]}; margin-right: 5px;"></span>${grade}
        </span>
    `).join('');
}

// Display subject data - ALL YEARS with CHARTS
function displaySubjectData(subjectKey) {
    const [examType, subjectName] = subjectKey.split(':');
    let subjectData = resultsData.filter(row => row.exam_type === examType && row.subject === subjectName);
    
    if (subjectData.length === 0) {
        showError(`No data found for ${subjectName}`);
        return;
    }
    
    // Show navigation bar
    document.getElementById('navigationBar').style.display = 'block';
    
    // Sort by year descending, then by data_type (Exam before Teacher)
    subjectData.sort((a, b) => {
        const yearDiff = parseInt(b.year) - parseInt(a.year);
        if (yearDiff !== 0) return yearDiff;
        
        // Put "Exam" before "Teacher" for same year
        if (a.data_type === 'Exam' && b.data_type === 'Teacher') return 1;
        if (a.data_type === 'Teacher' && b.data_type === 'Exam') return -1;
        return 0;
    });
    
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Calculate summary statistics from most recent year
    const latestData = subjectData[0];
    const totalYears = new Set(subjectData.map(d => d.year)).size;
    const gradeSystem = latestData.grade_system;
    
    let html = `
        <div class="subject-display">
            <div class="subject-header">
                <h2 class="subject-title">${subjectName}</h2>
                <div class="subject-badge-container">
                    <span class="exam-type-badge">${examType}</span>
                    <span class="grade-system-badge">${gradeSystem}</span>
                </div>
                <div class="subject-info">
                    <div class="info-item">
                        <span class="info-label">Latest Year:</span>
                        <span class="info-value">${latestData.year}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Years:</span>
                        <span class="info-value">${totalYears}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Latest Candidates:</span>
                        <span class="info-value">${formatNumber(latestData.candidates)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Latest Pass Rate:</span>
                        <span class="info-value">${latestData.pass_rate || 'N/A'}%</span>
                    </div>
                </div>
            </div>
            
            <div class="summary-stats">
                <div class="stat-box">
                    <div class="stat-label">Top Grades</div>
                    <div class="stat-value">${calculateTopGrades(latestData)}%</div>
                    <div class="stat-context">${latestData.year} results</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Good Pass Rate</div>
                    <div class="stat-value">${calculateAtoC(latestData)}%</div>
                    <div class="stat-context">${latestData.year} results</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Total Records</div>
                    <div class="stat-value">${subjectData.length}</div>
                    <div class="stat-context">Including historical data</div>
                </div>
            </div>
            
            <div class="data-note" style="padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; margin-bottom: 25px; border-radius: 4px;">
                <strong>Note:</strong> ${getGradeSystemNote(gradeSystem, examType)}
            </div>
            
            <div class="charts-section">
                ${generatePassRateChart(subjectData)}
                ${generateGradeDistributionChart(subjectData)}
                ${generateTopGradesChart(subjectData)}
            </div>
            
            <div class="data-table-wrapper">
                <h3 class="chart-title">Complete Data Table</h3>
                <table class="data-table">
    `;
    
    // Add all data rows with dynamic headers when grade system changes
    let currentGradeSystem = null;
    subjectData.forEach((row, index) => {
        // Insert new header when grade system changes
        if (row.grade_system !== currentGradeSystem) {
            currentGradeSystem = row.grade_system;
            
            // Close previous tbody if not first
            if (index > 0) {
                html += `</tbody>`;
            }
            
            // Add header for this grade system
            html += `
                    <thead>
                        <tr class="grade-system-header">
                            <th colspan="100%" style="background: #495057; color: white; text-align: center; padding: 8px; font-size: 0.9rem;">
                                ${row.grade_system} Grading System (${row.pass_threshold})
                            </th>
                        </tr>
                        <tr>
                            <th>Year</th>
                            <th>Type</th>
                            ${generateTableHeaders(row.grade_system)}
                            <th class="number-col">U</th>
                            <th class="number-col">Pass Rate</th>
                            <th class="number-col">Candidates</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
        }
        
        const yearClass = row.year === '2025' ? 'year-2025' : '';
        const teacherClass = row.data_type === 'Teacher' ? 'teacher' : '';
        const pre2010Class = parseInt(row.year) < 2010 ? 'pre-2010' : '';
        const rowClass = `${yearClass} ${teacherClass} ${pre2010Class}`.trim();
        
        const grades = getGradesFromRow(row);
        const gradeLabels = getGradeLabels(row.grade_system);
        const gradeCells = gradeLabels.map(label => 
            `<td class="number-col grade-cell">${formatValue(grades[label] || '')}</td>`
        ).join('');
        
        html += `
            <tr class="${rowClass}">
                <td class="year-col">${row.year}</td>
                <td class="type-col">${row.data_type || 'Exam'}</td>
                ${gradeCells}
                <td class="number-col">${formatValue(row.u)}</td>
                <td class="number-col pass-rate-cell">${formatValue(row.pass_rate)}</td>
                <td class="number-col">${formatNumber(row.candidates)}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Generate Pass Rate Chart
function generatePassRateChart(data) {
    const examData = data.filter(d => d.data_type !== 'Teacher').slice(0, 20);
    if (examData.length === 0) return '';
    
    const maxValue = Math.max(...examData.map(d => parseFloat(d.pass_rate) || 0));
    
    // Skip rendering if no data
    if (maxValue === 0 || isNaN(maxValue)) return '';
    
    const passThreshold = examData[0].pass_threshold || 'Pass';
    
    let html = `
        <div class="chart-wrapper">
            <h3 class="chart-title">Pass Rate Trend (${passThreshold}) - Last ${examData.length} Years</h3>
            <div class="chart-container">
                <div class="line-chart">
    `;
    
    examData.forEach(row => {
        const value = parseFloat(row.pass_rate) || 0;
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
        html += `
            <div class="chart-bar">
                <div class="bar-group">
                    <div class="bar" style="height: ${height}%;">
                        <span class="bar-value">${value}%</span>
                    </div>
                </div>
                <div class="bar-label">${row.year}</div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Generate Grade Distribution Chart
function generateGradeDistributionChart(data) {
    const examData = data.filter(d => d.data_type !== 'Teacher').slice(0, 15);
    if (examData.length === 0) return '';
    
    const primarySystem = examData[0].grade_system;
    const isGCSE = examData[0].exam_type === 'GCSE';
    
    // For GCSE, use 9-1 as primary but include A*-G data
    const displaySystem = (isGCSE && primarySystem === '9-1') ? '9-1' : primarySystem;
    const grades = getGradeLabels(displaySystem);
    
    const maxValue = Math.max(...examData.flatMap(d => {
        const values = getGradesForChart(d, displaySystem);
        return Object.values(values).map(v => parseFloat(v) || 0);
    }));
    
    // Skip rendering if no data
    if (maxValue === 0 || isNaN(maxValue)) return '';
    
    let html = `
        <div class="chart-wrapper">
            <h3 class="chart-title">Grade Distribution - Last ${examData.length} Years</h3>
            <div class="chart-container">
                <div class="multi-line-chart">
    `;
    
    examData.forEach(row => {
        html += `
            <div class="year-group">
                <div class="bars-container">
        `;
        
        const rowGrades = getGradesForChart(row, displaySystem);
        grades.forEach(grade => {
            const value = parseFloat(rowGrades[grade]) || 0;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            // Prefix numeric grades with 'g-' for valid CSS class names
            let gradeClass = grade.toLowerCase().replace('*', '-star').replace('/', '-');
            if (!isNaN(grade)) {
                gradeClass = 'g-' + grade;
            }
            
            const tooltip = row.grade_system !== displaySystem ? `${grade} (≈${getOriginalGrade(grade, row.grade_system)}): ${value}%` : `${grade}: ${value}%`;
            
            html += `
                <div class="grade-bar ${gradeClass}" style="height: ${height}%;" title="${tooltip}"></div>
            `;
        });
        
        html += `
                </div>
                <div class="year-label">${row.year}</div>
            </div>
        `;
    });
    
    html += `
                </div>
                <div style="text-align: center; margin-top: 15px; font-size: 0.85rem; color: #6c757d;">
                    ${generateGradeLegend(grades)}
                </div>`;
    
    // Add note if mixing grade systems
    const hasMixedSystems = new Set(examData.map(d => d.grade_system)).size > 1;
    if (hasMixedSystems) {
        html += `
                <div style="text-align: center; margin-top: 10px; font-size: 0.8rem; color: #856404; background: #fff3cd; padding: 8px; border-radius: 4px;">
                    Note: Pre-2019 data uses A*-G grades mapped to approximate 9-1 equivalents for visualization.
                </div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Generate Top Grades Chart
function generateTopGradesChart(data) {
    const examData = data.filter(d => d.data_type !== 'Teacher').slice(0, 20);
    if (examData.length === 0) return '';
    
    const primarySystem = examData[0].grade_system;
    const values = examData.map(d => {
        const grades = getGradesFromRow(d);
        // Calculate top grades based on actual system
        if (d.grade_system === '9-1') {
            return (parseFloat(grades['9']) || 0) + (parseFloat(grades['8']) || 0) + (parseFloat(grades['7']) || 0);
        } else if (d.grade_system === 'A*-G') {
            // For A*-G system, use A* + A as equivalent to top grades
            return (parseFloat(grades['A*']) || 0) + (parseFloat(grades['A']) || 0);
        } else {
            // A-Level
            return (parseFloat(grades['A*']) || 0) + (parseFloat(grades['A']) || 0);
        }
    });
    const maxValue = Math.max(...values);
    
    // Skip rendering if no data
    if (maxValue === 0 || isNaN(maxValue)) return '';
    
    const topGradeLabel = primarySystem === '9-1' ? '9-7 / A*-A' : 'A* + A';
    
    let html = `
        <div class="chart-wrapper">
            <h3 class="chart-title">Top Grades Trend (${topGradeLabel}) - Last ${examData.length} Years</h3>
            <div class="chart-container">
                <div class="line-chart">
    `;
    
    examData.forEach((row, index) => {
        const value = values[index];
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
        html += `
            <div class="chart-bar">
                <div class="bar-group">
                    <div class="bar" style="height: ${height}%;">
                        <span class="bar-value">${value.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="bar-label">${row.year}</div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Format value for display
function formatValue(value) {
    if (value === null || value === undefined || value === '') return '—';
    if (value === '0' || value === '0.0') return '0';
    return value;
}

// Format number with commas
function formatNumber(num) {
    if (!num || num === '' || num === '0' || isNaN(num)) return 'N/A';
    return parseInt(num).toLocaleString();
}

// Calculate top grades based on grade system
function calculateTopGrades(data) {
    const grades = getGradesFromRow(data);
    if (data.grade_system === '9-1') {
        const g9 = parseFloat(grades['9']) || 0;
        const g8 = parseFloat(grades['8']) || 0;
        const g7 = parseFloat(grades['7']) || 0;
        return (g9 + g8 + g7).toFixed(1);
    } else {
        const aStar = parseFloat(grades['A*']) || 0;
        const a = parseFloat(grades['A']) || 0;
        return (aStar + a).toFixed(1);
    }
}

// Calculate good pass rate (9-4 or A*-C equivalent)
function calculateAtoC(data) {
    const grades = getGradesFromRow(data);
    if (data.grade_system === '9-1') {
        const g9 = parseFloat(grades['9']) || 0;
        const g8 = parseFloat(grades['8']) || 0;
        const g7 = parseFloat(grades['7']) || 0;
        const g6 = parseFloat(grades['6']) || 0;
        const g5 = parseFloat(grades['5']) || 0;
        const g4 = parseFloat(grades['4']) || 0;
        return (g9 + g8 + g7 + g6 + g5 + g4).toFixed(1);
    } else {
        const aStar = parseFloat(grades['A*']) || 0;
        const a = parseFloat(grades['A']) || 0;
        const b = parseFloat(grades['B']) || 0;
        const c = parseFloat(grades['C']) || 0;
        return (aStar + a + b + c).toFixed(1);
    }
}

// Show error message
function showError(message) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div class="error-message">
            <h2>⚠️ ${message}</h2>
            <p>Please try searching for another subject.</p>
        </div>
    `;
}
