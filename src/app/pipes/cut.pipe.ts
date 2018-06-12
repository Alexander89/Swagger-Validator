import { PipeTransform, Pipe  } from '@angular/core';

@Pipe({
	name: 'Cut',
	pure: true
})
export class CutPipe implements PipeTransform {
	/**
	 * cut an string on a given position and append three dots
	 * @param str string to cu
	 * @param limit max length to cut
	 */
	transform(str: string, limit: number): string {
		if (!str) {
			return '';
		}
		return str.length > limit ? `${str.substring(0, limit)}...` : str;
	}
}
