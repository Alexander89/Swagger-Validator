import { Component, OnInit, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
export class TesterComponent implements OnInit, OnChanges {

	@Input() source: string;
	private loadSource: string;
	public status: string;

	protected info: S.Info;

	private openSubscription: Subscription;

	constructor(private cd: ChangeDetectorRef, public swagger: Swagger, protected httpClient: HttpClient) {
		this.openSubscription = undefined;
		this.status = 'ready';
	}

	ngOnInit() {
	}

	ngOnChanges() {
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

	get pathArray() { return this.swagger.pathArray; }

	public trackTag(index, tag: S.Tag) { return tag.name; }
	public trackCall(index, call) { return call.callName; }
	public trackMeth(index, method) { return method.name; }

	get selectedScheme(): string {return this.swagger.selectedRequestSchema; }
	set selectedScheme(value: string) { this.swagger.selectedRequestSchema = value; }

}
