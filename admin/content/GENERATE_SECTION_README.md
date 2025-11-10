# Generate Section - Documentation

## Overview

The **Generate Section** is an AI-powered content generation system that allows admins to create complete course content automatically by uploading a specification PDF. The system uses Google's Gemini AI to extract course information and generate comprehensive educational content including papers, topics, notes, and practice questions.

## Features

### 🎯 Core Functionality

1. **PDF Upload & Analysis**
   - Upload course specification PDFs (up to 100MB)
   - AI extracts course metadata (title, year, subject, description)
   - Automatic matching to existing years and subjects

2. **Two-Step Generation Process**
   - **Step 1: Info Extraction** - Review and edit AI-extracted course information
   - **Step 2: Content Generation** - Generate full course content in background

3. **Real-Time Progress Tracking**
   - Live progress bars and percentage completion
   - Current task status (e.g., "Generating notes for: Data Structures")
   - Detailed breakdowns: notes completed, questions completed
   - Estimated completion time

4. **Task Management**
   - View all generation tasks (running, completed, failed, cancelled)
   - Filter by status
   - Sort by date, status, or course title
   - Cancel running tasks
   - View detailed task information

5. **Background Processing**
   - Long-running generation doesn't block UI
   - Automatic polling every 5 seconds for active tasks
   - Graceful handling of errors

### 📊 Generated Content Structure

```
Course
└─ Papers (e.g., Paper 1, Paper 2, Paper 3)
    └─ Topics (e.g., Data Structures, Algorithms, Networks)
        ├─ Notes (comprehensive study notes in markdown)
        └─ Questions (10 multiple-choice per topic)
            └─ Options (4 options per question, 1 correct)
```

### ⏱️ Timing Estimates

For a typical course with 24 topics:
- **Papers/Topics Structure**: ~5 seconds
- **Notes Generation**: ~9 seconds per topic (216s total)
- **Questions Generation**: ~9 seconds per topic (216s total)
- **Total**: ~7-8 minutes

## User Interface

### Task List View (Default)

