let gridCols = 5;
let gridRows = 5; // Fixed to 5 rows
let cellSize;
let padding = 250;
const DOT_SIZES = [0.45, 0.95, 1.95]; // S, M, L (L adjusted for edge-to-edge match)
let dotSize = 0.95; // Default to M
let placedDots = []; // This will now be an array of arrays
let connectionColors = []; // Array to store colors for each connection
let currentConnectionIndex = 0; // Index to track the current connection
let currentColor = [0, 0, 255]; // Current color (blue by default)
let gridToggleButton; // Button for toggling grid size
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
let currentLetter = "A";
let previewText = "";
let letterButtons = [];
let letterDrawings = {}; // Store drawings for each letter
let isTextInputFocused = false;
let isLettersVisible = false; // Start with letters hidden

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

function generateLogContent(letter) {
  let sizeLabels = ["S", "M", "L"];
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
  let width = 800;
  let height = 800;

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

  // Calculate scale to fit in 800x800 with padding
  let designWidth = maxX - minX;
  let designHeight = maxY - minY;
  let padding = 100; // Padding around the design
  let scale = Math.min(
    (width - padding * 2) / designWidth,
    (height - padding * 2) / designHeight
  );

  // Calculate offset to center the design
  let offsetX = (width - designWidth * scale) / 2 - minX * scale;
  let offsetY = (height - designHeight * scale) / 2 - minY * scale;

  // Start SVG content
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Add white background
  svg += `<rect width="${width}" height="${height}" fill="#ffffff"/>`;

  // Add connections and dots
  placedDots.forEach((connection, index) => {
    if (connection.length > 0) {
      // Draw connections
      for (let i = 0; i < connection.length - 1; i++) {
        let d1 = connection[i];
        let d2 = connection[i + 1];
        let color = connectionColors[index];

        // Scale and center coordinates
        let x1 = d1.x * scale + offsetX;
        let y1 = d1.y * scale + offsetY;
        let x2 = d2.x * scale + offsetX;
        let y2 = d2.y * scale + offsetY;

        let r1 = (d1.size * cellSize * scale) / 2;
        let r2 = (d2.size * cellSize * scale) / 2;

        // Calculate tangent points
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

        // Draw the connection
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
  undoButton.attribute("title", "Undo (Left Arrow)");
  undoButton.mousePressed(() => {
    if (placedDots[currentConnectionIndex].length > 0) {
      placedDots[currentConnectionIndex].pop();
    } else if (currentConnectionIndex > 0) {
      placedDots.pop();
      connectionColors.pop();
      connectionDotStyles.pop();
      currentConnectionIndex--;
    }
    saveCurrentLetterState(); // Save state after undo
    updateLetterButtonIndicator(currentLetter); // Update indicator after undo
  });
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
    saveCurrentLetterState(); // Save state after clearing
    updateLetterButtonIndicator(currentLetter); // Update indicator after clearing
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
      saveCurrentLetterState(); // Save state after style change
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
  let exportComboButton = createButton("EXPORT");
  exportComboButton.class("control-button");
  exportComboButton.mousePressed(exportZipWithSVGAndLog);
  exportButtons.child(exportComboButton);

  // Create letter selector container
  let letterSelector = createDiv("");
  letterSelector.class("letter-selector");

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
    letterButtons.push(btn);
    letterSelector.child(btn);
  }

  // Add numbers 0-9
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
    letterButtons.push(btn);
    letterSelector.child(btn);
  }

  // Add punctuation buttons
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
    letterButtons.push(btn);
    letterSelector.child(btn);
  });

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

  // Add both to the control buttons container
  controlButtonsContainer.child(abcButton);
  controlButtonsContainer.child(letterSelector);
  controlButtonsContainer.child(textInput);

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
                drawTangentLines(d1, d2, connectionColors[j]);
              }
              // Draw dots
              for (let dot of connection) {
                drawDot(
                  dot.x,
                  dot.y,
                  dot.size,
                  connectionColors[j],
                  dot.style || connectionDotStyles[j]
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
  } else {
    fill(color);
    ellipse(x, y, r);
    fill(255);
    ellipse(x, y, r - 16);
  }
}

