# 锁

## 1. 为什么需要锁？

并发事务同时改同一份数据时，需要锁来保证正确性，避免丢失更新、写写冲突等。

InnoDB 的并发控制 = **锁 + MVCC**：

- 写写冲突：靠锁
- 读写冲突：尽量靠 MVCC（快照读）

---

## 2. 锁的分类总览

```text
MySQL 锁
├── 全局锁（Global Lock）
│   └── 全库加锁，阻塞更新
├── 表级锁（Table-Level Lock）
│   ├── 表锁（Table Lock）
│   ├── MDL 元数据锁（Metadata Lock）
│   └── 意向锁（Intention Lock）
│       ├── IS（意向共享锁）
│       └── IX（意向排他锁）
└── 行级锁（Row-Level Lock）
    ├── Record Lock（记录锁）
    ├── Gap Lock（间隙锁）
    ├── Next-Key Lock（临键锁）
    └── Insert Intention Lock（插入意向锁）
```

### 2.1 按兼容性（行锁模式）

| 类型 | 说明 |
|---|---|
| 共享锁 S | 读锁，多人可读，不可写 |
| 排他锁 X | 写锁，不可再加其他 S/X |

兼容关系：

| | S | X |
|---|---|---|
| S | 兼容 | 冲突 |
| X | 冲突 | 冲突 |

---

## 3. 全局锁

全局锁是对整个数据库实例加锁。

```sql
FLUSH TABLES WITH READ LOCK;
```

| 项目 | 说明 |
|---|---|
| 作用对象 | 整个数据库实例 |
| 典型命令 | `FLUSH TABLES WITH READ LOCK;` |
| 主要用途 | 全库一致性备份（如 mysqldump） |
| 风险 | 阻塞所有 DML / DDL，严重影响业务 |
| 生产建议 | 避免长时间持有；优先使用 `--single-transaction` 等逻辑备份方案 |

---

## 4. 表级锁

### 4.1 表锁（Table Lock）

对整张表加锁，粒度大。

```sql
LOCK TABLE user READ;    -- 读锁
LOCK TABLE user WRITE;   -- 写锁
UNLOCK TABLES;
```

| 特点 | 说明 |
|---|---|
| 锁粒度 | 大（整张表） |
| 并发能力 | 低 |
| 开销 | 加锁 / 解锁开销小 |
| 使用场景 | InnoDB 日常 CRUD 基本不用，MyISAM 依赖较多 |

InnoDB 日常业务主要依赖行锁，普通 CRUD 一般不会主动使用这种表锁。

### 4.2 MDL 元数据锁（Metadata Lock）

MDL（Metadata Lock）保护表结构，防止事务执行期间表结构被修改。

| 操作 | 行为 | 获取的锁 |
|---|---|---|
| DML | `SELECT` / `INSERT` / `UPDATE` / `DELETE` | MDL 读锁 |
| DDL | `ALTER TABLE` / `CREATE INDEX` | MDL 写锁 |

兼容规则：

- 读锁 + 读锁 → 兼容
- 读锁 + 写锁 → 冲突
- 写锁 + 写锁 → 冲突

#### 生产环境大坑：DDL + 长事务 = MDL 锁风暴

```text
事务A: BEGIN → SELECT * FROM user → （长时间未 COMMIT）
              ↓
        持有 MDL 读锁
              ↓
ALTER TABLE user ADD COLUMN age INT
              ↓
        申请 MDL 写锁 → 阻塞等待
              ↓
后续新 SQL → 进入 MDL 等待队列 → 业务雪崩
```

生产建议：

- 执行 DDL 前检查长事务：`SELECT * FROM information_schema.INNODB_TRX;`
- 大表 DDL 使用 Online DDL（如 `ALGORITHM=INPLACE`）
- 避开业务高峰期

### 4.3 意向锁（Intention Lock）

意向锁是 InnoDB 的表级锁，表示事务准备在表中的某些记录上加行锁。

| 类型 | 含义 | 场景 |
|---|---|---|
| IS | 意向共享锁 | 事务准备对某些行加共享锁（S） |
| IX | 意向排他锁 | 事务准备对某些行加排他锁（X） |

作用：让表级锁快速判断表中是否存在行级锁，无需遍历全表。

```sql
UPDATE user SET name = '张三' WHERE id = 1;
-- 表级别：加 IX 锁
-- 行级别：加 X 锁（排他锁）
```

