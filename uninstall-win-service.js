const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name: 'KNBank Scraping Server',
  script: require('path').join(__dirname, 'app.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function () {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

// Uninstall the service.
svc.uninstall();
