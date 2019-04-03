import { Injectable } from '@angular/core';
import { NFC, NdefEvent } from '@ionic-native/nfc/ngx'
import { DeviceService } from './device.service';

@Injectable({
  providedIn: 'root'
})
export class NfcService {

  public lastTagRead = {
    appName: "",
    macAddress: ""
  };

  constructor(public nfc: NFC,
              public deviceService: DeviceService) { }

  listenNFC() {
    this.nfc.addNdefListener(() => {
      console.log('NFC listener ON')
    },
      (error) => {
        console.error('NFC listener didn\'t start: ', error)
      }).subscribe(event => {
        console.log('NDEF Event')
        this.onDiscoveredTap(event);
      });
  }

  onDiscoveredTap(event: NdefEvent) {
    let message = event.tag.ndefMessage;
    this.lastTagRead.appName = String.fromCharCode(...message[3].payload);
    this.lastTagRead.macAddress = this.convertBytesToBLEAddress(message[2].payload);

    this.deviceService.NFCLoginAndBLEPairing(this.lastTagRead.macAddress);
  }

  convertBytesToBLEAddress(bytes: number[]): string {
    return bytes.slice(1)
                .map(byte => {
                  if (byte < 0) {
                    byte += 256;
                  }
                  let byteString = '0' + byte.toString(16).toUpperCase();
                  byteString = byteString.slice(-2);
                  return byteString;
                })
                .reverse()
                .join(':')
  }
}
