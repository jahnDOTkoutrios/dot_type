let gridCols = 5;
let gridRows = 5; // Fixed to 5 rows
let cellSize;
let padding = 250;
const DOT_SIZES = [0.35, 0.95, 1.95, 2.95]; // S, M, L, XL (XL matches three M circles on grid)
let dotSize = 0.95; // Default to M
let placedDots = []; // This will now be an array of arrays
let connectionColors = []; // Array to store colors for each connection
let currentConnectionIndex = 0; // Index to track the current connection
let currentColor = [0, 0, 255]; // Current color (blue by default)
let undoStack = []; // Stack for undo operations
let redoStack = []; // Stack for redo operations
let gridToggleButton; // Button for toggling grid size
let colorButtons = {}; // Object to store color buttons
let sizeDisplay; // Display for dot size
let consolePanel;
let maxGridDim = 7; // The largest grid dimension (for 5x7)
let canvasSize = 700; // The main drawing area size (without padding)
let sizeButtons = [];
let nextDotStyle = "outlined"; // 'outlined', 'filled', or 'eraser'
let connectionDotStyles = []; // Array to store dot styles for each connection
let styleButtons = [];
let isDarkMode = false;
let currentLetter = "A";
let previewText = "";
let letterButtons = [];
let letterDrawings = {}; // Store drawings for each letter
let isTextInputFocused = false;
let isLettersVisible = false; // Start with letters hidden
let hoverPreviewDiv = null; // Add this line for hover preview

// Define available colors
const COLOR_PALETTES = [
  {
    name: "RGB",
    colors: {
      red: [255, 0, 0],
      yellow: [255, 255, 0],
      blue: [0, 0, 255],
    },
  },
  {
    name: "Pastel",
    colors: {
      red: [255, 179, 186],
      yellow: [255, 255, 179],
      blue: [186, 201, 255],
    },
  },
  {
    name: "Neon",
    colors: {
      red: [255, 0, 128],
      yellow: [255, 255, 0],
      blue: [128, 0, 255],
    },
  },
  {
    name: "Muted",
    colors: {
      red: [204, 102, 102],
      yellow: [204, 204, 102],
      blue: [102, 102, 204],
    },
  },
  {
    name: "Warm",
    colors: {
      red: [255, 99, 71],
      yellow: [255, 215, 0],
      blue: [255, 69, 0],
    },
  },
  {
    name: "Cool",
    colors: {
      red: [70, 130, 180],
      yellow: [255, 255, 0],
      blue: [135, 206, 235],
    },
  },
  {
    name: "Earth",
    colors: {
      red: [139, 69, 19],
      yellow: [218, 165, 32],
      blue: [101, 67, 33],
    },
  },
  {
    name: "Ocean",
    colors: {
      red: [0, 105, 148],
      yellow: [255, 255, 0],
      blue: [0, 51, 102],
    },
  },
];
let currentPaletteIndex = 0;
let COLORS = COLOR_PALETTES[currentPaletteIndex].colors;

// Add these variables at the top with other global variables
let currentGridX = 0; // Current position in the letter grid (0-9 for A-J)
let currentGridY = 0; // Current position in the letter grid (0-3 for rows)

// Add this function to convert grid position to letter
function gridPositionToLetter(x, y) {
  const letters = [
    ["A", "B", "C"],
    ["D", "E", "F"],
    ["G", "H", "I"],
    ["J", "K", "L"],
    ["M", "N", "O"],
    ["P", "Q", "R"],
    ["S", "T", "U"],
    ["V", "W", "X"],
    ["Y", "Z", "0"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", ",", "?"],
    ["!", "–", "&"],
  ];
  return letters[y][x];
}

// Add this function to handle grid navigation
function navigateGrid(dx, dy) {
  let newX = currentGridX + dx;
  let newY = currentGridY + dy;

  // Get the current grid dimensions
  const letters = [
    ["A", "B", "C"],
    ["D", "E", "F"],
    ["G", "H", "I"],
    ["J", "K", "L"],
    ["M", "N", "O"],
    ["P", "Q", "R"],
    ["S", "T", "U"],
    ["V", "W", "X"],
    ["Y", "Z", "0"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", ",", "?"],
    ["!", "–", "&"],
  ];

  // Handle horizontal wrapping
  if (dx !== 0) {
    if (newX < 0) {
      // Wrap to the end of the previous row
      newY = (newY - 1 + letters.length) % letters.length;
      newX = letters[newY].length - 1;
    } else if (newX >= letters[newY].length) {
      // Wrap to the start of the next row
      newY = (newY + 1) % letters.length;
      newX = 0;
    }
  } else {
    // For vertical movement, just wrap around
    newY = (newY + letters.length) % letters.length;
  }

  // Only update if position changed
  if (newX !== currentGridX || newY !== currentGridY) {
    currentGridX = newX;
    currentGridY = newY;

    // Get the letter at the new position
    let newLetter = gridPositionToLetter(currentGridX, currentGridY);

    // Save current state and load new letter
    saveCurrentLetterState();
    currentLetter = newLetter;
    loadLetterState(newLetter);

    // Update UI
    letterButtons.forEach((b) => b.removeClass("active"));
    let btn = select(`#letter-${newLetter.replace(/[^a-zA-Z0-9]/g, "\\$&")}`);
    if (btn) btn.addClass("active");
  }
}

function generateWordSVG(word) {
  let width = 800;
  let height = 800;
  let previewScale = 0.12;
  let letterSpacing = 90;
  let dotSpacing = 12;
  let y = height / 2;

  // Calculate total width of the word
  let totalWidth = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] === ".") {
      totalWidth += dotSpacing;
    } else {
      totalWidth += letterSpacing;
    }
  }
  let x = (width - totalWidth) / 2;

  // For vertical centering, find the max/min y of all letters
  let minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < word.length; i++) {
    let letter = word[i];
    if (letter !== "." && letterDrawings[letter]) {
      let state = letterDrawings[letter];
      state.placedDots.forEach((connection) => {
        connection.forEach((dot) => {
          let r = dot.size * cellSize * previewScale;
          minY = Math.min(minY, dot.y * previewScale - r / 2);
          maxY = Math.max(maxY, dot.y * previewScale + r / 2);
        });
      });
    }
  }
  if (!isFinite(minY)) {
    minY = 0;
    maxY = height;
  }
  let wordHeight = maxY - minY;
  let yOffset = (height - wordHeight) / 2 - minY;

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  for (let i = 0; i < word.length; i++) {
    let letter = word[i];
    if (letter === ".") {
      let cx = x + 4;
      let cy = height / 2 + 2;
      svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#000"/>`;
      x += dotSpacing;
    } else {
      let state = letterDrawings[letter];
      if (state) {
        // Calculate bounds for this letter
        let minX = Infinity,
          minYL = Infinity,
          maxXL = -Infinity,
          maxYL = -Infinity;
        state.placedDots.forEach((connection) => {
          connection.forEach((dot) => {
            let r = dot.size * cellSize;
            minX = Math.min(minX, dot.x - r / 2);
            minYL = Math.min(minYL, dot.y - r / 2);
            maxXL = Math.max(maxXL, dot.x + r / 2);
            maxYL = Math.max(maxYL, dot.y + r / 2);
          });
        });
        let scale = previewScale;
        let offsetX = x - minX * scale;
        let offsetY = yOffset;
        // Draw each connection
        for (let j = 0; j < state.placedDots.length; j++) {
          let connection = state.placedDots[j];
          if (connection.length > 0) {
            // Draw connections
            for (let k = 0; k < connection.length - 1; k++) {
              let d1 = connection[k];
              let d2 = connection[k + 1];
              let color = state.connectionColors[j];
              let x1 = d1.x * scale + offsetX;
              let y1 = d1.y * scale + offsetY;
              let x2 = d2.x * scale + offsetX;
              let y2 = d2.y * scale + offsetY;
              let r1 = (d1.size * cellSize * scale) / 2;
              let r2 = (d2.size * cellSize * scale) / 2;
              let dx = x2 - x1;
              let dy = y2 - y1;
              let distance = Math.sqrt(dx * dx + dy * dy);
              let angle = Math.atan2(dy, dx);
              let tangentAngle = Math.acos((r1 - r2) / distance);
              let angle1 = angle + tangentAngle;
              let angle2 = angle - tangentAngle;
              let x1a = x1 + r1 * Math.cos(angle1);
              let y1a = y1 + r1 * Math.sin(angle1);
              let x1b = x1 + r1 * Math.cos(angle2);
              let y1b = y1 + r1 * Math.sin(angle2);
              let x2a = x2 + r2 * Math.cos(angle1);
              let y2a = y2 + r2 * Math.sin(angle1);
              let x2b = x2 + r2 * Math.cos(angle2);
              let y2b = y2 + r2 * Math.sin(angle2);
              svg += `<path d="M ${x1a} ${y1a} L ${x2a} ${y2a} L ${x2b} ${y2b} L ${x1b} ${y1b} Z" fill="rgb(${color.join(
                ","
              )})"/>`;
            }
            // Draw dots
            for (let dot of connection) {
              let r = dot.size * cellSize * scale;
              let cx = dot.x * scale + offsetX;
              let cy = dot.y * scale + offsetY;
              let color = state.connectionColors[j];
              if (dot.style === "filled") {
                svg += `<circle cx="${cx}" cy="${cy}" r="${
                  r / 2
                }" fill="rgb(${color.join(",")})"/>`;
              } else {
                svg += `<circle cx="${cx}" cy="${cy}" r="${
                  r / 2
                }" fill="rgb(${color.join(",")})"/>`;
                svg += `<circle cx="${cx}" cy="${cy}" r="${
                  (r - 16 * scale) / 2
                }" fill="#ffffff"/>`;
              }
            }
          }
        }
        x += letterSpacing;
      } else {
        x += letterSpacing;
      }
    }
  }
  svg += "</svg>";
  return svg;
}

