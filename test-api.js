const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testAPI() {
  console.log('🔍 Test des endpoints API...\n');

  const endpoints = [
    '/health',
    '/livestreams',
    '/events',
    '/alerts'
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      console.log(`✅ ${endpoint}: ${result.status} - ${result.data.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ ${endpoint}: Erreur - ${error.message}`);
    }
  }
}

testAPI(); 