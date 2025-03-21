# Dot Type

A creative coding project that allows you to create beautiful dot-based artwork with connected dots. Built with p5.js, this interactive tool lets you create, manipulate, and export dot-based designs with various connection styles and colors.

## Features

- **Interactive Dot Placement**: Click to place dots on a grid
- **Multiple Connection Styles**:
  - Linear connections
  - Curved connections
- **Color Options**:
  - Red
  - Green
  - Black
  - Blue
- **Dot Size Control**:
  - Adjustable dot sizes
  - Mouse wheel support for quick size changes
- **Grid System**:
  - Adjustable grid size (5x5 to 30x30)
  - Visual grid overlay
- **Multiple Connections**:
  - Create multiple independent dot connections
  - Each connection can have its own style and color
- **Export Options**:
  - PNG export
  - SVG export (vector format)
  - Console log export (for data analysis)

## Controls

### Mouse Controls

- **Left Click**: Place dots
- **Middle Click**: Break current connection and start a new one
- **Mouse Wheel**: Adjust dot size

### Keyboard Shortcuts

- `n`: Start a new connection
- `g`: Toggle between curved and linear connections
- `c`: Clear all connections
- `w/s`: Increase/decrease dot size
- `1-4`: Quick color selection
  - `1`: Red
  - `2`: Green
  - `3`: Black
  - `4`: Blue
- `p`: Export as PNG
- `z`: Generate and export a 10x10 grid of variations
- `r`: Generate random connections

### UI Controls

- Grid size slider
- Color selection buttons
- Size adjustment controls
- Export buttons
- Connection style toggle

## Export Options

### PNG Export

- Saves the current artwork as a PNG file
- Includes timestamp in filename
- Preserves all visual elements including grid

### SVG Export

- Exports artwork in vector format
- Perfect for scaling and editing in vector software
- Maintains all connection styles and colors

### Console Log Export

- Exports detailed connection data
- Includes coordinates, sizes, and connection styles
- Useful for data analysis or recreation

## Technical Details

Built using:

- p5.js for creative coding
- HTML5 Canvas for rendering
- Modern JavaScript features

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Start creating your dot-based artwork!

## License

This project is open source and available under the MIT License.
