import {http} from "@/shared/api/http.ts"

export const stats =() =>
    http.get("/users/me/stats")

export const attemptHistory = (skip: number = 0, limit: number = 20) =>
    http.get(`/users/me/attempts?skip=${skip}&limit=${limit}`)