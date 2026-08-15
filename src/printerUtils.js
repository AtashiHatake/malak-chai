import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

let bluetoothDevice = null;
let printerCharacteristic = null;

export const connectToPrinter = async () => {
  // Check if browser supports Web Bluetooth
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported on this browser. Use Chrome on Android.");
    return false;
  }

  try {
    // Look for the HOIN / MPT-II printer
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'MPT-II' },
        { namePrefix: 'MPT' },
        { namePrefix: 'HOIN' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard Chinese thermal printer service
        '0000ff00-0000-1000-8000-00805f9b34fb'
      ]
    });

    const server = await bluetoothDevice.gatt.connect();

    // Find the writable service
    let service;
    try {
      service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    } catch {
      service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
    }

    const characteristics = await service.getCharacteristics();
    
    // Find the specific data pipeline that allows us to write bytes to the printer
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

export const printReceipt = async ({ items, total }) => {
  if (!bluetoothDevice || !bluetoothDevice.gatt.connected || !printerCharacteristic) {
    alert('⚠️ Printer not connected. Please connect first.');
    return;
  }

  try {
    // The HOIN HL58 is a 58mm printer, which perfectly fits 32 columns of text
    const encoder = new ReceiptPrinterEncoder({
      language: 'esc-pos',
      columns: 32 
    });

    // Build the receipt layout
    let receipt = encoder
      .initialize()
      .align('center')
      .bold(true)
      .size(2, 2)
      .text('MALAK CHAI')
      .newline()
      .size(1, 1)
      .bold(false)
      .text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .newline()
      .text('--------------------------------')
      .newline()
      .align('left');

    // Loop through the cart and add items to the receipt
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
      .align('right')
      .bold(true)
      .size(2, 1)
      .text(`TOTAL: Rs.${total}`)
      .newline()
      .size(1, 1)
      .bold(false)
      .align('center')
      .newline()
      .text('Thank You! Visit Again.')
      .newline()
      .newline()
      .newline(); // Extra lines to push the paper out for tearing

    const encodedBytes = receipt.encode();
    
    // Send the data to the printer
    await printerCharacteristic.writeValue(encodedBytes);
  } catch (error) {
    console.error('Print Error:', error);
    alert('Failed to print token.');
  }
};