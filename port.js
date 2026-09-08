const net = require('net');
const dgram = require('dgram');
const fs = require('fs').promises;


const host = process.argv[2] || '127.0.0.1';
const ports = [20, 21, 22, 23, 25, 53, 67, 68, 80, 110, 143, 443, 300];

const scanResult = [];
let completedCount = 0;

//  tracks total async tasks (TCP + UDP per port)
const totalTasks = ports.length * 2; 

function checkCompletion() {
    completedCount++;
    
    if (completedCount === totalTasks) {
        createdFile();
    }
}

// renders CLI table and exports json report
async function createdFile() {
    console.log('\n--- SCAN RESULTS ---');
    console.table(scanResult);

    const reportData = {
        targetHost: host,
        scanDate: new Date().toISOString(),
        totalPortsScanned: ports.length,
        results: scanResult
    };

    try {
        await fs.writeFile('data.json', JSON.stringify(reportData, null, 2), 'utf-8');
        console.log('[+] data.json file was successfully created.');
    } catch (err) {
        console.log('[-] File Creation Error:', err.message);
    }
}

// TCP PORT SCANNER
function portController(port, host, timeout = 3000) {
    const socket = new net.Socket();
    
    let isHandled = false;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
        if (port === 80 || port === 443 || port === 300) {
            // trigger HTTP response header for BANNER Grabbing
            socket.write("HEAD / HTTP/1.1\r\nHost: " + host + "\r\n\r\n");
        } else {
            setTimeout(() => {
                if (!isHandled) {
                    isHandled = true;
                    scanResult.push({ Port: port, Protocol: 'TCP', Status: 'OPEN', Banner: 'Service Did Not Respond' });
                    socket.destroy();
                    checkCompletion();
                }
            }, 1000);
        }
    });

    socket.on('data', (data) => {
        if (!isHandled) {
            isHandled = true;
            const response = data.toString().trim();
            const firstLine = response.split('\n')[0]; 
            scanResult.push({ Port: port, Protocol: 'TCP', Status: 'OPEN', Banner: firstLine });
            socket.destroy();
            checkCompletion();
        }
    });

    socket.on('timeout', () => {
        if (!isHandled) {
            isHandled = true;
            scanResult.push({ Port: port, Protocol: 'TCP', Status: 'CLOSED (Timeout)', Banner: '-' });
            socket.destroy();
            checkCompletion();
        }
    });

    socket.on('error', (err) => {
        if (!isHandled) {
            isHandled = true;
            scanResult.push({ Port: port, Protocol: 'TCP', Status: `CLOSED (${err.code})`, Banner: '-' });
            socket.destroy();
            checkCompletion();
        }
    });

    socket.connect(port, host);
}

// UDP is connectionless , silence usually implies open/filtered or packet loss
function udpPortController(port, host, timeoutMs = 3000) {
    const socket = dgram.createSocket('udp4');
    let isHandled = false;

    const timeout = setTimeout(() => {
        if (!isHandled) {
            isHandled = true;
            scanResult.push({ Port: port, Protocol: 'UDP', Status: 'OPEN|FILTERED (No Response)', Banner: '-' });
            socket.close();
            checkCompletion();
        }
    }, timeoutMs);

    socket.on('message', (msg) => {
        if (!isHandled) {
            isHandled = true;
            clearTimeout(timeout);
            scanResult.push({ Port: port, Protocol: 'UDP', Status: 'OPEN', Banner: msg.toString().trim() });
            socket.close();
            checkCompletion();
        }
    });

    socket.on('error', (err) => {
        if (!isHandled) {
            isHandled = true;
            clearTimeout(timeout);
            scanResult.push({ Port: port, Protocol: 'UDP', Status: `CLOSED (${err.code})`, Banner: '-' });
            socket.close();
            checkCompletion();
        }
    });

    socket.send(Buffer.from('PING'), port, host, (err) => {
        if (err && !isHandled) {
            isHandled = true;
            clearTimeout(timeout);
            scanResult.push({ Port: port, Protocol: 'UDP', Status: 'ERROR', Banner: err.message });
            socket.close();
            checkCompletion();
        }
    });
}

// main execution
console.log(`[i] ${host} Scanning...`);

ports.forEach((port) => {
    portController(port, host);
    udpPortController(port, host);
});