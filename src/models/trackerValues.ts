import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { formatTime } from "../implementations/impelmentation";

export class TrackerValue{
    total: number;
    lastTrackedAt: number;

    constructor(){
        this.total = -1;
        this.lastTrackedAt = Date.now();
    }

    update() : number {
        const now = Date.now();
        const difference = now - this.lastTrackedAt;
        this.total += difference;
        this.lastTrackedAt = now;

        return this.total;
    }
    
    resume(){
        this.lastTrackedAt = Date.now();
    }

    reset(){
        this.total = -1;
        this.lastTrackedAt = -1;
    }
};


export interface TimeTrackingResultItem{
    date: number,
    comment: string | undefined,
    notes: string | undefined,
    total: TrackerValue,
    breakdowns: {key: string, value: TrackerValue}[]
    logs: string[]
}

export class TimeTrackingItem extends TreeItem implements IHiearchicalNode{
    private date: number;
    private value: TrackerValue;
    private breakdowns: TimeTrackingBreakdownItem[];
    
    children: TreeItem[] = [];

    get breakdown(): TimeTrackingBreakdownItem[] {
        return this.breakdowns;
    }

    constructor(item: TimeTrackingResultItem)
    {
        super('', TreeItemCollapsibleState.Collapsed);
        this.date = item.date;
        this.value = item.total;

        this.breakdowns = item.breakdowns.map(c =>{
            return new TimeTrackingBreakdownItem(c.key, c.value);
        });
        
        const defaultComment = new Date(item.date).toLocaleDateString();
        this.label = item.comment ? item.comment === '' ? defaultComment : item.comment
            : defaultComment;
        this.children = [this.summary(item), ...this.breakdowns];
    }

    summary(item: TimeTrackingResultItem) : TimeTrackingSummaryItem {
        return new TimeTrackingSummaryItem(item.comment ?? "Activity", item.total);
    }
}

export class TimeTrackingBreakdownItem extends TreeItem{
    private value: TrackerValue;

    constructor(detail: string, value: TrackerValue){
        super(detail);
        this.value = value;

        this.label = `${detail}: ${formatTime(value.total)}`;
        this.contextValue = 'breakdown';
    }
}

export class TimeTrackingSummaryItem extends TreeItem{
    constructor(title: string, value: TrackerValue){
        super(title, TreeItemCollapsibleState.None);

        this.contextValue = 'summary';
        this.label = `Total: ${formatTime(value.total)}`;
    }
}

export interface IHiearchicalNode{
    children: TreeItem[]
}
