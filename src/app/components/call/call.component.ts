import { Component, OnInit, Input, OnChanges, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Call, Parameter } from '@app/models/swagger/calls';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Swagger, extractType, SwaggerValidator, ValidationError } from '@services/swagger';

import { ɵa as PrettyJsonComponent } from 'angular2-prettyjson';
import { ExampleComponent } from '@comp/example/example.component';
import { SwaggerModeler } from '@services/swagger/swagger-modeler.service';
import * as S from '@swagger/swagger';


@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css'],
  entryComponents: [ PrettyJsonComponent, ExampleComponent]
})
export class CallComponent {
	/** call name to use in this view */
	@Input() callName: string;
	/** method this call should use */
	@Input() method: string;
	/** reference to the call */
	@Input() call: Call;

	/* additional info */

	/** is the compleat call open or closed */
	public collapsed = true;
	/** is the try it out section open or closed */
	public tryItOut = false;
	/** is the result collapsed */
	public showResult = false;
	/** are the details collapsed */
	public details = false;
	/** is the Output collapsed of compleat visible */
	public showFullOutput = false;
	/** network call status */
	public status: string;
	/** successfully result data */
	public result: string;
	/** failed result data */
	public error: string;
	/** JSON example data */
	public example: string;
	/** All errors, given by the Error Validator */
	public validationError: ValidationError;

	constructor(private validator: SwaggerValidator, private modeler: SwaggerModeler, protected swagger: Swagger, protected httpClient: HttpClient, private zone: NgZone) {
	}

	/**
	 * toggle the collapse of the compleat call
	 */
	public toggleCollapse() { this.collapsed = ! this.collapsed; }

	/**
	 * do the network request and reset the last output
	 */
	protected request() {
		this.error = undefined;
		this.result = undefined;
		this.showFullOutput = false;

		this.swagger.procRequest(this.call).subscribe(v => {
			this.showResult = true;
			if (v.length < 100 && v !== null) {
				this.status = v;
			} else {
				this.result = v || 'Successful Operation';
				this.validationError = v ? this.validator.validateReply(this.call, v) : {status: '200'};
			}
		}, e => {
			this.showResult = true;
			this.status = `receive Error ${e.status}: ${this.call.responses[e.status].description}`;
			this.error = e.error;
		});
	}

	/**
	 * set the user input tuo the call
	 * @param param parameter witch is changed
	 * @param ev keyboard input event to get the src Element
	 */
	public setNewValue(param: string, ev: KeyboardEvent) {
		this.call.values[param] = (ev.srcElement as any).value;
	}
	/**
	 * toggle the details open and closed
	 */
	protected toggleDetails() {
		this.details = !this.details;
	}
	/**
	 * toggle try it out and reset the last request output
	 */
	protected toggleShowCall() {
		this.resetRequest();
		this.tryItOut = !this.tryItOut;
	}
	/**
	 * reset the last Request output and close the result
	 */
	protected resetRequest() {
		this.swagger.resetCall(this.call);
		this.result = '';
		this.status = '';
		this.showResult = false;
	}


	/**
	 * returns the type of the parameter
	 * @param param Parameter to get the type of
	 */
	public extractType(param: Parameter): string { return extractType(param); }
	/**
	 * get the type from the parameter and return the swagger schema
	 * @param param Parameter to get the Swagger schema of
	 */
	public getParamSchem(param: Parameter): S.Schema { return this.swagger.def.definitions[extractType(param)]; }
	/**
	 * open and close the compleat output of the request
	 */
	public toggleFullOutput() { this.showFullOutput = !this.showFullOutput; }

	/** copy the example to the input field in a call property */
	public useExampleOnBody() {
		const bodyParam = this.call.parameters.find(p => p.in === 'body');
		this.call.values['body'] = this.modeler.createExample(Swagger.extractType(bodyParam));
	}

	/** Response track function for ngFor loops to define a reference for the change detection */
	public trackResponse(index: number, response: S.Response) { return response.description; }

	/** extract the return type from a call */
	get returnValue(): string | undefined { return Swagger.extractReturnType(this.call); }
	/** get a nice JSON string for the result */
	get niceResult() { return JSON.stringify(JSON.parse(this.result), null, 4); }
	/** get a nice JSON string for the error */
	get niceError() { return JSON.stringify(JSON.parse(this.error), null, 4); }
	/** get Array of all errors from the result */
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
	/** get all possible responses codes for a call */
	get responses(): Array<string> { return Object.getOwnPropertyNames(this.call.responses); }
}
