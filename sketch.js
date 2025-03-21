let gridSize = 15;
let cellSize;
let padding = 250; // Increased padding
let dotSize = 1; // Start with the smallest dot size
let placedDots = []; // This will now be an array of arrays
let connectionStyles = []; // Array to store whether each connection is curved
let connectionColors = []; // Array to store colors for each connection
let currentConnectionIndex = 0; // Index to track the current connection
let currentColor = [0, 0, 255]; // Current color (blue by default)
let gridSizeSlider; // Slider for grid size
let isCurved = false; // Toggle for curved/linear connections, default to linear
let toggleButton; // Button for toggling connection style
let colorButtons = {}; // Object to store color buttons
let sizeDisplay; // Display for dot size
let consolePanel;

// Define available colors
const COLORS = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  black: [0, 0, 0],
  blue: [0, 0, 255],
};

function setup() {
  strokeCap(ROUND);
  strokeJoin(ROUND); // Add smooth joins between vertices
  createCanvas(600 + padding * 2, 600 + padding * 2); // Smaller artboard with more padding

  // Create shortcuts info
  let shortcutsInfo = createDiv("");
  shortcutsInfo.class("shortcuts-info");

  // Add shortcuts
  const shortcuts = [
    ["n", "New connection"],
    ["g", "Toggle curved/linear"],
    ["c", "Clear all"],
    ["w/s", "Size up/down"],
    ["1-4", "Colors"],
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

  // Create control buttons container
  let controlButtonsContainer = createDiv("");
  controlButtonsContainer.class("control-buttons");

  // Create new connection button
  let newConnectionButton = createButton("New Connection");
  newConnectionButton.class("control-button");
  newConnectionButton.mousePressed(() => {
    currentConnectionIndex++;
    placedDots.push([]);
    connectionStyles.push(isCurved);
    connectionColors.push([...currentColor]);
  });
  controlButtonsContainer.child(newConnectionButton);

  // Create undo button
  let undoButton = createButton("Undo");
  undoButton.class("control-button");
  undoButton.mousePressed(() => {
    if (placedDots[currentConnectionIndex].length > 0) {
      placedDots[currentConnectionIndex].pop();
    } else if (currentConnectionIndex > 0) {
      placedDots.pop();
      connectionStyles.pop();
      connectionColors.pop();
      currentConnectionIndex--;
    }
  });
  controlButtonsContainer.child(undoButton);

  // Create clear button
  let clearButton = createButton("Clear");
  clearButton.class("control-button");
  clearButton.mousePressed(() => {
    placedDots = [[]];
    connectionStyles = [isCurved];
    connectionColors = [[...currentColor]];
    currentConnectionIndex = 0;
  });
  controlButtonsContainer.child(clearButton);

  // Create size control container
  let sizeControl = createDiv("");
  sizeControl.class("size-control control-button");

  // Decrease size button
  let decreaseButton = createButton("-");
  decreaseButton.class("size-button");
  decreaseButton.mousePressed(() => {
    dotSize = max(1, floor(dotSize - 1));
    updateSizeDisplay();
  });

  // Size display
  sizeDisplay = createSpan(dotSize.toString());
  sizeDisplay.class("size-display");

  // Increase size button
  let increaseButton = createButton("+");
  increaseButton.class("size-button");
  increaseButton.mousePressed(() => {
    dotSize = min(getMaxDotSize(), floor(dotSize + 1));
    updateSizeDisplay();
  });

  // Add all size controls
  sizeControl.child(createSpan("Size:"));
  sizeControl.child(decreaseButton);
  sizeControl.child(sizeDisplay);
  sizeControl.child(increaseButton);
  controlButtonsContainer.child(sizeControl);

  // Create export buttons container
  let exportButtons = createDiv("");
  exportButtons.class("export-buttons");

  // Create PNG export button
  let pngButton = createButton("Export PNG");
  pngButton.class("export-button");
  pngButton.mousePressed(() => {
    saveImageWithTimestamp();
  });
  exportButtons.child(pngButton);

  // Create SVG export button
  let svgButton = createButton("Export SVG");
  svgButton.class("export-button");
  svgButton.mousePressed(() => {
    exportSVG();
  });
  exportButtons.child(svgButton);

  // Create Console Log export button
  let logButton = createButton("Export Log");
  logButton.class("export-button");
  logButton.mousePressed(() => {
    exportConsoleLog();
  });
  exportButtons.child(logButton);

  // Create color buttons container
  let colorButtonsContainer = createDiv("");
  colorButtonsContainer.class("color-buttons");

  // Create color buttons
  Object.entries(COLORS).forEach(([name, color]) => {
    let button = createDiv("");
    button.class("color-button");
    button.style("background-color", `rgb(${color.join(",")})`);
    if (arraysEqual(color, currentColor)) {
      button.addClass("active");
    }
    button.mousePressed(() => changeColor(color));
    colorButtons[name] = button;
    colorButtonsContainer.child(button);
  });

  // Create slider for grid size with web3 styling
  gridSizeSlider = createSlider(5, 30, gridSize);

  // Create value display
  let valueDisplay = createDiv("");
  valueDisplay.class("slider-value");

  // Create toggle button with initial linear state
  toggleButton = createButton("");
  toggleButton.class("toggle-button");
  toggleButton.attribute("data-active", "false");

  // Create switch element
  let switchElem = createDiv();
  switchElem.class("switch");
  toggleButton.child(switchElem);

  // Add label
  let label = createSpan("Linear");
  toggleButton.child(label);

  // Toggle function
  const toggleCurved = () => {
    isCurved = !isCurved;
    toggleButton.attribute("data-active", isCurved ? "true" : "false");
    label.html(isCurved ? "Curved" : "Linear");
    // Update the current connection's style
    if (
      currentConnectionIndex >= 0 &&
      currentConnectionIndex < connectionStyles.length
    ) {
      connectionStyles[currentConnectionIndex] = isCurved;
    }
  };

  toggleButton.mousePressed(toggleCurved);

  // Update the value display when slider changes
  gridSizeSlider.input(() => {
    valueDisplay.html(`Grid: ${gridSizeSlider.value()}`);
  });

  // Set initial value
  valueDisplay.html(`Grid: ${gridSizeSlider.value()}`);

  updateGridSize();
  noFill();
  placedDots.push([]); // Initialize with the first connection
  connectionStyles.push(isCurved); // Store the style for the first connection
  connectionColors.push([...currentColor]); // Store the color for the first connection

  // Create console panel
  consolePanel = createDiv("");
  consolePanel.class("console-panel");
}

function updateGridSize() {
  let oldGridSize = gridSize;
  gridSize = gridSizeSlider.value();
  cellSize = (width - padding * 2) / gridSize;

  // No need to clear or reset connections
  // Just update the grid size and let the draw function handle the rest
}

function draw() {
  background(255);

  // Check if grid size has changed
  if (gridSize !== gridSizeSlider.value()) {
    updateGridSize();
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

function drawGrid() {
  stroke(200); // Lighter grid color for white background
  strokeWeight(0.5);
  for (let i = 0; i <= gridSize; i++) {
    let pos = i * cellSize + padding;
    line(pos, padding, pos, height - padding);
    line(padding, pos, width - padding, pos);
  }
}

function drawConnection(connection, index) {
  noStroke();
  stroke(connectionColors[index]); // Use the connection's stored color
  strokeWeight(6); // Set the stroke weight to 6px
  fill(connectionColors[index]);

  // Draw the tangent lines for the connection
  for (let i = 0; i < connection.length - 1; i++) {
    let d1 = connection[i];
    let d2 = connection[i + 1];
    drawTangentLines(d1, d2, connectionStyles[index]);
  }

  // Draw the dots for the connection
  stroke(connectionColors[index]); // Use the connection's stored color
  strokeWeight(6); // Set the stroke weight to 6px
  fill(255); // Set the fill color to white
  for (let dot of connection) {
    drawDot(dot.x, dot.y, dot.size);
  }
}

function drawTangentLines(d1, d2, isCurvedConnection) {
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
    beginShape();

    // Start with a smoother transition from the first circle
    for (let a = perpAngle - 0.2; a <= perpAngle + 0.2; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      vertex(x, y);
    }

    bezierVertex(cp1ax, cp1ay, cp2ax, cp2ay, x2a, y2a);

    // Add a half-circle at the end with smoother steps
    for (let a = perpAngle; a <= perpAngle + PI; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      vertex(x, y);
    }

    // Add smooth transition at the bottom connection
    for (let a = perpAngle + PI - 0.2; a <= perpAngle + PI + 0.2; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      vertex(x, y);
    }

    bezierVertex(cp2bx, cp2by, cp1bx, cp1by, x1b, y1b);

    // Add a half-circle at the start with smoother steps
    for (let a = perpAngle + PI; a <= perpAngle + TWO_PI; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      vertex(x, y);
    }
  } else {
    // Draw linear connecting shape
    beginShape();

    // Start with a smoother transition from the first circle
    for (let a = perpAngle - 0.2; a <= perpAngle + 0.2; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      vertex(x, y);
    }

    vertex(x2a, y2a);

    // Add a half-circle at the end with smoother steps
    for (let a = perpAngle; a <= perpAngle + PI; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      vertex(x, y);
    }

    // Add smooth transition at the bottom connection
    for (let a = perpAngle + PI - 0.2; a <= perpAngle + PI + 0.2; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      vertex(x, y);
    }

    vertex(x1b, y1b);

    // Add a half-circle at the start with smoother steps
    for (let a = perpAngle + PI; a <= perpAngle + TWO_PI; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      vertex(x, y);
    }
  }
  endShape(CLOSE);
}

function drawPreview() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
    // Draw the preview dot
    noStroke();
    fill(0, 50);
    drawDot(gx, gy, dotSize);

    // Draw preview tangent lines if there is at least one dot placed
    let currentConnection = placedDots[currentConnectionIndex];
    if (currentConnection.length > 0) {
      noStroke();
      fill(0, 50);
      let lastDot = currentConnection[currentConnection.length - 1];
      let previewDot = { x: gx, y: gy, size: dotSize };
      drawTangentLines(
        lastDot,
        previewDot,
        connectionStyles[currentConnectionIndex]
      );
    }
  }
}