function generateCombinedSVG() {
  let letterSize = 740; // Size of each letter SVG
  let gridCols = 6;
  let gridRows = 7;
  let padding = 20; // Padding between letters
  let width = letterSize * gridCols + padding * (gridCols + 1);
  let height = letterSize * gridRows + padding * (gridRows + 1);

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Define the grid layout
  const grid = [
    ["A", "B", "C", "D", "E", "F"],
    ["G", "H", "I", "J", "K", "L"],
    ["M", "N", "O", "P", "Q", "R"],
    ["S", "T", "U", "V", "W", "X"],
    ["Y", "Z", "0", "1", "2", "3"],
    ["4", "5", "6", "7", "8", "9"],
    [".", ",", "?", "!", "–", "&"],
  ];

  // Place each letter in the grid
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      let letter = grid[row][col];
      let x = col * (letterSize + padding) + padding;
      let y = row * (letterSize + padding) + padding;

      // Save current state
      let currentState = {
        placedDots: JSON.parse(JSON.stringify(placedDots)),
        connectionColors: JSON.parse(JSON.stringify(connectionColors)),
        connectionDotStyles: [...connectionDotStyles],
        currentConnectionIndex: currentConnectionIndex,
      };

      // Load letter state
      let state = letterDrawings[letter];
      if (
        state &&
        state.placedDots.some((connection) => connection.length > 0)
      ) {
        placedDots = JSON.parse(JSON.stringify(state.placedDots));
        connectionColors = JSON.parse(JSON.stringify(state.connectionColors));
        connectionDotStyles = [...state.connectionDotStyles];
        currentConnectionIndex = 0;

        // Generate SVG for this letter
        let letterSVG = generateSVG();

        // Extract the content between the svg tags
        let content = letterSVG.replace(/<svg[^>]*>|<\/svg>/g, "");

        // Add the letter content with translation
        svg += `<g transform="translate(${x}, ${y})">${content}</g>`;
      }

      // Restore previous state
      placedDots = currentState.placedDots;
      connectionColors = currentState.connectionColors;
      connectionDotStyles = currentState.connectionDotStyles;
      currentConnectionIndex = currentState.currentConnectionIndex;
    }
  }

  svg += "</svg>";
  return svg;
}

function exportZipWithSVGAndLog() {
  let timestamp =
    year() +
    "-" +
    month() +
    "-" +
    day() +
    "_" +
    hour() +
    "-" +
    minute() +
    "-" +
    second();

  // Create ZIP
  let zip = new JSZip();

  // Export each letter that has been designed
  Object.entries(letterDrawings).forEach(([letter, state]) => {
    // Check if the letter has any dots placed
    let hasDots = state.placedDots.some((connection) => connection.length > 0);

    if (hasDots) {
      // Save current state
      let currentState = {
        placedDots: JSON.parse(JSON.stringify(placedDots)),
        connectionColors: JSON.parse(JSON.stringify(connectionColors)),
        connectionDotStyles: [...connectionDotStyles],
        currentConnectionIndex: currentConnectionIndex,
      };

      // Load letter state
      placedDots = JSON.parse(JSON.stringify(state.placedDots));
      connectionColors = JSON.parse(JSON.stringify(state.connectionColors));
      connectionDotStyles = [...state.connectionDotStyles];
      currentConnectionIndex = 0;

      // Generate SVG and log for this letter
      let svgContent = generateSVG();
      let logContent = generateLogContent(letter);

      // Add to ZIP
      zip.file(`letter_${letter}_${timestamp}.svg`, svgContent);
      zip.file(`letter_${letter}_log_${timestamp}.txt`, logContent);

      // Restore previous state
      placedDots = currentState.placedDots;
      connectionColors = currentState.connectionColors;
      connectionDotStyles = currentState.connectionDotStyles;
      currentConnectionIndex = currentState.currentConnectionIndex;
    }
  });

  // Add word SVG if previewText is not empty
  if (previewText && previewText.length > 0) {
    let wordSVG = generateWordSVG(previewText);
    zip.file(`word_preview_${timestamp}.svg`, wordSVG);
  }

  // Add combined grid SVG
  let combinedSVG = generateCombinedSVG();
  zip.file(`combined_grid_${timestamp}.svg`, combinedSVG);

  // Generate and add the ZIP file
  zip.generateAsync({ type: "blob" }).then(function (blob) {
    let zipFilename = `dot_type_export_${timestamp}.zip`;
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function exportAsOTF() {
  // Create an array to store all glyphs
  let glyphs = [];

  // Add .notdef glyph first
  let notdefPath = new opentype.Path();
  // Create a simple square for .notdef
  notdefPath.moveTo(100, 100);
  notdefPath.lineTo(900, 100);
  notdefPath.lineTo(900, 900);
  notdefPath.lineTo(100, 900);
  notdefPath.closePath();

  let notdefGlyph = new opentype.Glyph({
    name: ".notdef",
    unicode: 0,
    advanceWidth: 1000,
    path: notdefPath,
  });
  glyphs.push(notdefGlyph);
  // Convert each letter's dots to a path
  Object.entries(letterDrawings).forEach(([letter, state]) => {
    if (state.placedDots.some((connection) => connection.length > 0)) {
      // Save current state
      let currentState = {
        placedDots: JSON.parse(JSON.stringify(placedDots)),
        connectionColors: JSON.parse(JSON.stringify(connectionColors)),
        connectionDotStyles: [...connectionDotStyles],
        currentConnectionIndex: currentConnectionIndex,
      };

      // Load letter state
      placedDots = JSON.parse(JSON.stringify(state.placedDots));
      connectionColors = JSON.parse(JSON.stringify(state.connectionColors));
      connectionDotStyles = [...state.connectionDotStyles];
      currentConnectionIndex = 0;

      // Create path for this letter
      let path = new opentype.Path();

      // Convert dots and their connections to paths
      placedDots.forEach((connection) => {
        // Draw connections between dots
        for (let i = 0; i < connection.length - 1; i++) {
          let d1 = connection[i];
          let d2 = connection[i + 1];

          // Convert coordinates to font space (0-1000)
          let x1 = map(d1.x, padding, width - padding, 100, 900);
          let y1 = map(d1.y, padding, height - padding, 900, 100) - 122; // Invert y mapping and subtract 122
          let x2 = map(d2.x, padding, width - padding, 100, 900);
          let y2 = map(d2.y, padding, height - padding, 900, 100) - 122; // Invert y mapping and subtract 122

          let r1 = map(d1.size * cellSize, 0, cellSize * 2, 20, 100);
          let r2 = map(d2.size * cellSize, 0, cellSize * 2, 20, 100);

          // Ensure r1 is the larger radius
          let swap = false;
          if (r2 > r1) {
            [r1, r2] = [r2, r1];
            [x1, x2] = [x2, x1];
            [y1, y2] = [y2, y1];
            swap = true;
          }

          // Calculate the distance between centers
          let dx = x2 - x1;
          let dy = y2 - y1;
          let distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate the angle between centers
          let angle = Math.atan2(dy, dx);

          // Calculate the angle of the tangent line
          let tangentAngle = Math.acos((r1 - r2) / distance);

          // Calculate the two tangent angles
          let angle1 = angle + tangentAngle;
          let angle2 = angle - tangentAngle;

          // Calculate the tangent points on the larger circle
          let x1a = x1 + r1 * Math.cos(angle1);
          let y1a = y1 + r1 * Math.sin(angle1);
          let x1b = x1 + r1 * Math.cos(angle2);
          let y1b = y1 + r1 * Math.sin(angle2);

          // Calculate the tangent points on the smaller circle
          let x2a = x2 + r2 * Math.cos(angle1);
          let y2a = y2 + r2 * Math.sin(angle1);
          let x2b = x2 + r2 * Math.cos(angle2);
          let y2b = y2 + r2 * Math.sin(angle2);

          // Swap points if we swapped the circles
          if (swap) {
            [x1a, x2a] = [x2a, x1a];
            [y1a, y2a] = [y2a, y1a];
            [x1b, x2b] = [x2b, x1b];
            [y1b, y2b] = [y2b, y1b];
          }

          // Draw the connection shape clockwise
          path.moveTo(x1a, y1a);
          path.lineTo(x2a, y2a);
          path.lineTo(x2b, y2b);
          path.lineTo(x1b, y1b);
          path.closePath();
        }

        // Draw the dots (only outer circles)
        connection.forEach((dot) => {
          // Convert coordinates to font space (0-1000)
          let x = map(dot.x, padding, width - padding, 100, 900);
          let y = map(dot.y, padding, height - padding, 900, 100) - 122; // Invert y mapping and subtract 122
          let radius = map(dot.size * cellSize, 0, cellSize * 2, 20, 100);

          // Create circle using Bézier curves
          // The magic number 0.552284749831 is used to create a perfect circle with Bézier curves
          const c = 0.552284749831;

          // Draw outer circle counter-clockwise starting from top
          path.moveTo(x, y - radius);
          path.bezierCurveTo(
            x - radius * c,
            y - radius,
            x - radius,
            y - radius * c,
            x - radius,
            y
          );
          path.bezierCurveTo(
            x - radius,
            y + radius * c,
            x - radius * c,
            y + radius,
            x,
            y + radius
          );
          path.bezierCurveTo(
            x + radius * c,
            y + radius,
            x + radius,
            y + radius * c,
            x + radius,
            y
          );
          path.bezierCurveTo(
            x + radius,
            y - radius * c,
            x + radius * c,
            y - radius,
            x,
            y - radius
          );
          path.closePath();
        });
      });

      // Create the glyph
      let glyph = new opentype.Glyph({
        name: letter,
        unicode: letter.charCodeAt(0),
        advanceWidth: 1000,
        path: path,
      });

      glyphs.push(glyph);

      // Restore previous state
      placedDots = currentState.placedDots;
      connectionColors = currentState.connectionColors;
      connectionDotStyles = currentState.connectionDotStyles;
      currentConnectionIndex = currentState.currentConnectionIndex;
    }
  });

  // Create the font with all glyphs at once
  let font = new opentype.Font({
    familyName: "DotType",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: glyphs,
  });

  // Generate and download the font
  let timestamp =
    year() +
    "-" +
    month() +
    "-" +
    day() +
    "_" +
    hour() +
    "-" +
    minute() +
    "-" +
    second();
  let fontBlob = font.toArrayBuffer();
  let url = URL.createObjectURL(new Blob([fontBlob], { type: "font/otf" }));
  let link = document.createElement("a");
  link.href = url;
  link.download = `dot_type_${timestamp}.otf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateLogContent(letter) {
  let sizeLabels = ["S", "M", "L", "XL"];
  let content = `Dot Connections Log for Letter ${letter}\n`;
  content += "=================\n\n";

  placedDots.forEach((dots, index) => {
    if (dots.length > 0) {
      content += `Connection ${String(index + 1).padStart(2, "0")}\n`;
      content += `Color: rgb(${connectionColors[index].join(",")})\n`;
      content += "Dots:\n";
      dots.forEach((dot, dotIndex) => {
        // Convert dot size to S/M/L
        let sizeIdx = DOT_SIZES.findIndex(
          (s) => Math.abs(s - dot.size) < 0.001
        );
        let sizeLabel = sizeLabels[sizeIdx] || dot.size;
        // Convert position to grid coordinates
        let gx = Math.round((dot.x - padding - cellSize / 2) / cellSize);
        let yOffset = gridRows === 7 ? padding - cellSize : padding;
        let gy = Math.round((dot.y - yOffset - cellSize / 2) / cellSize);
        let colLetter = String.fromCharCode(65 + gx); // 65 = 'A'
        let rowNumber = gy + 1;
        content += `  Dot ${String(dotIndex + 1).padStart(
          2,
          "0"
        )}: ${colLetter}${String(rowNumber).padStart(
          2,
          "0"
        )}, size=${sizeLabel}\n`;
      });
      content += "\n";
    }
  });

  return content;
}

function generateSVG() {
  let width = 740; // canvasSize (700) + gridPadding*2 (20*2)
  let height = 740; // canvasSize (700) + gridPadding*2 (20*2)

  // Calculate bounds of the design
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  placedDots.forEach((connection) => {
    connection.forEach((dot) => {
      minX = Math.min(minX, dot.x);
      minY = Math.min(minY, dot.y);
      maxX = Math.max(maxX, dot.x);
      maxY = Math.max(maxY, dot.y);
    });
  });

  // If no dots, use default bounds
  if (!isFinite(minX)) {
    minX = minY = 0;
    maxX = maxY = 1;
  }

  // Use a fixed scale based on the canvas size
  let scale = 1; // Keep scale at 1 since we're using the exact size

  // Calculate offset to center the design
  let designWidth = maxX - minX;
  let designHeight = maxY - minY;
  let offsetX = (width - designWidth * scale) / 2 - minX * scale;
  let offsetY = (height - designHeight * scale) / 2 - minY * scale;

  // Start SVG content
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Start grid group
  svg += `<g id="grid">`;

  // Add light grey background for the game board area
  let gridPadding = 20;
  let gridSize = canvasSize * scale;
  let gridX = (width - gridSize) / 2;
  let gridY = (height - gridSize) / 2;
  svg += `<rect x="${gridX - gridPadding}" y="${gridY - gridPadding}" width="${
    gridSize + gridPadding * 2
  }" height="${gridSize + gridPadding * 2}" fill="${
    isDarkMode ? "#232323" : "#fafafa"
  }"/>`;

  // Draw the dot grid
  let dotRadius = cellSize * 0.16 * scale;
  let yOffset = getGridYOffset() * scale;
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      let x = i * cellSize * scale + gridX + (cellSize * scale) / 2;
      let y = j * cellSize * scale + gridY + (cellSize * scale) / 2;
      svg += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${
        isDarkMode ? "#c8c8c8" : "#000000"
      }"/>`;
    }
  }

  // End grid group
  svg += `</g>`;

  // Start design group
  svg += `<g id="design">`;

  // Add connections and dots
  placedDots.forEach((connection, index) => {
    if (connection.length > 0) {
      // Draw connections
      for (let i = 0; i < connection.length - 1; i++) {
        let d1 = connection[i];
        let d2 = connection[i + 1];
        let color = connectionColors[index];
        let x1 = d1.x * scale + offsetX;
        let y1 = d1.y * scale + offsetY;
        let x2 = d2.x * scale + offsetX;
        let y2 = d2.y * scale + offsetY;
        let r1 = (d1.size * cellSize * scale) / 2;
        let r2 = (d2.size * cellSize * scale) / 2;
        let dx = x2 - x1;
        let dy = y2 - y1;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        let tangentAngle = Math.acos((r1 - r2) / distance);
        let angle1 = angle + tangentAngle;
        let angle2 = angle - tangentAngle;
        let x1a = x1 + r1 * Math.cos(angle1);
        let y1a = y1 + r1 * Math.sin(angle1);
        let x1b = x1 + r1 * Math.cos(angle2);
        let y1b = y1 + r1 * Math.sin(angle2);
        let x2a = x2 + r2 * Math.cos(angle1);
        let y2a = y2 + r2 * Math.sin(angle1);
        let x2b = x2 + r2 * Math.cos(angle2);
        let y2b = y2 + r2 * Math.sin(angle2);
        svg += `<path d="M ${x1a} ${y1a} L ${x2a} ${y2a} L ${x2b} ${y2b} L ${x1b} ${y1b} Z" fill="rgb(${color.join(
          ","
        )})"/>`;
      }
      // Draw dots
      connection.forEach((dot) => {
        let r = dot.size * cellSize * scale;
        let x = dot.x * scale + offsetX;
        let y = dot.y * scale + offsetY;
        if (dot.style === "filled") {
          svg += `<circle cx="${x}" cy="${y}" r="${
            r / 2
          }" fill="rgb(${connectionColors[index].join(",")})"/>`;
        } else {
          svg += `<circle cx="${x}" cy="${y}" r="${
            r / 2
          }" fill="rgb(${connectionColors[index].join(",")})"/>`;
          svg += `<circle cx="${x}" cy="${y}" r="${
            (r - 16 * scale) / 2
          }" fill="#ffffff"/>`;
        }
      });
    }
  });

  // End design group
  svg += `</g>`;
  svg += "</svg>";
  return svg;
}

