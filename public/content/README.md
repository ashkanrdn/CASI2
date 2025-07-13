# Content Management Guide

This directory contains the homepage content for the CASI website. Each section is stored as a separate markdown file.

## File Structure

- `hero.md` - Hero section with main title and statistics
- `about.md` - About CASI section
- `how-to-use.md` - How to use CASI section
- `history.md` - California sentencing history
- `juvenile.md` - Juvenile justice in California
- `data-importance.md` - The importance of data section
- `data-metrics.md` - Key data metrics section

## Editing Content

### Basic Markdown Format

Each file starts with frontmatter (metadata) followed by the content:

```markdown
---
title: "Section Title"
subtitle: "Optional subtitle"
order: 1
visible: true
section: "section-name"
---

# Your content goes here

This is a paragraph. You can use **bold text** and *italic text*.

## Subsections

- Bullet point 1
- Bullet point 2
- Bullet point 3
```

### Frontmatter Fields

- `title`: The main heading for the section
- `subtitle`: Optional secondary heading
- `order`: Number that determines display order (1, 2, 3, etc.)
- `visible`: Set to `true` to show the section, `false` to hide it
- `section`: Internal identifier (don't change this)

### Markdown Formatting

- `**bold text**` for bold
- `*italic text*` for italic
- `## Heading` for section headings
- `• Text` or `- Text` for bullet points
- Paragraphs are separated by blank lines

## External Editing

You can edit these files in:
- Any text editor (Notepad, TextEdit, VS Code)
- Online markdown editors (Typora, StackEdit)
- Google Docs (then copy to markdown)
- GitHub web interface

## Publishing Changes

1. Edit the markdown files
2. Save them to this directory or your external source
3. The website will automatically load the updated content

## Tips

- Keep paragraphs short for better readability
- Use bullet points for lists of information
- Don't change the frontmatter section names
- Test your markdown in a preview tool before publishing