const API_BASE_URL = "http://localhost:8000";

const LOGIN_ENDPOINT = "/auth/token";
const PRODUCTOS_ENDPOINT = "/productos";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function apiLogin(email, password) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await fetch(API_BASE_URL + LOGIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    let errorMsg = "Error en el login";
    try {
      const errorBody = await response.json();
      if (errorBody.detail) errorMsg = errorBody.detail;
    } catch (e) {

    }
    throw new Error(errorMsg);
  }

  return response.json();
}

async function apiGetProductos(filters = {}) {
  let url = API_BASE_URL + PRODUCTOS_ENDPOINT;
  const params = new URLSearchParams();

  if (filters.categoria) {
    params.append("categoria", filters.categoria);
  }
  if (filters.min_price) {
    params.append("min_price", filters.min_price);
  }
  if (filters.max_price) {
    params.append("max_price", filters.max_price);
  }

  const qs = params.toString();
  if (qs) {
    url += "?" + qs;
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = "Error al obtener productos";
    try {
      const errorBody = await response.json();
      if (errorBody.detail) errorMsg = errorBody.detail;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json(); 
}

async function apiCreateProducto(payload) {
  const response = await fetch(API_BASE_URL + PRODUCTOS_ENDPOINT, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = "Error al crear producto";
    try {
      const errorBody = await response.json();
      if (errorBody.detail) errorMsg = errorBody.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

async function apiUpdateProducto(id, payload) {
  const response = await fetch(`${API_BASE_URL + PRODUCTOS_ENDPOINT}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = "Error al actualizar producto";
    try {
      const errorBody = await response.json();
      if (errorBody.detail) errorMsg = errorBody.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

async function apiDeleteProducto(id) {
  const response = await fetch(`${API_BASE_URL + PRODUCTOS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = "Error al eliminar producto";
    try {
      const errorBody = await response.json();
      if (errorBody.detail) errorMsg = errorBody.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}
