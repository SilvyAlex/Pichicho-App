import { TestBed } from '@angular/core/testing';

import { FeedingService } from './feeding.service';

describe('FeedingService', () => {
  let service: FeedingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeedingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
