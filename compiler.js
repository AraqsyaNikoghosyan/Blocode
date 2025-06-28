function toggleSidebar() {
    document.body.classList.toggle('open');
    codeEditor.setValue(parseMxGraphXml(getxml()));
    window.graph.setEnabled(!document.body.classList.contains('open'));
}

const sideWindow = document.querySelector('.side-window');
const resizer = document.querySelector('.resizer');

let isResizing = false;

resizer.addEventListener('mousedown', (event) => {
    isResizing = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
});

function resize(event) {
    if (isResizing) {
        let newWidth = window.innerWidth - event.clientX;
        if (newWidth > 200 && newWidth < window.innerWidth * 0.8) { // Set min/max width
            sideWindow.style.width = newWidth + 'px';
        }
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

function runCode() {
    const code = parseMxGraphXml(getxml());
    const userInput = document.getElementById("inputField").value; // Capture user input
    const outputConsole = document.getElementById("outputConsole");

    outputConsole.textContent = "Compiling and running...";

    fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": "2c2987f39bmsh6fd766dbafbebdep1562e3jsn3d8d4aa907d0", // Replace with your API key
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        },
        body: JSON.stringify({
            language_id: 54,  // C++ (GCC 9.2.0)
            source_code: code,
            stdin: userInput // Pass user input as stdin
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status && data.status.description) {
            switch (data.status.id) {
                case 3: // Success
                    outputConsole.textContent = data.stdout || "Execution finished without output.";
                    break;
                case 6: // Compilation Error
                    outputConsole.textContent = "Compilation Error:\n" + (data.compile_output || "Check your syntax.");
                    break;
                case 7: // Runtime Error
                    outputConsole.textContent = "Runtime Error:\n" + (data.stderr || "Something went wrong at runtime.");
                    break;
                case 8: // Time Limit Exceeded
                    outputConsole.textContent = "Error: Your code took too long to execute.";
                    break;
                default:
                    outputConsole.textContent = "Error: " + data.status.description;
            }
        } else if (data.message) {
            outputConsole.textContent = "API Error: " + data.message;
        } else {
            outputConsole.textContent = err.message;
        }
    })
    .catch(err => {
        outputConsole.textContent = "Network or API Error: " + err.message;
    });
}

