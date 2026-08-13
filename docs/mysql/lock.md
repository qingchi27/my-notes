# 锁

## 1. 为什么需要锁？

并发事务同时改同一份数据时，需要锁来保证正确性，避免丢失更新、读写冲突等。

InnoDB 的并发控制 = **锁 + MVCC**：

- 写写冲突：靠锁
- 读写冲突：尽量靠 MVCC（快照读）


---

## 2. 锁的分类视角

### 2.1 按粒度

| 类型 | 说明 |
|---|---|
| 表锁 | 锁整张表，开销小、并发差 |
| 行锁 | 锁相关行，开销大、并发好（InnoDB 主流） |
| 页锁 | 锁数据页（了解即可） |

### 2.2 按兼容性（行锁模式）

| 类型 | 说明 |
|---|---|
| 共享锁 S | 读锁，多人可读，不可写 |
| 排他锁 X | 写锁，不可再加其他 S/X |

兼容关系：

| | S | X |
|---|---|---|
| S | 兼容 | 冲突 |
| X | 冲突 | 冲突 |

### 2.3 意向锁（表级）

- `IS`：意向共享
- `IX`：意向排他

作用：快速判断表上是否能加表锁，避免逐行检查。

例如：事务要对某行加 X 锁，会先在表上加 `IX`。


---

## 3. InnoDB 行锁具体形态

InnoDB 行锁本质是锁**索引项**，不是“锁物理行记录”这么简单。

### 3.1 Record Lock（记录锁）

锁住单条索引记录。

```sql
SELECT * FROM user WHERE id = 1 FOR UPDATE;
```

### 3.2 Gap Lock（间隙锁）

锁住索引记录之间的间隙，阻止其他事务在间隙中插入，从而减少幻读。

例如索引值有 10、20，间隙 `(10,20)` 可被锁住。

### 3.3 Next-Key Lock

**Record Lock + Gap Lock**：锁住记录本身 + 前面的间隙。

InnoDB 在 RR 下，当前读默认常用 Next-Key Lock。


---

## 4. 加锁规则（实用版）

前提：隔离级别 RR，且走索引。

1. 等值查询命中唯一索引：通常只需 Record Lock
2. 等值查询未命中：锁住扫描到的间隙（Gap）
3. 范围查询：对范围内记录加 Next-Key，并对边界间隙加锁
4. 没有可用索引：可能升级成更大范围锁，甚至近似表级效果（实际是锁住大量索引间隙）

```sql
-- id 主键
SELECT * FROM user WHERE id = 10 FOR UPDATE;          -- 多为记录锁
SELECT * FROM user WHERE id > 10 FOR UPDATE;          -- 范围 + 间隙
SELECT * FROM user WHERE name = 'tom' FOR UPDATE;     -- 若 name 无索引，锁范围可能很大
```

**结论：更新条件尽量命中索引，尤其是唯一/主键索引。**


---

## 5. 乐观锁 vs 悲观锁（业务层）

### 5.1 悲观锁

认为冲突会经常发生，先加锁再改。

```sql
SELECT * FROM product WHERE id = 1 FOR UPDATE;
UPDATE product SET stock = stock - 1 WHERE id = 1;
```

### 5.2 乐观锁

认为冲突少，用版本号/时间戳做 CAS。

```sql
UPDATE product
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 3;
```

影响行数为 0 则表示冲突，需重试或失败返回。

适用：

- 读多写少 → 乐观锁
- 冲突频繁、必须强互斥 → 悲观锁


---

## 6. 死锁

### 6.1 什么是死锁？

两个（或多个）事务互相持有对方需要的锁，形成环路等待。

示例：

```text
事务 A：锁住行 1，等待行 2
事务 B：锁住行 2，等待行 1
```

### 6.2 InnoDB 如何处理？

InnoDB 有死锁检测：发现环后，回滚代价较小的事务，返回错误（如 `Deadlock found when trying to get lock`）。

也可通过 `innodb_lock_wait_timeout` 做锁等待超时（防死锁的补充，不是根治）。

### 6.3 如何减少死锁？

1. 以固定顺序访问资源（如都按 id 升序更新）
2. 缩短事务，尽快提交
3. 给高频条件加合适索引，缩小锁范围
4. 避免大事务扫太多行
5. 业务上必要时重试被回滚的事务


---

## 7. 锁等待排查

```sql
-- 谁在等锁、谁持有锁（8.0）
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;

-- 事务信息
SELECT * FROM information_schema.innodb_trx;

-- 当前进程
SHOW PROCESSLIST;
```

思路：

1. 找到阻塞源事务
2. 看它的 SQL 是否全表扫描、范围过大、事务过长
3. 优化 SQL / 索引 / 业务拆分


---

## 8. 表锁 / 元数据锁（了解）

```sql
LOCK TABLES user READ;
UNLOCK TABLES;
```

业务中少手动表锁。更常见的是 **MDL（Metadata Lock）**：

- 事务未提交时，其他会话对同表做 DDL 可能被阻塞
- 长事务 + DDL 是线上变更常见坑


---

## 9. 面试速记

1. InnoDB 支持行锁；无索引更新可能锁很多行
2. RR 下当前读常用 Next-Key Lock 防幻读
3. 间隙锁主要拦插入
4. 死锁可被检测并回滚一方，应用应支持重试
5. 锁优化核心：**索引精准 + 事务短小 + 访问顺序一致**
