import { Component, OnInit } from '@angular/core';
import { NfcService } from '../nfc.service';
import { DeviceService } from '../device.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(public nfcService: NfcService,
              public deviceService: DeviceService) {}

  ngOnInit() {
    this.nfcService.listenNFC();
  }

}
