# Embed images in markdown

## Features

When a markdown file is open, dragging and dropping an image file with a `png`, `jpeg`, `jpg`, `gif`, or `webp` extension onto the text while holding down the `Shift` key will convert it to the DataUrl scheme and paste it into the markdown file.

At this time, the image is placed at the drop position in the form of a reference link, and the image file converted to the DataUrl scheme is expanded to the last line of the file.

## Requirements

- Visual sudio code version 1.74.3 or higher

## Known Issues

- **The value "markdown.editor.drop.enabled" must be `false` for this to work.**
- If you drag and drop multiple files at the same time, only one will be pasted.
- Drag and drop from the explorer pane will not paste.
- **You can only paste to the active editor pane. Be careful if you have multiple panes open.**

## Release Notes

### 0.0.1

We confirmed that it works at a minimum.
