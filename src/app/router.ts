import {createRouter, createWebHistory} from "vue-router"
const MainPage = () => import("@/pages/MainPage/MainPage.vue");
const QuizPage = () => import("@/pages/Quizes/QuizPage.vue")
const ProfilePage = () =>  import("@/pages/ProfilePage/ProfilePage.vue")
const LeaderPage = () => import("@/pages/LeaderPage/LeaderPage.vue");
const DailyChallengePage = () => import("@/pages/DailyChallenge/DailyChallengePage.vue");
const DuelsPage = () => import("@/pages/DuelsPage/DuelsPage.vue");

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: MainPage},
        {path: '/quiz', component: QuizPage},
        // Deep-link по хеш-коду: dovtalab.app/quiz/QZS+R6GO1KGYE5KB
        {path: '/quiz/:hashCode', component: QuizPage},
        {path: '/profile', component: ProfilePage },
        {path: '/leaders', component: LeaderPage},
        {path: '/daily', component: DailyChallengePage},
        {path: '/duels', component: DuelsPage},
        {path: '/duels/:duelId', component: DuelsPage},
    ]
})

export default router