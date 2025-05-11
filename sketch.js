let gridCols = 5;
let gridRows = 5; // Fixed to 5 rows
let cellSize;
let padding = 250;
const DOT_SIZES = [0.45, 0.95, 1.95]; // S, M, L (L adjusted for edge-to-edge match)
let dotSize = 0.95; // Default to M
let placedDots = []; // This will now be an array of arrays
let connectionStyles = []; // Array to store whether each connection is curved
let connectionColors = []; // Array to store colors for each connection
let currentConnectionIndex = 0; // Index to track the current connection
let currentColor = [0, 0, 255]; // Current color (blue by default)
let gridToggleButton; // Button for toggling grid size
let isCurved = false; // Toggle for curved/linear connections, default to linear
let toggleButton; // Button for toggling connection style
let colorButtons = {}; // Object to store color buttons
let sizeDisplay; // Display for dot size
let consolePanel;
let maxGridDim = 7; // The largest grid dimension (for 5x7)
let canvasSize = 700; // The main drawing area size (without padding)
let sizeButtons = [];
let nextDotStyle = "outlined"; // 'outlined' or 'filled'
let connectionDotStyles = []; // Array to store dot styles for each connection
let styleButtons = [];
let isDarkMode = false;

// Define available colors
const COLOR_PALETTES = [
  {
    name: "RGB",
    colors: {
      red: [255, 0, 0],
      green: [0, 255, 0],
      blue: [0, 0, 255],
    },
  },
  {
    name: "Pastel",
    colors: {
      red: [255, 179, 186],
      green: [186, 255, 201],
      blue: [186, 201, 255],
    },
  },
  {
    name: "Neon",
    colors: {
      red: [255, 0, 128],
      green: [0, 255, 128],
      blue: [128, 0, 255],
    },
  },
  {
    name: "Muted",
    colors: {
      red: [204, 102, 102],
      green: [102, 204, 102],
      blue: [102, 102, 204],
    },
  },
  {
    name: "Warm",
    colors: {
      red: [255, 99, 71],
      green: [255, 165, 0],
      blue: [255, 69, 0],
    },
  },
  {
    name: "Cool",
    colors: {
      red: [70, 130, 180],
      green: [0, 191, 255],
      blue: [135, 206, 235],
    },
  },
  {
    name: "Earth",
    colors: {
      red: [139, 69, 19],
      green: [85, 107, 47],
      blue: [101, 67, 33],
    },
  },
  {
    name: "Ocean",
    colors: {
      red: [0, 105, 148],
      green: [0, 191, 255],
      blue: [0, 51, 102],
    },
  },
];
let currentPaletteIndex = 0;
let COLORS = COLOR_PALETTES[currentPaletteIndex].colors;

