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
      { text: 'Redis', link: '/redis/' },
      { text: 'Git', link: '/git/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    sidebar: [
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
      { icon: 'github', link: 'https://qingchi27.github.io/my-notes' }
    ]
  }
})