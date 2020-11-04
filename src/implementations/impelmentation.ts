import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TrackerValue, TimeTrackingResultItem } from "../models/trackerValues";

interface KeyNumberPair {
  [key: string]: TrackerValue;
}

const filePath = function(){
  return storagePath;
};

let storagePath: string = '';

export async function test () {
    console.log(vscode.env.appName);
    console.log(vscode.env.appRoot);
    const config = vscode.workspace.getConfiguration("vstime");
    
    fs.writeFileSync(filePath(), "[]");
}

export function setStoragePath(contextPath: string){
  const targetPath = path.join(contextPath,'.vstime');
  if (!fs.existsSync(path.dirname(targetPath))){ fs.mkdirSync(path.dirname(targetPath));}
  storagePath = targetPath;
}

export async function save(timeTrackingDetail: TimeTrackingResultItem) {
  const activitiesTracked = await load();
  const full = [...activitiesTracked, timeTrackingDetail];

  await fs.writeFile(filePath(), JSON.stringify(full), null, (()=>{}));
}

export async function load(): Promise<TimeTrackingResultItem[]> {
  const file = filePath();
  if (fs.existsSync(file))
  {
    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content === '' ? '[]' : content);
  }
  return [];
}

export class Tracker {
  private statusItem: vscode.StatusBarItem;
  private timerId: NodeJS.Timeout | null;
  private current: TrackerValue;
  private trackedFiles: KeyNumberPair;
  private comment: string | undefined;
  private currentFile: string;
  private logs: string[];

  isTracking: boolean;

  constructor(statusItem: vscode.StatusBarItem) {
    this.statusItem = statusItem;
    this.timerId = null;
    this.currentFile = "";
    this.trackedFiles = {};
    this.current = new TrackerValue();
    this.logs = [];

    this.isTracking = false;
  }

  get currentProgress() : TimeTrackingResultItem[]{
    if (!this.isTracking) {
      return [];
    }

    return [
       {
        date: getToday().getTime(),
        comment: 'Current',
        notes: '',
        total: this.current,
        breakdowns: this.getBreakdownInfo(),
        logs: []
      }
    ];
  }

  async startTracker() {
    this.comment = await vscode.window.showInputBox({
      prompt: "What are you working on?",
    });
    this.start();
    this.trackCurrentFile();
  }

  resumeTracker() {
    this.logs.push(`resumed at : ${Date.now()}`);
    const currentFile = vscode.window.activeTextEditor?.document.uri.path ?? 'Untitled';
    this.trackChanges(currentFile);
    this.start();
  }

  pauseTracker() {
    this.isTracking = false;
    this.statusItem.command = "vstime.resume";
    this.statusItem.text = "Timer Paused";

    this.logs.push(`paused at : ${Date.now()}`);

    this.stopTimer();
  }


  reset(){
      this.isTracking = false;
      this.current = new TrackerValue();
  }

  async stopTracker(): Promise<TimeTrackingResultItem> {
    this.isTracking = false;

    this.stopTimer();

    const finalComment = await vscode.window.showInputBox({
      prompt: "Thoughts, comments, notes",
    });
    this.logs.push(`stopped at : ${Date.now()}`);

    this.statusItem.command = "vstime.start";
    this.statusItem.text = "Timer Off";
    // log to file
    const values = this.getBreakdownInfo();

    const final: TimeTrackingResultItem = {
      date: getToday().getTime(),
      comment: this.comment,
      notes: finalComment,
      total: this.current,
      breakdowns: values,
      logs: this.logs,
    };

    console.log(final);

    return final;
  }

  private getBreakdownInfo() {
    return Object.keys(this.trackedFiles)
      .map((k) => {
        const key = path.parse(k).name;
        const extension = path.parse(k).ext;
        return {
          key: `${key}${extension}`,
          value: this.trackedFiles[k]
        };
      })
      .filter(f => f.value.total > 0);
  }

  trackChanges(file: string) {
    if (!this.isTracking) {
      return;
    }

    const lastTracker =
      this.trackedFiles[this.currentFile] ?? new TrackerValue();
    // if deactivating, update lastTime.update
    // if activating, call resume
    this.logs.push(`stopped at ${Date.now()}`);
    lastTracker.update();
    this.trackedFiles[this.currentFile] = lastTracker;

    const tracker = this.trackedFiles[file] ?? new TrackerValue();
    this.trackedFiles[file] = tracker;

    this.logs.push(`working with ${file} at ${Date.now()}`);
    this.currentFile = file;
    tracker.resume();
  }
  
  private trackCurrentFile(){
    this.currentFile = vscode.window.activeTextEditor?.document.uri.path ?? "Untitled";
    this.trackChanges(this.currentFile);
  }
  
  private stopTimer() {
    this.trackCurrentFile();

    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private start() {
    this.isTracking = true;
    this.trackCurrentFile();

    this.current.resume();
    this.statusItem.command = "vstime.pause";

    this.timerId = setInterval(() => {
      const now = Date.now();
      const total = this.current.update();
      this.statusItem.text = `${formatTime(total)}`;
    }, 1000);
  }

}

export class EmptyTracker extends Tracker{
  constructor() {
    super(vscode.window.createStatusBarItem());
  }
}

  export function getToday() : Date{
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  export function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 60 / 60 / 1000);
    const minutes = Math.floor(seconds / 60 / 1000) - hours * 60;
    const secondsLeft = Math.round(seconds/1000 - hours * 60 * 60 - minutes * 60);

    const hourStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = secondsLeft.toString().padStart(2, '0');

    return `${hourStr}:${minutesStr}:${secondsStr}`;
  }