```
┌─────────────────────────────────────────────────────┐
│ Filters: [All Tasks ▼] [Newest First ▼] [+ Create] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Computer Science A-Level    [Generating] 🟢     │ │
│ │ Subject: Computer Science                        │ │
│ │ Specification: cs-spec.pdf                       │ │
│ │ ╔═══════════════════════════════════════╗        │ │
│ │ ║ Progress: ████████████░░░░░░░ 45.8%   ║        │ │
│ │ ║ Generating notes for: Data Structures  ║        │ │
│ │ ║ Notes: 12/24  Questions: 10/24         ║        │ │
│ │ ╚═══════════════════════════════════════╝        │ │
│ │ [Details] [Cancel]                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Biology A-Level             [Completed] ✓        │ │
│ │ Subject: Biology                                 │ │
│ │ Duration: 8m 23s  Cost: $0.25                    │ │
│ │ [Details]                                        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Create New Task Flow

#### Step 1: Upload Specification PDF
```
┌──────────────────────────────────────┐
│ Create New Generation Task           │
├──────────────────────────────────────┤
│ Upload a course specification PDF to │
│ extract course information and       │
│ generate content using AI.           │
│                                      │
│ Specification PDF *                  │
│ [Choose File]                        │
│ ┌──────────────────────────────────┐ │
│ │ 📄 computer-science-spec.pdf     │ │
│ │ 2.3 MB                      [×]  │ │
│ └──────────────────────────────────┘ │
│ Maximum: 100MB (admin limit)         │
│                                      │
│ [Cancel] [Upload & Extract Info]    │
└──────────────────────────────────────┘
```

#### Step 2: Review & Start Generation
```
┌──────────────────────────────────────┐
│ Review & Start Generation            │
├──────────────────────────────────────┤
│ Review the extracted course info and │
│ make any edits before starting AI    │
│ content generation.                  │
│                                      │
│ Course Title *                       │
│ [Computer Science A-Level]           │
│                                      │
│ Year Level *                         │
│ [A-Level (12/13) ▼]                  │
│                                      │
│ Subject                              │
│ [Computer Science (9618) ▼]          │
│                                      │
│ Description *                        │
│ [Comprehensive A-Level CS course...] │
│                                      │
│ ℹ What happens next:                 │
│ • Course will be created             │
│ • AI generates papers, topics, notes │
│ • Generation runs in background      │
│ • Monitor progress in real-time      │
│                                      │
│ [Cancel] [Start Content Generation]  │
└──────────────────────────────────────┘
```

### Task Details View
```
┌──────────────────────────────────────┐
│ Computer Science A-Level             │
│ Status: [Generating Notes] 🟢        │
├──────────────────────────────────────┤
│ Subject: Computer Science            │
│ Created By: admin_user               │
│ Specification: cs-spec.pdf           │
│                                      │
│ ╔════════════════════════════════╗   │
│ ║ Progress: ██████████░░ 45.8%   ║   │
│ ║ Notes: 12/24  Questions: 10/24 ║   │
│ ╚════════════════════════════════╝   │
│                                      │
│ Timestamps:                          │
│ • Created: Nov 10, 2025 10:00 AM     │
│ • Started: Nov 10, 2025 10:00 AM     │
│ • Info Extracted: Nov 10, 2025 10:00 │
│ • Generation Started: Nov 10, 10:05  │
│ • Est. Completion: Nov 10, 10:20     │
│                                      │
│ Metrics:                             │
│ • API Calls: 26                      │
│ • Tokens Used: 45,000                │
│ • Estimated Cost: $0.12              │
│                                      │
│ [Close]                              │
└──────────────────────────────────────┘
```

## Status Types

### Task Status Values

| Status | Badge Color | Description |
|--------|------------|-------------|
| `pending` | Gray | Task created, waiting to start |
| `info_generating` | Blue | AI extracting course information |
| `info_complete` | Green | Ready to start generation (Step 2) |
| `content_generating` | Blue | Starting content generation |
| `generating_papers` | Blue | Creating papers/topics structure |
| `generating_notes_*` | Blue | Generating notes for specific topic |
| `generating_questions_*` | Blue | Generating questions for specific topic |
| `completed` | Green | All content generated successfully |
| `failed` | Red | Generation failed (error details shown) |
| `cancelled` | Gray | Cancelled by admin |

## API Endpoints Used

### 1. Upload Specification
```javascript
POST /admin/upload/presign
POST /admin/upload/complete
```

### 2. Extract Course Info (Step 1)
```javascript
POST /admin/generate/info
{
  "token": "admin_token",
  "specification_file_id": "file-uuid"
}
```

### 3. Start Content Generation (Step 2)
```javascript
POST /admin/generate/content
{
  "token": "admin_token",
  "task_id": "task-uuid",
  "course_title": "Computer Science A-Level",
  "year_id": "year-uuid",
  "subject_id": "subject-uuid",
  "description": "Course description..."
}
```

### 4. Get Task Status
```javascript
GET /admin/generate/status?token=admin_token&task_id=task-uuid
```

### 5. List All Tasks
```javascript
GET /admin/generate/list?token=admin_token&status=completed&sort=created_at_desc
```

### 6. Cancel Running Task
```javascript
DELETE /admin/generate/cancel
{
  "token": "admin_token",
  "task_id": "task-uuid"
}
```

## File Structure

### JavaScript Files

```
admin/content/js/
├── generate.js         # Main generate section controller
├── api.js             # API methods for generate endpoints
├── state.js           # State management for generate tasks
├── content-management.js  # Section loader integration
└── ui.js              # Shared UI components
```

### Key Components

**generate.js** (~700 lines)
- `GenerateSection.load()` - Initialize section
- `GenerateSection.render()` - Render task list
- `GenerateSection.renderTaskCard()` - Individual task cards
- `GenerateSection.renderProgress()` - Progress bars
- `GenerateSection.startPolling()` - Real-time updates
- `GenerateSection.openCreateModal()` - Upload workflow
- `GenerateSection.handleUploadSpec()` - File upload handler
- `GenerateSection.openStartGenerationModal()` - Step 2 modal
- `GenerateSection.handleStartGeneration()` - Start generation
- `GenerateSection.viewTaskDetails()` - Detailed view
- `GenerateSection.handleCancel()` - Cancel task

**api.js** (generate methods)
- `adminPresignUpload()` - Get presigned URL for PDF
- `adminCompleteUpload()` - Complete upload
- `generateInfo()` - Extract course info (Step 1)
- `generateContent()` - Start generation (Step 2)
- `getGenerateStatus()` - Get task status
- `listGenerateTasks()` - List all tasks with filters
- `cancelGenerate()` - Cancel running task

**state.js**
- `generateTasks: []` - Array of all tasks
- `setGenerateTasks()` - Update tasks in state

## Polling & Real-Time Updates

### Auto-Polling Behavior

1. **Start Conditions**:
   - Automatically starts when active tasks exist
   - Active = `info_generating`, `content_generating`, `generating_papers`, `generating_notes_*`, `generating_questions_*`

2. **Poll Interval**: Every 5 seconds

3. **Stop Conditions**:
   - No active tasks remain
   - User navigates away from Generate section
   - All tasks completed/failed/cancelled

4. **Poll Process**:
   ```javascript
   // For each active task
   1. Fetch current status from API
   2. Update task in state
   3. Re-render cards to show progress
   4. Repeat after 5 seconds
   ```

5. **Cleanup**:
   ```javascript
   // When switching sections
   if (GenerateSection.cleanup) {
     GenerateSection.cleanup(); // Stops polling
   }
   ```

## Error Handling

### Failed Tasks
- Error message displayed in task card
- Red error badge
- Error details in task detail view
- Task remains in database for review

### Upload Errors
- File type validation (PDF only)
- Size validation (100MB max for admins)
- Network error handling
- Clear error messages shown to user

### API Errors
- Retry logic not implemented (single attempt)
- Errors logged to console
- Toast notifications for user feedback
- Failed tasks marked as 'failed' status

## Cost Tracking

### Metrics Displayed
- **Total API Calls**: Number of Gemini API requests
- **Tokens Used**: Total tokens consumed
- **Estimated Cost**: Calculated based on token usage

### Cost Formula
```
Estimated Cost = (Tokens Used / 1M) × Rate
- Input tokens: ~$0.00 per 1M (free tier)
- Output tokens: ~$0.00 per 1M (free tier)
```

## Permissions

### Who Can Use Generate Section
- ✅ **Owner**: Full access to all features
- ✅ **Admin**: Full access to all features
- ❌ **User**: No access (admin panel restricted)

### Cancel Permissions
- **Admin**: Can cancel their own tasks only
- **Owner**: Can cancel any task

## Best Practices

### For Admins

1. **Before Uploading**:
   - Ensure PDF is a valid course specification
   - Check file size (< 100MB)
   - Verify year and subject exist in database

2. **After Info Extraction**:
   - Review extracted course title
   - Verify year and subject matching
   - Edit description if needed
   - Check for existing similar courses

3. **During Generation**:
   - Monitor progress regularly
   - Don't close browser tab
   - Check for errors in detail view
   - Allow 7-15 minutes for completion

4. **After Completion**:
   - Review generated content quality
   - Check notes for accuracy
   - Validate questions and answers
   - Edit/improve content as needed

### Performance Tips

1. **Optimal Polling**: 5-second interval balances real-time updates with API load
2. **Background Processing**: Generation doesn't block UI
3. **Batch Operations**: One API call per topic for notes/questions
4. **Rate Limiting**: 4-second delay between API calls (Gemini limit)

## Troubleshooting

### Common Issues

**Issue**: Task stuck in "Generating" status
- **Solution**: Check task details for error message
- **Action**: Cancel task and retry with clearer specification

**Issue**: Uploaded PDF not recognized
- **Solution**: Ensure PDF contains text (not scanned image)
- **Action**: Re-save PDF with OCR or use different file

**Issue**: Subject not matching
- **Solution**: Create new subject in Subjects section first
- **Action**: Then select it in Step 2 dropdown

**Issue**: Polling stops working
- **Solution**: Refresh page to restart polling
- **Action**: Check browser console for errors

**Issue**: Cancellation doesn't work immediately
- **Solution**: Task completes current operation first (5-10s delay)
- **Action**: Wait for graceful shutdown

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('generateDebug', 'true');
// Reload page
```

View logs:
```javascript
// Check state
console.log(AppState.generateTasks);

// Check polling status
console.log(GenerateSection.pollInterval);

// Manual status check
API.getGenerateStatus('task-uuid-here').then(console.log);
```

## Future Enhancements

### Planned Features
- [ ] Bulk generation (multiple PDFs at once)
- [ ] Custom prompts for generation style
- [ ] Preview generated content before saving
- [ ] Edit content during generation
- [ ] Export generation logs
- [ ] Cost budgets and alerts
- [ ] Generation templates
- [ ] A/B testing different prompts

### Technical Improvements
- [ ] Websocket for real-time updates (replace polling)
- [ ] Retry logic for failed API calls
- [ ] Resume failed/cancelled tasks
- [ ] Incremental generation (save as you go)
- [ ] Parallel topic generation
- [ ] Cache common extraction results

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check task detail view for error messages
4. Consult backend documentation: `backend_admin_documentation.txt`
5. Contact system administrator

---

**Intellectual Property of Hugisoft (hugisoft.com)**
