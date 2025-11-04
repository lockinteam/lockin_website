# Markdown Editor - Feature Documentation

## Overview
A Notion-like markdown editor with live preview for the notes management system. The editor provides a rich text editing experience while storing content as clean markdown in the backend.

## Features

### 🎨 Text Formatting
- **Bold**: `**text**` or `__text__` - Click the **B** button or use Ctrl+B
- **Italic**: `*text*` or `_text_` - Click the *I* button or use Ctrl+I
- **Strikethrough**: `~~text~~` - Click the strikethrough button
- **Inline Code**: `` `code` `` - Click the code button

### 📝 Headers
- **H1**: `# Heading 1` - Click H1 button
- **H2**: `## Heading 2` - Click H2 button
- **H3**: `### Heading 3` - Click H3 button
- Supports H4-H6 with manual typing: `####`, `#####`, `######`

### 📋 Lists
- **Bullet List**: `- item` or `* item` - Click bullet list button
- **Numbered List**: `1. item` - Click numbered list button
- **Checkboxes**: `- [ ] unchecked` or `- [x] checked` - Click checkbox button
- Nested lists supported with indentation

### 💻 Code
- **Inline Code**: `` `code here` `` - For short code snippets
- **Code Blocks**: 
  ```
  ```language
  code here
  ```
  ```
  Click code block button, optionally specify language (e.g., python, javascript, html)

### 🔗 Links & Media
- **Links**: `[text](url)` - Click link button or use Ctrl+K
- **Images**: `![alt text](image-url)` - Click image button
  - Images are embedded and displayed in the preview
  - Supports any publicly accessible image URL
  - Alt text is used for accessibility

### 📐 Structure
- **Blockquotes**: `> quote text` - Click quote button
- **Horizontal Rule**: `---` or `***` - Click HR button
- **Tables**: Click table button to create
  ```
  | Column 1 | Column 2 | Column 3 |
  | --- | --- | --- |
  | Cell 1 | Cell 2 | Cell 3 |
  ```

### 🖥️ Editor Features
- **Live Preview**: See formatted output in real-time as you type
- **Fullscreen Mode**: Click fullscreen button for distraction-free editing
- **Split View**: Editor on left, preview on right (desktop)
- **Keyboard Shortcuts**:
  - Ctrl+B: Bold
  - Ctrl+I: Italic
  - Ctrl+K: Insert link
  - Tab: Insert 2 spaces (for indentation)
- **Toolbar**: Quick access to all formatting options with hover tooltips
- **Auto-save**: Content is saved as markdown to backend

### 📱 Responsive Design
- Desktop: Split view (editor + preview)
- Mobile: Single pane view with toggle between editor and preview
- Touch-friendly toolbar buttons
- Optimized for all screen sizes

## Usage

### Creating a Note
1. Navigate to Notes section
2. Select Course → Paper → Topic
3. Click "Create Notes"
4. Use the toolbar or type markdown directly
5. Watch the live preview on the right
6. Click "Create Notes" to save

### Editing a Note
1. Click "Edit" on any note card
2. The editor opens with existing content
3. Make changes using toolbar or markdown syntax
4. Preview updates in real-time
5. Click "Update Notes" to save changes

### Fullscreen Editing
1. Click the fullscreen button (expand icon) in toolbar
2. Editor takes over entire screen
3. Click fullscreen button again to exit
4. Great for working with long documents

### Working with Images
1. Click the image button in toolbar
2. Enter the image URL (must be publicly accessible)
3. Enter alt text for accessibility
4. Image syntax is inserted: `![alt](url)`
5. Preview shows the embedded image

### Creating Tables
1. Click the table button
2. Specify number of columns and rows
3. Table structure is inserted
4. Fill in cells with your content
5. Preview shows formatted table

## Markdown Reference

### Quick Syntax Guide
```markdown
# H1 Header
## H2 Header
### H3 Header

**bold text**
*italic text*
~~strikethrough~~

- Bullet item
- Another item

1. Numbered item
2. Another item

- [ ] Unchecked task
- [x] Checked task

`inline code`

```python
# Code block
def hello():
    print("Hello World")
```

> Blockquote text

[Link text](https://example.com)

![Image alt](https://example.com/image.jpg)

---

| Column 1 | Column 2 |
| --- | --- |
| Cell 1 | Cell 2 |
```

## Tips & Best Practices

### For Best Results
- Use headers to structure long documents
- Add alt text to images for accessibility
- Use code blocks for multi-line code (not inline code)
- Preview your content before saving
- Use checkboxes for todo lists and learning objectives
- Tables work best with concise cell content

### Formatting Large Documents
1. Start with an H1 header for the title
2. Use H2 for main sections
3. Use H3 for subsections
4. Break up long paragraphs with blank lines
5. Use lists for easy scanning
6. Add horizontal rules between major sections

### Working with Images
- Images must be publicly accessible URLs
- Use descriptive alt text
- Consider image size (large images may slow loading)
- Can use image hosting services like Imgur, Cloudinary, etc.

### Code Documentation
- Use inline code for: `variable names`, `function()`, `short snippets`
- Use code blocks for: complete functions, multi-line examples
- Specify language for syntax highlighting in code blocks
- Supported languages: python, javascript, html, css, sql, bash, etc.

## Technical Details

### Storage
- All notes are stored as **raw markdown** in the backend
- No HTML is stored - only markdown syntax
- This ensures:
  - Clean, portable data
  - Easy editing and version control
  - Compatible with other markdown tools
  - No security risks from HTML injection

### Rendering
- Markdown is converted to HTML only for preview
- Conversion happens client-side in real-time
- Preview updates as you type (debounced)
- Same rendering engine displays notes to users

### Supported Markdown Features
All standard CommonMark markdown plus:
- GitHub-flavored markdown tables
- Task lists (checkboxes)
- Strikethrough text
- Automatic URL linking
- Image embedding

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- No external dependencies or libraries

## Troubleshooting

### Images Not Displaying
- Ensure URL is publicly accessible
- Check URL is correct (try opening in browser)
- Some servers block image hotlinking
- Use HTTPS URLs when possible

### Preview Not Updating
- Ensure JavaScript is enabled
- Try refreshing the page
- Check browser console for errors

### Formatting Not Working
- Double-check markdown syntax
- Ensure proper spacing (e.g., space after `#` for headers)
- Some formatting requires blank lines before/after
- Check preview to see actual rendering

### Fullscreen Issues
- Press escape or click fullscreen button to exit
- If stuck, refresh the page
- Browser zoom may affect layout

## Future Enhancements (Potential)
- Syntax highlighting in code blocks
- Drag & drop image upload
- Markdown file import/export
- Math equation support (LaTeX)
- Diagram support (Mermaid)
- Version history
- Collaborative editing
- Custom keyboard shortcuts
- Dark mode theme

## Support
For issues or feature requests, contact the development team.

---

*Intellectual Property of Hugisoft (hugisoft.com)*
