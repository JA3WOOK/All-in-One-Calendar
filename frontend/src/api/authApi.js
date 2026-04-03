import axios from "axios";

const authApi = axios.create({
  baseURL: "http://localhost:3001/api/auth",
  headers: {
    "Content-Type" : "application/json",
  },
});

export const loginApi = async(payload) => {
 const response = await authApi.post("/login", payload);
  return response.data;
};

export const signupApi = async (payload) => {
  const response = await authApi.post("/signup", payload);
  return response.data;
};

export default authApi;