function drawDot(x, y, size) {
  let r = size * cellSize;
  ellipse(x, y, r);
}

function getGridMousePos() {
  let gx = floor((mouseX - padding) / cellSize);
  let gy = floor((mouseY - padding) / cellSize);
  if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
    return [
      gx * cellSize + padding + cellSize / 2,
      gy * cellSize + padding + cellSize / 2,
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
      placedDots[currentConnectionIndex].push({ x: gx, y: gy, size: dotSize });
    }
  }
}

function keyPressed() {
  if (key === "C" || key === "c") {
    placedDots = [[]]; // Reset all connections
    connectionStyles = [isCurved]; // Reset styles
    connectionColors = [[...currentColor]]; // Reset colors
    currentConnectionIndex = 0;
  } else if (key === "w") {
    dotSize += 1;
    dotSize = constrain(dotSize, 1, getMaxDotSize()); // Scale max size with grid density
  } else if (key === "s") {
    dotSize -= 1;
    dotSize = constrain(dotSize, 1, getMaxDotSize()); // Scale max size with grid density
  } else if (key === "n" || key === "N") {
    // 'n' key pressed for new connection
    currentConnectionIndex++; // Move to the next connection
    placedDots.push([]); // Start a new connection
    connectionStyles.push(isCurved); // Store the current style for this new connection
    connectionColors.push([...currentColor]); // Store the current color for this new connection
  } else if (key === "g" || key === "G") {
    // Toggle curved/linear mode
    toggleCurved();
  } else if (key === "r" || key === "R") {
    // 'r' key pressed
    generateRandomConnections();
  } else if (key === "1") {
    changeColor(COLORS.red);
  } else if (key === "2") {
    changeColor(COLORS.green);
  } else if (key === "3") {
    changeColor(COLORS.black);
  } else if (key === "4") {
    changeColor(COLORS.blue);
  } else if (key === "p" || key === "P") {
    // Save image with timestamp
    saveImageWithTimestamp();
  } else if (key === "z" || key === "Z") {
    // Export 10x10 grid of variations
    exportGridOfVariations();
  }
}

