import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Intro2Page } from './intro2.page';

describe('Intro2Page', () => {
  let component: Intro2Page;
  let fixture: ComponentFixture<Intro2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Intro2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
