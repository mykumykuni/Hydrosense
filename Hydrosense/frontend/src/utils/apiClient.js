export const createApiClient = (apiBase, token) => {
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  });

  const getJson = async (path) => {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'GET',
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return { response, data };
  };

  const postJson = async (path, body) => {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return { response, data };
  };

  const patchJson = async (path, body) => {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return { response, data };
  };

  return {
    getJson,
    postJson,
    patchJson
  };
};