function setup() {
  strokeCap(ROUND);
  strokeJoin(ROUND); // Add smooth joins between vertices
  // Set canvas size to fit the largest grid (5x7)
  createCanvas(canvasSize + padding * 2, canvasSize + padding * 2);

  // Create shortcuts info (hidden by default)
  let shortcutsInfo = createDiv("");
  shortcutsInfo.class("shortcuts-info");

  // Add shortcuts
  const shortcuts = [
    ["n", "New connection"],
    ["c", "Clear all"],
    ["1/2/3", "Dot size S/M/L"],
    ["4/5/6", "Colors"],
    ["q", "Toggle dot style"],
    ["k", "Toggle dark mode"],
    ["MMB", "Break connection"],
  ];

  shortcuts.forEach(([key, desc]) => {
    let row = createDiv("");
    let keySpan = createSpan(key);
    keySpan.class("key");
    let descSpan = createSpan(desc);
    row.child(keySpan);
    row.child(descSpan);
    shortcutsInfo.child(row);
  });

  // Create help button after shortcutsInfo so the CSS sibling selector works
  let helpButton = createButton("?");
  helpButton.class("help-button");
  helpButton.mousePressed(() => {
    if (shortcutsInfo.hasClass("show-shortcuts")) {
      shortcutsInfo.removeClass("show-shortcuts");
    } else {
      shortcutsInfo.addClass("show-shortcuts");
    }
  });

  // Create control buttons container
  let controlButtonsContainer = createDiv("");
  controlButtonsContainer.class("control-buttons");

  // Create color buttons container first
  let colorButtonsContainer = createDiv("");
  colorButtonsContainer.class("color-buttons");

  // Create color buttons
  Object.entries(COLORS).forEach(([name, color], idx) => {
    let button = createDiv("");
    button.class("color-button");
    button.style("background-color", `rgb(${color.join(",")})`);
    if (arraysEqual(color, currentColor)) {
      button.addClass("active");
    }
    button.mousePressed(() => {
      // Use the current palette's color
      changeColor(COLORS[name]);
    });
    colorButtons[name] = button;
    colorButtonsContainer.child(button);
  });

  controlButtonsContainer.child(colorButtonsContainer);

  // S/M/L size buttons in a wrapper with width 120px
  let sizeControl = createDiv("");
  sizeControl.class("size-control");
  sizeControl.style("width", "120px");
  const sizeLabels = ["S", "M", "L"]; // Removed XL from UI
  sizeButtons = [];
  sizeLabels.forEach((label, idx) => {
    let btn = createButton(label);
    btn.class("size-button");
    btn.mousePressed(() => {
      dotSize = DOT_SIZES[idx];
      updateSizeDisplay();
    });
    sizeButtons.push(btn);
    sizeControl.child(btn);
  });
  // Set initial active button
  sizeButtons[getDotSizeIndex(dotSize)]?.addClass("active");
  controlButtonsContainer.child(sizeControl);

  // Style buttons (Outlined, Filled, Eraser) in a wrapper with width 120px
  let styleControl = createDiv("");
  styleControl.class("style-control");
  styleControl.style("width", "120px");
  const styleLabels = ["○", "●", "◌"]; // Changed the eraser symbol to ◌
  styleButtons = [];
  styleLabels.forEach((label, idx) => {
    let btn = createButton(label);
    btn.class("style-button");
    btn.style("width", "40px"); // Fixed width
    btn.style("height", "40px"); // Fixed height
    btn.style("display", "flex"); // Use flexbox
    btn.style("align-items", "center"); // Center vertically
    btn.style("justify-content", "center"); // Center horizontally
    btn.style("padding", "0"); // Remove padding
    btn.style("line-height", "1"); // Reset line height
    if (label === "◌") {
      btn.style("font-weight", "900"); // Make the dotted circle bolder
    }
    btn.mousePressed(() => {
      nextDotStyle = ["outlined", "filled", "eraser"][idx];
      updateStyleDisplay();
    });
    styleButtons.push(btn);
    styleControl.child(btn);
  });
  // Set initial active button
  styleButtons[0].addClass("active");
  controlButtonsContainer.child(styleControl);

  // Action buttons (New, Undo, Clear) in a wrapper with width 120px
  let actionControl = createDiv("");
  actionControl.class("action-control");
  actionControl.style("width", "120px");

  // New (N)
  let newButton = createButton("N");
  newButton.class("action-button");
  newButton.attribute("title", "New connection (N)");
  newButton.mousePressed(() => {
    currentConnectionIndex++;
    placedDots.push([]);
    connectionColors.push([...currentColor]);
    connectionDotStyles.push(nextDotStyle);
    saveCurrentLetterState(); // Save state after new connection
  });
  actionControl.child(newButton);

  // Undo (←)
  let undoButton = createButton("←");
  undoButton.class("action-button");
  undoButton.attribute("title", "Undo (Z)");
  undoButton.mousePressed(undo);
  actionControl.child(undoButton);

  // Clear (×)
  let clearButton = createButton("×");
  clearButton.class("action-button");
  clearButton.attribute("title", "Clear (C)");
  clearButton.mousePressed(() => {
    placedDots = [[]];
    connectionColors = [[...currentColor]];
    connectionDotStyles = [nextDotStyle];
    currentConnectionIndex = 0;
    saveStateForUndo(); // Save state after clearing
    updateLetterButtonIndicator(currentLetter); // Update indicator after clearing
  });
  actionControl.child(clearButton);

  controlButtonsContainer.child(actionControl);

  // Create export buttons container
  let exportButtons = createDiv("");
  exportButtons.class("export-buttons");

  // Create a single export button for SVG and Log
  let exportComboButton = createButton("EXPORT");
  exportComboButton.class("control-button");
  exportComboButton.mousePressed(exportZipWithSVGAndLog);
  exportButtons.child(exportComboButton);

  // Create OTF export button
  // let exportOTFButton = createButton("EXPORT OTF");
  // exportOTFButton.class("control-button");
  // exportOTFButton.mousePressed(exportAsOTF);
  // exportButtons.child(exportOTFButton);

  // Create letter selector container
  let letterSelector = createDiv("");
  letterSelector.class("letter-selector");

  // Create text input for preview
  let textInput = createInput("");
  textInput.class("text-preview");
  textInput.attribute("placeholder", "Type...");
  textInput.input(() => {
    previewText = textInput.value().toUpperCase();
    textInput.value(textInput.value().toUpperCase()); // Force uppercase in input
  });

  // Add event listeners for focus/blur
  textInput.elt.addEventListener("focus", () => {
    isTextInputFocused = true;
  });
  textInput.elt.addEventListener("blur", () => {
    isTextInputFocused = false;
  });

  // Prevent key events from bubbling up when input is focused
  textInput.elt.addEventListener("keydown", (e) => {
    if (isTextInputFocused) {
      e.stopPropagation();
    }
  });

  // Create ABC toggle button
  let abcButton = createButton("ABC ↓");
  abcButton.class("control-button");
  abcButton.style("width", "120px"); // Match width of other buttons
  abcButton.mousePressed(() => {
    isLettersVisible = !isLettersVisible;
    letterSelector.class(
      isLettersVisible ? "letter-selector visible" : "letter-selector"
    );
    textInput.class(isLettersVisible ? "text-preview visible" : "text-preview");
    abcButton.toggleClass("active");
    abcButton.html(isLettersVisible ? "ABC ↑" : "ABC ↓");
  });

  // Create hover preview div
  hoverPreviewDiv = createDiv("");
  hoverPreviewDiv.class("hover-preview");
  hoverPreviewDiv.style("display", "none");
  hoverPreviewDiv.style("position", "absolute");
  hoverPreviewDiv.style("background", "white");
  hoverPreviewDiv.style("border", "1.5px solid rgba(0, 102, 255, 0.2)");
  hoverPreviewDiv.style("padding", "10px");
  hoverPreviewDiv.style("border-radius", "4px");
  hoverPreviewDiv.style("box-shadow", "0 2px 4px rgba(0, 102, 255, 0.2)");
  hoverPreviewDiv.style("z-index", "1000");
  hoverPreviewDiv.style("pointer-events", "none");

  // Create letter buttons A-Z
  for (let i = 0; i < 26; i++) {
    let letter = String.fromCharCode(65 + i);
    let btn = createButton(letter);
    btn.class("letter-button");
    btn.id(`letter-${letter}`);
    if (letter === currentLetter) {
      btn.addClass("active");
    }
    if (hasLetterDrawing(letter)) {
      btn.addClass("has-drawing");
    }
    btn.mousePressed(() => {
      saveCurrentLetterState();
      currentLetter = letter;
      loadLetterState(letter);
      letterButtons.forEach((b) => b.removeClass("active"));
      btn.addClass("active");
    });
    // Add hover events
    btn.mouseOver(() => showHoverPreview(letter, btn));
    btn.mouseOut(() => hideHoverPreview());
    letterButtons.push(btn);
    letterSelector.child(btn);
  }

  // Add numbers 0-9 with hover events
  for (let i = 0; i < 10; i++) {
    let number = i.toString();
    let btn = createButton(number);
    btn.class("letter-button");
    btn.id(`letter-${number}`);
    if (number === currentLetter) {
      btn.addClass("active");
    }
    if (hasLetterDrawing(number)) {
      btn.addClass("has-drawing");
    }
    btn.mousePressed(() => {
      saveCurrentLetterState();
      currentLetter = number;
      loadLetterState(number);
      letterButtons.forEach((b) => b.removeClass("active"));
      btn.addClass("active");
    });
    // Add hover events
    btn.mouseOver(() => showHoverPreview(number, btn));
    btn.mouseOut(() => hideHoverPreview());
    letterButtons.push(btn);
    letterSelector.child(btn);
  }

  // Add punctuation buttons with hover events
  const punctuation = [".", ",", "?", "!", "–", "&"];
  punctuation.forEach((punct) => {
    let btn = createButton(punct);
    btn.class("letter-button");
    btn.id(`letter-${punct}`);
    if (punct === currentLetter) {
      btn.addClass("active");
    }
    if (hasLetterDrawing(punct)) {
      btn.addClass("has-drawing");
    }
    btn.mousePressed(() => {
      saveCurrentLetterState();
      currentLetter = punct;
      loadLetterState(punct);
      letterButtons.forEach((b) => b.removeClass("active"));
      btn.addClass("active");
    });
    // Add hover events
    btn.mouseOver(() => showHoverPreview(punct, btn));
    btn.mouseOut(() => hideHoverPreview());
    letterButtons.push(btn);
    letterSelector.child(btn);
  });

  // Add both to the control buttons container
  controlButtonsContainer.child(abcButton);
  controlButtonsContainer.child(textInput); // Add text input before letter selector
  controlButtonsContainer.child(letterSelector);

  // Initialize letter drawings
  initializeLetterDrawings();
  loadLetterState(currentLetter);

  updateGridSize();
  noFill();

  // Create console panel
  consolePanel = createDiv("");
  consolePanel.class("console-panel");

  updateSizeDisplay(); // Ensure UI is in sync on load
}

