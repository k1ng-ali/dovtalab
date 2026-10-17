import { createApp } from 'vue'
import {createPinia} from "pinia";
// Сброс ant-design раньше наших стилей, чтобы не перебивал шрифт и фон
import 'ant-design-vue/dist/reset.css'
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import '@fontsource/onest/600.css'
import '@fontsource/onest/700.css'
import '@fontsource/onest/800.css'
import './style.css'
import './shared/styles/design.css'
import App from './App.vue'
import router from "./app/router.ts";
import i18n from './shared/i18n'
import { setupTelegramChrome } from './shared/lib/telegramChrome'

setupTelegramChrome()

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount(`#app`)