let gridSize = 15;
let cellSize;
let padding = 100;
let dotSize = 1; // Start with the smallest dot size
let placedDots = []; // This will now be an array of arrays
let currentConnectionIndex = 0; // Index to track the current connection
let strokeColor = [0, 0, 255]; // Default color is blue
let isAnimating = false; // Flag to control animation
let animationFrames = []; // Array to store animation frames
let frameIndex = 0; // Current frame index for animation

function setup() {
  strokeCap(ROUND);
  createCanvas(600 + padding * 2, 600 + padding * 2); // Larger artboard
  cellSize = (width - padding * 2) / gridSize; // Adjust cell size for the new grid
  noFill();
  placedDots.push([]); // Initialize with the first connection
}

function draw() {
  background(245);

  if (isAnimating) {
    // Display the current frame of the animation
    image(animationFrames[frameIndex], 0, 0);
    frameIndex = (frameIndex + 1) % animationFrames.length; // Loop through frames
  } else {
    // Draw the static grid and connections
    drawGrid();

    // Draw all existing connections and dots first
    for (let i = 0; i < placedDots.length; i++) {
      if (i !== currentConnectionIndex) {
        drawConnection(placedDots[i]);
      }
    }

    // Draw the current connection being worked on (including preview)
    if (placedDots[currentConnectionIndex].length > 0) {
      drawConnection(placedDots[currentConnectionIndex]);
    }

    drawPreview(); // Draw the preview last to ensure it's on top
  }
}

function drawGrid() {
  stroke(180);
  strokeWeight(0.5);
  for (let i = 0; i <= gridSize; i++) {
    let pos = i * cellSize + padding;
    line(pos, padding, pos, height - padding);
    line(padding, pos, width - padding, pos);
  }
}

function drawConnection(connection) {
  noStroke();
  stroke(strokeColor); // Use the current stroke color
  strokeWeight(6); // Set the stroke weight to 6px
  fill(strokeColor);

  // Draw the tangent lines for the connection
  for (let i = 0; i < connection.length - 1; i++) {
    let d1 = connection[i];
    let d2 = connection[i + 1];
    drawTangentLines(d1, d2);
  }

  // Draw the dots for the connection
  stroke(strokeColor); // Use the current stroke color
  strokeWeight(6); // Set the stroke weight to 6px
  fill(255); // Set the fill color to white
  for (let dot of connection) {
    drawDot(dot.x, dot.y, dot.size);
  }
}

function drawTangentLines(d1, d2) {
  let x1 = d1.x;
  let y1 = d1.y;
  let x2 = d2.x;
  let y2 = d2.y;

  let r1 = (d1.size * cellSize) / 2;
  let r2 = (d2.size * cellSize) / 2;

  // Calculate the angle between the two circles
  let angle = atan2(y2 - y1, x2 - x1);
  let perpAngle = angle + HALF_PI;

  // Calculate the tangent points without offset
  let x1a = x1 + cos(perpAngle) * r1;
  let y1a = y1 + sin(perpAngle) * r1;
  let x1b = x1 - cos(perpAngle) * r1;
  let y1b = y1 - sin(perpAngle) * r1;

  let x2a = x2 + cos(perpAngle) * r2;
  let y2a = y2 + sin(perpAngle) * r2;
  let x2b = x2 - cos(perpAngle) * r2;
  let y2b = y2 - sin(perpAngle) * r2;

  // Draw the connecting shape
  beginShape();
  vertex(x1a, y1a);
  vertex(x2a, y2a);
  // Add a half-circle at the end
  for (let a = perpAngle; a <= perpAngle + PI; a += 0.1) {
    let x = x2 + cos(a) * r2;
    let y = y2 + sin(a) * r2;
    vertex(x, y);
  }
  vertex(x2b, y2b);
  vertex(x1b, y1b);
  // Add a half-circle at the start
  for (let a = perpAngle + PI; a <= perpAngle + TWO_PI; a += 0.1) {
    let x = x1 + cos(a) * r1;
    let y = y1 + sin(a) * r1;
    vertex(x, y);
  }
  endShape(CLOSE);
}