function exportZipWithSVGAndLog() {
  // Generate SVG content (as string)
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
  let svgFilename = "artwork_" + timestamp + ".svg";
  let logFilename = "console_log_" + timestamp + ".txt";

  // --- SVG content (copied from exportSVG, but as a string) ---
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Grid of dots -->
  <g fill="black">`;
  let yOffset = gridRows === 7 ? padding - cellSize : padding;
  let dotRadius = (cellSize * 0.16) / 2;
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      let x = i * cellSize + padding + cellSize / 2;
      let y = j * cellSize + yOffset + cellSize / 2;
      svg += `\n    <circle cx="${x}" cy="${y}" r="${dotRadius}"/>`;
    }
  }
  svg += `\n  </g>`;
  placedDots.forEach((connection, index) => {
    if (connection.length > 0) {
      let color = connectionColors[index];
      let colorStr = `rgb(${color.join(",")})`;
      svg += `\n  <!-- Connection ${
        index + 1
      } -->\n  <g stroke="${colorStr}" stroke-width="6" fill="${colorStr}">`;
      for (let i = 0; i < connection.length - 1; i++) {
        let d1 = connection[i];
        let d2 = connection[i + 1];
        let r1 = (d1.size * cellSize) / 2;
        let r2 = (d2.size * cellSize) / 2;
        let angle = atan2(d2.y - d1.y, d2.x - d1.x);
        let perpAngle = angle + HALF_PI;
        let x1a = d1.x + cos(perpAngle) * r1;
        let y1a = d1.y + sin(perpAngle) * r1;
        let x1b = d1.x - cos(perpAngle) * r1;
        let y1b = d1.y - sin(perpAngle) * r1;
        let x2a = d2.x + cos(perpAngle) * r2;
        let y2a = d2.y + sin(perpAngle) * r2;
        let x2b = d2.x - cos(perpAngle) * r2;
        let y2b = d2.y - sin(perpAngle) * r2;
        if (connectionStyles[index]) {
          let distance = p5.Vector.dist(
            createVector(d1.x, d1.y),
            createVector(d2.x, d2.y)
          );
          let controlDist = distance * 0.4;
          let cp1ax = x1a + cos(angle) * controlDist;
          let cp1ay = y1a + sin(angle) * controlDist;
          let cp2ax = x2a - cos(angle) * controlDist;
          let cp2ay = y2a - sin(angle) * controlDist;
          let cp1bx = x1b + cos(angle) * controlDist;
          let cp1by = y1b + sin(angle) * controlDist;
          let cp2bx = x2b - cos(angle) * controlDist;
          let cp2by = y2b - sin(angle) * controlDist;
          svg += `\n    <path d=\"M ${x1a} ${y1a} C ${cp1ax} ${cp1ay} ${cp2ax} ${cp2ay} ${x2a} ${y2a} A ${r2} ${r2} 0 1 1 ${x2b} ${y2b} C ${cp2bx} ${cp2by} ${cp1bx} ${cp1by} ${x1b} ${y1b} A ${r1} ${r1} 0 1 1 ${x1a} ${y1a} Z\"/>`;
        } else {
          svg += `\n    <path d=\"M ${x1a} ${y1a} L ${x2a} ${y2a} A ${r2} ${r2} 0 1 1 ${x2b} ${y2b} L ${x1b} ${y1b} A ${r1} ${r1} 0 1 1 ${x1a} ${y1a} Z\"/>`;
        }
      }
      svg += `\n  </g>\n  <g stroke="${colorStr}" stroke-width=\"6\" fill=\"white\">`;
      connection.forEach((dot) => {
        let r = dot.size * cellSize;
        svg += `\n    <circle cx=\"${dot.x}\" cy=\"${dot.y}\" r=\"${r / 2}\"/>`;
      });
      svg += `\n  </g>`;
    }
  });
  svg += `\n</svg>`;

  // --- Log content (with S/M/L and grid coordinates) ---
  let sizeLabels = ["S", "M", "L"];
  let content = "Dot Connections Log\n";
  content += "=================\n\n";
  placedDots.forEach((dots, index) => {
    if (dots.length > 0) {
      content += `Connection ${index + 1}\n`;
      content += `Style: ${connectionStyles[index] ? "Curved" : "Linear"}\n`;
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
        content += `  ${
          dotIndex + 1
        }: ${colLetter}${rowNumber}, size=${sizeLabel}\n`;
      });
      content += "\n";
    }
  });

  // --- Create ZIP ---
  let zip = new JSZip();
  zip.file(svgFilename, svg);
  zip.file(logFilename, content);
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
    ["g", "Toggle curved/linear"],
    ["c", "Clear all"],
    ["1/2/3", "Dot size S/M/L"],
    ["4/5/6", "Colors"],
    ["q", "Toggle dot style"],
    ["k", "Toggle dark mode"],
    ["s", "Cycle color palette"],
    ["p", "Export image"],
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
    connectionStyles.push(isCurved);
    connectionColors.push([...currentColor]);
    connectionDotStyles.push(nextDotStyle);
  });
  actionControl.child(newButton);

  // Undo (←)
  let undoButton = createButton("←");
  undoButton.class("action-button");
  undoButton.attribute("title", "Undo (Left Arrow)");
  undoButton.mousePressed(() => {
    if (placedDots[currentConnectionIndex].length > 0) {
      placedDots[currentConnectionIndex].pop();
    } else if (currentConnectionIndex > 0) {
      placedDots.pop();
      connectionStyles.pop();
      connectionColors.pop();
      connectionDotStyles.pop();
      currentConnectionIndex--;
    }
  });
  actionControl.child(undoButton);

  // Clear (×)
  let clearButton = createButton("×");
  clearButton.class("action-button");
  clearButton.attribute("title", "Clear (C)");
  clearButton.mousePressed(() => {
    placedDots = [[]];
    connectionStyles = [isCurved];
    connectionColors = [[...currentColor]];
    connectionDotStyles = [nextDotStyle];
    currentConnectionIndex = 0;
  });
  actionControl.child(clearButton);

  controlButtonsContainer.child(actionControl);

  // S/M/L size buttons in a wrapper with width 120px
  let sizeControl = createDiv("");
  sizeControl.class("size-control");
  sizeControl.style("width", "120px");
  const sizeLabels = ["S", "M", "L"];
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

  // Style buttons (Outlined, Filled) in a wrapper with width 120px
  let styleControl = createDiv("");
  styleControl.class("style-control");
  styleControl.style("width", "120px");
  const styleLabels = ["○", "●"];
  styleButtons = [];
  styleLabels.forEach((label, idx) => {
    let btn = createButton(label);
    btn.class("style-button");
    btn.mousePressed(() => {
      nextDotStyle = ["outlined", "filled"][idx];
      updateStyleDisplay();
    });
    styleButtons.push(btn);
    styleControl.child(btn);
  });
  // Set initial active button
  styleButtons[0].addClass("active");
  controlButtonsContainer.child(styleControl);

  // Size display (optional, can be removed if not needed)
  // sizeDisplay = createSpan(dotSize.toString());
  // sizeDisplay.class("size-display");
  // sizeControl.child(sizeDisplay);

  // Create export buttons container
  let exportButtons = createDiv("");
  exportButtons.class("export-buttons");

  // Create a single export button for SVG and Log
  let exportComboButton = createButton("Export");
  exportComboButton.class("export-button");
  exportComboButton.mousePressed(exportZipWithSVGAndLog);
  exportButtons.child(exportComboButton);

  // Create color buttons container
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

  updateGridSize();
  noFill();
  placedDots.push([]); // Initialize with the first connection
  connectionStyles.push(isCurved); // Store the style for the first connection
  connectionColors.push([...currentColor]); // Store the color for the first connection
  connectionDotStyles.push(nextDotStyle); // Store the current dot style for this new connection

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
    drawTangentLines(d1, d2, connectionStyles[index], connectionColors[index]);
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

