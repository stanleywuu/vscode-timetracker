import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TrackerValue, TimeTrackingResultItem } from "../models/trackerValues";

interface KeyNumberPair {
  [key: string]: TrackerValue;
}
const filePath: string = '.vstime';

export async function test () {
    fs.writeFileSync("vstime.txt", "hi");
}

export async function save(timeTrackingDetail: TimeTrackingResultItem) {
  const activitiesTracked = await load();
  const full = [...activitiesTracked, timeTrackingDetail];

  await fs.writeFile(filePath, JSON.stringify(full), null, (()=>{}));
}

export async function load(): Promise<TimeTrackingResultItem[]> {
  const file = filePath;
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

  async startTracker() {
    this.comment = await vscode.window.showInputBox({
      prompt: "What are you working on?",
    });
    this.logs.push(`started at : ${Date.now()}`);
    this.start();
  }

  resumeTracker() {
    this.logs.push(`resumed at : ${Date.now()}`);
    const currentFile = vscode.window.activeTextEditor?.document.uri.path ?? 'blank';
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
    const values = Object.keys(this.trackedFiles)
    .map((k) => {
      return { key: path.parse(k).name, value: this.trackedFiles[k] };
    })
    .filter(f => f.value.total > 0);

    const final: TimeTrackingResultItem = {
      date: getToday().getTime().toString(),
      comment: this.comment,
      notes: finalComment,
      total: this.current,
      breakdowns: values,
      logs: this.logs,
    };

    console.log(final);

    return final;
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
    this.currentFile = vscode.window.activeTextEditor?.document.uri.path ?? "blank";
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
      this.statusItem.text = `${formatTime(total / 1000)}`;
    }, 1000);
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

