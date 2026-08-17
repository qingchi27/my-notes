# 日志

## 1. 三大日志总览

```text
MySQL 三大日志
│
├── binlog（二进制日志）
│   ├── 所属层：MySQL Server 层
│   ├── 类型：逻辑日志
│   ├── 用途：主从复制 + 数据恢复
│   └── 特点：通常持续追加
│
├── redo log（重做日志）
│   ├── 所属层：InnoDB 存储引擎
│   ├── 类型：物理日志（物理 / 逻辑混合）
│   ├── 用途：崩溃恢复 + 保证持久性
│   └── 特点：循环使用
│
└── undo log（回滚日志）
    ├── 所属层：InnoDB 存储引擎
    ├── 类型：逻辑日志
    ├── 用途：事务回滚 + MVCC 一致性读
    └── 特点：记录修改前的数据
```

口诀：**Undo 回滚 Redo 存，Binlog 主从要区分。**

除此之外还有运维常用日志：error log、slow query log、general log、relay log（从库中继）。

---

## 2. redo log（重做日志）

### 2.1 为什么需要 redo log？

如果每次修改都直接写磁盘数据页，随机 IO 严重，性能极差。

InnoDB 采用 WAL（Write-Ahead Logging，预写日志）：

```text
修改数据页
    ↓
先写 redo log（顺序追加写，高效）
    ↓
事务提交
    ↓
后台异步将脏页刷入磁盘
```

核心思想：**先写日志，再写数据。** 提交时保证日志已持久化，数据页可以慢慢刷。

redo log 两大核心作用：

```text
redo log
├── 崩溃恢复 —— 宕机后恢复数据页
└── WAL，提高写性能 —— 顺序 IO 替代随机 IO
```

### 2.2 redo log 写入流程

```text
事务修改数据
    ↓
修改 Buffer Pool（内存中的数据页）
    ↓
生成 redo log
    ↓
写入 redo log buffer
    ↓
根据刷盘策略 → redo log file（磁盘）
```

redo log 本身也需要刷到磁盘，不是「修改完就直接落盘」。

基本形态：

- 物理日志（记录数据页的修改）
- 固定大小，循环写（可配置组文件）
- 有 `writepos` / `checkpoint` 等位点概念

当日志写得太快、追不上刷脏时，可能触发更强同步，影响吞吐。

### 2.3 redo log 刷盘策略

由参数 `innodb_flush_log_at_trx_commit` 控制。

| 参数值 | 行为 | 安全性 | 性能 |
|---|---|---|---|
| 0 | 提交时不刷盘，后台线程定期刷 | 最低（可能丢失最近 1 秒事务） | 最好 |
| 1 | 提交时写入 redo log 并 fsync 刷盘 | 最高（提交即持久化） | 相对低 |
| 2 | 提交时写入 OS 缓存，后台线程 fsync | 中等（进程崩溃不丢，系统崩溃可能丢） | 较好 |

最简单记忆：

- `0`：都延后
- `1`：都立即
- `2`：写立即，刷盘延后

#### 设置为 1（生产推荐）

```text
事务提交
 ↓
redo log buffer
 ↓
写入 redo log file
 ↓
fsync 刷盘
 ↓
COMMIT 返回
```

最安全。正常情况下可以保证：提交成功的事务对应的 redo log 已经持久化到磁盘。

生产环境推荐：`innodb_flush_log_at_trx_commit = 1`

#### 设置为 0

```text
事务提交
 ↓
redo log buffer
 ↓
不立即刷盘
 ↓
后台线程定期刷
```

事务提交时不保证 redo log 已经刷盘。MySQL 进程崩溃可能丢失最近一秒左右的事务。性能最好，数据安全性最低。

#### 设置为 2

```text
事务提交
 ↓
redo log buffer
 ↓
写入 redo log file
 ↓
不立即 fsync
 ↓
后台线程 fsync
```

