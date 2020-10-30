import * as vscode from 'vscode';
import * as tracker from '../implementations/impelmentation';

import {TrackerValue, TimeTrackingResultItem, TimeTrackingItem} from '../models/trackerValues';

export class TrackerItemTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null> = new vscode.EventEmitter<vscode.TreeItem | null>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | null > = this._onDidChangeTreeData.event;

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
            const todayStr = tracker.getToday().getTime().toString();

            const items = 
                await (await tracker.load())
                    .filter((t) => t.date === todayStr) ;

            const results: vscode.TreeItem[] = items.map(i => new TimeTrackingItem(i));
            return results;
        }

        const child = element as TimeTrackingItem;
        const results: vscode.TreeItem[] = child.breakdown;
        return results;
    }
}