function mouseWheel(event) {
  // Adjust dot size based on the scroll direction
  if (event.delta > 0) {
    dotSize = max(1, floor(dotSize - 1)); // Scroll down, decrease size
  } else {
    dotSize = min(getMaxDotSize(), floor(dotSize + 1)); // Scroll up, increase size
  }
  // Update the size display
  updateSizeDisplay();
  return false; // Prevent default scrolling behavior
}

function getMaxDotSize() {
  // Scale max dot size based on grid density
  // For grid size 5: max size = 6
  // For grid size 30: max size = 12
  return floor(map(gridSize, 5, 30, 6, 12));
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
      let gx = int(random(0, gridSize)) * cellSize + padding + cellSize / 2;
      let gy = int(random(0, gridSize)) * cellSize + padding + cellSize / 2;
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
  for (let i = 0; i <= gridSize; i++) {
    let pos = i * cellSize + padding;
    buffer.line(pos, padding, pos, height - padding);
    buffer.line(padding, pos, width - padding, pos);
  }
}

function drawConnectionOnBuffer(buffer, connection, index) {
  buffer.noStroke();
  buffer.stroke(connectionColors[index]); // Use this connection's color
  buffer.strokeWeight(6);
  buffer.fill(connectionColors[index]);

  // Draw the tangent lines for the connection
  for (let i = 0; i < connection.length - 1; i++) {
    let d1 = connection[i];
    let d2 = connection[i + 1];
    drawTangentLinesOnBuffer(buffer, d1, d2, connectionStyles[index]); // Pass the style
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

    // Start with a smoother transition from the first circle
    for (let a = perpAngle - 0.2; a <= perpAngle + 0.2; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      buffer.vertex(x, y);
    }

    buffer.bezierVertex(cp1ax, cp1ay, cp2ax, cp2ay, x2a, y2a);

    // Add a half-circle at the end with smoother steps
    for (let a = perpAngle; a <= perpAngle + PI; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      buffer.vertex(x, y);
    }

    // Add smooth transition at the bottom connection
    for (let a = perpAngle + PI - 0.2; a <= perpAngle + PI + 0.2; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      buffer.vertex(x, y);
    }

    buffer.bezierVertex(cp2bx, cp2by, cp1bx, cp1by, x1b, y1b);

    // Add a half-circle at the start with smoother steps
    for (let a = perpAngle + PI; a <= perpAngle + TWO_PI; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      buffer.vertex(x, y);
    }
  } else {
    // Draw linear connecting shape
    buffer.beginShape();

    // Start with a smoother transition from the first circle
    for (let a = perpAngle - 0.2; a <= perpAngle + 0.2; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      buffer.vertex(x, y);
    }

    buffer.vertex(x2a, y2a);

    // Add a half-circle at the end with smoother steps
    for (let a = perpAngle; a <= perpAngle + PI; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      buffer.vertex(x, y);
    }

    // Add smooth transition at the bottom connection
    for (let a = perpAngle + PI - 0.2; a <= perpAngle + PI + 0.2; a += 0.05) {
      let x = x2 + cos(a) * r2;
      let y = y2 + sin(a) * r2;
      buffer.vertex(x, y);
    }

    buffer.vertex(x1b, y1b);

    // Add a half-circle at the start with smoother steps
    for (let a = perpAngle + PI; a <= perpAngle + TWO_PI; a += 0.05) {
      let x = x1 + cos(a) * r1;
      let y = y1 + sin(a) * r1;
      buffer.vertex(x, y);
    }
  }
  buffer.endShape(CLOSE);
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
  sizeDisplay.html(dotSize.toString());
}

