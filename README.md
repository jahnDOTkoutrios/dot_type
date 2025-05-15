# Dot Type

A creative coding project that allows you to create beautiful dot-based typography and artwork. Built with p5.js, this interactive tool lets you design, manipulate, and export dot-based letters and fonts with various connection styles and colors.

## Features

- **Interactive Dot Placement**: Click to place dots on a grid
- **Multiple Connection Styles**:
  - Linear connections with tangent lines
  - Outlined and filled dot styles
- **Color Options**:
  - Multiple color palettes (RGB, Pastel, Neon, Muted, Warm, Cool, Earth, Ocean)
  - Custom color selection
- **Dot Size Control**:
  - Four dot sizes (S, M, L, XL)
  - Mouse wheel support for quick size changes
- **Grid System**:
  - 5x5 grid for precise letter design
  - Visual grid overlay
- **Multiple Connections**:
  - Create multiple independent dot connections
  - Each connection can have its own style and color
- **Letter Management**:
  - Design individual letters (A-Z, 0-9, punctuation)
  - Preview text with designed letters
  - Hover previews for each letter
- **Export Options**:
  - SVG export with individual letter files
  - OTF font export
  - Console log export for data analysis

## Controls

### Mouse Controls

- **Left Click**: Place dots
- **Middle Click**: Break current connection and start a new one
- **Mouse Wheel**: Adjust dot size
- **Hover**: Preview letter designs

### Keyboard Shortcuts

- **Space**: Start a new connection
- **C**: Clear all connections
- **1/2/3**: Quick dot size selection (S/M/L)
- **4/5/6**: Quick color selection
- **Q**: Toggle dot style (outlined/filled)
- **K**: Toggle dark mode
- **S**: Cycle through color palettes
- **P**: Export as PNG
- **Z**: Undo
- **Y**: Redo
- **O**: Export as OTF
- **R**: Generate random designs (filled)
- **T**: Generate random designs (outlined)
- **Arrow Keys**: Navigate between letters

### UI Controls

- Color selection buttons
- Size adjustment controls (S/M/L)
- Style controls (outlined/filled/eraser)
- Action buttons (new/undo/clear)
- Letter selector
- Text preview input
- Export buttons (SVG/OTF)

## Export Options

### SVG Export

- Exports individual SVG files for each designed letter
- Includes a combined grid view
- Preserves all visual elements and connections
- Includes timestamp in filenames

### OTF Export

- Generates a complete OpenType font file
- Includes all designed letters
- Optimized for font rendering
- Includes timestamp in filename

### Console Log Export

- Exports detailed connection data
- Includes coordinates, sizes, and connection styles
- Useful for data analysis or recreation

## Technical Details

Built using:

- p5.js for creative coding
- HTML5 Canvas for rendering
- Paper.js for SVG processing
- OpenType.js for font generation
- Modern JavaScript features

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Start designing your dot-based typography!

## License

This project is open source and available under the MIT License.