function drawPreview() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
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
      saveCurrentLetterState(); // Save state after breaking connection
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
      saveCurrentLetterState(); // Save state after adding dot
    }
  }
}

function keyPressed() {
  // If text input is focused, don't process any hotkeys
  if (isTextInputFocused) {
    return false;
  }

  // Process hotkeys only when text input is not focused
  if (key === "C" || key === "c") {
    placedDots = [[]];
    connectionColors = [[...currentColor]];
    connectionDotStyles = [nextDotStyle];
    currentConnectionIndex = 0;
    saveCurrentLetterState(); // Save state after clearing
    updateLetterButtonIndicator(currentLetter); // Update indicator after clearing
  } else if (key === "n" || key === "N") {
    currentConnectionIndex++;
    placedDots.push([]);
    connectionColors.push([...currentColor]);
    connectionDotStyles.push(nextDotStyle);
    saveCurrentLetterState(); // Save state after new connection
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
    saveCurrentLetterState(); // Save state after color change
  } else if (key === "5") {
    changeColor(COLORS.yellow);
    saveCurrentLetterState(); // Save state after color change
  } else if (key === "6") {
    changeColor(COLORS.blue);
    saveCurrentLetterState(); // Save state after color change
  } else if (key === "q" || key === "Q") {
    nextDotStyle = nextDotStyle === "filled" ? "outlined" : "filled";
    updateStyleDisplay();
    saveCurrentLetterState(); // Save state after style change
  } else if (key === "k" || key === "K") {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode");
  } else if (key === "s" || key === "S") {
    cycleColorPalette();
    saveCurrentLetterState(); // Save state after palette change
  } else if (key === "p" || key === "P") {
    saveImageWithTimestamp();
  } else if (key === "z" || key === "Z") {
    // Export 10x10 grid of variations
    exportGridOfVariations();
  }
  return false;
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
    drawTangentLinesOnBuffer(buffer, d1, d2, connectionColors[index]);
  }

  // Draw the dots for the connection
  buffer.stroke(connectionColors[index]); // Use this connection's color
  buffer.strokeWeight(6);
  buffer.fill(255); // Set the fill color to white
  for (let dot of connection) {
    drawDotOnBuffer(buffer, dot.x, dot.y, dot.size);
  }
}

function drawTangentLinesOnBuffer(buffer, d1, d2, color) {
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
  let y1b = y1 - sin(perpAngle) * r1;

  let x2a = x2 + cos(perpAngle) * r2;
  let y2a = y2 + sin(perpAngle) * r2;
  let x2b = x2 - cos(perpAngle) * r2;
  let y2b = y2 - sin(perpAngle) * r2;

  // Draw the connection with inward stroke
  noStroke();
  fill(color);
  // Draw linear connecting shape
  buffer.beginShape();
  vertex(x1a, y1a);
  vertex(x2a, y2a);
  vertex(x2b, y2b);
  vertex(x1b, y1b);
  endShape(CLOSE);
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
          ).padStart(2, "0")}, size = ${sizeLabel}`
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
  letterDrawings[currentLetter] = {
    placedDots: JSON.parse(JSON.stringify(placedDots)),
    connectionColors: JSON.parse(JSON.stringify(connectionColors)),
    connectionDotStyles: [...connectionDotStyles],
  };

  // Update the indicator for the current letter
  updateLetterButtonIndicator(currentLetter);

  // Force preview update if this letter is in the preview text
  if (previewText && previewText.includes(currentLetter)) {
    previewText = previewText; // This will trigger the input event
  }
}

function loadLetterState(letter) {
  let state = letterDrawings[letter];
  placedDots = JSON.parse(JSON.stringify(state.placedDots));
  connectionColors = JSON.parse(JSON.stringify(state.connectionColors));
  connectionDotStyles = [...state.connectionDotStyles];
  currentConnectionIndex = 0;
}

function hasLetterDrawing(letter) {
  let state = letterDrawings[letter];
  return state && state.placedDots.some((connection) => connection.length > 0);
}

function updateLetterButtonIndicator(letter) {
  let btn = select(`#letter-${letter}`);
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
