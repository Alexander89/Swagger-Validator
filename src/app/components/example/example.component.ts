import { Component, Input, OnChanges } from '@angular/core';
import * as S from '@swagger/swagger';
import { SwaggerModeler, ModelInfo } from '@services/swagger/swagger-modeler.service';
import { Swagger } from '@app/services/swagger';


@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnChanges {
	/** schema to display in this view */
	@Input() schema: S.Schema;
	/** title for this view */
	@Input() title: string;
	/** methode to display the data */
	@Input() mode: string;
	/** example data */
	public example = '{}';
	/** reference to the model data */
	public modelData: Array<ModelInfo>;
	/** name of the root model */
	public rootName: string;
	/** structure to collapse any model in the view */
	public collapsed: {[element: string]: boolean};

	constructor(private modeler: SwaggerModeler) {
		this.modelData = [];
		this.collapsed = {};
	}

	/**
	 * when a new model is set to the example view, prepare the collapse state and prepare the data to display
	 */
	ngOnChanges() {
		this.collapsed[this.schema.name] = true;

		this.example = this.modeler.createExampleBySchema(this.schema);
		this.modelData = [this.modeler.createInfoBySchema(this.schema)];
	}

	/**
	 * toggle the models in the Model view
	 * @param modelName Model to get opened and closed
	 */
	public toggle(modelName: string) {
		this.collapsed[modelName] = !this.collapsed[modelName];
	}
	/** return if the model info is visible */
	get infoVisible(): boolean { return !this.exampleVisible; }// extend with other modes to use this as default
	/** return if the JSON example is visible */
	get exampleVisible(): boolean { return this.mode === 'example'; }

}
