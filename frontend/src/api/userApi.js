import axios from "axios";

const userApi = axios.create({
  baseURL: "http://localhost:3001/api/users",
  headers: {
    "Content-Type": "application/json",
  },
});

// 수정: 요청마다 accessToken 붙이기
userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getMyProfileApi = async () => {
  const response = await userApi.get("/me");
  return response.data?.data ?? response.data;
};

// 수정: FormData 전송 지원
export const updateMyProfileApi = async (payload) => {
  const response = await userApi.patch("/me", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data?.data ?? response.data;
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