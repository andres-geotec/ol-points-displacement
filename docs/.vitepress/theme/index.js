// https://vitepress.dev/guide/custom-theme
import Layout from './Layout.vue'
import './style.css'
import 'ol/ol.css'

/** @type {import('vitepress').Theme} */
export default {
  Layout,
  enhanceApp({ app, router, siteData }) {
    // ...
  }
}

