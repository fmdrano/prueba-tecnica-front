import { TestBed } from '@angular/core/testing';

import { NavigationControl } from './navigation-control';

describe('NavigationControl', () => {
  let service: NavigationControl;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationControl);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
