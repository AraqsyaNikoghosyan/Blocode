// Initialize mxGraph
var container = document.getElementById('graphContainer');
var graph = new mxGraph(container);
var parent = graph.getDefaultParent();
var rubberband = new mxRubberband(graph);

// Disable unnecessary events and optimizations
graph.setAllowDanglingEdges(false);
graph.setCellsMovable(true);
graph.setConnectable(true);
graph.setAutoSizeCells(true);
graph.setCellsResizable(true);

// Allow text editing inside shapes
graph.setCellsEditable(true);
graph.setHtmlLabels(true);

// Enable edge selection & waypoints
graph.setCellsDisconnectable(true);
graph.setAllowLoops(false);
graph.setMultigraph(true);
graph.setDisconnectOnMove(false);
graph.setSplitEnabled(true);
graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';

// Custom Parallelogram Shape
function ParallelogramShape(bounds, style) {
    mxShape.call(this, bounds, style);
}
mxUtils.extend(ParallelogramShape, mxShape);

ParallelogramShape.prototype.paintBackground = function (c, x, y, w, h) {
    const skew = 0.3;
    const points = [
        new mxPoint(x + skew * h, y),
        new mxPoint(x + w, y),
        new mxPoint(x + w - skew * h, y + h),
        new mxPoint(x, y + h)
    ];

    c.begin();
    c.moveTo(points[0].x, points[0].y);
    points.forEach(point => c.lineTo(point.x, point.y));
    c.close();
    c.fillAndStroke();
};

mxCellRenderer.registerShape('parallelogram', ParallelogramShape);

// Custom Trapezoid Shape for Output
function TrapezoidShape() {
    mxShape.call(this);
}
mxUtils.extend(TrapezoidShape, mxShape);

TrapezoidShape.prototype.paintBackground = function (c, x, y, w, h) {
    c.begin();
    c.moveTo(x + w * 0.2, y);
    c.lineTo(x + w * 0.8, y);
    c.lineTo(x + w, y + h);
    c.lineTo(x, y + h);
    c.close();
    c.fillAndStroke();
};

mxCellRenderer.registerShape('trapezoid', TrapezoidShape);

// Function to create shapes
function createShape(type, x, y) {
    var style = `whiteSpace=wrap;html=1;fillColor=#555;strokeColor=#ffffff;fontColor=#ffffff;`;
    var shape;
    switch (type) {
        case 'ellipse':
            shape = graph.insertVertex(parent, null, 'Start/End', x, y, 100, 60, `shape=ellipse;` + style);
            break;
        case 'rect':
            shape = graph.insertVertex(parent, null, 'Action', x, y, 100, 60, `shape=rect;` + style);
            break;
        case 'parallelogram':
            shape = graph.insertVertex(parent, null, 'Input', x, y, 120, 60, `shape=parallelogram;` + style);
            break;
        case 'trapezoid':
            shape = graph.insertVertex(parent, null, 'Output', x, y, 120, 60, `shape=trapezoid;` + style);
            break;
        case 'rhombus':
            shape = graph.insertVertex(parent, null, 'If', x, y, 100, 60, `shape=rhombus;` + style);
            break;
        case 'hexagon':
            shape = graph.insertVertex(parent, null, 'Loop', x, y, 100, 60, `shape=hexagon;` + style);
            break;
    }
    return shape;
}

// Toolbar
function drawToolbarShapes() {
    var toolbar = document.getElementById('toolbar');
    var shapes = [
        { type: 'ellipse', bg: 'start.png' },
        { type: 'parallelogram', bg: 'input.png' },
        { type: 'trapezoid', bg: 'output.png' },
        { type: 'rect', bg: 'action.png' },
        { type: 'rhombus', bg: 'if.png' },
        { type: 'hexagon', bg: 'loop.png' }
    ];

    shapes.forEach(function (shapeData) {
        var shapeElement = document.createElement('div');
        shapeElement.className = 'toolbar-shape';
        shapeElement.setAttribute('draggable', true);
        shapeElement.setAttribute('data-shape', shapeData.type);

        shapeElement.style.backgroundImage = `url('img/${shapeData.bg}')`;
        shapeElement.style.backgroundSize = 'contain';
        shapeElement.style.backgroundRepeat = 'no-repeat';
        shapeElement.style.backgroundPosition = 'center';
        shapeElement.style.width = '70%';

        shapeElement.addEventListener('dragstart', function (event) {
            event.dataTransfer.setData('shapeType', shapeData.type);
        });

        toolbar.appendChild(shapeElement);
    });

    var buttonContainer = document.createElement('div');
    buttonContainer.id = 'buttonContainer';
    buttonContainer.className = 'button-container';

    var toggleGridBtn = document.createElement('button');
    toggleGridBtn.id = 'toggleGridBtn';
    toggleGridBtn.className = 'toolbar-button';
    toggleGridBtn.textContent = '';
    toggleGridBtn.style.backgroundImage = `url('img/grid.png')`;
    toggleGridBtn.style.backgroundSize = 'contain';
    toggleGridBtn.style.backgroundRepeat = 'no-repeat';
    toggleGridBtn.style.backgroundPosition = 'center';
    toggleGridBtn.addEventListener('click', toggleGrid);
    buttonContainer.appendChild(toggleGridBtn);

    var downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadBtn';
    downloadBtn.className = 'toolbar-button';
    downloadBtn.textContent = '';
    downloadBtn.style.backgroundImage = `url('img/save.png')`;
    downloadBtn.style.backgroundSize = 'contain';
    downloadBtn.style.backgroundRepeat = 'no-repeat';
    downloadBtn.style.backgroundPosition = 'center';
    downloadBtn.style.width = '70%';
    downloadBtn.addEventListener('click', downloadGraph);
    buttonContainer.appendChild(downloadBtn);

    var loadBtn = document.createElement('button');
    loadBtn.id = 'loadBtn';
    loadBtn.className = 'toolbar-button';
    loadBtn.textContent = '';
    loadBtn.style.backgroundImage = `url('img/load.png')`;
    loadBtn.style.backgroundSize = 'contain';
    loadBtn.style.backgroundRepeat = 'no-repeat';
    loadBtn.style.backgroundPosition = 'center';
    loadBtn.addEventListener('click', loadGraph);
    buttonContainer.appendChild(loadBtn);

    toolbar.appendChild(buttonContainer);
}