function updateGridSize() {
  // Always base cell size on 5 columns so cells are square
  cellSize = canvasSize / gridCols;
}

function draw() {
  // Set background based on dark mode
  background(isDarkMode ? 26 : 255);

  // Draw light grey background for the game board area (slightly larger than grid)
  noStroke();
  fill(isDarkMode ? 35 : 250);
  rect(padding - 20, padding - 20, canvasSize + 40, canvasSize + 40);

  // Draw preview text if any
  if (previewText) {
    let x = padding;
    let y = 80;
    let previewScale = 0.08;
    let letterSpacing = 62; // Changed from 70 to 62

    for (let i = 0; i < previewText.length; i++) {
      let letter = previewText[i];
      if (letter === ".") {
        // Draw a small dot
        noStroke();
        fill(isDarkMode ? 255 : 0);
        ellipse(x + 1.5, y + 0.8, 0.8, 0.8);
        x += 3;
      } else {
        // Draw the letter using dots from the stored state
        let state = letterDrawings[letter];
        if (state) {
          push();
          translate(x, y);
          scale(previewScale);

          // Draw each connection
          for (let j = 0; j < state.placedDots.length; j++) {
            let connection = state.placedDots[j];
            if (connection.length > 0) {
              // Draw connections
              for (let k = 0; k < connection.length - 1; k++) {
                let d1 = connection[k];
                let d2 = connection[k + 1];
                drawTangentLines(d1, d2, state.connectionColors[j]);
              }
              // Draw dots
              for (let dot of connection) {
                drawDot(
                  dot.x,
                  dot.y,
                  dot.size,
                  state.connectionColors[j],
                  dot.style || state.connectionDotStyles[j]
                );
              }
            }
          }
          pop();
        }
        x += letterSpacing;
      }
    }
  }

  // Draw the static grid and connections
  drawGrid();

  // Draw all existing connections and dots first
  for (let i = 0; i < placedDots.length; i++) {
    if (i !== currentConnectionIndex) {
      drawConnection(placedDots[i], i);
    }
  }

  // Draw the current connection being worked on (including preview)
  if (placedDots[currentConnectionIndex].length > 0) {
    drawConnection(placedDots[currentConnectionIndex], currentConnectionIndex);
  }

  drawPreview();
  updateConsole(); // Update the console each frame
}

