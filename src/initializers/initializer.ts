import * as vscode from 'vscode';
import * as impl from '../implementations/impelmentation';

export function initializeTracker(context: vscode.ExtensionContext){
    const statusBar = initializeStatusBar(context);
    const tracker = new impl.Tracker(statusBar);

    let trackStart = vscode.commands.registerCommand('vstime.start', ((p)=> {tracker.startTracker();}));
    let trackStop = vscode.commands.registerCommand('vstime.stop', (()=> {tracker.stopTracker();}));
    let trackResume = vscode.commands.registerCommand('vstime.resume', (()=> {tracker.resumeTracker();}));
    let trackPause = vscode.commands.registerCommand('vstime.pause', (()=> {tracker.pauseTracker();}));
    
    context.subscriptions.push(trackStart);
    context.subscriptions.push(trackStop);
    context.subscriptions.push(trackResume);
    context.subscriptions.push(trackPause);

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => { 
        if (editor === vscode.window.activeTextEditor){
        tracker.trackChanges(editor?.document.uri.path ?? '');}
    }));
}

 function initializeStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem{
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3);
    statusBarItem.text = 'Timer Off';
    statusBarItem.command = 'vstime.start';
    statusBarItem.color = '#BEDEAD';
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();

    return statusBarItem;
}