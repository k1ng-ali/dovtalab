import {http} from "@/shared/api/http.ts";

export const telegramAuth = (data: any) =>
    http.post('/auth/web_app', data)

export const refreshToken = () =>
    http.post('/auth/refresh')

const TestUser = {
    "id": 1653169072,
    "first_name": "Mukhammad Ali",
    "last_name": null,
    "username": "King_a1i",
    "photo_url": "https://t.me/i/userpic/320/z2kpbDfpJbzZZxX-VWTxjKWJh3qytVxlnHW5XHEJK_Y.svg",
    "auth_date": 0,
    "hash": "string"
}

export const testLogin = () => http.post('/auth/test', TestUser)