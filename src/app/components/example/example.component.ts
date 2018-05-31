import { Component, OnInit, Input, OnChanges } from '@angular/core';
import * as S from '@swagger/swagger';
import { SwaggerModeler, ModelInfo } from '@services/swagger/swagger-modeler.service';
import { Swagger } from '@app/services/swagger';


@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit, OnChanges {
	@Input() schema: S.Schema;
	@Input() title: string;
	@Input() mode: string;
	example = '{}';
	modelData: Array<ModelInfo>;
	rootName: string;
	collapsed: {[element: string]: boolean};

	constructor(private modeler: SwaggerModeler) {
		this.modelData = [];
		this.collapsed = {};
	}

	ngOnInit() {
	}

	ngOnChanges() {

		this.collapsed[this.schema.name] = true;

		this.example = this.modeler.createExampleBySchema(this.schema);
		this.modelData = [this.modeler.createInfoBySchema(this.schema)];
	}

	get infoVisible(): boolean { return !this.exampleVisible; }// extend with other modes to use this as default
	get exampleVisible(): boolean { return this.mode === 'example'; }
	toggle(modelName: string) {
		this.collapsed[modelName] = !this.collapsed[modelName];
	}
}
