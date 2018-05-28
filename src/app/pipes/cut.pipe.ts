import { PipeTransform, Pipe  } from '@angular/core';

@Pipe({
	name: 'Cut',
	pure: true
})
export class CutPipe implements PipeTransform {
	transform(str: string, limit: number): string {
		if (!str) {
			return '';
		}
		return str.length > limit ? `${str.substring(0, limit)}...` : str;
	}
}
