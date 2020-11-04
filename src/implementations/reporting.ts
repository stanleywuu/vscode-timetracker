import * as vscode from 'vscode';
import { TimeTrackingResultItem } from '../models/trackerValues';
import { formatTime, load, Tracker } from './implementation';

class DateValue{
    date: Date;
    total: number;

    constructor(){
        this.date = new Date();
        this.total = -1;
    }
}
export class Report{
    private results: TimeTrackingResultItem[];

    constructor (results: TimeTrackingResultItem[]){
        this.results = results;
    }

    report(): string{
        // What a raw report could look like
        // Sunday, Nov 01
        // Total: 03:20:34
        // Comment 1: 01:20:32
        //    Spent {time} in {file}
        //    Notes: blah
        // Comment 2: 03:20:40
        //    Spent {time} in {file}
        //    Notes: blah
        let report = '----------------------------------------\r\n';
        const items = this.groupByReport();
        for (var index in items){
            const t = items[index];
            const total:DateValue = t.reduce<DateValue>((accum, c, i, array) =>{
                accum.date = new Date(c.date);
                accum.total += c.total.total;
                return accum;
            }, new DateValue());

            report += `${total.date.toDateString()}\nTotal: ${formatTime(total.total)}\n`;

            t.forEach(detail =>{
                report += `${formatTime(detail.total.total)}: ${detail.comment}\n`;
                  detail.breakdowns.forEach(b =>{
                       report += `  Spent ${formatTime(b.value.total)} in ${b.key}\n`;
                  });
                
                if (detail.notes){
                    report += `    Notes: ${detail.notes}\n\n`;
                }
            });
        }

        report += '----------------------------------------\r\n';
        return report;
    }

    groupByReport() : TimeTrackingResultItem[][] {
        // let report = '----------------------------------------';
        return this.results.sort((a, b) => a.date > b.date ? 1 : -1).reverse()
        .reduce((accum: TimeTrackingResultItem[][], current)=>
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

export async function getReports(){
    const results = await load();
    const reportContent = new Report(results).report();
    vscode.workspace.openTextDocument({content: reportContent}).then((doc)=> vscode.window.showTextDocument(doc));
}