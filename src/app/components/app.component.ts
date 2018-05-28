import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	public readonly title = 'API tester';
	public source: string = 'http://swagger.hotelbird.com/swagger.json';
}
