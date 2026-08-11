# Redis 集群


---

## 1. Redis 有哪些集群 / 高可用方案？它们有什么区别？

主要有三种：

| 方案 | 核心 | 数据分片 | 自动故障转移 | 典型用途 |
|---|---|---|---|---|
| 主从复制 | Master + Replica | ❌ | ❌ | 数据备份、读扩展 |
| Sentinel | 主从 + Sentinel | ❌ | ✅ | 高可用 |
| Redis Cluster | 多 Master + Replica | ✅ | ✅ | 分布式、高并发、大数据量 |

### 1.1 主从复制

一个 Master，多个 Replica。

```text
        Master
       /      \
 Replica1    Replica2
```

Master 负责写，Replica 默认负责读。

| 优点 | 缺点 |
|---|---|
| 数据备份 | 无法自动故障转移 |
| 读性能扩展 | 单个 Master 的容量和写性能存在瓶颈 |
| Replica 可在故障后手动提升为 Master | |

### 1.2 Sentinel

在主从复制基础上增加 Sentinel。

```text
          Sentinel
        /    |    \
       ↓     ↓     ↓
     Master
     /    \
 Replica  Replica
```

Sentinel 负责：

1. 监控 Redis  
2. 判断 Master 是否故障  
3. 自动选举 Replica  
4. 执行故障转移  
5. 通知客户端新的 Master  

解决的是**高可用**，但不解决数据分片。

### 1.3 Redis Cluster

多个 Master，每个 Master 负责一部分 Hash Slot。

```text
Master1 → 0 ~ 5460
Master2 → 5461 ~ 10922
Master3 → 10923 ~ 16383
```

每个 Master 再配置 Replica：

```text
Master1 → Replica1
Master2 → Replica2
Master3 → Replica3
```

同时解决：数据分片、水平扩容、高可用、自动故障转移。

**面试一句话：**

> 主从解决复制，Sentinel 解决高可用，Cluster 解决分片 + 高可用 + 水平扩展。


---

## 2. Redis 主从复制流程是什么？

核心链路：

```text
Replica
   │
   │ PSYNC
   ↓
Master
   │
   ├── 判断是否可以增量同步
   │
   ├── 可以 → 发送 backlog 中缺失的数据
   │
   └── 不可以 → 全量同步
                     │
                     ├── BGSAVE
                     ├── RDB
                     └── Replica 加载 RDB
```

### 2.1 第一步：Replica 建立连接

Replica 启动后连接 Master，并发送：

```text
PSYNC replicationId offset
```

| 参数 | 含义 |
|---|---|
| `replicationId` | Master 的复制历史标识 |
| `offset` | Replica 已同步到的进度 |

可简单理解为：复制数据的进度编号。

### 2.2 第二步：Master 判断同步方式

Master 检查：Replica 缺失的数据，我还能不能提供？

- **能** → 增量同步  
- **不能** → 全量同步  

### 2.3 RDB 是什么？

RDB 是 Redis 的一种持久化文件。全量同步时，Master 通常后台生成 RDB，再发送给 Replica。

```text
Master
   │
 BGSAVE
   ↓
 RDB
   │
   ↓
Replica
```

### 2.4 backlog 是什么？

Replication Backlog 是 Master 保存的一块：**最近执行过的复制命令的环形缓冲区**。

例如：

```text
backlog: [1001][1002][1003][1004][1005][1006]...
Replica 已同步到 offset = 1003
Master 当前 offset = 1006
→ Replica 缺少 1004、1005、1006，只需发送这些即可
```


---

## 3. Redis 为什么默认采用异步复制？

因为异步复制性能更高。

### 3.1 异步 vs 同步

异步：

```text
Client → Master 写入成功 → 立即返回 Client
              ↓
           异步复制
              ↓
           Replica
```

同步类似：

```text
Client → Master → 等待 Replica 确认 → 再返回 Client
```

后者明显增加网络 RTT 和延迟。

### 3.2 异步复制的优点

1. **性能高**：Master 不需等待 Replica  
2. **延迟低**：客户端不被 Replica 网络拖慢  
3. **吞吐量高**：适合 Redis 这种高性能内存数据库  

### 3.3 缺点

最大问题：

> Master 写成功 ≠ Replica 已经同步成功。

例如：

```text
Client → Master：SET A 100 → 返回成功
→ Master 突然宕机，Replica 还没同步到
→ 故障转移后 Replica 成为新 Master，A 不存在
```

因此：**主从复制存在数据丢失窗口**。


---

## 4. Slave 断线重连后，Master 怎么知道发送哪些数据？

核心：

> `replicationId` + `offset` + `replication backlog`

### 4.1 示例

Master 当前 `offset = 10000`，Replica 之前同步到 `offset = 9900`。

重连：

```text
PSYNC replicationId 9900
```

Master 检查：`9901 ~ 10000` 是否还在 backlog？

| 情况 | 处理 |
|---|---|
| 还在 | 增量同步：发送 9901～10000 |
| 已不在 | 全量同步（RDB） |

例如 Replica `offset = 100`，而 Master backlog 只覆盖 `500 ~ 1000`，则 100～499 已被覆盖，只能 RDB 全量同步。

### 4.2 什么情况下全量同步？

1. Replica **第一次**连接 Master（无同步历史）  
2. `replicationId` **不匹配**（无法确认同一复制历史）  
3. Replica 缺失的数据**已经不在 backlog**  

