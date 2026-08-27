const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let currentPanel = undefined;

  let disposable = vscode.commands.registerCommand('callGuide.openEditor', function () {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (currentPanel) {
      // すでに開いている場合は手前に表示
      currentPanel.reveal(columnToShowIn);
    } else {
      // 新しいWebviewパネルを作成
      currentPanel = vscode.window.createWebviewPanel(
        'callGuideEditor',
        '🎵 コールタイミングメーカー',
        vscode.ViewColumn.Beside, // 横並びで開く
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, '..'))
          ]
        }
      );

      // HTMLの読み込み（複数パス候補に対応）
      let editorHtmlPath = path.join(context.extensionPath, '..', 'tools', 'editor.html');
      if (!fs.existsSync(editorHtmlPath)) {
        editorHtmlPath = path.join(context.extensionPath, 'editor.html');
      }
      if (!fs.existsSync(editorHtmlPath)) {
        editorHtmlPath = path.join(context.extensionPath, 'tools', 'editor.html');
      }

      let htmlContent = '';
      try {
        htmlContent = fs.readFileSync(editorHtmlPath, 'utf8');
      } catch (err) {
        htmlContent = `<h1>Error loading editor.html: ${err.message}</h1>`;
      }

      currentPanel.webview.html = htmlContent;

      // Webviewからのメッセージ受信（エディタ挿入など）
      currentPanel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'insertCode':
              insertCodeToEditor(message.text);
              return;
          }
        },
        undefined,
        context.subscriptions
      );

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );
    }
  });

  context.subscriptions.push(disposable);
}

/**
 * 現在アクティブなエディタのカーソル位置にコードを挿入
 * @param {string} text 
 */
function insertCodeToEditor(text) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('コードを挿入する対象のエディタが開かれていません。');
    return;
  }

  editor.edit(editBuilder => {
    // 選択範囲がある場合は置換、ない場合はカーソル位置に挿入
    if (!editor.selection.isEmpty) {
      editBuilder.replace(editor.selection, text);
    } else {
      editBuilder.insert(editor.selection.active, text);
    }
  }).then(success => {
    if (success) {
      vscode.window.showInformationMessage('辞書コードをエディタに挿入しました！');
    }
  });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
