import * as vscode from 'vscode';
import * as tracker from '../implementations/impelmentation';

import {TrackerValue, TimeTrackingResultItem, TimeTrackingSummaryItem} from '../models/trackerValues';

export class TrackerItemTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    onDidChangeTreeData?: vscode.Event<void | vscode.TreeItem | null | undefined> | undefined;
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        return this.getChildrenItem(element);
    }
    
    async getChildrenItem(element?: vscode.TreeItem) : Promise<vscode.TreeItem[]>{
        if (!element){
            const items = await tracker.load();
            const results: vscode.TreeItem[] = items.map(i => new TimeTrackingSummaryItem(i.date, i.total, i.breakdowns));
            return results;
        }

        const child = element as TimeTrackingSummaryItem;
        const results: vscode.TreeItem[] = child.breakdown;
        return results;
    }
}