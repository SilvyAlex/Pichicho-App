import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Intro1Page } from './intro1.page';

describe('Intro1Page', () => {
  let component: Intro1Page;
  let fixture: ComponentFixture<Intro1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Intro1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
