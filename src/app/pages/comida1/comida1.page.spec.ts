import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Comida1Page } from './comida1.page';

describe('Comida1Page', () => {
  let component: Comida1Page;
  let fixture: ComponentFixture<Comida1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Comida1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
