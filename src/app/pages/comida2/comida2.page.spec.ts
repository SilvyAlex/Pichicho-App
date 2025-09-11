import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Comida2Page } from './comida2.page';

describe('Comida2Page', () => {
  let component: Comida2Page;
  let fixture: ComponentFixture<Comida2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Comida2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