提交时写到操作系统缓存，但不立即刷磁盘：

- MySQL 进程崩溃 → 通常不会丢已经写入 OS 缓存的数据
- 操作系统宕机 → 可能丢失最近的事务

---

## 3. binlog（二进制日志 / 归档日志）

### 3.1 作用

| 用途 | 说明 |
|---|---|
| 主从复制 | 从库读取 binlog 重放，实现数据同步 |
| 数据恢复 | 结合全量备份进行时间点恢复（PITR） |
| 审计 | 追踪数据变更历史 |

### 3.2 三种格式

| 格式 | 记录内容 | 优点 | 缺点 | 推荐度 |
|---|---|---|---|---|
| STATEMENT | 执行的 SQL 语句 | 日志量小 | 某些 SQL 存在不确定性，主从可能不一致 | ⭐ |
| ROW | 具体哪一行发生了什么变化 | 数据一致性好，不依赖执行结果 | 日志量可能较大 | ⭐⭐⭐ |
| MIXED | 根据 SQL 情况自动选择 STATEMENT 或 ROW | 兼顾两者 | 逻辑复杂 | ⭐⭐ |

生产环境推荐：**ROW 格式**（数据一致性优先）。

简单理解 MIXED：

```text
普通 SQL          → STATEMENT
存在不确定性的 SQL → ROW
```

### 3.3 binlog 恢复数据示例

binlog 可以恢复数据，但用途和 redo log 不同。

误删数据：`DELETE FROM user;`

```text
昨天 00:00 全量备份
    ↓
应用 binlog（从备份时间点到误删前）
    ↓
恢复到目标时间点（Point-in-Time Recovery）
```

所以一定要区分：

- redo log → 崩溃恢复
- binlog → 主从复制 + 时间点恢复

### 3.4 binlog 刷盘策略

`sync_binlog`：

| 值 | 行为 |
|---|---|
| 1 | 每次事务提交都刷 binlog（最安全） |
| 0 | 由 OS 决定何时刷 |
| N | 每 N 次提交刷一次 |

双 1 配置（`innodb_flush_log_at_trx_commit=1` + `sync_binlog=1`）最稳，但性能开销更大。

---

## 4. redo log vs binlog

### 4.1 对比

| 对比项 | redo log | binlog |
|---|---|---|
| 所属层 | InnoDB 存储引擎 | MySQL Server 层 |
| 日志类型 | 物理日志（记录数据页修改） | 逻辑日志（记录 SQL / 行变更） |
| 主要用途 | 崩溃恢复 | 主从复制、时间点恢复 |
| 是否循环使用 | ✅ 是 | ❌ 否（持续追加） |
| 写入方式 | WAL 机制 | 事务提交时写入 |
| 恢复层面 | 物理层面（恢复 Buffer Pool 状态） | 逻辑层面（重新执行 SQL） |

**一句话总结：redo log 解决「宕机后怎么恢复」，binlog 解决「数据怎么复制和重新构建」。**

两者问题域不同，缺一不可，不能互相替代。

### 4.2 为什么崩溃恢复主要用 redo log 而不是 binlog？

1. redo log 是 InnoDB 专门为崩溃恢复设计的，记录了数据页的修改状态，采用 WAL 机制
2. binlog 是 Server 层逻辑日志，设计目标是主从复制和数据恢复，不负责恢复 Buffer Pool 状态
3. redo log 恢复更快：直接重做数据页修改，无需重新解析执行 SQL

```text
MySQL 宕机
    ↓
InnoDB 启动
    ↓
读取 redo log
    ↓
重做已提交事务的修改
    ↓
恢复数据页到一致状态
    ↓
完成 Crash Recovery
```

binlog 不负责把 InnoDB 的 Buffer Pool 状态恢复到崩溃前状态。

### 4.3 恢复方式怎么区分？

**redo log：物理层面的恢复**

