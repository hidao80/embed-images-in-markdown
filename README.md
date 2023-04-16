# Embed images in markdown

## Features

When a markdown file is open, dragging and dropping an image file with a `png`, `jpeg`, `jpg`, `gif`, or `webp` extension onto the text while holding down the `Shift` key will convert it to the DataUrl scheme and paste it into the markdown file.

At this time, the image is placed at the drop position in the form of a reference link, and the image file converted to the DataUrl scheme is expanded to the last line of the file.

![preview](https://user-images.githubusercontent.com/8155294/219820928-a38088bd-a8f4-465e-9117-30a17216f3b3.gif)

## Requirements

- Visual sudio code version 1.74.0 or higher

## Known Issues

- **The value "markdown.editor.drop.enabled" must be `false` for this to work.**
- If you drag and drop multiple files at the same time, only one will be pasted.

## Release Notes

### 0.0.5

- Support for macOS, Linux, WSL.

### 0.0.4

- add extension icon.

### 0.0.3

- Support for uppercase extensions.

### 0.0.2

- Drag and drop from Explorer view can now also be pasted.
- When multiple panes are open, you can now paste to the inactive editor pane.

### 0.0.1

- We confirmed that it works at a minimum.
