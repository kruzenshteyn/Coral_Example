async function api(path, options) {
  const config = options || {};
  const headers = Object.assign({ Accept: "application/json" }, config.headers || {});
  const init = {
    method: config.method || "GET",
    credentials: "include",
    headers: headers,
  };

  if (config.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(config.body);
  }

  const response = await fetch(path, init);
  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("Invalid JSON from " + path);
  }

  if (!payload || payload.ok !== true) {
    const error = new Error((payload && payload.error) || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload.data;
}