drawToolbarShapes();

// Drag & Drop Shapes
container.addEventListener('dragover', function (event) {
    event.preventDefault();
});

container.addEventListener('drop', function (event) {
    event.preventDefault();
    var shapeType = event.dataTransfer.getData('shapeType');
    var x = event.offsetX;
    var y = event.offsetY;
    createShape(shapeType, x, y);
});

// Keydown events
document.addEventListener('keydown', function (event) {
    var selectedCells = graph.getSelectionCells();

    if (selectedCells.length > 0) {
        if (event.key === "Delete") {
            graph.removeCells(selectedCells);
        } else if (event.key === "Backspace") {
            if (graph.cellEditor.isEditing()) {
                return;
            }
            graph.startEditingAtCell(selectedCells[0]);
            event.preventDefault();
        }
    }
});

// Enable click-based waypoint addition
graph.addListener(mxEvent.CLICK, function(sender, evt) {
    var cell = evt.getProperty('cell');
    var point = evt.getProperty('event');

    if (cell && cell.edge) {
        graph.getModel().beginUpdate();
        try {
            var geo = graph.getCellGeometry(cell);
            if (geo != null) {
                geo = geo.clone();
                if (!geo.points) {
                    geo.points = [];
                }
                geo.points.push(new mxPoint(point.graphX, point.graphY));
                graph.getModel().setGeometry(cell, geo);
            }
        } finally {
            graph.getModel().endUpdate();
        }
        evt.consume();
    }
});

// Enable edge bendpoints
graph.setCellsBendable(true);
graph.setConnectableEdges(true);
graph.setEdgeLabelsMovable(true);

graph.isEdgeValid = function (edge, source, target) {
    return true;
};

// Toggle grid visibility
var isGridVisible = true;
function toggleGrid() {
    isGridVisible = !isGridVisible;
    var gridContainer = document.getElementById('gridContainer');
    var toggleButton = document.getElementById('toggleGridBtn');
    if (isGridVisible) {
        gridContainer.style.display = 'block';
        drawGrid();
    } else {
        gridContainer.style.display = 'none';
    }
}

// Draw the grid lines
function drawGrid() {
    var gridContainer = document.getElementById('gridContainer');
    var gridSize = 25;
    var width = container.offsetWidth;
    var height = container.offsetHeight;

    gridContainer.innerHTML = '';

    for (var x = 0; x < width; x += gridSize) {
        var verticalLine = document.createElement('div');
        verticalLine.className = 'grid-line';
        verticalLine.style.height = height + 'px';
        verticalLine.style.width = '1px';
        verticalLine.style.left = x + 'px';
        gridContainer.appendChild(verticalLine);
    }

    for (var y = 0; y < height; y += gridSize) {
        var horizontalLine = document.createElement('div');
        horizontalLine.className = 'grid-line';
        horizontalLine.style.width = width + 'px';
        horizontalLine.style.height = '1px';
        horizontalLine.style.top = y + 'px';
        gridContainer.appendChild(horizontalLine);
    }
}

drawGrid();

// Undo/Redo
const undoManager = new mxUndoManager();
graph.getModel().addListener(mxEvent.CHANGE, function(sender, event) {
    undoManager.undoableEditHappened(event.getProperty('edit'));
});

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (undoManager.canUndo()) {
            undoManager.undo();
            console.log('Undo performed');
        }
        event.preventDefault();
    }
});

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
        if (undoManager.canRedo()) {
            undoManager.redo();
            console.log('Redo performed');
        }
        event.preventDefault();
    }
});

