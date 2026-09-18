# 消息队列学习笔记

消息队列（MQ）是跨服务的异步通信中间件。本模块按面试主线整理：**为什么用 → 不丢 / 不重 / 有序 / 积压 → Kafka → RocketMQ → 对比选型**。

本模块主要围绕 **Java 后端开发 / 面试**，按以下路径系统整理：

1. **MQ 基础** — 异步、解耦、削峰；可靠性三段；幂等、顺序、积压
2. **Kafka** — Topic / Partition / Group / Rebalance、吞吐与副本、Exactly Once、KRaft
3. **RocketMQ** — NameServer、CommitLog、顺序 / 延迟 / 事务、重试与死信
4. **Kafka vs RocketMQ** — 差异、场景、口述路线

通用幂等、最终一致性也可对照 [分布式面试题](/ssm/microservice/distributed)。

## 学习目标

- 能按「生产 → 存储 → 消费」三段讲清消息不丢
- 能讲清 Kafka 分区并行、高吞吐和副本可靠性
- 能讲清 RocketMQ 业务消息能力（事务、延迟、重试）
- 能按业务场景选型，而不是背「谁更快」

## 目录

- **[MQ 基础](./basics)**
- **[Kafka](./kafka)**
- **[RocketMQ](./rocketmq)**
- **[Kafka vs RocketMQ](./compare)**
