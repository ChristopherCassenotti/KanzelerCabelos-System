import axios from "axios";
import { env } from "./env";

export const rawHttp = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});
