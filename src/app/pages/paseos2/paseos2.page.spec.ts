import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paseos2Page } from './paseos2.page';

describe('Paseos2Page', () => {
  let component: Paseos2Page;
  let fixture: ComponentFixture<Paseos2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Paseos2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
