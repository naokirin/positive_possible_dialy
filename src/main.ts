import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { diary } from '$lib/diary'

await diary.open()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