function drawTangentLines(d1, d2, isCurvedConnection, color) {
  let x1 = d1.x;
  let y1 = d1.y;
  let x2 = d2.x;
  let y2 = d2.y;

  let r1 = (d1.size * cellSize) / 2;
  let r2 = (d2.size * cellSize) / 2;

  // Calculate the angle between the two circles
  let angle = atan2(y2 - y1, x2 - x1);
  let perpAngle = angle + HALF_PI;

  // Calculate the tangent points
  let x1a = x1 + cos(perpAngle) * r1;
  let y1a = y1 + sin(perpAngle) * r1;
  let x1b = x1 - cos(perpAngle) * r1;
  let y1b = y1 - sin(perpAngle) * r1;

  let x2a = x2 + cos(perpAngle) * r2;
  let y2a = y2 + sin(perpAngle) * r2;
  let x2b = x2 - cos(perpAngle) * r2;
  let y2b = y2 - sin(perpAngle) * r2;

  // Draw the connection with inward stroke
  noStroke();
  fill(color);
  if (isCurvedConnection) {
    // Calculate control points for the Bézier curves
    let distance = p5.Vector.dist(createVector(x1, y1), createVector(x2, y2));
    let controlDist = distance * 0.4;

    let cp1ax = x1a + cos(angle) * controlDist;
    let cp1ay = y1a + sin(angle) * controlDist;
    let cp2ax = x2a - cos(angle) * controlDist;
    let cp2ay = y2a - sin(angle) * controlDist;

    let cp1bx = x1b + cos(angle) * controlDist;
    let cp1by = y1b + sin(angle) * controlDist;
    let cp2bx = x2b - cos(angle) * controlDist;
    let cp2by = y2b - sin(angle) * controlDist;

    // Draw the curved connecting shape
    beginShape();
    vertex(x1a, y1a);
    bezierVertex(cp1ax, cp1ay, cp2ax, cp2ay, x2a, y2a);
    vertex(x2b, y2b);
    bezierVertex(cp2bx, cp2by, cp1bx, cp1by, x1b, y1b);
    endShape(CLOSE);
  } else {
    // Draw linear connecting shape
    beginShape();
    vertex(x1a, y1a);
    vertex(x2a, y2a);
    vertex(x2b, y2b);
    vertex(x1b, y1b);
    endShape(CLOSE);
  }
}

