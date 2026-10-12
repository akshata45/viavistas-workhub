const API_URL = "http://localhost:5000/api";

const getToken = () => {
  return localStorage.getItem("workhubToken");
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getUsers = async () => {
  const response = await fetch(
    `${API_URL}/users`,
    {
      headers: authHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to fetch employees."
    );
  }

  return data;
};

export const createUser = async (userData) => {
  const response = await fetch(
    `${API_URL}/users`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to create employee."
    );
  }

  return data;
};

export const updateUser = async (
  userId,
  userData
) => {
  const response = await fetch(
    `${API_URL}/users/${userId}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(userData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to update employee."
    );
  }

  return data;
};

export const deactivateUser = async (
  userId
) => {
  const response = await fetch(
    `${API_URL}/users/${userId}/deactivate`,
    {
      method: "PATCH",
      headers: authHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to deactivate employee."
    );
  }

  return data;
};