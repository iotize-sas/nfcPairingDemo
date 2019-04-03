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
