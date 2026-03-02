import {createRouter, createWebHistory} from "vue-router"
import MainPage from "@/pages/MainPage/MainPage.vue";
import QuizPage from "@/pages/Quizes/QuizPage.vue"
import ProfilePage from "@/pages/ProfilePage/ProfilePage.vue"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: MainPage},
        {path: '/quiz', component: QuizPage},
        { path: '/profile', component: ProfilePage },
    ]
})

export default router