```text
磁盘数据页
    ↓
找到 redo log
    ↓
重做已经提交的修改
    ↓
恢复到一致状态
```

**binlog：逻辑层面的恢复**

记录数据库发生了什么逻辑上的数据变化，例如：

```sql
UPDATE user SET name = '张三' WHERE id = 1;
```

或 ROW 格式记录：`id=1，name: 李四 → 张三`，然后重新执行 / 应用，恢复数据。

---

## 5. 两阶段提交（2PC）

### 5.1 为什么需要两阶段提交？

因为 MySQL 同时存在 redo log 和 binlog，两者写入是独立的过程。必须保证它们状态一致，否则会导致主从数据不一致。

| 场景 | 结果 |
|---|---|
| redo log 有，binlog 没有 | 主库恢复有数据，从库复制无数据 |
| binlog 有，redo log 没有 | 从库有数据，主库恢复无数据 |

#### 为什么不能直接写完 redo log 再写 binlog？

```text
redo log 写成功
    ↓
MySQL 宕机
    ↓
binlog 还没写
```

恢复时：redo log 有事务，binlog 没有事务。主库恢复出来有这次修改，从库通过 binlog 不知道这次修改 → 主从数据不一致。

#### 反过来也不行

```text
binlog 写成功
    ↓
MySQL 宕机
    ↓
redo log 没有提交
```

从库会执行这次修改（有数据），主库恢复时可能没有这次修改 → 同样主从不一致。

所以需要两阶段提交保证：**redo log + binlog 最终状态一致。**

### 5.2 两阶段提交流程

假设执行：`UPDATE user SET name='张三' WHERE id=1;`

```text
              UPDATE
                 ↓
          修改 Buffer Pool
                 ↓
        写入 redo log buffer
                 ↓
        ┌─────────────────┐
        │  第一阶段：Prepare │
        │ redo log 标记为 PREPARE │
        └─────────────────┘
                 ↓
             写 binlog
                 ↓
        ┌─────────────────┐
        │  第二阶段：Commit  │
        │ redo log 标记为 COMMIT │
        └─────────────────┘
                 ↓
              COMMIT 返回
```

**第一阶段 Prepare：** InnoDB 写 redo log，状态 = PREPARE。表示「数据修改已经准备好了，但整个事务还没有最终提交」。

**第二阶段 Commit：** Server 层写 binlog。binlog 写成功后，redo log 从 PREPARE 变为 COMMIT，最终事务提交。

### 5.3 崩溃恢复时如何判断事务是否提交？

InnoDB 重启后，看到 redo log 状态为 PREPARE 时：

```text
检查 binlog 中是否存在对应事务
    │
    ├── 存在 → 认为事务已提交 → 完成 redo log commit
    │
    └── 不存在 → 认为事务未完成 → 回滚 / 丢弃
```

这就是两阶段提交的重要意义：保证 redo log 和 binlog 最终一致，主从复制数据才可靠。

---

## 6. undo log（回滚日志）

| 项目 | 说明 |
|---|---|
| 所属层 | InnoDB 存储引擎 |
| 类型 | 逻辑日志（记录修改前的数据） |
| 核心作用 | 事务回滚 + MVCC 一致性读 |
| 工作原理 | 事务修改数据时，先将旧值写入 undo log；回滚时根据 undo log 恢复 |

### 6.1 与 redo 的区别

| | redo log | undo log |
|---|---|---|
| 目的 | 提交后不丢（崩溃恢复） | 失败可回滚 / 多版本读 |
| 内容倾向 | 如何重做修改 | 如何撤销修改 |
| 主要服务 | 持久性 | 原子性 + 隔离性 |

### 6.2 undo log 在 MVCC 中的作用

```text
事务 A 读取数据（快照读）
    ↓
通过 undo log 构建数据的历史版本
    ↓
读取到事务开始时的数据状态
    ↓
实现可重复读（RR）和读已提交（RC）
```