// Copy/Cut/Paste
let copiedCells = [];
let cutCells = [];

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const selectedCells = graph.getSelectionCells();
        if (selectedCells.length > 0) {
            copiedCells = selectedCells.map(cell => cell.clone());
            cutCells = [];
            console.log('Shape copied:', copiedCells);
            event.preventDefault();
        }
    }
});

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        const selectedCells = graph.getSelectionCells();
        if (selectedCells.length > 0) {
            cutCells = selectedCells.map(cell => cell.clone());
            graph.removeCells(selectedCells);
            copiedCells = [];
            console.log('Shape cut:', cutCells);
            event.preventDefault();
        }
    }
});

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        let cellsToPaste = copiedCells.length > 0 ? copiedCells : cutCells;
        if (cellsToPaste.length > 0) {
            const parent = graph.getDefaultParent();
            let offset = 1;

            graph.getModel().beginUpdate();
            try {
                cellsToPaste.forEach(cell => {
                    const geometry = cell.getGeometry();
                    const newGeometry = new mxGeometry(geometry.x + offset, geometry.y + offset, geometry.width, geometry.height);
                    cell.setGeometry(newGeometry);
                    graph.importCells([cell], newGeometry.x, newGeometry.y, parent);
                });
                if (cutCells.length > 0) {
                    cutCells = [];
                }
            } finally {
                graph.getModel().endUpdate();
            }
            event.preventDefault();
        }
    }
});

// Duplicate
document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        const selectedCells = graph.getSelectionCells();
        if (selectedCells.length > 0) {
            const parent = graph.getDefaultParent();
            let offset = 1;

            graph.getModel().beginUpdate();
            try {
                selectedCells.forEach(cell => {
                    const geometry = cell.getGeometry();
                    const newGeometry = new mxGeometry(geometry.x + offset, geometry.y + offset, geometry.width, geometry.height);
                    const newCell = cell.clone();
                    newCell.setGeometry(newGeometry);
                    graph.importCells([newCell], newGeometry.x, newGeometry.y, parent);
                });
            } finally {
                graph.getModel().endUpdate();
            }
            event.preventDefault();
        }
    }
});

// Minimum shape size
const minWidth = 100;
const minHeight = 50;

graph.getPreferredSizeForCell = function(cell) {
    const size = mxGraph.prototype.getPreferredSizeForCell.apply(this, arguments);
    size.width = Math.max(size.width, minWidth);
    size.height = Math.max(size.height, minHeight);
    return size;
};

graph.resizeCell = function(cell, bounds, recurse) {
    if (bounds.width < minWidth) bounds.width = minWidth;
    if (bounds.height < minHeight) bounds.height = minHeight;
    mxGraph.prototype.resizeCell.call(this, cell, bounds, recurse);
};


function downloadGraph() {
    const xml = getxml();
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.xml';
    a.click();
    URL.revokeObjectURL(url);
}

function loadGraph() {
    document.getElementById('fileInput').click();
}

// CodeMirror initialization
let codeEditor;

function initCodeEditor() {
    codeEditor = CodeMirror(document.getElementById('codeEditor'), {
        value: '',
        mode: 'text/x-c++src',
        theme: 'default',
        lineNumbers: true,
        tabSize: 4,
        indentWithTabs: true,
        lineWrapping: true
    });
}

function updateCodeEditor(code) {
    if (codeEditor) {
        codeEditor.setValue(code || '');
    }
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const ixml = e.target.result;
            try {
                const doc = mxUtils.parseXml(ixml);
                const codec = new mxCodec(doc);
                codec.decode(doc.documentElement, graph.getModel());
                // Restore graph settings
                parent = graph.getDefaultParent(); // Update parent
                graph.setEnabled(true);
                graph.setCellsMovable(true);
                graph.setConnectable(true);
                graph.setAutoSizeCells(true);
                graph.setCellsResizable(true);
                graph.setCellsEditable(true);
                graph.setHtmlLabels(true);
                graph.setCellsDisconnectable(true);
                graph.setAllowLoops(false);
                graph.setMultigraph(true);
                graph.setDisconnectOnMove(false);
                graph.setSplitEnabled(true);
                graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';
                // Update editor
                const code = parseMxGraphXml(ixml);
                updateCodeEditor(code);
            } catch (error) {
                console.error('Invalid XML file:', error);
                alert('Failed to load flowchart: Invalid XML file.');
            }
        };
        reader.readAsText(file);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initCodeEditor();
    updateCodeEditor('');
});

function getxml() {
    const encoder = new mxCodec();
    const node = encoder.encode(graph.getModel());
    const xml = mxUtils.getXml(node);
    return xml;
}

window.getxml = getxml;