---

## 5. InnoDB 行级锁

InnoDB 行锁本质是锁**索引记录**，不是“锁物理行”这么简单。即使表没有显式索引，InnoDB 也存在聚簇索引，因此仍然可以对索引记录加锁。

### 5.1 Record Lock（记录锁）

锁住索引上的某一条具体记录。

```sql
SELECT * FROM user WHERE id = 10 FOR UPDATE;
-- 锁住 id = 10 的索引记录
```

### 5.2 Gap Lock（间隙锁）

锁住索引记录之间的间隙，而非记录本身。作用是阻止其他事务在间隙中插入数据，解决 RR 隔离级别下的幻读问题。

例如索引值存在 10、20、30，间隙 `(10, 20)` 被加 Gap Lock 后，其他事务不能插入 15。

**Gap Lock 本身不是为了阻止修改已有记录，而主要是为了阻止其他事务向间隙中插入记录。**

### 5.3 Next-Key Lock（临键锁）

```text
Next-Key Lock = Gap Lock + Record Lock
```

例如 `(10, 20]` 表示：

- `(10, 20)` → Gap Lock（间隙）
- `20` → Record Lock（记录本身）

常见场景：RR 隔离级别下的范围查询。

### 5.4 Insert Intention Lock（插入意向锁）

事务准备插入记录时申请。若目标间隙已存在 Gap Lock，则插入操作等待。

```sql
INSERT INTO user(id) VALUES(15);
```

假设索引中存在 10、20，插入 15 需要在间隙 `(10, 20)` 申请插入意向锁。若其他事务已持有 `Gap Lock (10, 20)`，插入就会等待。

### 5.5 间隙锁工作原理

```sql
-- 事务 A（RR）
SELECT * FROM user WHERE id > 10 AND id < 20 FOR UPDATE;
-- 可能对范围产生 Gap / Next-Key Lock

-- 事务 B
INSERT INTO user(id) VALUES(15);
```

```text
事务 B 准备插入 15
        ↓
申请 Insert Intention Lock
        ↓
发现目标间隙存在 Gap Lock
        ↓
锁冲突
        ↓
事务 B 等待
```

---

## 6. RC 和 RR 对锁的影响

| 隔离级别 | 锁行为 | 幻读防护 |
|---|---|---|
| RC（读已提交） | 主要使用 Record Lock，Gap Lock 大幅减少 | 不防幻读 |
| RR（可重复读） | 范围查询常用 Next-Key Lock（Record + Gap） | 防幻读 |

不要死记成「RC = 记录锁、RR = 临键锁」。

**具体加什么锁取决于：隔离级别 + 索引 + 查询条件 + 执行计划 + 扫描范围。**

实用加锁规则（前提：RR，且走索引）：

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

---

## 7. UPDATE 加锁范围分析

### 7.1 UPDATE 不带 WHERE

```sql
UPDATE user SET name = '张三';
```

因为没有 WHERE 条件，需要扫描大量甚至全部记录。

| 隔离级别 | 锁行为 | 风险 |
|---|---|---|
| RR | 扫描过程可能产生大量 Next-Key Lock | 锁范围极大，并发骤降 |
| RC | 主要使用 Record Lock | 相对较轻，但仍需扫描全表 |

正确回答：UPDATE 不带 WHERE 时，由于需要扫描大量记录，锁的范围可能非常大。在 RR 下可能产生大量 Next-Key Lock，在 RC 下主要以 Record Lock 为主。具体情况还取决于索引和执行计划。

### 7.2 WHERE 条件无索引

```sql
UPDATE user SET name = '张三' WHERE age = 20;  -- age 无索引
```

```text
无索引 → 全表扫描 → 扫描范围大 → 加锁范围大
    → 锁等待增加 → 并发下降 → 死锁风险增加
```

**面试金句：索引不仅影响查询性能，也直接影响加锁范围和并发性能。**

UPDATE / DELETE 一定要关注 WHERE 条件是否走索引，这是生产环境非常重要的锁问题。

### 7.3 唯一索引等值查询（命中）

```sql
UPDATE user SET name = '张三' WHERE id = 10;  -- id 是唯一索引，且命中
```

可精准定位 → 主要加 Record Lock，不会无差别锁住整个范围。

