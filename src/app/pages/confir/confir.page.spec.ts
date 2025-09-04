import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirPage } from './confir.page';

describe('ConfirPage', () => {
  let component: ConfirPage;
  let fixture: ComponentFixture<ConfirPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