function updateConsole() {
  // Clear existing content
  consolePanel.html("");

  // Add title
  consolePanel.child(createElement("h3", "Connections"));

  // Add info for each connection
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
        dotInfo.html(
          `Dot ${dotIndex + 1}: x=${Math.round(dot.x)}, y=${Math.round(
            dot.y
          )}, size=${dot.size}`
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
  <!-- Grid -->
  <g stroke="rgb(200,200,200)" stroke-width="0.5">`;

  // Add grid lines
  for (let i = 0; i <= gridSize; i++) {
    let pos = i * cellSize + padding;
    svg += `
    <line x1="${pos}" y1="${padding}" x2="${pos}" y2="${height - padding}"/>
    <line x1="${padding}" y1="${pos}" x2="${width - padding}" y2="${pos}"/>`;
  }

  svg += `
  </g>`;

  // Add connections
  placedDots.forEach((connection, index) => {
    if (connection.length > 0) {
      let color = connectionColors[index];
      let colorStr = `rgb(${color.join(",")})`;

      svg += `
  <!-- Connection ${index + 1} -->
  <g stroke="${colorStr}" stroke-width="6" fill="${colorStr}">`;

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

          svg += `
    <path d="M ${x1a} ${y1a} C ${cp1ax} ${cp1ay} ${cp2ax} ${cp2ay} ${x2a} ${y2a} A ${r2} ${r2} 0 1 1 ${x2b} ${y2b} C ${cp2bx} ${cp2by} ${cp1bx} ${cp1by} ${x1b} ${y1b} A ${r1} ${r1} 0 1 1 ${x1a} ${y1a} Z"/>`;
        } else {
          // Linear connection
          svg += `
    <path d="M ${x1a} ${y1a} L ${x2a} ${y2a} A ${r2} ${r2} 0 1 1 ${x2b} ${y2b} L ${x1b} ${y1b} A ${r1} ${r1} 0 1 1 ${x1a} ${y1a} Z"/>`;
        }
      }

      // Add dots
      svg += `
  </g>
  <g stroke="${colorStr}" stroke-width="6" fill="white">`;
      connection.forEach((dot) => {
        let r = dot.size * cellSize;
        svg += `
    <circle cx="${dot.x}" cy="${dot.y}" r="${r / 2}"/>`;
      });
      svg += `
  </g>`;
    }
  });

  svg += `
</svg>`;

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