**面试重点：唯一索引 + 等值查询 + 命中记录，可以精准定位记录，通常主要使用 Record Lock。**

### 7.4 普通索引更新

```sql
UPDATE user SET name = '张三' WHERE age = 20;  -- age 是普通索引
```

```text
普通索引
    ↓
扫描二级索引范围（RR 下可能产生 Next-Key Lock）
    ↓
找到对应主键
    ↓
修改聚簇索引记录 → 加 Record Lock
```

### 7.5 并发 UPDATE

**同一条记录：**

```sql
-- 事务 A
UPDATE user SET name = 'A' WHERE id = 1;

-- 事务 B
UPDATE user SET name = 'B' WHERE id = 1;
```

```text
事务 A 获取 id=1 的排他锁
        ↓
事务 B 发现 id=1 已被锁
        ↓
等待事务 A 提交
```

两个事务更新同一条记录时，后执行的事务通常需要等待前者释放排他锁。

**不同记录：**

```sql
UPDATE user SET name='A' WHERE id=1;
UPDATE user SET name='B' WHERE id=2;
```

| 场景 | 结果 |
|---|---|
| 两事务更新同一条记录 | 后执行事务等待前者释放排他锁 |
| 两事务更新不同记录（主键精准定位） | 锁范围不重叠，通常可并发 |
| 两事务更新不同记录（范围条件 / 无索引） | 锁范围可能重叠，仍可能阻塞 |

不能简单说「更新不同记录一定不会阻塞」。如果使用范围条件、没有索引、锁范围重叠、存在 Gap Lock / Next-Key Lock，即使最终修改的是不同记录，也可能产生锁等待。

### 7.6 为什么有索引可以减少锁冲突？

```text
有主键 / 唯一索引：
索引定位 → 直接找到目标记录 → 锁定对应记录

没有合适索引：
全表扫描 → 扫描大量记录 → 可能锁住大量范围 → 并发能力下降
```

**结论：更新条件尽量命中索引，尤其是唯一 / 主键索引。**

---

## 8. 乐观锁 vs 悲观锁（业务层）

### 8.1 悲观锁

认为冲突会经常发生，先加锁再改。

```sql
SELECT * FROM product WHERE id = 1 FOR UPDATE;
UPDATE product SET stock = stock - 1 WHERE id = 1;
```

### 8.2 乐观锁

认为冲突少，用版本号 / 时间戳做 CAS。

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

## 9. 死锁

### 9.1 什么是死锁？

两个或多个事务互相持有对方需要的锁，形成循环等待。

```text
事务 A: 锁住 id=1 ──→ 等待 id=2
         ↑                ↓
事务 B: 锁住 id=2 ──→ 等待 id=1
```

### 9.2 死锁检测与排查

InnoDB 会自动进行死锁检测。发生死锁后，选择一个事务回滚（通常是代价较小的一方），打破循环等待，返回错误（如 `Deadlock found when trying to get lock`）。

也可通过 `innodb_lock_wait_timeout` 做锁等待超时（防死锁的补充，不是根治）。

| 方法 | 命令 / 工具 |
|---|---|
| 查看最近一次死锁 | `SHOW ENGINE INNODB STATUS;`（关注 `LATEST DETECTED DEADLOCK`） |
| 实时监控 | `performance_schema` |
| 进程查看 | `SHOW PROCESSLIST;` |
| 日志分析 | MySQL error log + 应用日志 |

```sql
-- 谁在等锁、谁持有锁（8.0）
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;

-- 事务信息
SELECT * FROM information_schema.INNODB_TRX;

-- 当前进程
SHOW PROCESSLIST;
```

排查链路：

```text
哪个事务 → 执行了什么 SQL → 持有什么锁 → 等待什么锁 → 为什么循环等待
```

思路：

1. 找到阻塞源事务
2. 看它的 SQL 是否全表扫描、范围过大、事务过长
3. 优化 SQL / 索引 / 业务拆分

### 9.3 降低死锁概率的 6 个方法

死锁无法完全避免，只能降低发生概率。

| 方法 | 具体做法 |
|---|---|
| 1. 固定加锁顺序 | 所有事务按相同顺序访问资源（如都按 id 从小到大） |
| 2. 缩短事务时间 | 避免事务中嵌套 RPC、网络请求、复杂计算 |
| 3. 合理使用索引 | 避免无索引导致的全表扫描和锁范围扩大 |
| 4. 减小锁范围 | 精确条件 + 合理索引 + 尽量少的数据 |
| 5. 避免长事务 | 锁持有时间长 → 等待增加 → 死锁概率上升 |
| 6. 应用层重试 | 捕获死锁异常 → 短暂等待 → 有限次数重试 |

