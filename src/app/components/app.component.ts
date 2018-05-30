import { Component } from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	public readonly title = 'Swagger-Validator';
	public _source: string;

	constructor() {
		const hostname = localStorage.getItem('hostName');
		if (hostname) {
			this._source = hostname;
		}
	}

	/** set the source to the template and update the localStore */
	set source(src: string) {
		localStorage.setItem('hostName', src);
		this._source = src;
	}
	/** set the JSON source */
	get source(): string { return this._source; }
}
