const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name: 'KNBank Scraping Server',
  description: 'This server scrapes the certain information on the KNBank website.',
  script: require('path').join(__dirname, 'app.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start();
});

svc.install();