事务应尽量：

```text
BEGIN → UPDATE → COMMIT
```

避免：

```text
BEGIN → 查询 → RPC → 网络请求 → 复杂计算 → UPDATE → COMMIT
```

---

## 10. 生产环境最常见的锁问题

```text
MySQL 锁问题
├── 长事务
│   └── 锁长时间不释放，阻塞其他事务
├── DDL + MDL
│   └── DDL 等待长事务释放 MDL 读锁，引发连锁阻塞
├── UPDATE / DELETE 无索引
│   └── 全表扫描 → 锁范围极大 → 并发崩溃
├── 大范围 SELECT FOR UPDATE
│   └── 锁住大量数据，其他事务无法操作
├── 事务执行时间过长
│   └── 锁持有时间过长，系统吞吐量下降
└── 加锁顺序不一致
    └── 多个事务访问相同资源顺序不同 → 死锁
```

---

## 11. 整套知识的核心逻辑

```text
                    MySQL 锁
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      全局锁         表级锁          行级锁
        │              │              │
      备份        ┌────┼────┐     ┌───┼────┬────┐
                  ↓    ↓    ↓     ↓   ↓    ↓    ↓
                 表锁 MDL 意向   Record Gap Next Insert
                                  Lock Lock Key Intention
```

三个核心场景：

**场景一：DDL**

```text
DML → MDL 读锁
DDL → MDL 写锁
读写互斥
        ↓
长事务可能导致 DDL 等待 → 后续 SQL 排队 → 业务雪崩
```

**场景二：RR 范围查询**

```text
范围扫描
    ↓
Next-Key Lock
    ↓
Record + Gap
    ↓
防止范围内插入
    ↓
解决幻读
```

**场景三：UPDATE**

```text
有没有索引？
    │
 ┌──┴──┐
有     没有
│       │
↓       ↓
精准 /  全表扫描
范围    │
扫描    ↓
│      锁范围可能很大
↓       │
锁范围  ↓
相对小  并发下降 / 死锁风险增加
```

---

## 12. 面试速答

### 12.1 详细说一下 MySQL 的锁

MySQL 的锁按粒度分为全局锁、表级锁和行级锁。

全局锁主要用于全库一致性备份，生产环境不建议长时间使用。

表级锁包括表锁、MDL 元数据锁和意向锁。MDL 保护表结构，DML 获取读锁，DDL 申请写锁，读写互斥，所以生产环境执行 DDL 要特别关注长事务导致的 MDL 锁等待。意向锁（IS / IX）让表级锁快速判断表中是否存在行级锁。

行级锁包括 Record Lock、Gap Lock、Next-Key Lock 和 Insert Intention Lock。Record Lock 锁定具体记录；Gap Lock 锁定间隙防止插入；Next-Key Lock 是两者的结合，在 RR 范围查询中常见，用于防幻读；Insert Intention Lock 是插入时申请的意向锁。

具体加什么锁不是固定的，要结合隔离级别、索引、查询条件和执行计划分析。唯一索引等值查询命中时通常精准加 Record Lock；普通索引或范围查询可能锁住更大范围；UPDATE / DELETE 无合适索引会导致全表扫描，扩大锁范围，降低并发。

两个事务更新同一条记录时，后一个事务通常需要等待前一个事务释放排他锁；如果更新不同记录并且锁范围不重叠，通常可以并发执行。

死锁是两个事务互相持有对方需要的锁形成循环等待。InnoDB 自动检测并回滚其中一个事务。可通过 `SHOW ENGINE INNODB STATUS` 排查。死锁无法完全避免，可通过统一加锁顺序、缩短事务、合理索引、减少锁范围、应用层重试来降低概率。

### 12.2 速记清单

1. InnoDB 支持行锁；无索引更新可能锁很多行
2. RR 下当前读常用 Next-Key Lock 防幻读
3. 间隙锁主要拦插入
4. 死锁可被检测并回滚一方，应用应支持重试
5. 锁优化核心：**索引精准 + 事务短小 + 访问顺序一致**
