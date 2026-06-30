import { createApp } from 'vue'
import {createPinia} from "pinia";
import './style.css'
import App from './App.vue'
import router from "./app/router.ts";
import i18n from './shared/i18n'
import 'ant-design-vue/dist/reset.css';

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount(`#app`)