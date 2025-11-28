# CSS Designer

A simple visual tool for designing and editing CSS styles on any HTML page.

## Live Demo
You can try out the live demo [here](https://nawab-as.github.io/css-designer)!

## Features
- Import any HTML file to start editing
- Select and highlight elements visually
- Edit CSS properties with a simplified style editor and a live preview
- Export your styled HTML file (copy or download)

# Usage
- Click "New HTML File" to import your own HTML (paste or upload)
- Use "Select Element" to pick an element in the preview
- Edit CSS properties in the style editor panel
- See changes live as you adjust values
- Export your work with the "Export" button (copy or download)
- Close the style editor to select a new element

## Installation
### Requirements
- A modern web browser
- Local development server

1. Clone this repository with git:
```bash
git clone https://github.com/Nawab-AS/css-designer.git
cd ./css-designer
```

2. Host using any web server
Since this is a static web page, you can host it with any web server. For example, using Python's built-in HTTP server:
```bash
python -m http.server -p 3000
```
Then visit `http://localhost:3000` in your browser

## Editing CSS Properties
- Select an element in the preview to open the style editor
- Change color, font, position, box-shadow, padding, margin, and more
- Properties unlock based on context (e.g., position unlocks top/left/right/bottom)
- All changes are applied live to the selected element

## Exporting Your Work
- Use the "Export" button to copy or download your styled HTML
- The exported file contains all your changes
