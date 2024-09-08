const form = document.getElementById('callBtn');

// フォームが存在するか確認
if (form) {
    const vscode = acquireVsCodeApi();
    form.addEventListener('click', (event) => {
        vscode.postMessage({ type: 'prompt', command: document.getElementById("prompt").value })
        document.getElementById("result").innerHTML = document.getElementById("prompt").value;
    });
}
