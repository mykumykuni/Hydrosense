// Test Upstash Redis connectivity
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const kvUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const kvToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

  const testKey = 'hydrosense:test:connectivity';
  const testValue = `test-${Date.now()}`;

  try {
    // Test SET
    console.log('[KV-TEST] Attempting SET...');
    const setResp = await fetch(`${kvUrl}/set/${encodeURIComponent(testKey)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: testValue })
    });

    const setData = await setResp.json();
    console.log(`[KV-TEST] SET response: ${setResp.status}`, setData);

    if (setResp.status !== 200) {
      return res.status(200).send(JSON.stringify({
        ok: false,
        error: 'SET failed',
        status: setResp.status,
        response: setData,
        kvUrl: kvUrl.substring(0, 50) + '...',
        kvTokenSet: Boolean(kvToken),
        troubleshoot: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel'
      }));
    }

    // Test GET
    console.log('[KV-TEST] Attempting GET...');
    const getResp = await fetch(`${kvUrl}/get/${encodeURIComponent(testKey)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kvToken}`
      }
    });

    const getData = await getResp.json();
    console.log(`[KV-TEST] GET response: ${getResp.status}`, getData);

    if (getResp.status === 200 && getData.result === testValue) {
      return res.status(200).send(JSON.stringify({
        ok: true,
        message: '✓ Upstash Redis is working correctly',
        testKey,
        setValue: testValue,
        getValue: getData.result,
        kvUrl: kvUrl.substring(0, 50) + '...',
        kvTokenSet: Boolean(kvToken)
      }));
    } else {
      return res.status(200).send(JSON.stringify({
        ok: false,
        error: 'GET verification failed',
        status: getResp.status,
        expected: testValue,
        received: getData.result,
        response: getData
      }));
    }
  } catch (err) {
    console.error('[KV-TEST] Exception:', err.message);
    return res.status(200).send(JSON.stringify({
      ok: false,
      error: 'Exception during test',
      message: err.message,
      kvUrlSet: Boolean(kvUrl),
      kvTokenSet: Boolean(kvToken)
    }));
  }
};
