import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "My Notes",
  description: "Learning Notes",
  base: '/my-notes/',
  title: 'My Notes',
  description: 'Learning Notes',
  vite: {
    server: {
      host: '127.0.0.1',
      port: 3000
    },
    // Mermaid 依赖的 dayjs 为 CJS，需强制预构建，否则报 default export 错误
    optimizeDeps: {
      include: ['dayjs', 'mermaid', '@braintree/sanitize-url']
    },
    resolve: {
      alias: {
        dayjs: 'dayjs/',
      }
    },
    build: {
      commonjsOptions: {
        include: [/dayjs/, /node_modules/]
      }
    }
  },
  // 允许节点中使用 HTML（如 <br/>）等写法，保证流程图正常渲染
  mermaid: {
    securityLevel: 'loose',
  },
  themeConfig: {
    mediumZoom: true,
    outline: {
      level: [2, 3],
      label: '目录'
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Java基础', link: '/java/' },
      { text: 'Java框架', link: '/ssm/' },
      { text: 'MySQL', link: '/mysql/' },
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
          { text: 'Java语言基础', link: '/java/basics/java基础' },
          { text: 'Java集合', link: '/java/basics/collection' },
          {
            text: 'JVM',
            collapsible: true,
            collapsed: true,
            items: [
              { text: 'Java 内存区域', link: '/java/jvm/memory-areas' },
              { text: '类加载机制', link: '/java/jvm/class-loading' },
              { text: '垃圾回收与内存分配', link: '/java/jvm/gc-memory' },
              { text: 'jvm调优', link: '/java/jvm/jvm-tuning' },
              { text: 'Full GC 频繁排查', link: '/java/jvm/full-gc-troubleshooting' },
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
              { text: 'Spring 概述与核心', link: '/ssm/spring/spring' },
              { text: 'Spring Bean', link: '/ssm/spring/spring-bean' },
              { text: 'Spring AOP', link: '/ssm/spring/spring-aop' },
              { text: 'Spring 事务', link: '/ssm/spring/spring-transaction' },
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
            text: 'Spring Boot',
            collapsible: true,
            collapsed: false,
            items: [
              { text: 'Spring Boot', link: '/ssm/spring-boot/springboot' },
            ]
          },
          {
            text: 'MyBatis',
            collapsible: true,
            collapsed: false,
            items: [
              { text: 'MyBatis', link: '/ssm/mybatis/mybatis' },
              { text: 'MyBatis-Plus', link: '/ssm/mybatis/mybatis-plus' },
            ]
          },
        ]
      },
      {
        text: 'MySQL',
        collapsible: true,
        collapsed: false,
        items: [
          { text: 'SQL 语法', link: '/mysql/sql-syntax' },
          { text: '存储引擎', link: '/mysql/storage-engine' },
          { text: '索引', link: '/mysql/indexes' },
          { text: '事务', link: '/mysql/transaction' },
          { text: '锁', link: '/mysql/lock' },
          { text: '日志', link: '/mysql/log' },
          { text: '高性能', link: '/mysql/high-performance' },
        ]
      },
      {
        text: 'Redis',
        collapsible: true,
        collapsed: false,
        items: [
          { text: '初识 Redis', link: '/redis/intro' },
          { text: 'Redis 数据对象', link: '/redis/data-objects' },
          { text: 'Redis 执行', link: '/redis/execution' },
          { text: 'Redis 持久化', link: '/redis/persistence' },
          { text: 'Redis 内存淘汰策略', link: '/redis/eviction' },
          { text: 'Redis 场景', link: '/redis/scenarios' },
          { text: 'Redis 分布式锁', link: '/redis/distributed-lock' },
          { text: 'Redis 集群', link: '/redis/cluster' },
        ]
      },
      {
        text: 'Git',
        collapsible: true,
        collapsed: true,
        items: [
          { text: 'Git基础', link: '/git/git-base' },
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
              { text: '双指针 - 原地移除元素', link: '/algorithm/array/双指针-原地移除元素' },
              { text: '双指针 - 有序数组平方', link: '/algorithm/array/双指针-有序数组平方' },
              { text: '双指针 - 三数之和', link: '/algorithm/array/双指针-三数之和' },
            ]
          },
          {
            text: '哈希',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '数组计数 - 有效的字母异位词', link: '/algorithm/hash/数组计数-有效的字母异位词' },
              { text: '哈希集合 - 快乐数', link: '/algorithm/hash/哈希集合-快乐数' },
              { text: '哈希表 - 两个数组的交集', link: '/algorithm/hash/哈希表-两个数组的交集' },
            ]
          },
          {
            text: '链表',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '双指针 - 反转链表', link: '/algorithm/linked-list/双指针-反转链表' },
              { text: '虚拟头 - 两两交换链表节点', link: '/algorithm/linked-list/虚拟头-两两交换链表节点' },
              { text: '虚拟头 - 删除链表倒数第 N 个节点', link: '/algorithm/linked-list/虚拟头-删除链表倒数第N个节点' },
              { text: '链表相交', link: '/algorithm/linked-list/链表相交' },
              { text: '快慢指针 - 环形链表 II', link: '/algorithm/linked-list/快慢指针-环形链表II' },
            ]
          },
          {
            text: '滑动窗口',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '滑动窗口 - 长度最小的子数组', link: '/algorithm/sliding-window/滑动窗口-长度最小的子数组' },
              { text: '滑动窗口 - 无重复字符的最长子串', link: '/algorithm/sliding-window/滑动窗口-无重复字符的最长子串' },
            ]
          },
          {
            text: '贪心',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '贪心 - 赢得比赛的最少训练时长', link: '/algorithm/greedy/贪心-赢得比赛的最少训练时长' },
              { text: '贪心 - 根据行列求和构造矩阵', link: '/algorithm/greedy/贪心-根据行列求和构造矩阵' },
            ]
          },
          {
            text: '堆',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '小顶堆 - 前 K 个高频元素', link: '/algorithm/heap/小顶堆-前K个高频元素' },
            ]
          },
          {
            text: '设计',
            collapsible: true,
            collapsed: false,
            items: [
              { text: '哈希双向链表 - LRU 缓存', link: '/algorithm/design/哈希双向链表-LRU缓存' },
            ]
          },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/qingchi27/my-notes' }
    ]
  }
}))
