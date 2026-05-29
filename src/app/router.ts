import {createRouter, createWebHistory} from "vue-router"
const MainPage = () => import("@/pages/MainPage/MainPage.vue");
const QuizPage = () => import("@/pages/Quizes/QuizPage.vue")
const ProfilePage = () =>  import("@/pages/ProfilePage/ProfilePage.vue")
const LeaderPage = () => import("@/pages/LeaderPage/LeaderPage.vue");

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: MainPage},
        {path: '/quiz', component: QuizPage},
        {path: '/profile', component: ProfilePage },
        {path: '/leaders', component: LeaderPage},
    ]
})

export default router