function drawDot(x, y, size, color, style) {
  let r = size * cellSize;
  noStroke();

  if (style === "filled") {
    fill(color);
    ellipse(x, y, r);
  } else {
    fill(color);
    ellipse(x, y, r);
    fill(255);
    ellipse(x, y, r - 12);
  }
}

function drawPreview() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
    noStroke();
    fill(0, 30); // Single, consistent color for all preview elements

    // Draw the preview dot
    let r = dotSize * cellSize;
    if (nextDotStyle === "filled") {
      ellipse(gx, gy, r);
    } else {
      // For outlined style, draw a ring
      ellipse(gx, gy, r);
      fill(255); // White background
      ellipse(gx, gy, r - 12);
      fill(0, 30); // Back to preview color
      ellipse(gx, gy, r - 12);
    }

    // Draw preview tangent lines if there is at least one dot placed
    let currentConnection = placedDots[currentConnectionIndex];
    if (currentConnection.length > 0) {
      let lastDot = currentConnection[currentConnection.length - 1];
      let previewDot = { x: gx, y: gy, size: dotSize };

      // Calculate the angle between the two circles
      let angle = atan2(gy - lastDot.y, gx - lastDot.x);
      let perpAngle = angle + HALF_PI;

      // Calculate the tangent points
      let r1 = (lastDot.size * cellSize) / 2;
      let r2 = (dotSize * cellSize) / 2;

      let x1a = lastDot.x + cos(perpAngle) * r1;
      let y1a = lastDot.y + sin(perpAngle) * r1;
      let x1b = lastDot.x - cos(perpAngle) * r1;
      let y1b = lastDot.y - sin(perpAngle) * r1;

      let x2a = gx + cos(perpAngle) * r2;
      let y2a = gy + sin(perpAngle) * r2;
      let x2b = gx - cos(perpAngle) * r2;
      let y2b = gy - sin(perpAngle) * r2;

      if (connectionStyles[currentConnectionIndex]) {
        // Calculate control points for the Bézier curves
        let distance = p5.Vector.dist(
          createVector(lastDot.x, lastDot.y),
          createVector(gx, gy)
        );
        let controlDist = distance * 0.4;

        let cp1ax = x1a + cos(angle) * controlDist;
        let cp1ay = y1a + sin(angle) * controlDist;
        let cp2ax = x2a - cos(angle) * controlDist;
        let cp2ay = y2a - sin(angle) * controlDist;

        let cp1bx = x1b + cos(angle) * controlDist;
        let cp1by = y1b + sin(angle) * controlDist;
        let cp2bx = x2b - cos(angle) * controlDist;
        let cp2by = y2b - sin(angle) * controlDist;

        // Draw the curved connecting shape
        beginShape();
        vertex(x1a, y1a);
        bezierVertex(cp1ax, cp1ay, cp2ax, cp2ay, x2a, y2a);
        vertex(x2b, y2b);
        bezierVertex(cp2bx, cp2by, cp1bx, cp1by, x1b, y1b);
        endShape(CLOSE);
      } else {
        // Draw linear connecting shape
        beginShape();
        vertex(x1a, y1a);
        vertex(x2a, y2a);
        vertex(x2b, y2b);
        vertex(x1b, y1b);
        endShape(CLOSE);
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
      connectionStyles.push(isCurved); // Store the current style for this new connection
      connectionColors.push([...currentColor]); // Store the current color for this new connection
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

function keyPressed() {
  if (key === "C" || key === "c") {
    placedDots = [[]];
    connectionStyles = [isCurved];
    connectionColors = [[...currentColor]];
    currentConnectionIndex = 0;
  } else if (key === "n" || key === "N") {
    currentConnectionIndex++;
    placedDots.push([]);
    connectionStyles.push(isCurved);
    connectionColors.push([...currentColor]);
  } else if (key === "g" || key === "G") {
    toggleCurved();
  } else if (key === "1") {
    dotSize = DOT_SIZES[0]; // S
    updateSizeDisplay();
  } else if (key === "2") {
    dotSize = DOT_SIZES[1]; // M
    updateSizeDisplay();
  } else if (key === "3") {
    dotSize = DOT_SIZES[2]; // L
    updateSizeDisplay();
  } else if (key === "4") {
    changeColor(COLORS.red);
  } else if (key === "5") {
    changeColor(COLORS.green);
  } else if (key === "6") {
    changeColor(COLORS.blue);
  } else if (key === "q" || key === "Q") {
    nextDotStyle = nextDotStyle === "filled" ? "outlined" : "filled";
    updateStyleDisplay();
  } else if (key === "k" || key === "K") {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode");
  } else if (key === "s" || key === "S") {
    cycleColorPalette();
  } else if (key === "p" || key === "P") {
    saveImageWithTimestamp();
  } else if (key === "z" || key === "Z") {
    // Export 10x10 grid of variations
    exportGridOfVariations();
  }
}

function mouseWheel(event) {
  // Find the current index in DOT_SIZES
  let idx = getDotSizeIndex(dotSize);
  if (event.delta > 0) {
    // Scroll down, decrease size (to S)
    idx = max(0, idx - 1);
  } else {
    // Scroll up, increase size (to L)
    idx = min(DOT_SIZES.length - 1, idx + 1);
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
  connectionStyles = []; // Clear connection styles
  connectionColors = []; // Clear connection colors
  currentConnectionIndex = 0;

  // Adjust the number of connections and dots based on density
  let numConnections = int(map(density, 1, 100, 2, 10)); // Increase connections with density
  for (let i = 0; i < numConnections; i++) {
    placedDots.push([]); // Start a new connection
    connectionStyles.push(isCurved); // Store the current style for this connection
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

function exportGridOfVariations() {
  let gridRows = 10;
  let gridCols = 10;
  let gutter = 4; // 4px gutter between variations
  let variationWidth = (width - padding * 2) / gridCols - gutter; // Width of each variation
  let variationHeight = (height - padding * 2) / gridRows - gutter; // Height of each variation

  // Create a new off-screen graphics buffer for the grid
  let gridBuffer = createGraphics(
    (variationWidth + gutter) * gridCols + gutter,
    (variationHeight + gutter) * gridRows + gutter
  );
  gridBuffer.background(245);

  // Generate and draw 10x10 variations with increasing density
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      // Calculate density based on grid position (increases from top-left to bottom-right)
      let density = map(
        row * gridCols + col,
        0,
        gridRows * gridCols - 1,
        1,
        100
      );

      // Generate random connections with the current density
      generateRandomConnections(density);

      // Draw the variation onto the grid buffer
      gridBuffer.push();
      gridBuffer.translate(
        col * (variationWidth + gutter) + gutter,
        row * (variationHeight + gutter) + gutter
      );
      gridBuffer.scale(
        variationWidth / (width - padding * 2),
        variationHeight / (height - padding * 2)
      );
      drawGridOnBuffer(gridBuffer);
      for (let i = 0; i < placedDots.length; i++) {
        drawConnectionOnBuffer(gridBuffer, placedDots[i], i);
      }
      gridBuffer.pop();
    }
  }

  // Save the grid as an image
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
  gridBuffer.save("grid_variations_" + timestamp + ".png");
}

function drawGridOnBuffer(buffer) {
  buffer.stroke(180);
  buffer.strokeWeight(0.5);
  for (let i = 0; i <= gridCols; i++) {
    let pos = i * cellSize + padding;
    buffer.line(pos, padding, pos, height - padding);
    buffer.line(padding, pos, width - padding, pos);
  }
}

function drawConnectionOnBuffer(buffer, connection, index) {
  buffer.strokeCap(ROUND);
  buffer.strokeJoin(ROUND);
  buffer.noStroke();
  buffer.stroke(connectionColors[index]); // Use this connection's color
  buffer.strokeWeight(6);
  buffer.fill(connectionColors[index]);

  // Draw the tangent lines for the connection
  for (let i = 0; i < connection.length - 1; i++) {
    let d1 = connection[i];
    let d2 = connection[i + 1];
    drawTangentLinesOnBuffer(buffer, d1, d2, connectionStyles[index]);
  }

  // Draw the dots for the connection
  buffer.stroke(connectionColors[index]); // Use this connection's color
  buffer.strokeWeight(6);
  buffer.fill(255); // Set the fill color to white
  for (let dot of connection) {
    drawDotOnBuffer(buffer, dot.x, dot.y, dot.size);
  }
}

function drawTangentLinesOnBuffer(buffer, d1, d2, isCurvedConnection) {
  buffer.strokeCap(ROUND);
  buffer.strokeJoin(ROUND);
  let x1 = d1.x;
  let y1 = d1.y;
  let x2 = d2.x;
  let y2 = d2.y;

  let r1 = (d1.size * cellSize) / 2;
  let r2 = (d2.size * cellSize) / 2;

  // Calculate the angle between the two circles
  let angle = atan2(y2 - y1, x2 - x1);
  let perpAngle = angle + HALF_PI;

  // Calculate the tangent points
  let x1a = x1 + cos(perpAngle) * r1;
  let y1a = y1 + sin(perpAngle) * r1;
  let x1b = x1 - cos(perpAngle) * r1;
  let y1b = y1 - sin(angle) * r1;

  let x2a = x2 + cos(perpAngle) * r2;
  let y2a = y2 + sin(perpAngle) * r2;
  let x2b = x2 - cos(perpAngle) * r2;
  let y2b = y2 - sin(angle) * r2;

  if (isCurvedConnection) {
    // Calculate control points for the Bézier curves
    let distance = p5.Vector.dist(createVector(x1, y1), createVector(x2, y2));
    let controlDist = distance * 0.4; // Adjust this value to control curve intensity

    let cp1ax = x1a + cos(angle) * controlDist;
    let cp1ay = y1a + sin(angle) * controlDist;
    let cp2ax = x2a - cos(angle) * controlDist;
    let cp2ay = y2a - sin(angle) * controlDist;

    let cp1bx = x1b + cos(angle) * controlDist;
    let cp1by = y1b + sin(angle) * controlDist;
    let cp2bx = x2b - cos(angle) * controlDist;
    let cp2by = y2b - sin(angle) * controlDist;

    // Draw the curved connecting shape
    buffer.beginShape();
    vertex(x1a, y1a);
    bezierVertex(cp1ax, cp1ay, cp2ax, cp2ay, x2a, y2a);
    vertex(x2b, y2b);
    bezierVertex(cp2bx, cp2by, cp1bx, cp1by, x1b, y1b);
    endShape(CLOSE);
  } else {
    // Draw linear connecting shape
    buffer.beginShape();
    vertex(x1a, y1a);
    vertex(x2a, y2a);
    vertex(x2b, y2b);
    vertex(x1b, y1b);
    endShape(CLOSE);
  }
}

function drawDotOnBuffer(buffer, x, y, size) {
  let r = size * cellSize;
  buffer.ellipse(x, y, r);
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

  // Add title
  consolePanel.child(createElement("h3", "Connections"));

  // Add info for each connection
  let sizeLabels = ["S", "M", "L"];
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
        createSpan(
          `Connection ${index + 1} (${
            connectionStyles[index] ? "Curved" : "Linear"
          })`
        )
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
          `Dot ${dotIndex + 1}: ${colLetter}${rowNumber}, size=${sizeLabel}`
        );
        connectionDiv.child(dotInfo);
      });

      consolePanel.child(connectionDiv);
    }
  });
}

