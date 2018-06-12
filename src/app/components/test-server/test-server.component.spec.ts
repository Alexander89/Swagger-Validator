import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestServerComponent } from './test-server.component';

describe('TestServerComponent', () => {
  let component: TestServerComponent;
  let fixture: ComponentFixture<TestServerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestServerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
