const vscode = acquireVsCodeApi();
const callBtn = document.getElementById('callBtn');
if (callBtn) {
  callBtn.addEventListener('click', (event) => {
    vscode.postMessage({ type: 'prompt', command: document.getElementById("prompt").value })
    document.getElementById("result").innerHTML = document.getElementById("prompt").value;
  });
}
