const { app } = require('electron');
const fs = require('fs');
const logFile = 'test_result.txt';
fs.writeFileSync(logFile, `App: ${!!app}\nVersions: ${JSON.stringify(process.versions, null, 2)}\nEnv: ${JSON.stringify(process.env.ELECTRON_RUN_AS_NODE)}\n`);
process.exit(0);
