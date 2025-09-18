import { TestBed } from '@angular/core/testing';

import { ProfileModel } from './profile.model';

describe('ProfileModel', () => {
  let service: ProfileModel;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileModel);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
