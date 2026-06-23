import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Notes",
  description: "Learning Notes",
  base: '/my-notes/',
  title: 'My Notes',
  description: 'Learning Notes',
  vite: {
    server: {
      host: '127.0.0.1',
      port: 3000
    }
  },
  themeConfig: {
    mediumZoom: true,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Java基础', link: '/java/' },
      { text: 'Redis', link: '/redis/' },
      { text: 'Git', link: '/git/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    sidebar: [
      {
        text: 'Java基础',
        collapsible: true,
        collapsed: false,
        items: [
          {
            text: '并发编程',
            collapsible: true,
            collapsed: true,
            items: [
              { text: '并发编程基础', link: '/java/concurrency/basics' },
              { text: 'ThreadLocal', link: '/java/concurrency/threadlocal' },
              { text: 'JMM', link: '/java/concurrency/jmm' },
              { text: 'volatile', link: '/java/concurrency/volatile' },
              { text: 'synchronized', link: '/java/concurrency/synchronized' },
              { text: 'CAS & AQS', link: '/java/concurrency/cas-aqs' },
            ]
          },
        ]
      },
      {
        text: 'Redis',
        collapsible: true,
        collapsed: false,
        items: [
          {
            text: 'Redis实战',
            collapsible: true,
            collapsed: true,
            items: [
              { text: '初识Redis', link: '/redis/intro' },
            ]
          },
          {
            text: 'Git',
            collapsible: true,
            collapsed: true,
            items: [
              { text: 'Git基础', link: '/git/git-base' },
            ]
          }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/qingchi27/my-notes' }
    ]
  }
})