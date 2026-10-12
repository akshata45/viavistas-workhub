const API_BASE_URL = "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("workhubToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();

    throw new Error(
      `Server returned non-JSON response (${response.status}). ${text.slice(
        0,
        100
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

export default API_BASE_URL;