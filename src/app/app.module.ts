import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Swagger, SwaggerValidator } from '@services/swagger';
import { SwaggerModeler } from '@services/swagger/swagger-modeler.service';

import { AppComponent } from '@comp/app.component';
import { TesterComponent } from '@comp/tester/tester.component';
import { CallComponent } from '@comp/call/call.component';
import { ExampleComponent } from './components/example/example.component';

import { PrettyJsonModule, ɵc as SafeJsonPipe } from 'angular2-prettyjson';
import { JsonPipe } from '@angular/common';
import { ɵa as PrettyJsonComponent } from 'angular2-prettyjson';

import { CutPipe } from '@pipes/cut.pipe';

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		ReactiveFormsModule,
		PrettyJsonModule
	],
	declarations: [
		AppComponent,
		TesterComponent,
		CallComponent,
		CutPipe,
		ExampleComponent
	],
	providers: [
		Swagger,
		SwaggerValidator,
		SwaggerModeler,
		{ provide: JsonPipe, useClass: SafeJsonPipe }
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
