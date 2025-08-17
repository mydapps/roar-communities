const express = require('express');
const app = express();

// Test SSE endpoint
app.get('/test-sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('data: {"type": "test", "message": "SSE is working!"}\n\n');
  
  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    res.write(`data: {"type": "counter", "count": ${counter}}\n\n`);
    
    if (counter >= 5) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);
});

app.listen(3004, () => {
  console.log('SSE test server running on http://localhost:3004');
  console.log('Test with: curl -N http://localhost:3004/test-sse');
}); 