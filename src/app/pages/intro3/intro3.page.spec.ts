import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Intro3Page } from './intro3.page';

describe('Intro3Page', () => {
  let component: Intro3Page;
  let fixture: ComponentFixture<Intro3Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Intro3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
