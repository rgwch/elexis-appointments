import { mount } from 'svelte'
import '/lib/i18n/i18n'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
