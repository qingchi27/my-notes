# 事务

## 1. 什么是事务？

事务是一组要么全部成功、要么全部失败的 SQL 操作单元，用来保证业务一致性。

典型例子：转账

```sql
START TRANSACTION;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- 出错则 ROLLBACK;
```


---

## 2. ACID

| 特性 | 含义 |
|---|---|
| Atomicity 原子性 | 事务内操作不可分割，失败则全部回滚 |
| Consistency 一致性 | 事务前后数据满足约束与业务规则 |
| Isolation 隔离性 | 并发事务互不干扰（通过隔离级别控制） |
| Durability 持久性 | 提交后即使宕机也不丢 |

在 InnoDB 中的大致支撑：

- 原子性：undo log（回滚）
- 持久性：redo log（崩溃恢复）
- 隔离性：锁 + MVCC
- 一致性：由前三者 + 应用约束共同保证


---

## 3. 事务开启方式

```sql
-- 显式事务
START TRANSACTION;   -- 或 BEGIN;
-- SQL...
COMMIT;
-- 或 ROLLBACK;

-- 自动提交（默认开启）
SHOW VARIABLES LIKE 'autocommit';
SET autocommit = 0;
```

注意：

- DDL（如 `ALTER TABLE`）通常会隐式提交
- 长事务会占用 undo、锁资源，应尽量短小


---

## 4. 并发带来的问题

| 问题 | 现象 |
|---|---|
| 脏读 | 读到其他事务未提交的数据 |
| 不可重复读 | 同一事务内两次读同一行，结果不同（通常被更新） |
| 幻读 | 同一事务内两次范围查询，行数变化（通常被插入/删除） |

补充：

- 不可重复读关注“行值变了”
- 幻读关注“行集合变了”


---

## 5. 四种隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 说明 |
|---|---|---|---|---|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 几乎不用 |
| READ COMMITTED | 不会 | 可能 | 可能 | Oracle/PostgreSQL 常见默认 |
| REPEATABLE READ | 不会 | 不会 | 可能（标准） | **MySQL InnoDB 默认** |
| SERIALIZABLE | 不会 | 不会 | 不会 | 串行化，并发最差 |

查看/设置：

```sql
SELECT @@transaction_isolation;
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```


---

## 6. MySQL 的可重复读如何实现？

InnoDB 在 **REPEATABLE READ** 下：

1. **普通 SELECT**：用 MVCC 读快照，解决脏读、不可重复读
2. **当前读**（`SELECT ... FOR UPDATE` / `UPDATE` / `DELETE`）：加锁，并配合间隙锁减少幻读

因此面试常说：InnoDB 在 RR 下能较大程度避免幻读，但不是“标准语义上绝对不会出现幻读的所有场景”。


---

## 7. MVCC（多版本并发控制）

### 7.1 核心思想

一行数据保留多个版本，读操作读快照，写操作生成新版本，读写尽量不互相阻塞。

### 7.2 隐藏字段（简化理解）

- `DB_TRX_ID`：最近修改该行的事务 ID
- `DB_ROLL_PTR`：回滚指针，指向 undo 中旧版本
- `DB_ROW_ID`：无主键时生成的隐藏行号

### 7.3 ReadView

快照读时生成 ReadView，用来判断某个版本对当前事务是否可见。

可见性判断（简化）：

- 版本的创建事务已提交，且在当前事务启动前就该看见 → 可见
- 版本由未提交事务或“启动后才开始的事务”产生 → 不可见，沿 undo 链找更旧版本

### 7.4 RC vs RR 的差异（关键）

| | READ COMMITTED | REPEATABLE READ |
|---|---|---|
| ReadView | 每条语句重新生成 | 事务中第一次快照读时生成，之后复用 |
| 效果 | 每次读最新已提交 | 事务内看到同一快照 |


---

## 8. 快照读 vs 当前读

| 类型 | 典型语句 | 行为 |
|---|---|---|
| 快照读 | 普通 `SELECT` | 读历史版本（MVCC） |
| 当前读 | `SELECT ... LOCK IN SHARE MODE` / `FOR UPDATE`、`UPDATE`、`DELETE` | 读最新版本并加锁 |

```sql
SELECT * FROM user WHERE id = 1;                 -- 快照读
SELECT * FROM user WHERE id = 1 FOR UPDATE;      -- 当前读（排他）
SELECT * FROM user WHERE id = 1 LOCK IN SHARE MODE; -- 当前读（共享）
```


---

## 9. 事务使用建议

1. 事务尽可能短，避免长事务拖垮 undo / purge
2. 事务内少做远程调用、少做无关计算
3. 捕获异常后明确 `ROLLBACK`
4. 合理选择隔离级别：金融强一致可 RR；高并发读多写少可评估 RC
5. Spring 中注意传播行为、自调用导致事务失效等问题（见 SSM 事务笔记）


---

## 10. 面试速记

1. ACID：原子、一致、隔离、持久
2. MySQL InnoDB 默认隔离级别：**RR**
3. MVCC 解决大部分读写冲突；当前读靠锁
4. RR 与 RC 的关键差别是 **ReadView 生成时机**
5. 长事务是生产常见隐患