function getGridYOffset() {
  // Returns the y offset for the grid so it stays centered
  if (gridRows === 7) {
    return padding - cellSize; // shift up by one cell
  } else {
    return padding;
  }
}

function drawGrid() {
  // Draw a grid of small black dots at each intersection
  noStroke();
  fill(isDarkMode ? 200 : 0);
  let yOffset = getGridYOffset();
  let dotRadius = cellSize * 0.16; // Slightly larger dot
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      let x = i * cellSize + padding + cellSize / 2;
      let y = j * cellSize + yOffset + cellSize / 2;
      ellipse(x, y, dotRadius, dotRadius);
    }
  }
}

function drawConnection(connection, index) {
  // Draw the tangent lines for the connection
  for (let i = 0; i < connection.length - 1; i++) {
    let d1 = connection[i];
    let d2 = connection[i + 1];
    drawTangentLines(d1, d2, connectionColors[index]);
  }

  // Draw the dots for the connection
  for (let dot of connection) {
    drawDot(
      dot.x,
      dot.y,
      dot.size,
      connectionColors[index],
      dot.style || nextDotStyle
    );
  }
}

function drawTangentLines(d1, d2, color) {
  let x1 = d1.x;
  let y1 = d1.y;
  let x2 = d2.x;
  let y2 = d2.y;

  let r1 = (d1.size * cellSize) / 2;
  let r2 = (d2.size * cellSize) / 2;

  // Ensure r1 is the larger radius
  let swap = false;
  if (r2 > r1) {
    [r1, r2] = [r2, r1];
    [x1, x2] = [x2, x1];
    [y1, y2] = [y2, y1];
    swap = true;
  }

  // Calculate the distance between centers
  let dx = x2 - x1;
  let dy = y2 - y1;
  let distance = sqrt(dx * dx + dy * dy);

  // Calculate the angle between centers
  let angle = atan2(dy, dx);

  // Calculate the angle of the tangent line
  let tangentAngle = acos((r1 - r2) / distance);

  // Calculate the two tangent angles
  let angle1 = angle + tangentAngle;
  let angle2 = angle - tangentAngle;

  // Calculate the tangent points on the larger circle
  let x1a = x1 + r1 * cos(angle1);
  let y1a = y1 + r1 * sin(angle1);
  let x1b = x1 + r1 * cos(angle2);
  let y1b = y1 + r1 * sin(angle2);

  // Calculate the tangent points on the smaller circle
  let x2a = x2 + r2 * cos(angle1);
  let y2a = y2 + r2 * sin(angle1);
  let x2b = x2 + r2 * cos(angle2);
  let y2b = y2 + r2 * sin(angle2);

  // Swap points if we swapped the circles
  if (swap) {
    [x1a, x2a] = [x2a, x1a];
    [y1a, y2a] = [y2a, y1a];
    [x1b, x2b] = [x2b, x1b];
    [y1b, y2b] = [y2b, y1b];
  }

  // Draw the connection with inward stroke
  noStroke();
  fill(color);
  // Draw linear connecting shape
  beginShape();
  vertex(x1a, y1a);
  vertex(x2a, y2a);
  vertex(x2b, y2b);
  vertex(x1b, y1b);
  endShape(CLOSE);
}

function drawDot(x, y, size, color, style) {
  let r = size * cellSize;
  noStroke();

  if (style === "filled") {
    fill(color);
    ellipse(x, y, r);
  } else if (style === "outlined") {
    fill(color);
    ellipse(x, y, r);
    fill(255);
    ellipse(x, y, r - 16);
  }
  // No need to draw anything for eraser style
}

function drawPreview() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
    if (nextDotStyle === "eraser") {
      // Draw dotted circle preview for eraser
      noFill();
      stroke("#c1c1c1");
      strokeWeight(1.5);
      let r = dotSize * cellSize;
      // Draw dotted circle using stroke
      drawingContext.setLineDash([4, 4]); // Set dash pattern
      ellipse(gx, gy, r);
      drawingContext.setLineDash([]); // Reset dash pattern
    } else {
      // Draw preview tangent lines if there is at least one dot placed
      let currentConnection = placedDots[currentConnectionIndex];
      if (currentConnection.length > 0) {
        let lastDot = currentConnection[currentConnection.length - 1];
        let previewDot = { x: gx, y: gy, size: dotSize };

        let x1 = lastDot.x;
        let y1 = lastDot.y;
        let x2 = gx;
        let y2 = gy;

        let r1 = (lastDot.size * cellSize) / 2;
        let r2 = (dotSize * cellSize) / 2;

        // Ensure r1 is the larger radius
        let swap = false;
        if (r2 > r1) {
          [r1, r2] = [r2, r1];
          [x1, x2] = [x2, x1];
          [y1, y2] = [y2, y1];
          swap = true;
        }

        // Calculate the distance between centers
        let dx = x2 - x1;
        let dy = y2 - y1;
        let distance = sqrt(dx * dx + dy * dy);

        // Calculate the angle between centers
        let angle = atan2(dy, dx);

        // Calculate the angle of the tangent line
        let tangentAngle = acos((r1 - r2) / distance);

        // Calculate the two tangent angles
        let angle1 = angle + tangentAngle;
        let angle2 = angle - tangentAngle;

        // Calculate the tangent points on the larger circle
        let x1a = x1 + r1 * cos(angle1);
        let y1a = y1 + r1 * sin(angle1);
        let x1b = x1 + r1 * cos(angle2);
        let y1b = y1 + r1 * sin(angle2);

        // Calculate the tangent points on the smaller circle
        let x2a = x2 + r2 * cos(angle1);
        let y2a = y2 + r2 * sin(angle1);
        let x2b = x2 + r2 * cos(angle2);
        let y2b = y2 + r2 * sin(angle2);

        // Swap points if we swapped the circles
        if (swap) {
          [x1a, x2a] = [x2a, x1a];
          [y1a, y2a] = [y2a, y1a];
          [x1b, x2b] = [x2b, x1b];
          [y1b, y2b] = [y2b, y1b];
        }

        // Draw preview connection with hex color #c1c1c1
        noFill();
        stroke("#c1c1c1");
        strokeWeight(1.5);

        // Draw the circle segments
        if (swap) {
          // If preview circle is larger, it should show the longer arc
          arc(x2, y2, r2 * 2, r2 * 2, angle2, angle1 + TWO_PI);
          // Existing circle shows shorter arc in opposite direction
          arc(x1, y1, r1 * 2, r1 * 2, angle1, angle2);
        } else {
          // If existing circle is larger, it should show the longer arc
          arc(x1, y1, r1 * 2, r1 * 2, angle1, angle2 + TWO_PI);
          // Preview circle shows shorter arc in opposite direction
          arc(x2, y2, r2 * 2, r2 * 2, angle2, angle1);
        }

        // Draw linear tangent lines
        line(x1a, y1a, x2a, y2a);
        line(x1b, y1b, x2b, y2b);
      } else {
        // If no dots are placed yet, show full circle preview
        noFill();
        stroke("#c1c1c1");
        strokeWeight(1.5);
        let r = dotSize * cellSize;
        ellipse(gx, gy, r);
      }
    }
  }
}

function getGridMousePos() {
  let yOffset = getGridYOffset();
  let gx = floor((mouseX - padding) / cellSize);
  let gy = floor((mouseY - yOffset) / cellSize);
  if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
    return [
      gx * cellSize + padding + cellSize / 2,
      gy * cellSize + yOffset + cellSize / 2,
    ];
  }
  return [null, null];
}

