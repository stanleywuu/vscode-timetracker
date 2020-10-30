import * as vscode from 'vscode';
import * as impl from '../implementations/impelmentation';
import * as provider from '../implementations/trackeritemTreeProvider';

function initializeTree(context: vscode.ExtensionContext){
    const treeprovider = new provider.TrackerItemTreeProvider();
    const timerProvider = vscode.window.registerTreeDataProvider('today', treeprovider);
    const refreshCommand = vscode.commands.registerCommand('vstime.refresh', (c)=> { treeprovider.refresh();});

    context.subscriptions.push(timerProvider);
    context.subscriptions.push(refreshCommand);
}

export function initialize(context: vscode.ExtensionContext){
    
    initializeTracker(context);
    initializeTree(context);
    initializeContextCommands(context);

    let testCommand = vscode.commands.registerCommand('vstime.test', ((p)=> { impl.test();}));
    context.subscriptions.push(testCommand);
}

function initializeContextCommands(context: vscode.ExtensionContext){
    const exportcmd = vscode.commands.registerCommand('vstime.export', ((i)=>{}));
    context.subscriptions.push(exportcmd);
}

function initializeTracker(context: vscode.ExtensionContext){
    const statusBar = initializeStatusBar(context);
    const tracker = new impl.Tracker(statusBar);

    let trackStart = vscode.commands.registerCommand('vstime.start', ((p)=> {tracker.startTracker();}));
    let trackStop = vscode.commands.registerCommand('vstime.stop', (async ()=> {
        const results = await tracker.stopTracker();
        await impl.save(results);
        tracker.reset();
    }));

    let trackResume = vscode.commands.registerCommand('vstime.resume', (()=> {tracker.resumeTracker();}));
    let trackPause = vscode.commands.registerCommand('vstime.pause', (()=> {tracker.pauseTracker();}));
    
    context.subscriptions.push(trackStart);
    context.subscriptions.push(trackStop);
    context.subscriptions.push(trackResume);
    context.subscriptions.push(trackPause);

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => { 
        if (editor === vscode.window.activeTextEditor){
        tracker.trackChanges(editor?.document.uri.path ?? 'blank');}
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