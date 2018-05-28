import { Component, OnInit, Input, OnChanges, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Call, Parameter } from '@app/models/swagger/calls';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Swagger, extractType, SwaggerValidator, ValidationError } from '@services/swagger';

import { ɵa as PrettyJsonComponent } from 'angular2-prettyjson';
import { ExampleComponent } from '@comp/example/example.component';
import { SwaggerModeler } from '@services/swagger/swagger-modeler.service';


@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css'],
  entryComponents: [ PrettyJsonComponent, ExampleComponent]
})
export class CallComponent {
	@Input() callName: string;
	@Input() method: string;
	@Input() call: Call;

	/* additional info */
	tryItOut = false;

	collapsed = true;
	showResult = false;
	details = false;
	showFullOutput = false;
	status: string;
	result: string;
	error: string;
	example: string;
	validationError: ValidationError;

	constructor(private validator: SwaggerValidator, private modeler: SwaggerModeler, protected swagger: Swagger, protected httpClient: HttpClient, private zone: NgZone) {
	}

	protected toggleCollapse() { this.collapsed = ! this.collapsed; }

	protected request() {
		this.error = undefined;
		this.result = undefined;
		this.showFullOutput = false;

		this.swagger.procRequest(this.call).subscribe(v => {
			this.showResult = true;
			if (v.length < 100) {
				this.status = v;
			} else {
				this.result = v;
				this.validationError = this.validator.validateReply(this.call, v);
				console.log(JSON.stringify(this.validationError));
			}
		}, e => {
			this.showResult = true;
			this.status = 'receive Error';
			this.error = e;
		});
	}

	public setNewValue(param: string, ev: KeyboardEvent) {
		this.call.values[param] = (ev.srcElement as any).value;
	}
	protected toggleDetails() {
		this.details = !this.details;
	}
	protected toggleShowCall() {
		this.resetRequest();
		this.tryItOut = !this.tryItOut;
	}
	protected resetRequest() {
		this.swagger.resetCall(this.call);
		this.result = '';
		this.status = '';
		this.showResult = false;
	}

	get returnValue(): string | undefined {
		return Swagger.extractReturnType(this.call);
	}

	public extractType(param: Parameter): string { return extractType(param); }
	public toggleFullOutput() { this.showFullOutput = !this.showFullOutput; }

	public useExampleOnBody() {
		const bodyParam = this.call.parameters.find(p => p.in === 'body');
		this.call.values['body'] = this.modeler.createExample(Swagger.extractType(bodyParam));
	}

	get niceResult() { return JSON.stringify(JSON.parse(this.result), null, 4); }
	get niceError() { return JSON.stringify(JSON.parse(this.error), null, 4); }
	get errorArray(): Array<string> {
		if (!this.error) {
			return [];
		}
		const errorList = JSON.parse(this.error);
		if (!errorList) {
			return [];
		}
		return errorList.error;
	}
}
