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
      { text: 'Java框架', link: '/ssm/' },
      { text: 'Redis', link: '/redis/' },
      { text: '算法', link: '/algorithm/' },
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
            text: 'JVM',
            collapsible: true,
            collapsed: true,
            items: [
              { text: 'Java 内存区域', link: '/java/jvm/memory-areas' },
              { text: '类加载机制', link: '/java/jvm/class-loading' },
              { text: '垃圾回收与内存分配', link: '/java/jvm/gc-memory' },
              { text: 'jvm调优', link: '/java/jvm/jvm-tuning' },
            ]
          },
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
              { text: '线程池（ThreadPool）', link: '/java/concurrency/thread-pool' },
            ]
          },
        ]
      },
      {
        text: 'Java 框架',
        collapsible: true,
        collapsed: false,
        items: [
          {
            text: 'Spring',
            collapsible: true,
            collapsed: false,
            items: [
              { text: 'Spring 概述与核心', link: '/ssm/spring' },
              { text: 'Spring Bean', link: '/ssm/spring-bean' },
              { text: 'Spring AOP', link: '/ssm/spring-aop' },
              { text: 'Spring 事务', link: '/ssm/spring-transaction' },
            ]
          },
          {
            text: 'Spring MVC',
            collapsible: true,
            collapsed: false,
            items: [
              { text: 'Spring MVC', link: '/ssm/spring-mvc/spring-mvc' },
            ]
          },
          {
            text: 'MyBatis',
            collapsible: true,
            collapsed: false,
            items: [
              { text: 'MyBatis', link: '/ssm/mybatis' },
              { text: 'MyBatis-Plus', link: '/ssm/mybatis-plus' },
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
      },
      {
        text: '算法',
        collapsible: true,
        collapsed: false,
        items: [
          {
            text: '数组',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '二分法查找有序数组目标值', link: '/algorithm/array/二分法查找有序数组目标值' },
            ]
          },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/qingchi27/my-notes' }
    ]
  }
})