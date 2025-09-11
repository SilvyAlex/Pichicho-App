import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Entrena1Page } from './entrena1.page';

describe('Entrena1Page', () => {
  let component: Entrena1Page;
  let fixture: ComponentFixture<Entrena1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Entrena1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
