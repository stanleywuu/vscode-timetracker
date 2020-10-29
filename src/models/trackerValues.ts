import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Tracker } from "../implementations/impelmentation";

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
    date: string,
    comment: string | undefined,
    total: TrackerValue,
    breakdowns: {key: string, value: TrackerValue}[]
    logs: string[]
}

export class TimeTrackingSummaryItem extends TreeItem{
    private date: string;
    private value: TrackerValue;
    private children: TimeTrackingBreakdownItem[];

    get breakdown(): TimeTrackingBreakdownItem[] {
        return this.children;
    }

    constructor(date: string, value: TrackerValue, children: {key: string, value: TrackerValue}[])
    {
        super(date, TreeItemCollapsibleState.Collapsed);
        this.date = date;
        this.value = value;
        this.children = children.map(c =>{
            return new TimeTrackingBreakdownItem(c.key, c.value);
        });
    }
}

export class TimeTrackingBreakdownItem extends TreeItem{
    private value: TrackerValue;

    constructor(detail: string, value: TrackerValue){
        super(detail);
        this.value = value;
    }
}
