function parseMxGraphXml(xml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");

    const cells = Array.from(xmlDoc.getElementsByTagName("mxCell")).map(cell => ({
        id: cell.getAttribute("id"),
        value: cell.getAttribute("value"),
        style: cell.getAttribute("style") || "",
        source: cell.getAttribute("source"),
        target: cell.getAttribute("target"),
        isEdge: cell.getAttribute("edge") === "1",
        isVertex: cell.getAttribute("vertex") === "1"
    }));

    const vertices = cells.filter(cell => cell.isVertex);
    const edges = cells.filter(cell => cell.isEdge);

    const graph = {};
    vertices.forEach(v => {
        graph[v.id] = { ...v, edges: [] };
    });

    edges.forEach(e => {
        if (graph[e.source]) {
            graph[e.source].edges.push(e.target);
        }
    });

    const startNode = vertices.find(v => (v.value || "").toLowerCase() === "start");
    if (!startNode) {
        console.error("❌ No 'Start' node found.");
        return "// Error: No 'Start' node found.";
    }

    const visited = new Set();
    const declaredVariables = new Set();
    let code = "";
    let indent = "    ";

    code += "#include <iostream>\nusing namespace std;\nint main() {\n";

    function extractVariables(expr) {
        const matches = expr.match(/[a-zA-Z_]\w*/g);
        if (matches) {
            matches.forEach(v => {
                if (!declaredVariables.has(v) && isNaN(v)) {
                    code += indent + `int ${v};\n`;
                    declaredVariables.add(v);
                }
            });
        }
    }

    function findConvergence(truePath, falsePath) {
        const visitedTrue = new Set();
        const queueTrue = [...truePath];
        while (queueTrue.length) {
            const id = queueTrue.shift();
            visitedTrue.add(id);
            graph[id]?.edges?.forEach(e => {
                if (!visitedTrue.has(e)) queueTrue.push(e);
            });
        }
        const queueFalse = [...falsePath];
        while (queueFalse.length) {
            const id = queueFalse.shift();
            if (visitedTrue.has(id)) return id;
            graph[id]?.edges?.forEach(e => {
                queueFalse.push(e);
            });
        }
        return null;
    }

    function traverse(nodeId, stopAt = null) {
        if (!nodeId || nodeId === stopAt || visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = graph[nodeId];
        if (!node) return;

        const value = (node.value || "").trim();
        const style = node.style;

        if (value.toLowerCase() === "start") {
            // skip
        } else if (value.toLowerCase() === "end") {
            // handled later
        } else if (style.includes("parallelogram")) {
            extractVariables(value);
            code += indent + `cin >> ${value};\n`;
        } else if (style.includes("trapezoid")) {
            code += indent + `cout << ${value} << endl;\n`;
        } else if (style.includes("rect")) {
            extractVariables(value);
            code += indent + value + ";\n";
        } else if (style.includes("rhombus")) {
            extractVariables(value);
            const trueBranch = node.edges[0];
            const falseBranch = node.edges[1];
            const endIf = findConvergence([trueBranch], [falseBranch]);

            code += indent + `if (${value}) {\n`;
            indent += "    ";
            traverse(trueBranch, endIf);
            indent = indent.slice(0, -4);

            code += indent + `} else {\n`;
            indent += "    ";
            traverse(falseBranch, endIf);
            indent = indent.slice(0, -4);

            code += indent + `}\n`;
            traverse(endIf);
            return;
        } else if (style.includes("hexagon")) {
            extractVariables(value);
            const backEdge = edges.find(e => e.target === nodeId && e.source !== nodeId);
            if (backEdge) {
                code += indent + `for(${value}) {\n`;
                const bodyStart = node.edges.find(id => id !== backEdge.source);
                if (bodyStart) {
                    indent += "    ";
                    traverse(bodyStart, nodeId);
                    indent = indent.slice(0, -4);
                }
                code += indent + `}\n`;
                const afterLoop = node.edges.find(t => t !== bodyStart);
                traverse(afterLoop);
                return;
            }
        }

        node.edges.forEach(e => traverse(e, stopAt));
    }

    traverse(startNode.id);
    code += indent + "return 0;\n";
    code += "}";

    return code;
}

window.parseMxGraphXml = parseMxGraphXml;