长事务会让旧版本 undo 长时间不能清理，导致空间膨胀、历史查询变慢。事务应尽量短小。

---

## 7. 完整事务日志流程

面试常问：「更新一条语句涉及哪些日志？」答案通常围绕：**undo + redo + binlog**。

```text
                    MySQL 事务执行
                          │
                          ↓
                   修改 Buffer Pool
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
        生成 undo log              生成 redo log
        (记录旧数据)               (记录页修改)
              │                       │
              ↓                       ↓
        支持回滚 & MVCC          写入 redo log buffer
                          │
                          ↓
                  ┌───────────────┐
                  │  Prepare 阶段  │
                  │ redo log PREPARE│
                  └───────────────┘
                          │
                          ↓
                      写 binlog
                          │
                  ┌───────────────┐
                  │  Commit 阶段   │
                  │ redo log COMMIT│
                  └───────────────┘
                          │
                          ↓
                       事务提交
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
          redo log     binlog      undo log
          (崩溃恢复)   (主从复制)   (回滚/MVCC)
                          │
                          ↓
                   后台刷脏页到磁盘
```

各自后续职责：

```text
redo log
   ├── WAL
   ├── 崩溃恢复
   └── 提高写性能

binlog
   ├── 主从复制
   ├── 数据恢复
   └── 时间点恢复

undo log
   ├── 事务回滚
   └── MVCC
```

---

## 8. 其他常用日志

### 8.1 慢查询日志

```sql
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 秒
```

用途：找出执行超过阈值的 SQL，配合 `EXPLAIN`、`pt-query-digest` 做优化。建议生产开启，并定期分析，而不是只在出故障后才开。

### 8.2 错误日志与通用日志

- **error log**：启动失败、崩溃、重大告警，运维必看
- **general log**：记录每条语句，排查偶发问题有用，但开销大，平时慎开
- **relay log**：从库用于主从复制的中继日志

---

## 9. 面试速答

### 9.1 MySQL 三大日志是什么？各自作用？

MySQL 常见的三大日志是 binlog、redo log、undo log。

- **binlog**：Server 层逻辑日志，用于主从复制和数据恢复
- **redo log**：InnoDB 物理日志，用于崩溃恢复和 WAL 提高写性能，保证事务持久性
- **undo log**：InnoDB 回滚日志，用于事务回滚，同时配合 MVCC 实现一致性读

### 9.2 redo log 和 binlog 有什么区别？为什么需要两阶段提交？

MySQL 中 redo log 是 InnoDB 存储引擎的日志，主要用于崩溃恢复，同时通过 WAL 机制提高写入性能；binlog 是 MySQL Server 层的逻辑日志，主要用于主从复制和数据恢复。

redo log 和 binlog 的写入是两个独立的过程，为了保证两者的一致性，MySQL 使用两阶段提交。

事务执行时，首先修改 Buffer Pool 并写入 redo log，redo log 进入 Prepare 状态；然后 Server 层写 binlog；binlog 写成功之后，再把 redo log 标记为 Commit，最终完成事务提交。

如果 MySQL 在 Prepare 阶段发生崩溃，恢复时会根据 binlog 是否存在对应事务来判断这个事务到底应该提交还是回滚，从而保证 redo log 和 binlog 的一致性。

redo log 的刷盘策略由 `innodb_flush_log_at_trx_commit` 控制：

- `0`：提交时不立即刷盘
- `1`：提交时写入并 fsync（生产推荐）
- `2`：提交时写入 OS 缓存，后台 fsync

### 9.3 速记清单

1. redo：持久性 / 崩溃恢复；undo：回滚 / MVCC
2. binlog：复制与时间点恢复（Server 层）
3. 更新提交靠**两阶段提交**保证 redo 与 binlog 一致
4. 生产常谈「双 1」：更安全、更费 IO
5. 慢查询日志是性能优化入口
