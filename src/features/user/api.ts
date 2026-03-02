import {http} from "@/shared/api/http.ts"
import type {Config} from "./type.ts"

export const getMe = () =>
    http.get('/users/me')

export const profile = () =>
    http.get('/users/profile')

export const config = () =>
    http.get('/users/config')

export const updateConfig = (data: Config) =>
    http.patch('/users/config', data)
