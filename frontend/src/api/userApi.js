import axios from "axios";

const userApi = axios.create({
  baseURL: "http://localhost:3001/users",
  headers: {
    "Content-Type": "application/json",
  },
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getMyProfileApi = async () => {
  const response = await userApi.get("/me");
  return response.data;
};

export const updateMyProfileApi = async (payload) => {
  const response = await userApi.patch("/me", payload);
  return response.data;
};

export const changeMyPasswordApi = async (payload) => {
  const response = await userApi.patch("/me/password", payload);
  return response.data;
};

export const deleteMyAccountApi = async () => {
  const response = await userApi.delete("/me");
  return response.data;
};

export default userApi;