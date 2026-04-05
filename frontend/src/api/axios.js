// 공통 설정 파일
import axios from "axios";

// 1. 비동기 통신을 구현하는 함수를 선언 / 접속하려는 백엔드 및 타 사이트 url 선언
const API = axios.create({
  baseURL: "http://localhost:3001"
});

export default API;