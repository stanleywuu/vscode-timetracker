import * as vscode from 'vscode';
import * as trackerImpl from '../implementations/impelmentation';

import {TrackerValue, TimeTrackingResultItem, TimeTrackingItem, TimeTrackingBreakdownItem} from '../models/trackerValues';

export class TrackerItemTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null> = new vscode.EventEmitter<vscode.TreeItem | null>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | null > = this._onDidChangeTreeData.event;

    private tracker: trackerImpl.Tracker;
    private filter: (t: TimeTrackingResultItem) => boolean;

    constructor(tracker: trackerImpl.Tracker, filter?: (t: TimeTrackingResultItem)=>boolean)
    {
        this.tracker = tracker;

        this.filter = filter ? filter : (t: TimeTrackingResultItem)=> {
            const todayValue = trackerImpl.getToday().getTime();
            return t.date === todayValue;
        };
    }

    refresh() {
		this._onDidChangeTreeData.fire(null);
    }
    
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        if (element){
            return (element as TimeTrackingItem).children;
        }
        
        return this.getChildrenItem(element);
    }
    
    async getChildrenItem(element?: vscode.TreeItem) : Promise<vscode.TreeItem[]>{
        if (!element){
            const todayStr = trackerImpl.getToday().getTime();

            const items = 
                await (await trackerImpl.load())
                    .filter((t) => t.date === todayStr) ;

            const results: vscode.TreeItem[] = items.map(i => new TimeTrackingItem(i));
            const current: vscode.TreeItem[] = this.tracker.currentProgress.map(i => new TimeTrackingItem(i));

            return [...current,...results];
        }

        const child = element as TimeTrackingItem;
        const results: vscode.TreeItem[] = child.breakdown;
        return results;
    }
}