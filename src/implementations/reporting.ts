import * as vscode from 'vscode';
import { TimeTrackingResultItem } from '../models/trackerValues';
import { Tracker } from './impelmentation';

export class Report{
    private results: TimeTrackingResultItem[];

    constructor (results: TimeTrackingResultItem[]){
        this.results = results;
    }

    groupByReport() : TimeTrackingResultItem[][] {
        // let report = '----------------------------------------';
        return this.results.reduce((accum: TimeTrackingResultItem[][], current)=>
        {
            if (accum[current.date]){
                accum[current.date] = [...accum[current.date], current];
            }
            else {
                accum[current.date] = [current];
            }

            return accum;
        }, []);
    }

}