function mousePressed() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
    if (mouseButton === CENTER) {
      // Middle mouse breaks current connection
      currentConnectionIndex++;
      placedDots.push([]); // Start a new connection
      connectionColors.push([...currentColor]); // Store the current color for this new connection
      connectionDotStyles.push(nextDotStyle); // Store the current dot style for this new connection
      saveStateForUndo(); // Save state after breaking connection
    } else {
      // Save state before adding any dot
      saveStateForUndo();

      if (nextDotStyle === "eraser") {
        // Find and remove dots that are close to the click
        let foundDot = false;
        for (let i = placedDots.length - 1; i >= 0; i--) {
          for (let j = placedDots[i].length - 1; j >= 0; j--) {
            let dot = placedDots[i][j];
            let distance = dist(gx, gy, dot.x, dot.y);
            if (distance < (dot.size * cellSize) / 2) {
              // If there are dots after the erased dot, create a new connection
              if (j < placedDots[i].length - 1) {
                let newConnection = placedDots[i].splice(j + 1);
                placedDots.splice(i + 1, 0, newConnection);
                connectionColors.splice(i + 1, 0, [...connectionColors[i]]);
                connectionDotStyles.splice(i + 1, 0, connectionDotStyles[i]);
              }
              // Remove the erased dot
              placedDots[i].splice(j, 1);

              // If connection is empty, remove it
              if (placedDots[i].length === 0) {
                placedDots.splice(i, 1);
                connectionColors.splice(i, 1);
                connectionDotStyles.splice(i, 1);
                if (currentConnectionIndex >= i) {
                  currentConnectionIndex = Math.max(
                    0,
                    currentConnectionIndex - 1
                  );
                }
              }

              // Start a new connection after erasing
              currentConnectionIndex++;
              placedDots.push([]);
              connectionColors.push([...currentColor]);
              connectionDotStyles.push(nextDotStyle);

              foundDot = true;
              break;
            }
          }
          if (foundDot) break;
        }
      } else {
        // If this is the first dot of a connection, store the current color
        if (placedDots[currentConnectionIndex].length === 0) {
          connectionColors[currentConnectionIndex] = [...currentColor];
        }
        placedDots[currentConnectionIndex].push({
          x: gx,
          y: gy,
          size: dotSize,
          style: nextDotStyle,
        });
      }
    }
  }
}

function saveStateForUndo() {
  // Save the current state for undo
  let currentState = {
    placedDots: JSON.parse(JSON.stringify(placedDots)),
    connectionColors: JSON.parse(JSON.stringify(connectionColors)),
    connectionDotStyles: [...connectionDotStyles],
    currentConnectionIndex: currentConnectionIndex,
  };

  // Push to undo stack
  undoStack.push(currentState);
  // Clear redo stack when new action is performed
  redoStack = [];

  // Update letter drawings
  letterDrawings[currentLetter] = {
    placedDots: currentState.placedDots,
    connectionColors: currentState.connectionColors,
    connectionDotStyles: currentState.connectionDotStyles,
  };

  updateLetterButtonIndicator(currentLetter);
}

function keyPressed() {
  // If text input is focused, don't process any hotkeys
  if (isTextInputFocused) {
    return false;
  }

  // Handle arrow keys for grid navigation
  if (keyCode === LEFT_ARROW) {
    navigateGrid(-1, 0);
    return false;
  } else if (keyCode === RIGHT_ARROW) {
    navigateGrid(1, 0);
    return false;
  } else if (keyCode === UP_ARROW) {
    navigateGrid(0, -1);
    return false;
  } else if (keyCode === DOWN_ARROW) {
    navigateGrid(0, 1);
    return false;
  }

  // Process other hotkeys only when text input is not focused
  if (keyIsDown(SHIFT)) {
    // Handle shift + letter/number/punctuation hotkeys
    let letter = key.toUpperCase();

    // Map shifted number keys to their actual numbers (Swiss keyboard layout)
    const shiftedNumberMap = {
      "+": "1",
      '"': "2",
      "*": "3",
      ç: "4",
      "%": "5",
      "&": "6",
      "/": "7",
      "(": "8",
      ")": "9",
      "=": "0",
    };

    // Check if it's a valid character (A-Z, 0-9, or punctuation)
    let validKey =
      /^[A-Z.,?!&–]$/.test(letter) ||
      (key >= "0" && key <= "9") || // Handle number keys directly
      Object.keys(shiftedNumberMap).includes(key); // Handle shifted number keys

    if (validKey) {
      // For shifted numbers, convert to actual number
      let selectedChar = shiftedNumberMap[key] || letter;
      saveCurrentLetterState();
      currentLetter = selectedChar;
      loadLetterState(selectedChar);
      letterButtons.forEach((b) => b.removeClass("active"));
      let btn = select(
        `#letter-${selectedChar.replace(/[^a-zA-Z0-9]/g, "\\$&")}`
      );
      if (btn) btn.addClass("active");
    }
  } else {
    // Only process other hotkeys when shift is not pressed
    if (key === "C" || key === "c") {
      placedDots = [[]];
      connectionColors = [[...currentColor]];
      connectionDotStyles = [nextDotStyle];
      currentConnectionIndex = 0;
      saveStateForUndo(); // Save state after clearing
      updateLetterButtonIndicator(currentLetter); // Update indicator after clearing
    } else if (key === "n" || key === "N") {
      currentConnectionIndex++;
      placedDots.push([]);
      connectionColors.push([...currentColor]);
      connectionDotStyles.push(nextDotStyle);
      saveStateForUndo(); // Save state after new connection
    } else if (key === "1") {
      dotSize = DOT_SIZES[0]; // S
      updateSizeDisplay();
    } else if (key === "2") {
      dotSize = DOT_SIZES[1]; // M
      updateSizeDisplay();
    } else if (key === "3") {
      dotSize = DOT_SIZES[2]; // L
      updateSizeDisplay();
    } else if (key === "x" || key === "X") {
      dotSize = DOT_SIZES[3]; // XL
      updateSizeDisplay();
    } else if (key === "5") {
      changeColor(COLORS.red);
    } else if (key === "6") {
      changeColor(COLORS.yellow);
    } else if (key === "7") {
      changeColor(COLORS.blue);
    } else if (key === "8") {
      randomizeAllColors();
    } else if (key === "q" || key === "Q") {
      nextDotStyle = nextDotStyle === "filled" ? "outlined" : "filled";
      updateStyleDisplay();
    } else if (key === "e" || key === "E") {
      nextDotStyle = "eraser";
      updateStyleDisplay();
    } else if (key === "k" || key === "K") {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle("dark-mode");
    } else if (key === "s" || key === "S") {
      cycleColorPalette();
    } else if (key === "p" || key === "P") {
      saveImageWithTimestamp();
    } else if (key === "z" || key === "Z") {
      undo();
    } else if (key === "y" || key === "Y") {
      redo();
    } else if (key === "o" || key === "O") {
      exportAsOTF();
    } else if (key === "r" || key === "R") {
      generateRandomDesignsForAllLetters(false); // Generate with filled dots
    } else if (key === "t" || key === "T") {
      generateRandomDesignsForAllLetters(true); // Generate with outlined dots
    }
  }
  return false;
}

function mouseWheel(event) {
  // Find the current index in DOT_SIZES (excluding XL)
  let idx = getDotSizeIndex(dotSize);
  if (idx >= 3) idx = 1; // If XL is selected, default to M
  if (event.delta > 0) {
    // Scroll down, decrease size (to S)
    idx = max(0, idx - 1);
  } else {
    // Scroll up, increase size (to L)
    idx = min(2, idx + 1); // Changed from DOT_SIZES.length - 1 to 2
  }
  dotSize = DOT_SIZES[idx];
  updateSizeDisplay();
  return false; // Prevent default scrolling behavior
}

function getMaxDotSize() {
  // Scale max dot size based on grid density
  // For grid size 5: max size = 6
  // For grid size 30: max size = 12
  return floor(map(gridRows, 5, 30, 6, 12));
}

function generateRandomConnections(density = 1) {
  placedDots = []; // Clear existing connections
  connectionColors = []; // Clear connection colors
  currentConnectionIndex = 0;

  // Adjust the number of connections and dots based on density
  let numConnections = int(map(density, 1, 100, 2, 10)); // Increase connections with density
  for (let i = 0; i < numConnections; i++) {
    placedDots.push([]); // Start a new connection
    connectionColors.push([...currentColor]); // Store the current color for this connection
    let numDots = int(map(density, 1, 100, 2, 8)); // Increase dots per connection with density
    for (let j = 0; j < numDots; j++) {
      let gx = int(random(0, gridCols)) * cellSize + padding + cellSize / 2;
      let gy = int(random(0, gridRows)) * cellSize + padding + cellSize / 2;
      // Scale random dot size with grid density
      let minSize = 1;
      let maxSize = getMaxDotSize();
      let size = int(random(minSize, maxSize));
      placedDots[i].push({ x: gx, y: gy, size: size });
    }
  }
}

function saveImageWithTimestamp() {
  let timestamp =
    year() +
    "-" +
    month() +
    "-" +
    day() +
    "_" +
    hour() +
    "-" +
    minute() +
    "-" +
    second();
  saveCanvas("artwork_" + timestamp, "png");
}

// Helper function to compare arrays
function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}

function changeColor(newColor) {
  currentColor = [...newColor];

  // Update button states
  Object.entries(COLORS).forEach(([name, color]) => {
    if (arraysEqual(color, currentColor)) {
      colorButtons[name].addClass("active");
    } else {
      colorButtons[name].removeClass("active");
    }
  });

  // If there's an active connection with dots, update its color
  if (
    placedDots[currentConnectionIndex] &&
    placedDots[currentConnectionIndex].length > 0
  ) {
    connectionColors[currentConnectionIndex] = [...currentColor];
    saveCurrentLetterState(); // Save state after color change
  }
}

function updateSizeDisplay() {
  // Highlight the active size button using a tolerance for floating-point comparison
  const TOL = 0.001;
  sizeButtons.forEach((btn, idx) => {
    if (Math.abs(DOT_SIZES[idx] - dotSize) < TOL) {
      btn.addClass("active");
    } else {
      btn.removeClass("active");
    }
  });
}

