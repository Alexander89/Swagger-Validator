import { browser, by, element } from 'protractor';

export class AppPage {
	/** nafigate to the homepage */
	navigateTo() {
		return browser.get('/');
	}
	/** return the header text */
	getParagraphText() {
		return element(by.css('app-root h1')).getText();
	}
}
