# Kafka vs RocketMQ

对比放最后。前面机制没讲清，对比只会变成「谁更快」。

---

## 1. 差异一览

Kafka 为 **日志 / 流管道** 而生；RocketMQ 为 **交易业务消息** 而生。

| 维度 | Kafka | RocketMQ |
|------|------|----------|
| 定位 | 高吞吐流式平台 | 企业级业务中间件 |
| 分片 | Partition | MessageQueue |
| 存储 | 每分区一份 Log | 全量进 CommitLog + 索引 |
| 路由 / 元数据 | 集群 / KRaft | NameServer |
| 顺序 | 分区内 | Queue 内 + 队列锁 |
| 事务 | EOS，偏流处理 | 半消息 + 回查，偏本地事务 |
| 延迟消息 | 要自己做 | 原生 |
| 重试 / 死信 | 多靠框架自建 | 原生更完整 |
| 按 key 查消息 | 弱 | IndexFile |
| 大数据生态 | Flink / Spark / ELK 很强 | 相对弱 |
| 吞吐 | 通常更高 | 高，但更偏实时和功能 |
| 延迟 | 攒批，略高 | 更低更稳 |

---

## 2. 为什么 Kafka 吞吐通常更高？

不要说「Kafka 比 RocketMQ 性能好」。说 **设计取舍**：Kafka 把「分区并行 + 顺序 IO + 少拷贝 + 少往返」做到更极致，并愿意用一点延迟换吞吐。

Kafka 快的六条（详见 [Kafka 为什么这么快](./kafka#9-为什么这么快)）在对比里要落到「和 RocketMQ 差在哪」：

| 手段 | Kafka | RocketMQ 相对更「厚」的地方 |
|------|--------|------------------------------|
| **顺序写** | 分区数适中时，每分区一份日志，纯追加 | 全量进一条 CommitLog，写稳；读要先索引再跳本体 |
| **Partition 并行** | 分区打到多 Broker，读写天然并行 | Queue 也能并行，但顺序消费会锁队列 |
| **Page Cache** | 写内存即返回，消费常命中缓存 | 同样用 PageCache，ConsumeQueue 很小好缓存 |
| **Zero Copy** | `sendfile` 消费几乎不进用户态 | 读路径多一次索引跳转，零拷贝不如 Kafka 彻底 |
| **Batch** | `batch.size` + `linger.ms` 攒满再发，很激进 | 默认更偏实时投递，攒批更保守 |
| **Compression** | RecordBatch 整批压缩再传、再落盘 | 也压缩，但批更小，摊薄效果弱一些 |

再加上功能负担：RocketMQ 的重试队列、延迟调度、事务回查、IndexFile 都有额外写。Kafka 功能更薄，复杂度留给客户端和 Flink 生态。

另一面：Topic / 队列极多时，Kafka 多文件交织写会退化；RocketMQ 单 CommitLog 更稳。分区适中、流式管道场景，Kafka 通常吞吐更高。

> Kafka 用延迟换吞吐（狠攒批、功能做减法）；RocketMQ 用吞吐换实时和业务能力。

---

## 3. 怎么选？

**Kafka**：日志采集、Flink / Spark 管道、埋点 Metrics、CDC、长保留回放。  
记：**高吞吐 + 流数据 + 大数据生态**。

**RocketMQ**：订单 / 支付 / 库存解耦、要事务消息、延迟关单、金融级同步刷盘、按 key 查轨迹、严格顺序。  
记：**业务消息 + 事务 + 延迟 + 顺序 + 重试**。

> 日志流式找 Kafka，交易业务找 RocketMQ。

---

## 4. 面试怎么串

从 MQ 开始：

```text
为什么用（异/解/削）→ 不丢三段 → 幂等 → 局部有序 → 积压
```

从 Kafka 开始：

```text
架构 → Topic/Partition → 为何分区 → Group 与一对一关系 → Rebalance
→ 生产攒批 / 消费 poll → Offset → 存储与高吞吐 → 副本 ISR
→ 不丢 → 重复 → 幂等 → Exactly Once → 积压 → KRaft
```

从 RocketMQ 开始：

```text
架构 → NameServer → Broker → CommitLog 三件套
→ 顺序 / 延迟 / 事务 → 重试 / 死信 → 再对比 Kafka
```

---

## 5. 追问速查

| 追问 | 一句话 |
|------|--------|
| 丢消息怎么查 | 生产 ack、存储刷盘副本、消费 Offset 时机 |
| 为何消费端要幂等 | 只保证 at-least-once |
| 加消费者没提速 | 已顶满分区数 |
| Rebalance 危害 | 停消费 + 可能重复 |
| acks=all 一定不丢？ | 还要 `min.insync.replicas≥2` |
| HW 和 LEO | LEO 是末尾，HW 是 ISR 都同步到的位置 |
| 事务回查防什么 | Producer 二次确认前宕机，半消息悬挂 |
| 顺序消息为何堵 | 失败本地无限重试，不跳过 |
| 分区能减少吗 | Kafka 不能，只能加 |
| 死信会一直在吗 | 不会，有保留期，要及时处理 |
