const targetUrl = 'http://localhost:3000/reserve-item';

async function makeRequest(vuId) {
  const idempotencyKey = `idempotency-key-test-${vuId}-${Math.random()}`;
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        userId: vuId + 2, 
        itemId: 101, 
        quantity: 1
      })
    });
    
    const body = await res.json();
    return { status: res.status, body };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

async function run() {
  console.log('Sending 100 concurrent requests to reserve 5 items...');
  const promises = Array.from({ length: 100 }).map((_, i) => makeRequest(i));
  const results = await Promise.all(promises);
  
  let successes = 0;
  let failures = 0;
  let errorMessages = {};
  
  results.forEach(res => {
    if (res.status === 200) {
      successes++;
    } else {
      failures++;
      const errMsg = res.body?.error || res.error || 'Unknown error';
      errorMessages[errMsg] = (errorMessages[errMsg] || 0) + 1;
    }
  });
  
  console.log('--- TEST RESULTS ---');
  console.log(`Successes (Status 200): ${successes}`);
  console.log(`Failures  (Status 400+): ${failures}`);
  console.log('Error counts:', errorMessages);
  
  // Verify metrics endpoint
  const metricsRes = await fetch('http://localhost:3000/metrics');
  const metricsText = await metricsRes.text();
  const activeConnsLine = metricsText.split('\n').find(line => line.startsWith('db_active_connections'));
  console.log('Active database connections metric line:', activeConnsLine);
}

run();
