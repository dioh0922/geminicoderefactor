// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  /*
  let editor = vscode.window.activeTextEditor; // エディタ取得
  let doc = editor?.document;            // ドキュメント取得
  let cur_selection = editor?.selection; // 選択範囲取得
  if(editor?.selection.isEmpty 
    && doc){         
    // 選択範囲が空であれば全てを選択範囲にする
    let startPos = new vscode.Position(0, 0);
    let endPos = new vscode.Position(doc.lineCount - 1, 10000);
    cur_selection = new vscode.Selection(startPos, endPos);
  }

  let text = doc ? doc.getText(cur_selection) : ''; //取得されたテキスト

  */

  /**
   * ここでテキストを加工します。
   **/

  /*
  //エディタ選択範囲にテキストを反映
  if(editor && cur_selection){
    editor.edit(edit => {
      edit.replace(cur_selection, text);
    });
  }
    */

  /*
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "geminicoderefactor" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('geminicoderefactor.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from geminiCodeRefactor!');
  });

  context.subscriptions.push(disposable);
  */

  const provider = new WebViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WebViewProvider.viewType, provider)
  )
}

// This method is called when your extension is deactivated
export function deactivate() {}


class WebViewProvider implements vscode.WebviewViewProvider{

  public static readonly viewType = 'geminicoderefactor.comment'

  private _view?: vscode.WebviewView;

  constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

  private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    const nonce = getNonce()

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>

        <textarea rows="10" id="prompt"></textarea>
        <button id="callBtn" class="add-color-button">Call</button>
        <textarea rows="10" id="result"></textarea>

        <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
        case 'prompt':
          {
            const config = vscode.workspace.getConfiguration('myExtension');
            const customSetting = config.get<string>('customSetting', 'defaultValue');
            const gemini = new GoogleGenerativeAI(customSetting);
            const model = gemini.getGenerativeModel({model:'gemini-1.5-flash'});
            const imputPrompt = data.command
            const result = ''
            model.generateContent(imputPrompt).then(res => {
              const response = res.response
              const text = response.text()
              vscode.window.showInformationMessage(text)
            })
            .catch(er => {
              vscode.window.showErrorMessage(er)
            })
                      break;
          }
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});
	}

}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}