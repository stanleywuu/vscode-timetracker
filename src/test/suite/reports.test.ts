import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { Report } from '../../implementations/reporting';
import { TimeTrackingResultItem, TrackerValue } from '../../models/trackerValues';
// import * as myExtension from '../../extension';

suite('Reports Test Suite', () => {
	vscode.window.showInformationMessage('Start report tests.');

	test('Group By', () => {
		const resultItems: TimeTrackingResultItem[] = [
			{ date: 5, comment: 'c', notes: 'c1', logs: [], breakdowns: [], total: new TrackerValue()},
			{ date: 5, comment: 'd', notes: 'd1', logs: [], breakdowns: [], total: new TrackerValue()},
			{ date: 1, comment: 'a', notes: 'a1', logs: [], breakdowns: [], total: new TrackerValue()},
		];
		const report = new Report(resultItems);
		const grouped = report.groupByReport();

		assert.strictEqual(grouped[5].length, 2);
		assert.strictEqual(grouped[1].length, 1);
	});
});
