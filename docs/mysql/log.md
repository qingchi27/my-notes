# 日志

## 1. MySQL 有哪些关键日志？

| 日志 | 层级 | 作用 |
|---|---|---|
| redo log | InnoDB | 保证持久性，崩溃恢复 |
| undo log | InnoDB | 回滚 + MVCC 多版本 |
| binlog | Server | 归档、主从复制、时间点恢复 |
| error log | Server | 错误/告警 |
| slow query log | Server | 慢 SQL 分析 |
| general log | Server | 记录所有请求（排查用，开销大） |
| relay log | 从库 | 主从复制中继 |


---

## 2. redo log（重做日志）

### 2.1 为什么需要 redo？

如果每次提交都把脏页刷盘，随机 IO 太多、性能差。

InnoDB 采用 WAL（Write-Ahead Logging）：

1. 先写 redo log（顺序写）
2. 事务可先提交
3. 后台再慢慢把脏页刷到数据文件

宕机后：用 redo 把已提交但未刷盘的改动“重放”出来。

### 2.2 基本形态

- 物理日志（记录页的修改）
- 固定大小，循环写（可配置组文件）
- 有 `writepos` / `checkpoint` 等位点概念

当日志写得太快、追不上刷脏时，可能触发更强同步，影响吞吐。


---

## 3. undo log（回滚日志）

### 3.1 作用

1. **事务回滚**：把数据改回旧值
2. **MVCC**：快照读通过 undo 链找历史版本

### 3.2 与 redo 的区别

| | redo log | undo log |
|---|---|---|
| 目的 | 提交后不丢（崩溃恢复） | 失败可回滚 / 多版本读 |
| 内容倾向 | 如何重做修改 | 如何撤销修改 |
| 主要服务 | 持久性 | 原子性 + 隔离性 |

长事务会让旧版本 undo 长时间不能清理，导致空间膨胀、历史查询变慢。


---

## 4. binlog（归档日志）

### 4.1 作用

- 主从复制
- 数据归档
- 时间点恢复（Point-in-Time Recovery）

### 4.2 格式

| 格式 | 特点 |
|---|---|
| STATEMENT | 记 SQL 语句，省空间；有不确定性函数风险 |
| ROW | 记行变更，安全准确；日志量更大 |
| MIXED | 混合模式，按情况选择 |

生产常见优先 **ROW**。

### 4.3 与 redo 的关键差别

| | redo log | binlog |
|---|---|---|
| 层级 | InnoDB | Server |
| 用途 | 崩溃恢复 | 复制 / 恢复 |
| 写入方式 | 循环写 | 追加写，可归档 |
| 内容 | 物理页改动 | 逻辑变更（视格式） |


---

## 5. 两阶段提交（为什么要有）

事务提交既要写 redo，也要写 binlog。若二者顺序不当，主从或恢复会出现不一致。

InnoDB 用**两阶段提交**协调：

```text
1. prepare：写 redo，事务进入 prepare 状态
2. 写 binlog
3. commit：redo 标记 commit
```

崩溃恢复时：

- 若 binlog 已完整写入，则提交事务
- 否则回滚

这样保证：**redo 与 binlog 最终一致**，主从复制数据才可靠。


---

## 6. 一条更新语句的日志流程（简化）

以 `UPDATE` 为例：

```text
执行器/引擎修改内存页（Buffer Pool）
  → 写 undo（旧版本）
  → 写 redo（准备重做）
  → 事务提交阶段写 binlog
  → redo commit
  → 后台刷脏页到磁盘
```

面试常问：“更新一条语句涉及哪些日志？”  
答案通常围绕：**undo + redo + binlog**。


---

## 7. 刷盘相关参数（了解）

### 7.1 redo

`innodb_flush_log_at_trx_commit`：

| 值 | 行为 | 安全性 |
|---|---|---|
| 1 | 每次提交都刷 redo 到盘 | 最安全（默认推荐） |
| 0 | 每秒刷 | 可能丢 1 秒 |
| 2 | 提交写 OS 缓存，每秒 fsync | 宕机可能丢，OS 崩溃风险低于 0 |

### 7.2 binlog

`sync_binlog`：

| 值 | 行为 |
|---|---|
| 1 | 每次事务提交都刷 binlog（最安全） |
| 0 | 由 OS 决定何时刷 |
| N | 每 N 次提交刷一次 |

双 1 配置（`innodb_flush_log_at_trx_commit=1` + `sync_binlog=1`）最稳，但性能开销更大。


---

## 8. 慢查询日志

```sql
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 秒
```

用途：

- 找出执行超过阈值的 SQL
- 配合 `EXPLAIN`、`pt-query-digest` 做优化

建议生产开启，并定期分析，而不是只在出故障后才开。


---

## 9. 错误日志与通用日志

- **error log**：启动失败、崩溃、重大告警，运维必看
- **general log**：记录每条语句，排查偶发问题有用，但开销大，平时慎开


---

## 10. 面试速记

1. redo：持久性 / 崩溃恢复；undo：回滚 / MVCC
2. binlog：复制与时间点恢复（Server 层）
3. 更新提交靠**两阶段提交**保证 redo 与 binlog 一致
4. 生产常谈“双 1”：更安全、更费 IO
5. 慢查询日志是性能优化入口
