If you clone this repository, just run
```bash
npm install
ionic cordova run android
```

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

`device.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ComProtocol } from '@iotize/device-client.js/protocol/api';
import { BLEComProtocol } from 'plugins/cordova-plugin-iotize-ble/src/www';
import { NFCComProtocol } from 'plugins/cordova-plugin-iotize-device-com-nfc/src/www';
import { Tap, SessionState } from '@iotize/device-client.js/device';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  isReady = false;
  device: Tap;
  connectionPromise = null;
  nfcSessionStateString = "";
  bleSessionStateString = "";

  constructor() { }

  async init(protocol: ComProtocol) {
    this.isReady = false;
    try {
      this.device = Tap.create();
      console.log('device created');
      this.connectionPromise = this.connect(protocol);
      console.log('waiting for connection promise');
      await this.connectionPromise;
      console.log(await this.getSerialNumber());
      this.isReady = true;
    } catch (error) {
      console.error('init failed');
      console.error(error);
      throw new Error('Connection Failed: ' + (error.message? error.message : error));
    }
  }

  async NFCLoginAndBLEPairing(deviceAddress: string){

    try {
      //start a communication session in NFC
      await this.init(new NFCComProtocol());
      
      //enable NFC auto login
      await this.device.encryption(true);
      
      //check the user login
      let sessionState: SessionState = await this.device.refreshSessionState()
      this.nfcSessionStateString =  JSON.stringify(sessionState);
      console.log(`NFCLoginAndBLEPairing in NFC:  ` + this.nfcSessionStateString);
      
      //connect to the device in BLE
      let bleCom : ComProtocol= new BLEComProtocol(deviceAddress);

      //start the BLE communication with the device
      await this.device.useComProtocol(bleCom);
      await this.device.connect();
      
      //check the connection
      sessionState = await this.device.refreshSessionState();
      this.bleSessionStateString = JSON.stringify(sessionState);
      console.log(`NFCLoginAndBLEPairing in BLE:  `+ this.bleSessionStateString);
    } catch (err) {
    console.error("Can't connect to TAP, try again" + JSON.stringify(err));
    console.error(err);
    }
   
  }

  connect(protocol: ComProtocol): Promise<void> {
    return this.device.connect(protocol);
  }

  async getSerialNumber() {
    return (await this.device.service.device.getSerialNumber()).body();
  }
}
```

update `nfc.service.ts`
```typescript
constructor(public nfc: NFC,
            public deviceService: DeviceService) { }

onDiscoveredTap(event: NdefEvent) {
let message = event.tag.ndefMessage;
this.lastTagRead.appName = String.fromCharCode(...message[3].payload);
this.lastTagRead.macAddress = this.convertBytesToBLEAddress(message[2].payload);

this.deviceService.NFCLoginAndBLEPairing(this.lastTagRead.macAddress);
}
```

whole `nfc.service.ts` file:
```typescript
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
```

## Update view to add session states:

`home.page.ts`
```typescript
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
```

and html view `home.page.html`
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
    <p>NFC Session State: {{deviceService.nfcSessionStateString}}</p>
    <p>BLE Session State: {{deviceService.bleSessionStateString}}</p>
    <p *ngIf="deviceService.bleSessionStateString != '' ">Tap is ready to use</p>
  </div>
</ion-content>
```

## Test NFC Login and BLE Pairing

Run the app again:

```bash
ionic cordova run android
```

And try to tap to your device. If the connection and login succeed, you should see the message 'Tap is ready to use', and see the logged profile under NFC Session State and BLE Session State.