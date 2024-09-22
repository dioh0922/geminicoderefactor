// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('geminicoderefactor.helloWorld', () => {
    const editor = vscode.window.activeTextEditor
    const doc = editor!.document
    const selection = editor!.selection
    if(!editor || !doc || selection?.isEmpty){
      vscode.window.showErrorMessage('選択範囲が空です')
    }else{
      const currentCode = doc.getText(selection)
      callGeminiApi(currentCode + '\n上記のコードにjsDocのスタイルでコメントを書いてください。authorを追加して「GeminiApi generated」と追加してください。回答にはコメント内容のみを含めてください').then((res: any)=> {
        const responseRegx = new RegExp(/\/\*\*([\s\S]*?)\*\//)
        const match = res.match(responseRegx)
        if(match){
          // コメント部分 /* -- */があれば適用する
          editor.edit(edit => {
            edit.replace(selection, match[0] + '\n' + currentCode)
          })

        }else{
          vscode.window.showErrorMessage('コメントが見つかりません\n' + res)
        }
      })
    }
  })
  context.subscriptions.push(disposable)

  const provider = new WebViewProvider(context.extensionUri)
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
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'))

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'))
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'))
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'))
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

        <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
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
		}

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'prompt':
          const text = callGeminiApi(data.command + '\n回答は日本語で返してください。').then((res: string) => {
            vscode.window.showInformationMessage(res)
          })
					break
        case 'colorSelected':
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`))
          break
      }
		});
	}

}

async function callGeminiApi(prompt: string): Promise<string>{
  const config = vscode.workspace.getConfiguration('myExtension')
  const customSetting = config.get<string>('customSetting', 'defaultValue')
  const gemini = new GoogleGenerativeAI(customSetting)
  const model = gemini.getGenerativeModel({model:'gemini-1.5-flash'})
  const inputPrompt = prompt
  let result = ''
  try{
    result = (await model.generateContent(inputPrompt)).response.text()
  }catch(e: any){
    vscode.window.showErrorMessage(e)
  }
  return result
}

function getNonce() {
	let text = ''
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}