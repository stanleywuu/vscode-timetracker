import * as vscode from "vscode";
import * as impl from "../implementations/implementation";
import * as provider from "../implementations/trackeritemTreeProvider";
import { TimeTrackingResultItem } from "../models/trackerValues";
import * as reporting from "../implementations/reporting";

export function initialize(context: vscode.ExtensionContext): impl.Tracker {
  // register where we can keep our data
  impl.setStoragePath(context.globalStorageUri.fsPath);

  const tracker = initializeTracker(context);

  initializeTree(context, tracker);
  initializeContextCommands(context);

  return tracker;
}
const dayFilter = (t: TimeTrackingResultItem, days: number): boolean => {
  const today = impl.getToday();
  const todayVal = today.getTime();
  const targetDay = impl.getToday();
  targetDay.setDate(today.getDate() - days);

  const startDayVal = targetDay.getTime();
  return t.date >= startDayVal && t.date < todayVal;
};

const weeklyFilter = (t: TimeTrackingResultItem): boolean => {
  return dayFilter(t, 7);
};

const yesterdayFilter = (t: TimeTrackingResultItem): boolean => {
  return dayFilter(t, 1);
};

function initializeTree(
  context: vscode.ExtensionContext,
  tracker: impl.Tracker
) {
  const treeprovider = new provider.TrackerItemTreeProvider(tracker);
  const todayProvider = vscode.window.registerTreeDataProvider(
    "today",
    treeprovider
  );

  const weeklyTreeProvider = new provider.TrackerItemTreeProvider(
    new impl.EmptyTracker(),
    weeklyFilter
  );
  const weekProvider = vscode.window.registerTreeDataProvider(
    "thisweek",
    weeklyTreeProvider
  );

  const yesterdayTreeProvider = new provider.TrackerItemTreeProvider(
    new impl.EmptyTracker(),
    yesterdayFilter
  );
  const yesterdayProvider = vscode.window.registerTreeDataProvider(
    "yesterday",
    yesterdayTreeProvider
  );

  const refreshCommand = vscode.commands.registerCommand(
    "vstime.refresh",
    (c) => {
      treeprovider.refresh();
    }
  );

  context.subscriptions.push(todayProvider);
  context.subscriptions.push(weekProvider);
  context.subscriptions.push(yesterdayProvider);

  context.subscriptions.push(refreshCommand);
}

function initializeContextCommands(context: vscode.ExtensionContext) {
  const exportcmd = vscode.commands.registerCommand("vstime.export", (i) => {
    reporting.getReports();
  });
  const opencmd = vscode.commands.registerCommand("vstime.open", (i) => {
    impl.open();
  });
  const resetcmd = vscode.commands.registerCommand("vstime.reset", (i) => {
    impl.reset();
  });

  context.subscriptions.push(exportcmd);
  context.subscriptions.push(opencmd);
  context.subscriptions.push(resetcmd);
}

function initializeTracker(context: vscode.ExtensionContext): impl.Tracker {
  const statusBar = initializeStatusBar(context);
  const tracker = new impl.Tracker(statusBar);

  let trackStart = vscode.commands.registerCommand("vstime.start", (p) => {
    tracker.startTracker();
  });
  let trackStop = vscode.commands.registerCommand("vstime.stop", async () => {
    const results = await tracker.stopTracker();
    await impl.save(results);
    tracker.reset();
  });

  let trackResume = vscode.commands.registerCommand("vstime.resume", () => {
    tracker.resumeTracker();
  });
  let trackPause = vscode.commands.registerCommand("vstime.pause", () => {
    tracker.pauseTracker();
  });

  context.subscriptions.push(trackStart);
  context.subscriptions.push(trackStop);
  context.subscriptions.push(trackResume);
  context.subscriptions.push(trackPause);

  // Set up when user switches tabs on vscode
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor === vscode.window.activeTextEditor) {
        tracker.trackChanges(editor?.document.uri.path ?? "Untitled");
      }
    })
  );

  return tracker;
}

function initializeStatusBar(
  context: vscode.ExtensionContext
): vscode.StatusBarItem {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    3
  );
  statusBarItem.text = "Timer Off";
  statusBarItem.command = "vstime.start";
  statusBarItem.color = "#BEDEAD";
  context.subscriptions.push(statusBarItem);
  statusBarItem.show();

  return statusBarItem;
}