function updateConsole() {
  // Clear existing content
  consolePanel.html("");

  // Add title with current letter
  consolePanel.child(createElement("h3", `Letter ${currentLetter}`));

  // Add info for each connection
  let sizeLabels = ["S", "M", "L", "XL"]; // Keep XL in console display
  placedDots.forEach((dots, index) => {
    if (dots.length > 0) {
      let connectionDiv = createDiv("");
      connectionDiv.class("connection-info");

      // Connection header with color preview
      let headerDiv = createDiv("");
      headerDiv.class("connection-header");

      let colorPreview = createDiv("");
      colorPreview.class("color-preview");
      colorPreview.style(
        "background-color",
        `rgb(${connectionColors[index].join(",")})`
      );

      headerDiv.child(colorPreview);
      headerDiv.child(
        createSpan(`Connection ${String(index + 1).padStart(2, "0")}`)
      );
      connectionDiv.child(headerDiv);

      // Add info for each dot
      dots.forEach((dot, dotIndex) => {
        let dotInfo = createDiv("");
        dotInfo.class("dot-info");
        // Convert dot size to S/M/L
        let sizeIdx = DOT_SIZES.findIndex(
          (s) => Math.abs(s - dot.size) < 0.001
        );
        let sizeLabel = sizeLabels[sizeIdx] || dot.size;
        // Convert position to grid coordinates
        let gx = Math.round((dot.x - padding - cellSize / 2) / cellSize);
        let yOffset = gridRows === 7 ? padding - cellSize : padding;
        let gy = Math.round((dot.y - yOffset - cellSize / 2) / cellSize);
        let colLetter = String.fromCharCode(65 + gx); // 65 = 'A'
        let rowNumber = gy + 1;
        dotInfo.html(
          `Dot ${String(dotIndex + 1).padStart(2, "0")}: ${colLetter}${String(
            rowNumber
          ).padStart(2, "0")}, size=${sizeLabel}`
        );
        connectionDiv.child(dotInfo);
      });

      consolePanel.child(connectionDiv);
    }
  });
}

function toggleCurved() {
  isCurved = !isCurved;
  // Update the current connection's style
  if (
    currentConnectionIndex >= 0 &&
    currentConnectionIndex < connectionColors.length
  ) {
    connectionColors[currentConnectionIndex] = [...currentColor];
    saveCurrentLetterState(); // Save state after toggling curve
  }
}

function getDotSizeIndex(val) {
  const TOL = 0.001;
  for (let i = 0; i < DOT_SIZES.length; i++) {
    if (Math.abs(DOT_SIZES[i] - val) < TOL) return i;
  }
  return -1;
}

function updateStyleDisplay() {
  styleButtons.forEach((btn, idx) => {
    if (["outlined", "filled", "eraser"][idx] === nextDotStyle) {
      btn.addClass("active");
    } else {
      btn.removeClass("active");
    }
  });
}

function cycleColorPalette() {
  currentPaletteIndex = (currentPaletteIndex + 1) % COLOR_PALETTES.length;
  COLORS = COLOR_PALETTES[currentPaletteIndex].colors;

  // Update color buttons
  Object.entries(COLORS).forEach(([name, color]) => {
    colorButtons[name].style("background-color", `rgb(${color.join(",")})`);
  });

  // Update current color if it exists in new palette
  let currentColorName = Object.entries(COLORS).find(([_, color]) =>
    arraysEqual(color, currentColor)
  )?.[0];

  if (!currentColorName) {
    // If current color doesn't exist in new palette, default to first color
    currentColorName = Object.keys(COLORS)[0];
    currentColor = [...COLORS[currentColorName]];
  }

  // Update active state of color buttons
  Object.entries(COLORS).forEach(([name, color]) => {
    if (name === currentColorName) {
      colorButtons[name].addClass("active");
    } else {
      colorButtons[name].removeClass("active");
    }
  });
}

function initializeLetterDrawings() {
  // Initialize A-Z
  for (let i = 0; i < 26; i++) {
    let letter = String.fromCharCode(65 + i);
    letterDrawings[letter] = {
      placedDots: [[]],
      connectionColors: [[...currentColor]],
      connectionDotStyles: [nextDotStyle],
    };
  }
  // Initialize numbers 0-9
  for (let i = 0; i < 10; i++) {
    let number = i.toString();
    letterDrawings[number] = {
      placedDots: [[]],
      connectionColors: [[...currentColor]],
      connectionDotStyles: [nextDotStyle],
    };
  }
  // Initialize punctuation
  [".", ",", "?", "!", "–", "&"].forEach((punct) => {
    letterDrawings[punct] = {
      placedDots: [[]],
      connectionColors: [[...currentColor]],
      connectionDotStyles: [nextDotStyle],
    };
  });
}

function saveCurrentLetterState() {
  // Save the current state for the current letter
  let currentState = {
    placedDots: JSON.parse(JSON.stringify(placedDots)),
    connectionColors: JSON.parse(JSON.stringify(connectionColors)),
    connectionDotStyles: [...connectionDotStyles],
    currentConnectionIndex: currentConnectionIndex,
  };

  // Push to undo stack
  undoStack.push(currentState);
  // Clear redo stack when new action is performed
  redoStack = [];

  letterDrawings[currentLetter] = {
    placedDots: currentState.placedDots,
    connectionColors: currentState.connectionColors,
    connectionDotStyles: currentState.connectionDotStyles,
  };

  // Update the indicator for the current letter
  updateLetterButtonIndicator(currentLetter);

  // Force preview update if this letter is in the preview text
  if (previewText && previewText.includes(currentLetter)) {
    previewText = previewText; // This will trigger the input event
  }
}

function undo() {
  if (undoStack.length > 0) {
    // Save current state to redo stack
    let currentState = {
      placedDots: JSON.parse(JSON.stringify(placedDots)),
      connectionColors: JSON.parse(JSON.stringify(connectionColors)),
      connectionDotStyles: [...connectionDotStyles],
      currentConnectionIndex: currentConnectionIndex,
    };
    redoStack.push(currentState);

    // Restore previous state
    let previousState = undoStack.pop();
    placedDots = previousState.placedDots;
    connectionColors = previousState.connectionColors;
    connectionDotStyles = previousState.connectionDotStyles;
    currentConnectionIndex = previousState.currentConnectionIndex;

    // Update letter drawings
    letterDrawings[currentLetter] = {
      placedDots: placedDots,
      connectionColors: connectionColors,
      connectionDotStyles: connectionDotStyles,
    };

    updateLetterButtonIndicator(currentLetter);
  }
}

function redo() {
  if (redoStack.length > 0) {
    // Save current state to undo stack
    let currentState = {
      placedDots: JSON.parse(JSON.stringify(placedDots)),
      connectionColors: JSON.parse(JSON.stringify(connectionColors)),
      connectionDotStyles: [...connectionDotStyles],
      currentConnectionIndex: currentConnectionIndex,
    };
    undoStack.push(currentState);

    // Restore next state
    let nextState = redoStack.pop();
    placedDots = nextState.placedDots;
    connectionColors = nextState.connectionColors;
    connectionDotStyles = nextState.connectionDotStyles;
    currentConnectionIndex = nextState.currentConnectionIndex;

    // Update letter drawings
    letterDrawings[currentLetter] = {
      placedDots: placedDots,
      connectionColors: connectionColors,
      connectionDotStyles: connectionDotStyles,
    };

    updateLetterButtonIndicator(currentLetter);
  }
}

