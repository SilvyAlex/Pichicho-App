import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LimpiezaPage } from './limpieza.page';

describe('LimpiezaPage', () => {
  let component: LimpiezaPage;
  let fixture: ComponentFixture<LimpiezaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LimpiezaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
