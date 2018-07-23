import { Component } from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	/** title for the Application */
	public readonly title = 'Swagger-Validator';
	/** source to load the JSON from */
	private _source: string;
	/** current visible tab */
	public activeTab = 'main';

	/** status for loading the JSON */
	public status = '';

	constructor() {
		this._source = localStorage.getItem('hostName') || '';
	}

	/** set the testServer to the template and update the localStore */
	set source(src: string) {
		src = `${src}`.trim();
		localStorage.setItem('hostName', src);
		this._source = src;
	}
	/** set the JSON source */
	get source(): string { return this._source; }

	/**
	 * validation status from the test component to show in the header
	 * @param status status to show up
	 */
	onStatusChanged(status: string) {
		this.status = status;
	}
}
