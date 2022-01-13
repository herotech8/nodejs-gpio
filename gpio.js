const fs = require('fs');

const PATH = '/sys/class/gpio';

function isExported(pin) {
  return fs.existsSync(PATH + '/gpio' + pin);
}

class gpio {
  constructor() {
    this.DIR_IN = 'in';
    this.DIR_OUT = 'out';
    this.VAL_LOW = 'low';
    this.VAL_HIGH = 'high';
  }

  setMode(mode) {
    return new Promise((resolve, reject) => {
      if(mode == 'pi-4-model-b-bcm') {
        this.pinMap = require('./maps/RaspberryPi4ModelB.js');
      } else if(mode == 'jetson-xavier-nx') {
        this.pinMap = require('./maps/NvidiaJetsonXavierNX.js');
      } else {
        throw new Error('Invalid mode specified');
      }

      resolve();
    });
  }

  getPinForCurrentMode(pin) {
    if(this.pinMap[pin] !== undefined) {
      return this.pinMap[pin];
    }

    return pin;
  }

  setup(pin, direction) {
    return new Promise((resolve, reject) => {
      if(this.pinMap === undefined) {
        throw new Error('Mode has not been set');
      }

      if(direction !== this.DIR_IN && direction !== this.DIR_OUT) {
        throw new Error('Invalid direction specified');
      }

      var currentPin = this.getPinForCurrentMode(pin);

      if(!isExported(currentPin)) {
        fs.writeFileSync(PATH + '/export', '' + currentPin);
      }

      setTimeout(() => {
        if(direction == this.DIR_IN) {
          fs.writeFileSync(PATH + '/gpio' + currentPin + '/direction', this.DIR_IN);
        } else {
          fs.writeFileSync(PATH + '/gpio' + currentPin + '/direction', this.DIR_OUT);
        }
      }, 1000);

      setTimeout(() => { resolve(); }, 2000);
    });
  }

  write(pin, value) {
    return new Promise((resolve, reject) => {
      var currentPin = this.getPinForCurrentMode(pin);

      if(value !== this.VAL_HIGH && value !== this.VAL_LOW) {
        throw new Error('Invalid value specified');
      }

      if(value == this.VAL_HIGH) {
        fs.writeFile(PATH + '/gpio' + currentPin + '/value', '' + 1, (err) => {
          if(err) { console.log('Write Error', err); }

          resolve();
        });
      } else {
        fs.writeFile(PATH + '/gpio' + currentPin + '/value', '' + 0, (err) => {
          if(err) { console.log('Write Error', err); }

          resolve();
        });
      }
    });
  }

  read(pin) {
    return new Promise((resolve, reject) => {
      var currentPin = this.getPinForCurrentMode(pin);

      var value = fs.readFileSync(PATH + '/gpio' + currentPin + '/value', 'utf-8');

      resolve((value == 1));
    });
  }
}

module.exports = new gpio();