function drawPreview() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
    noStroke();
    fill(0, 50);
    drawDot(mouseX, mouseY, dotSize);

    // Draw preview tangent lines if there is at least one dot placed
    let currentConnection = placedDots[currentConnectionIndex];
    if (currentConnection.length > 0) {
      let lastDot = currentConnection[currentConnection.length - 1];
      let previewDot = { x: mouseX, y: mouseY, size: dotSize };
      drawTangentLines(lastDot, previewDot);
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
    return [gx * cellSize + padding + cellSize / 2, gy * cellSize + padding + cellSize / 2];
  }
  return [null, null];
}

function mousePressed() {
  let [gx, gy] = getGridMousePos();
  if (gx !== null && gy !== null) {
    placedDots[currentConnectionIndex].push({ x: gx, y: gy, size: dotSize });
  }
}

function keyPressed() {
  if (key === 'C' || key === 'c') {
    placedDots = [[]]; // Reset all connections
    currentConnectionIndex = 0;
  } else if (key === 'w') {
    dotSize += 1;
    dotSize = constrain(dotSize, 1, 6); // Allow dot size up to 6
  } else if (key === 's') {
    dotSize -= 1;
    dotSize = constrain(dotSize, 1, 6); // Allow dot size up to 6
  } else if (key === ' ') { // Spacebar pressed
    currentConnectionIndex++; // Move to the next connection
    placedDots.push([]); // Start a new connection
  } else if (key === 'r' || key === 'R') { // 'r' key pressed
    generateRandomConnections();
  } else if (key === '1') { // Switch to red
    strokeColor = [255, 0, 0];
  } else if (key === '2') { // Switch to green
    strokeColor = [0, 255, 0];
  } else if (key === '3') { // Switch to black
    strokeColor = [0, 0, 0];
  } else if (key === 'p' || key === 'P') { // Save image with timestamp
    saveImageWithTimestamp();
  } else if (key === 'z' || key === 'Z') { // Export 10x10 grid of variations
    exportGridOfVariations();
  } else if (key === 'u' || key === 'U') { // Generate and play animation
    generateAnimation();
  }
}

function mouseWheel(event) {
  // Adjust dot size based on the scroll direction
  if (event.delta > 0) {
    dotSize += 1; // Scroll up, increase size
  } else {
    dotSize -= 1; // Scroll down, decrease size
  }
  // Constrain the dot size between 1 and 6
  dotSize = constrain(dotSize, 1, 6);
  return false; // Prevent default scrolling behavior
}

function generateRandomConnections(density = 1) {
  placedDots = []; // Clear existing connections
  currentConnectionIndex = 0;

  // Adjust the number of connections and dots based on density
  let numConnections = int(map(density, 1, 100, 2, 10)); // Increase connections with density
  for (let i = 0; i < numConnections; i++) {
    placedDots.push([]); // Start a new connection
    let numDots = int(map(density, 1, 100, 2, 8)); // Increase dots per connection with density
    for (let j = 0; j < numDots; j++) {
      let gx = int(random(0, gridSize)) * cellSize + padding + cellSize / 2;
      let gy = int(random(0, gridSize)) * cellSize + padding + cellSize / 2;
      let size = int(random(1, 5)); // Random dot size (1 to 6)
      placedDots[i].push({ x: gx, y: gy, size: size });
    }
  }
}

