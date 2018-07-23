import { Component, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Swagger } from '@services/swagger/swagger.service';
import * as S from '@swagger/swagger';

@Component({
  selector: 'app-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.css']
})
export class TesterComponent  {
	/** url to load the swagger definition from */
	private _source: string;
	/** http status for get call */
	public _status: string;
	/** out bound status event emitter */
	@Output() status = new EventEmitter<string>();


	/** info block from swagger call */
	protected info: S.Info;
	/** list of user entered host data */
	public enteredHosts: Array<string> = [];


	/** all open subscriptions to clean up on change the view */
	private openSubscription: Subscription;

	constructor(private cd: ChangeDetectorRef, public swagger: Swagger, protected httpClient: HttpClient) {
		this.openSubscription = undefined;
		this.status.emit('ready');
	}

	/**
	 * when user leave the input field, save this input in the localStorage
	 */
	public saveHostEntry() {
		if (this.enteredHosts.indexOf(this.swagger.def.host) === -1) {
			this.enteredHosts.push(this.swagger.def.host);
			localStorage.setItem('hostList', JSON.stringify(this.enteredHosts));
		}
	}

	/**
	 * Load the Json and return an observable to get the Swagger definition
	 * @param src url to load the JSON file
	 */
	private loadJson(src: string): Observable<S.Root> {
		const headers = new HttpHeaders();
		headers.append('Access-Control-Allow-Origin', '*');
		return this.httpClient.get<S.Root>(
			src,
			{
				headers,
				observe: 'body',
				reportProgress: false
			}
		);
	}

	/**
	 * Tag tracker for the ngFor loop
	 * @param index index of the item
	 * @param tag tag to be tracked
	 */

	public trackTag(index, tag: S.Tag) { return tag.name; }
	/**
	 * Call tracker for the ngFor loop
	 * @param index index for the item
	 * @param call call to be tracked
	 */
	public trackCall(index, call) { return call.callName; }
	/**
	 * Method tracker for the ngFor loop
	 * @param index index of the item
	 * @param method Method to be tracked
	 */
	public trackMeth(index, method) { return method.name; }

	/** getter for the source */
	get source(): string { return this._source; }

	/** set the new source and do the network request to get the definition */
	@Input('source') set source(value: string) {
		try {
			this._source = value;
			// unsubscribe open subscription
			if (this.openSubscription && !this.openSubscription.closed) {
				this.openSubscription.unsubscribe();
			}
			// load JSON fro source
			this.openSubscription = this.loadJson(this.source).subscribe(body => {
				try {
					this.swagger.def = body;
					this.info = body.info;
					this.status.emit('JSON loaded');
					this.selectedScheme = body.schemes[0];

					const hostList = localStorage.getItem('hostList');
					if (hostList) {
						this.enteredHosts = JSON.parse(hostList);
					} else {
						this.enteredHosts.push(body.host);
					}
				} catch (e) {
					this.status.emit(`invalid JSON ${e}`);
				}
			}, e => {
				this.status.emit(`invalid URL ${e}`);
			});
		} catch (e) {
			this.status.emit(e);
		}
	}
	/** getter for the swagger path array */
	get pathArray() { return this.swagger.pathArray; }
	/** getter for the selected scheme */
	get selectedScheme(): string {return this.swagger.selectedRequestScheme; }
	/** setter for the selected scheme */
	set selectedScheme(value: string) { this.swagger.selectedRequestScheme = value; }
}
