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
	@Input() call: S.Call;
	@Input() type: string;
	infoVisible = true;
	exampleVisible = false;
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
		if (this.call) {
			this.rootName = Swagger.extractReturnType(this.call);
		} else if (this.type) {
			this.rootName = this.type;
		}
		this.example = this.modeler.createExample(this.rootName);
		this.modelData = [this.modeler.createInfo(this.rootName)];
	}

	showInfo() {
		this.infoVisible = true;
		this.exampleVisible = false;
	}
	showExample() {
		this.exampleVisible = true;
		this.infoVisible = false;
	}

	toggle(modelName: string) {
		this.collapsed[modelName] = !this.collapsed[modelName];
	}
}
