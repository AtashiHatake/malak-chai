import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

let bluetoothDevice = null;
let printerCharacteristic = null;

export const connectToPrinter = async () => {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported on this browser. Use Chrome on Android.");
    return false;
  }

  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'MPT-II' },
        { namePrefix: 'MPT' },
        { namePrefix: 'HOIN' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb'
      ]
    });

    const server = await bluetoothDevice.gatt.connect();

    let service;
    try {
      service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    } catch {
      service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
    }

    const characteristics = await service.getCharacteristics();
    
    printerCharacteristic = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!printerCharacteristic) {
      throw new Error('No writable characteristic found.');
    }

    alert('✅ Thermal Printer Connected Successfully!');
    return true;
  } catch (error) {
    console.error('Bluetooth Connection Error:', error);
    alert('Failed to connect. Make sure the printer is on and paired to Android.');
    return false;
  }
};

export const printReceipt = async ({ items, total, timestamp }) => {
  if (!bluetoothDevice || !bluetoothDevice.gatt.connected || !printerCharacteristic) {
    alert('⚠️ Printer not connected. Please connect first.');
    return;
  }

  try {
    const encoder = new ReceiptPrinterEncoder({
      language: 'esc-pos',
      columns: 32 
    });

    const dateObj = timestamp ? new Date(timestamp) : new Date();
    const dateTimeStr = dateObj.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    let receipt = encoder
      .initialize()
      .align('center')
      .bold(true)
      .size(2, 2)
      .text('MALAK CHAI')
      .newline()
      .size(1, 1)
      .bold(false)
      .text(dateTimeStr)
      .newline()
      .text('--------------------------------')
      .newline()
      .align('left');

    items.forEach((item) => {
      receipt = receipt
        .bold(true)
        .text(`${item.name}`)
        .newline()
        .bold(false)
        .text(`  ${item.qty} x Rs.${item.sell_price} = Rs.${item.qty * item.sell_price}`)
        .newline();
    });

    receipt = receipt
      .text('--------------------------------')
      .newline()
      .align('left')
      .bold(true)
      .text(`TOTAL AMOUNT: Rs. ${total}`)
      .newline()
      .text('--------------------------------')
      .newline()
      .align('center')
      .bold(false)
      .text('*** Thank You! Visit Again ***')
      .newline()
      .newline()
      .newline()
      .newline()
      .newline(); 

    const encodedBytes = receipt.encode();
    
    const CHUNK_SIZE = 100;
    for (let i = 0; i < encodedBytes.length; i += CHUNK_SIZE) {
      const chunk = encodedBytes.slice(i, i + CHUNK_SIZE);
      await printerCharacteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

  } catch (error) {
    console.error('Print Error:', error);
    alert('Failed to print token.');
  }
};