function loadLetterState(letter) {
  let state = letterDrawings[letter];

  // Deep clone the state to avoid reference issues
  placedDots = JSON.parse(JSON.stringify(state.placedDots));
  connectionColors = JSON.parse(JSON.stringify(state.connectionColors));
  connectionDotStyles = [...state.connectionDotStyles];

  // Ensure we have at least one connection array
  if (placedDots.length === 0) {
    placedDots = [[]];
    connectionColors = [[...currentColor]];
    connectionDotStyles = [nextDotStyle];
  }

  // Set current connection index to the last non-empty connection
  currentConnectionIndex = placedDots.length - 1;
  for (let i = placedDots.length - 1; i >= 0; i--) {
    if (placedDots[i].length > 0) {
      currentConnectionIndex = i;
      break;
    }
  }

  // Update current color to match the first non-empty connection's color
  let foundColor = false;
  for (let i = 0; i < connectionColors.length; i++) {
    if (placedDots[i].length > 0) {
      currentColor = [...connectionColors[i]];
      foundColor = true;
      break;
    }
  }

  // If no connections have colors, set to default blue
  if (!foundColor) {
    currentColor = [...COLORS.blue];
  }

  // Update color button states
  Object.entries(COLORS).forEach(([name, color]) => {
    if (arraysEqual(color, currentColor)) {
      colorButtons[name].addClass("active");
    } else {
      colorButtons[name].removeClass("active");
    }
  });

  // Update grid position based on the letter
  const letters = [
    ["A", "B", "C"],
    ["D", "E", "F"],
    ["G", "H", "I"],
    ["J", "K", "L"],
    ["M", "N", "O"],
    ["P", "Q", "R"],
    ["S", "T", "U"],
    ["V", "W", "X"],
    ["Y", "Z", "0"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", ",", "?"],
    ["!", "–", "&"],
  ];

  for (let y = 0; y < letters.length; y++) {
    let x = letters[y].indexOf(letter);
    if (x !== -1) {
      currentGridX = x;
      currentGridY = y;
      break;
    }
  }
}

function hasLetterDrawing(letter) {
  let state = letterDrawings[letter];
  return state && state.placedDots.some((connection) => connection.length > 0);
}

function updateLetterButtonIndicator(letter) {
  // Escape special characters for CSS selector
  let escapedLetter = letter.replace(/[^a-zA-Z0-9]/g, "\\$&");
  let btn = select(`#letter-${escapedLetter}`);
  if (btn) {
    if (hasLetterDrawing(letter)) {
      btn.addClass("has-drawing");
    } else {
      btn.removeClass("has-drawing");
    }
  }
}

function updateAllLetterIndicators() {
  // Update indicators for all letters
  Object.keys(letterDrawings).forEach((letter) => {
    updateLetterButtonIndicator(letter);
  });
}

function showHoverPreview(letter, button) {
  if (!hasLetterDrawing(letter)) {
    return;
  }

  // Create a temporary canvas for the preview
  let previewCanvas = createGraphics(100, 100);
  previewCanvas.background(255);

  // Save current state
  let currentState = {
    placedDots: JSON.parse(JSON.stringify(placedDots)),
    connectionColors: JSON.parse(JSON.stringify(connectionColors)),
    connectionDotStyles: [...connectionDotStyles],
    currentConnectionIndex: currentConnectionIndex,
  };

  // Load letter state
  let state = letterDrawings[letter];
  placedDots = JSON.parse(JSON.stringify(state.placedDots));
  connectionColors = JSON.parse(JSON.stringify(state.connectionColors));
  connectionDotStyles = [...state.connectionDotStyles];
  currentConnectionIndex = 0;

  // Calculate bounds of the design
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  placedDots.forEach((connection) => {
    connection.forEach((dot) => {
      // Include the dot radius in bounds calculation
      let r = dot.size * cellSize;
      minX = Math.min(minX, dot.x - r / 2);
      minY = Math.min(minY, dot.y - r / 2);
      maxX = Math.max(maxX, dot.x + r / 2);
      maxY = Math.max(maxY, dot.y + r / 2);
    });
  });

  // Calculate scale to fit in preview box with padding
  let designWidth = maxX - minX;
  let designHeight = maxY - minY;
  let padding = 15; // Padding around the design
  let scale =
    Math.min(
      (100 - padding * 2) / designWidth,
      (100 - padding * 2) / designHeight
    ) * 0.95; // Increased from 0.9 to 0.95 for slightly larger preview

  // Draw the letter on the preview canvas
  previewCanvas.push();
  previewCanvas.translate(50, 50);
  previewCanvas.scale(scale);

  // Draw each connection
  for (let j = 0; j < placedDots.length; j++) {
    let connection = placedDots[j];
    if (connection.length > 0) {
      // Draw connections
      for (let k = 0; k < connection.length - 1; k++) {
        let d1 = connection[k];
        let d2 = connection[k + 1];

        // Draw tangent lines
        let x1 = d1.x - (minX + maxX) / 2;
        let y1 = d1.y - (minY + maxY) / 2;
        let x2 = d2.x - (minX + maxX) / 2;
        let y2 = d2.y - (minY + maxY) / 2;

        let r1 = (d1.size * cellSize) / 2;
        let r2 = (d2.size * cellSize) / 2;

        // Ensure r1 is the larger radius
        let swap = false;
        if (r2 > r1) {
          [r1, r2] = [r2, r1];
          [x1, x2] = [x2, x1];
          [y1, y2] = [y2, y1];
          swap = true;
        }

        // Calculate the distance between centers
        let dx = x2 - x1;
        let dy = y2 - y1;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the angle between centers
        let angle = Math.atan2(dy, dx);

        // Calculate the angle of the tangent line
        let tangentAngle = Math.acos((r1 - r2) / distance);

        // Calculate the two tangent angles
        let angle1 = angle + tangentAngle;
        let angle2 = angle - tangentAngle;

        // Calculate the tangent points
        let x1a = x1 + r1 * Math.cos(angle1);
        let y1a = y1 + r1 * Math.sin(angle1);
        let x1b = x1 + r1 * Math.cos(angle2);
        let y1b = y1 + r1 * Math.sin(angle2);

        let x2a = x2 + r2 * Math.cos(angle1);
        let y2a = y2 + r2 * Math.sin(angle1);
        let x2b = x2 + r2 * Math.cos(angle2);
        let y2b = y2 + r2 * Math.sin(angle2);

        // Swap points if we swapped the circles
        if (swap) {
          [x1a, x2a] = [x2a, x1a];
          [y1a, y2a] = [y2a, y1a];
          [x1b, x2b] = [x2b, x1b];
          [y1b, y2b] = [y2b, y1b];
        }

        // Draw the connection
        previewCanvas.noStroke();
        previewCanvas.fill(connectionColors[j]);
        previewCanvas.beginShape();
        previewCanvas.vertex(x1a, y1a);
        previewCanvas.vertex(x2a, y2a);
        previewCanvas.vertex(x2b, y2b);
        previewCanvas.vertex(x1b, y1b);
        previewCanvas.endShape(previewCanvas.CLOSE);
      }

      // Draw dots
      for (let dot of connection) {
        let x = dot.x - (minX + maxX) / 2;
        let y = dot.y - (minY + maxY) / 2;
        let r = dot.size * cellSize;

        previewCanvas.noStroke();
        previewCanvas.fill(connectionColors[j]);
        previewCanvas.ellipse(x, y, r);

        if (dot.style === "outlined") {
          previewCanvas.fill(255);
          previewCanvas.ellipse(x, y, r - 16);
        }
      }
    }
  }
  previewCanvas.pop();

  // Convert canvas to data URL
  let previewImage = previewCanvas.canvas.toDataURL();

  // Update preview div
  hoverPreviewDiv.html(`<img src="${previewImage}" width="100" height="100">`);
  hoverPreviewDiv.style("display", "block");

  // Position the preview
  let buttonRect = button.elt.getBoundingClientRect();
  hoverPreviewDiv.position(buttonRect.right + 10, buttonRect.top);

  // Restore previous state
  placedDots = currentState.placedDots;
  connectionColors = currentState.connectionColors;
  connectionDotStyles = currentState.connectionDotStyles;
  currentConnectionIndex = currentState.currentConnectionIndex;
}

function hideHoverPreview() {
  hoverPreviewDiv.style("display", "none");
}

// Add this function to generate random designs for all letters
function generateRandomDesignsForAllLetters(outlinedOnly = false) {
  // Save current state for undo
  let currentState = {
    placedDots: JSON.parse(JSON.stringify(placedDots)),
    connectionColors: JSON.parse(JSON.stringify(connectionColors)),
    connectionDotStyles: [...connectionDotStyles],
    currentConnectionIndex: currentConnectionIndex,
  };
  undoStack.push(currentState);
  redoStack = [];

  // Generate random designs for each letter
  Object.keys(letterDrawings).forEach((letter) => {
    // Save current letter state
    let letterState = {
      placedDots: JSON.parse(JSON.stringify(placedDots)),
      connectionColors: JSON.parse(JSON.stringify(connectionColors)),
      connectionDotStyles: [...connectionDotStyles],
      currentConnectionIndex: currentConnectionIndex,
    };

    // Clear existing connections
    placedDots = [[]];
    connectionColors = [[...currentColor]];
    connectionDotStyles = [nextDotStyle];
    currentConnectionIndex = 0;

    // Generate 2-3 random connections
    let numConnections = floor(random(2, 4));
    for (let i = 0; i < numConnections; i++) {
      placedDots.push([]);
      connectionColors.push([...currentColor]);
      connectionDotStyles.push(outlinedOnly ? "outlined" : "filled"); // Use outlined style if specified

      // Generate 2-4 dots per connection
      let numDots = floor(random(2, 5));
      for (let j = 0; j < numDots; j++) {
        let gx = int(random(0, gridCols)) * cellSize + padding + cellSize / 2;
        let gy = int(random(0, gridRows)) * cellSize + padding + cellSize / 2;
        placedDots[i].push({
          x: gx,
          y: gy,
          size: DOT_SIZES[0], // Always use size S (index 0)
          style: outlinedOnly ? "outlined" : "filled", // Use outlined style if specified
        });
      }
    }

    // Save the random design to the letter
    letterDrawings[letter] = {
      placedDots: JSON.parse(JSON.stringify(placedDots)),
      connectionColors: JSON.parse(JSON.stringify(connectionColors)),
      connectionDotStyles: [...connectionDotStyles],
    };

    // Update the letter button indicator
    updateLetterButtonIndicator(letter);
  });

  // Restore the current letter's state
  loadLetterState(currentLetter);
}

function randomizeAllColors() {
  // Save current state for undo
  let currentState = {
    placedDots: JSON.parse(JSON.stringify(placedDots)),
    connectionColors: JSON.parse(JSON.stringify(connectionColors)),
    connectionDotStyles: [...connectionDotStyles],
    currentConnectionIndex: currentConnectionIndex,
  };
  undoStack.push(currentState);
  redoStack = [];

  // Randomize colors for all letters
  Object.keys(letterDrawings).forEach((letter) => {
    let state = letterDrawings[letter];
    if (state && state.placedDots.some((connection) => connection.length > 0)) {
      // Generate new random colors for each connection
      let newColors = state.connectionColors.map(() => {
        return [floor(random(256)), floor(random(256)), floor(random(256))];
      });

      // Update the letter's colors
      letterDrawings[letter].connectionColors = newColors;
    }
  });

  // Update current letter's colors
  if (placedDots.some((connection) => connection.length > 0)) {
    connectionColors = connectionColors.map(() => {
      return [floor(random(256)), floor(random(256)), floor(random(256))];
    });
  }

  // Update current color to match the first non-empty connection's color
  for (let i = 0; i < connectionColors.length; i++) {
    if (placedDots[i].length > 0) {
      currentColor = [...connectionColors[i]];
      break;
    }
  }

  // Update color button states
  Object.entries(COLORS).forEach(([name, color]) => {
    if (arraysEqual(color, currentColor)) {
      colorButtons[name].addClass("active");
    } else {
      colorButtons[name].removeClass("active");
    }
  });

  // Update letter indicators
  updateAllLetterIndicators();
}
