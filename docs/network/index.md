# 计算机网络

计算机网络面试，重点把 **分层、寻址、连接建立、应用层请求** 串成一条链路讲清。

本模块主要面向 **高级 Java / 后端面试**，按以下路径整理：

1. **网络传输场景** — OSI / TCP-IP、DNS、从输入网址到页面渲染、端口与四元组、HTTP→HTTPS、排障与 ping 误区
2. **TCP / UDP 传输层** — 头部、三次握手与两个队列、四次挥手、TIME_WAIT / CLOSE_WAIT、可靠性与拥塞控制、粘包、MSS、连接上限与 SYN 洪水
3. **HTTPS 详细过程** — DNS、三次握手、TLS 1.2 / 1.3、加密传输、close_notify、四次挥手，以及 HTTP/1.0、1.1、HTTP/2、HTTP/3
4. **应用层面试题** — HTTP 报文与方法、状态码、会话、HTTPS 握手、跨域、RPC、Nginx

## 学习目标

- 能用口诀和快递类比讲清分层与各层职责
- 能按时间线口述「输入网址后发生了什么」
- 能讲清 DNS、端口、四元组分发，以及 ping 与 HTTP 为何可互不相关
- 能讲清 TCP 三次握手、半连接 / 全连接队列、四次挥手、TIME_WAIT 与 CLOSE_WAIT、粘包与 MSS，以及和 UDP 的选择
- 能按顺序讲清 HTTPS：DNS、三次握手、TLS 1.2 与 1.3、对称加密、close_notify、四次挥手
- 能讲清 HTTP/1.0、HTTP/1.1、HTTP/2、HTTP/3 在连接、队头阻塞和传输层上的差别
- 能讲清 HTTP 幂等、502/504、Cookie 与 JWT、TLS 混合加密，以及 Nginx 四层 / 七层
