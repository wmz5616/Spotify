const apiBaseUrl = 'http://localhost:3001';
const apiKey = 'your-secure-random-api-key-here'; // 应该根据实际使用的 Key 修改

async function testApiInconsistency() {
  console.log('Testing /api/albums for inconsistency across 3 requests...');
  
  const results: any[] = [];
  
  for (let i = 0; i < 3; i++) {
    const response = await fetch(`${apiBaseUrl}/api/albums`, {
      headers: { 'x-api-key': apiKey }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();
    const data = rawData.map((a: any) => ({ id: a.id, title: a.title }));
    results.push(data);
    console.log(`Request ${i + 1} sample:`, data.slice(0, 3));
  }

  const isSame = JSON.stringify(results[0]) === JSON.stringify(results[1]) && 
                 JSON.stringify(results[1]) === JSON.stringify(results[2]);

  if (isSame) {
    console.log('\nSUCCESS: /api/albums response is CONSISTENT across refreshes.');
    console.log('Checking cover links consistency...');
    // 可以增加检查具体封面链接是否对应数据库
  } else {
    console.log('\nFAILURE: /api/albums response is INCONSISTENT!');
  }
}

testApiInconsistency().catch(console.error);
