import { Component } from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	/** title for the Application */
	public readonly title = 'Swagger-Validator';
	private _source: string;
	private _testServer: string;
	public showServer: boolean;

	constructor() {
		const hostname = localStorage.getItem('hostName');
		if (hostname) {
			this._source = hostname;
		}
		const server = localStorage.getItem('testServer');
		if (server) {
			this._testServer = server;
		}
	}

	/** set the source to the template and update the localStore */
	set source(src: string) {
		localStorage.setItem('hostName', src);
		this._source = src;
	}
	/** set the JSON source */
	get source(): string { return this._source; }


	/** set the testServer to the template and update the localStore */
	set testServer(src: string) {
		localStorage.setItem('testServer', src);
		this._testServer = src;
	}
	/** set the JSON source */
	get testServer(): string { return this._testServer; }
}