function exportSVG() {
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
  let filename = "artwork_" + timestamp + ".svg";

  // Create SVG content
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Grid of dots -->
  <g fill="black">`;

  // Add grid dots
  let yOffset = gridRows === 7 ? padding - cellSize : padding;
  let dotRadius = (cellSize * 0.16) / 2;
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      let x = i * cellSize + padding + cellSize / 2;
      let y = j * cellSize + yOffset + cellSize / 2;
      svg += `\n    <circle cx="${x}" cy="${y}" r="${dotRadius}"/>`;
    }
  }
  svg += `\n  </g>`;

  // Add connections
  placedDots.forEach((connection, index) => {
    if (connection.length > 0) {
      let color = connectionColors[index];
      let colorStr = `rgb(${color.join(",")})`;

      svg += `\n  <!-- Connection ${
        index + 1
      } -->\n  <g stroke="${colorStr}" stroke-width="6" fill="${colorStr}">`;

      // Add connection paths
      for (let i = 0; i < connection.length - 1; i++) {
        let d1 = connection[i];
        let d2 = connection[i + 1];

        // Calculate path data similar to drawTangentLines
        let r1 = (d1.size * cellSize) / 2;
        let r2 = (d2.size * cellSize) / 2;
        let angle = atan2(d2.y - d1.y, d2.x - d1.x);
        let perpAngle = angle + HALF_PI;

        let x1a = d1.x + cos(perpAngle) * r1;
        let y1a = d1.y + sin(perpAngle) * r1;
        let x1b = d1.x - cos(perpAngle) * r1;
        let y1b = d1.y - sin(perpAngle) * r1;
        let x2a = d2.x + cos(perpAngle) * r2;
        let y2a = d2.y + sin(perpAngle) * r2;
        let x2b = d2.x - cos(perpAngle) * r2;
        let y2b = d2.y - sin(perpAngle) * r2;

        if (connectionStyles[index]) {
          // Curved connection
          let distance = p5.Vector.dist(
            createVector(d1.x, d1.y),
            createVector(d2.x, d2.y)
          );
          let controlDist = distance * 0.4;
          let cp1ax = x1a + cos(angle) * controlDist;
          let cp1ay = y1a + sin(angle) * controlDist;
          let cp2ax = x2a - cos(angle) * controlDist;
          let cp2ay = y2a - sin(angle) * controlDist;
          let cp1bx = x1b + cos(angle) * controlDist;
          let cp1by = y1b + sin(angle) * controlDist;
          let cp2bx = x2b - cos(angle) * controlDist;
          let cp2by = y2b - sin(angle) * controlDist;

          svg += `\n    <path d="M ${x1a} ${y1a} C ${cp1ax} ${cp1ay} ${cp2ax} ${cp2ay} ${x2a} ${y2a} L ${x2b} ${y2b} C ${cp2bx} ${cp2by} ${cp1bx} ${cp1by} ${x1b} ${y1b} Z"/>`;
        } else {
          // Linear connection
          svg += `\n    <path d="M ${x1a} ${y1a} L ${x2a} ${y2a} L ${x2b} ${y2b} L ${x1b} ${y1b} Z"/>`;
        }
      }

      // Add dots
      svg += `\n  </g>\n  <g stroke="${colorStr}" stroke-width="6" fill="white">`;
      connection.forEach((dot) => {
        let r = dot.size * cellSize;
        svg += `\n    <circle cx="${dot.x}" cy="${dot.y}" r="${r / 2}"/>`;
      });
      svg += `\n  </g>`;
    }
  });

  svg += `\n</svg>`;

  // Create a Blob containing the SVG data
  let blob = new Blob([svg], { type: "image/svg+xml" });
  let url = URL.createObjectURL(blob);

  // Create a temporary link and trigger download
  let link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportConsoleLog() {
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
  let filename = "console_log_" + timestamp + ".txt";

  // Create text content
  let content = "Dot Connections Log\n";
  content += "=================\n\n";

  // Add info for each connection
  placedDots.forEach((dots, index) => {
    if (dots.length > 0) {
      content += `Connection ${index + 1}\n`;
      content += `Style: ${connectionStyles[index] ? "Curved" : "Linear"}\n`;
      content += `Color: rgb(${connectionColors[index].join(",")})\n`;
      content += "Dots:\n";

      dots.forEach((dot, dotIndex) => {
        content += `  ${dotIndex + 1}: x=${Math.round(dot.x)}, y=${Math.round(
          dot.y
        )}, size=${dot.size}\n`;
      });
      content += "\n";
    }
  });

  // Create a Blob containing the text data
  let blob = new Blob([content], { type: "text/plain" });
  let url = URL.createObjectURL(blob);

  // Create a temporary link and trigger download
  let link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toggleCurved() {
  isCurved = !isCurved;
  // Update the current connection's style
  if (
    currentConnectionIndex >= 0 &&
    currentConnectionIndex < connectionStyles.length
  ) {
    connectionStyles[currentConnectionIndex] = isCurved;
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
    if (["outlined", "filled"][idx] === nextDotStyle) {
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
