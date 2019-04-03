import { TestBed } from '@angular/core/testing';

import { NfcService } from './nfc.service';

describe('NfcService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NfcService = TestBed.get(NfcService);
    expect(service).toBeTruthy();
  });
});
