import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paseos1Page } from './paseos1.page';

describe('Paseos1Page', () => {
  let component: Paseos1Page;
  let fixture: ComponentFixture<Paseos1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Paseos1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
