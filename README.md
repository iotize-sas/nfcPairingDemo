# Creating an IoTize NFC Pairing App with Ionic4 03/04/19

## Get latest versions of node and npm

(Node Download Page)[https://nodejs.org/en/download/]

## Create the Ionic App
Install / Update ionic
```bash
npm i -g ionic@latest
```
Create an Ionic project from blank template
```bash
ionic start nfcPairing blank
```
You don't have to connect to AppFlow when prompted.

Run a serve to check the proper creation of the Ionic App
```bash
ionic serve
```

## Add IoTize dependencies

Add device client library
```bash
npm install @iotize/device-client.js --save
```

Add cordova BLE and NFC IoTize plugins
```bash
ionic cordova plugin add @iotize/cordova-plugin-iotize-ble
ionic cordova plugin add @iotize/device-com-nfc.cordova
```

Add ionic-native NFC service
```bash
npm i @ionic-native/nfc
```

And register it as a provider in `app.module.ts`

## Create services
```bash
ionic generate service nfc
ionic generate service device
```

modify `nfc.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { NFC, NdefEvent } from '@ionic-native/nfc/ngx'

@Injectable({
  providedIn: 'root'
})
export class NfcService {

  public lastTagRead = {
    appName: "",
    macAddress: ""
  };

  constructor(public nfc: NFC) { }

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
  }

  convertBytesToBLEAddress(bytes: number[]): string {
    return bytes.slice(1)
                .map(byte => {
                  if (byte < 0) {
                    byte += 256;
                  }
                  return byte.toString(16).toUpperCase();
                })
                .reverse()
                .join(':')
  }
}
```

## Update home page
`home.page.ts`
```typescript
import { Component, OnInit } from '@angular/core';
import { NfcService } from '../nfc.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(public nfcService: NfcService) {}

  ngOnInit() {
    this.nfcService.listenNFC();
  }
}
```
`home.page.html`
```html
<ion-header>
  <ion-toolbar>
    <ion-title>
      NFC Pairing Demo
    </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="ion-padding">
    <p>Tag's AppName: {{nfcService.lastTagRead.appName}}</p>
    <p>Tag's mac Address: {{nfcService.lastTagRead.macAddress}}</p>
  </div>
</ion-content>

```

## Test NFC Reading

Launch app
```bash
ionic cordova run android
```
And tap and IoTize Tag. It should display its appName and BLE mac Address

## Add NFC to BLE Pairing