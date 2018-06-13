import { Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHandler, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Swagger } from '@services/swagger/swagger.service';
import * as S from '@swagger/swagger';

@Component({
  selector: 'app-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.css']
})
export class TesterComponent implements OnChanges {
	/** url to load the swagger definition from */
	@Input() source: string;
	/** resource who is loaded actually */
	private loadSource: string;
	/** http status for get call */
	public status: string;

	/** info block from swagger call */
	protected info: S.Info;

	/** all open subscriptions to clean up on change the view */
	private openSubscription: Subscription;

	constructor(private cd: ChangeDetectorRef, public swagger: Swagger, protected httpClient: HttpClient) {
		this.openSubscription = undefined;
		this.status = 'ready';
	}

	/**
	 * handler when Input is changed or other fields ar changed
	 */
	public ngOnChanges() {
		// on every change check if the source is changed
		if (this.loadSource !== this.source) {
			// hand over source to avoid recheck
			this.loadSource = this.source;
			// unsubscribe open subscription
			if (this.openSubscription && !this.openSubscription.closed) {
				this.openSubscription.unsubscribe();
			}
			// load JSON fro source
			this.openSubscription = this.loadJson(this.source).subscribe(body => {
				try {
					this.swagger.def = body;
					this.info = body.info;
					this.status = 'JSON loaded';
					this.selectedScheme = body.schemes[0];
				} catch (e) {
					this.status = `invalid JSON ${e}`;
				}
			}, e => {
				this.status = `invalid URL ${e}`;
			});
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

	/** getter for the swagger path array */
	get pathArray() { return this.swagger.pathArray; }

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
	 * Methode tracker for the ngFor loop
	 * @param index index of the item
	 * @param method Method to be tracked
	 */
	public trackMeth(index, method) { return method.name; }

	/** getter for the selected scheme */
	get selectedScheme(): string {return this.swagger.selectedRequestScheme; }
	/** setter for the selecte scheme */
	set selectedScheme(value: string) { this.swagger.selectedRequestScheme = value; }

}