function saveImageWithTimestamp() {
  let timestamp = year() + "-" + month() + "-" + day() + "_" + hour() + "-" + minute() + "-" + second();
  saveCanvas('artwork_' + timestamp, 'png');
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
      let density = map(row * gridCols + col, 0, gridRows * gridCols - 1, 1, 100);

      // Generate random connections with the current density
      generateRandomConnections(density);

      // Draw the variation onto the grid buffer
      gridBuffer.push();
      gridBuffer.translate(col * (variationWidth + gutter) + gutter, row * (variationHeight + gutter) + gutter);
      gridBuffer.scale(variationWidth / (width - padding * 2), variationHeight / (height - padding * 2));
      drawGridOnBuffer(gridBuffer);
      for (let connection of placedDots) {
        drawConnectionOnBuffer(gridBuffer, connection);
      }
      gridBuffer.pop();
    }
  }

  // Save the grid as an image
  let timestamp = year() + "-" + month() + "-" + day() + "_" + hour() + "-" + minute() + "-" + second();
  gridBuffer.save('grid_variations_' + timestamp + '.png');
}

function generateAnimation() {
  isAnimating = true;
  animationFrames = []; // Clear previous frames
  frameIndex = 0; // Reset frame index

  // Generate frames with increasing density
  for (let density = 1; density <= 100; density += 5) {
    generateRandomConnections(density);

    // Create a frame and draw the current state
    let frame = createGraphics(width, height);
    frame.background(245);
    drawGridOnBuffer(frame);
    for (let connection of placedDots) {
      drawConnectionOnBuffer(frame, connection);
    }
    animationFrames.push(frame);
  }
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

function drawConnectionOnBuffer(buffer, connection) {
  buffer.noStroke();
  buffer.stroke(strokeColor); // Use the current stroke color
  buffer.strokeWeight(6); // Set the stroke weight to 6px
  buffer.fill(strokeColor);

  // Draw the tangent lines for the connection
  for (let i = 0; i < connection.length - 1; i++) {
    let d1 = connection[i];
    let d2 = connection[i + 1];
    drawTangentLinesOnBuffer(buffer, d1, d2);
  }

  // Draw the dots for the connection
  buffer.stroke(strokeColor); // Use the current stroke color
  buffer.strokeWeight(6); // Set the stroke weight to 6px
  buffer.fill(255); // Set the fill color to white
  for (let dot of connection) {
    drawDotOnBuffer(buffer, dot.x, dot.y, dot.size);
  }
}

function drawTangentLinesOnBuffer(buffer, d1, d2) {
  let x1 = d1.x;
  let y1 = d1.y;
  let x2 = d2.x;
  let y2 = d2.y;

  let r1 = (d1.size * cellSize) / 2;
  let r2 = (d2.size * cellSize) / 2;

  // Calculate the angle between the two circles
  let angle = atan2(y2 - y1, x2 - x1);
  let perpAngle = angle + HALF_PI;

  // Calculate the tangent points without offset
  let x1a = x1 + cos(perpAngle) * r1;
  let y1a = y1 + sin(perpAngle) * r1;
  let x1b = x1 - cos(perpAngle) * r1;
  let y1b = y1 - sin(perpAngle) * r1;

  let x2a = x2 + cos(perpAngle) * r2;
  let y2a = y2 + sin(perpAngle) * r2;
  let x2b = x2 - cos(perpAngle) * r2;
  let y2b = y2 - sin(perpAngle) * r2;

  // Draw the connecting shape
  buffer.beginShape();
  buffer.vertex(x1a, y1a);
  buffer.vertex(x2a, y2a);
  // Add a half-circle at the end
  for (let a = perpAngle; a <= perpAngle + PI; a += 0.1) {
    let x = x2 + cos(a) * r2;
    let y = y2 + sin(a) * r2;
    buffer.vertex(x, y);
  }
  buffer.vertex(x2b, y2b);
  buffer.vertex(x1b, y1b);
  // Add a half-circle at the start
  for (let a = perpAngle + PI; a <= perpAngle + TWO_PI; a += 0.1) {
    let x = x1 + cos(a) * r1;
    let y = y1 + sin(a) * r1;
    buffer.vertex(x, y);
  }
  buffer.endShape(CLOSE);
}

function drawDotOnBuffer(buffer, x, y, size) {
  let r = size * cellSize;
  buffer.ellipse(x, y, r);
}