### 4.3 什么情况下增量同步？

满足：

> Replica 的 `replicationId` 与 Master 当前复制历史匹配，**并且**缺失的 offset 数据仍保存在 replication backlog 中。


---

## 5. Sentinel 是什么？如何实现自动故障转移？

Sentinel 本质上是：**Redis 高可用监控和故障转移系统**。

主要负责：

1. 监控 Redis  
2. 判断节点是否故障  
3. 选举 Leader Sentinel  
4. 选择新的 Master  
5. 执行故障转移  
6. 通知客户端  

### 5.1 故障转移过程

假设：

```text
Master
 /   \
R1   R2
```

Master 挂掉后：

1. Sentinel 发现 Master 无法响应  
2. 多个 Sentinel 互相确认  
3. 达到配置的 **quorum** → Master 被认为主观下线 / 客观下线  
4. Sentinel 之间选举出一个 **Leader**  
5. Leader Sentinel：选择一个 Replica → 提升为 Master → 让其他 Replica 复制新 Master → 通知客户端  

最终：

```text
        New Master
        /        \
      R1          R2
```


---

## 6. Redis Cluster 为什么有 16384 个 Hash Slot？

Redis Cluster 使用 **16384** 个 Hash Slot。Key 不直接映射到节点，而是：

```text
Key
 ↓
CRC16(key)
 ↓
CRC16(key) % 16384
 ↓
Hash Slot
 ↓
Slot 对应的 Master
```

例如：

```text
user:10086
    ↓
CRC16 → 12345
    ↓
Slot 12345 → Master3
```

### 6.1 为什么是 16384？

本质上是工程折中：在节点数量、集群规模、Gossip 通信开销和槽位粒度之间取平衡。

16384 个 Slot 能提供足够细的分片粒度；槽位数量过大也会增加节点间 Gossip 传播 Slot 信息的通信与元数据开销。

面试不要答成「因为 16384 性能最好」——不准确。


---

## 7. Redis Cluster 为什么不用一致性 Hash？

一致性 Hash：

```text
Hash Ring
────────────────────
Node1
       Node2
              Node3
```

增加节点时通常只影响部分 Key。

Redis Cluster 使用 Slot：

```text
16384 Slots
      ↓
Node1 → 0~5000
Node2 → 5001~10000
Node3 → 10001~16383
```

最大优势：**数据迁移和集群管理更加明确、可控**。

扩容示例：

```text
Node1: 0~5000
    ↓
Node1: 0~3000
Node4: 3001~5000   ← 明确迁移这些 Slot
```

**面试记一句：**

> Redis Cluster 使用固定数量的 Hash Slot，而不是一致性 Hash，主要是为了让数据分片、迁移、扩缩容和节点管理更加简单可控。


---

## 8. Redis Cluster 如何扩容？

假设：

```text
Node1 → 0~5460
Node2 → 5461~10922
Node3 → 10923~16383
```

增加 Node4：不是简单平均复制数据，而是**迁移部分 Hash Slot** 到 Node4。

例如：

```text
Node1: 0~5460
        ↓ 迁移部分 Slot
Node1: 0~4000
Node4: 4001~5460
```

迁移的是 **Slot 对应的数据**，而不是随便迁几个固定 Key。


---

## 9. Redis Cluster 迁移期间还能正常提供服务吗？

**可以。** 这是 Redis Cluster 的重要特点。

### 9.1 MOVED

Slot **已完成迁移**时：

```text
MOVED 100 192.168.1.10:6379
```

告诉客户端：Slot 100 已正式属于新节点；客户端应**永久更新** Slot 路由。

### 9.2 ASK

Slot **正在迁移**时：

```text
Node A → Slot 100 正在迁往 → Node B
```

客户端访问 Node A，A 发现该 Key 正在迁移，返回 **ASK**。

客户端：

```text
ASKING → 访问 Node B
```

ASK 是**临时**的，客户端不会因此永久修改 Slot 路由。

### 9.3 MOVED vs ASK

| | MOVED | ASK |
|---|---|---|
| Slot 状态 | 已完成迁移 | 正在迁移 |
| 是否更新客户端路由 | 是 | 否 |
| 是否临时 | 否 | 是 |

**面试直接背：**

> MOVED 是「你以后都去那里」，ASK 是「这一次你先去那里」。


---

## 10. Redis Cluster 如何保证高可用和数据一致性？为什么可能丢数据？

### 10.1 高可用

依赖 Master + Replica：

```text
Master1 ─ Replica1
Master2 ─ Replica2
Master3 ─ Replica3
```

正常：

```text
Client → Master → 异步复制 → Replica
```

Master 挂掉后：Replica 成为新 Master，实现自动故障转移。

### 10.2 为什么仍可能丢数据？

核心原因：主从复制默认是**异步**的。

```text
Client → Master：SET A 100 → 写成功并返回
→ Replica 还没同步 → Master 宕机
→ Replica 提升为 New Master，A 不存在
```

已向客户端返回成功的数据可能丢失。

### 10.3 Cluster 保证什么一致性？

不要说「Redis Cluster 保证强一致性」——错误。

更准确：

> Redis Cluster 通过主从复制和故障转移提供高可用，但主从复制默认异步，**不能保证强一致性**，故障切换等场景下存在数据丢失可能。
