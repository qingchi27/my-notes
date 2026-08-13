# SQL 语法

## 1. COUNT(*)、COUNT(1)、COUNT(列)、COUNT(主键) 有什么区别？

- `COUNT(*)` 和 `COUNT(1)` 都是统计行数，性能通常没有本质区别，推荐写 `COUNT(*)`
- `COUNT(列)` 只统计该列**非 NULL** 的行
- 主键不能为空，所以 `COUNT(主键)` 也能统计表中的记录数，但不能简单认为它一定比 `COUNT(*)` 更快

```sql
SELECT COUNT(*) FROM user;          -- 统计行数（推荐）
SELECT COUNT(1) FROM user;          -- 同样统计行数
SELECT COUNT(email) FROM user;      -- email 为 NULL 的行不计入
SELECT COUNT(id) FROM user;         -- 主键非空，结果通常等于行数
```


---

## 2. INNER JOIN 和 OUTER JOIN 有什么区别？

- `INNER JOIN`：只返回两边**匹配成功**的数据
- `OUTER JOIN`：会保留一侧的数据，没有匹配的一侧用 `NULL` 填充
- 常见的是 `LEFT JOIN`、`RIGHT JOIN`
- MySQL **不直接支持** `FULL OUTER JOIN`

```sql
-- 内连接：两边都有匹配才返回
SELECT u.username, o.order_no
FROM user u
INNER JOIN orders o ON u.id = o.user_id;

-- 左外连接：保留左表全部，右表无匹配则为 NULL
SELECT u.username, o.order_no
FROM user u
LEFT JOIN orders o ON u.id = o.user_id;
```

| 类型 | 结果特点 |
|---|---|
| `INNER JOIN` | 只保留匹配行 |
| `LEFT JOIN` | 保留左表全部 |
| `RIGHT JOIN` | 保留右表全部 |
| `FULL OUTER JOIN` | MySQL 无原生支持，可用 `UNION` 模拟 |


---

## 3. JOIN 中 ON 和 WHERE 有什么区别？

- `ON`：定义**连接条件**
- `WHERE`：过滤**最终结果**

在 `LEFT JOIN` 中差别尤其明显：

- `ON` 条件不满足时：左表记录仍然保留，右表字段为 `NULL`
- `WHERE` 条件不满足时：整行被过滤掉（左表也可能丢）

```sql
-- ON：即使没有 2024 年订单，用户仍会出现，order_no 为 NULL
SELECT u.username, o.order_no
FROM user u
LEFT JOIN orders o
  ON u.id = o.user_id AND o.create_time >= '2024-01-01';

-- WHERE：没有 2024 年订单的用户会被过滤掉（效果接近内连接）
SELECT u.username, o.order_no
FROM user u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.create_time >= '2024-01-01';
```


---

## 4. WHERE 和 HAVING 有什么区别？

- `WHERE`：在 `GROUP BY` **之前**过滤原始数据，主要过滤行
- `HAVING`：在 `GROUP BY` **之后**过滤分组结果，主要过滤组

```sql
SELECT status, COUNT(*) AS cnt
FROM user
WHERE create_time >= '2024-01-01'   -- 先过滤行
GROUP BY status
HAVING cnt > 10;                    -- 再过滤分组
```

| 关键字 | 时机 | 作用对象 |
|---|---|---|
| `WHERE` | 分组前 | 原始行 |
| `HAVING` | 分组后 | 聚合后的组 |


---

## 5. EXISTS 和 IN 有什么区别？

- `IN`：判断某个值是否存在于子查询结果集合中
- `EXISTS`：判断子查询是否存在满足条件的记录

现代 MySQL 会对两者做优化，**不能简单认为「IN 适合小表、EXISTS 适合大表」**。实际应结合索引和 `EXPLAIN` 执行计划判断。

```sql
-- IN：看 user_id 是否落在子查询结果集里
SELECT * FROM user
WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

-- EXISTS：看是否存在满足条件的关联行
SELECT * FROM user u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.amount > 100
);
```


---

## 6. MySQL 有哪些约束？

常见约束：

| 约束 | 作用 |
|---|---|
| `PRIMARY KEY` | 主键，唯一且非空 |
| `UNIQUE` | 唯一约束 |
| `NOT NULL` | 非空 |
| `FOREIGN KEY` | 外键，引用完整性 |
| `CHECK` | 检查约束（MySQL 8.0.16+ 真正生效） |

另外还有 `DEFAULT`（默认值），常与约束一起在建表时使用。

业务库里物理外键用得较少，更多在应用层保证关联完整性。


---

## 7. DELETE、TRUNCATE、DROP 有什么区别？

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| 作用 | 删除数据 | 快速清空整表数据 | 删除整张表 |
| WHERE | 支持 | 不支持 | 不适用 |
| 表结构 | 保留 | 保留 | 一起删除 |
| 类别 | DML | DDL（语义上像清空） | DDL |
| 回滚 | 事务中可回滚 | 通常不可回滚 | 不可回滚 |
| 自增 | 不重置 | 会重置 | 表已删除 |

注意：

- `DELETE` 是删除行数据，**不是逻辑删除**
- 业务上的逻辑删除一般是改状态字段，例如 `status = 0`


---

## 8. UNION 和 UNION ALL 有什么区别？

- `UNION`：合并结果集并**去重**
- `UNION ALL`：直接合并，**不去重**
- `UNION ALL` 通常性能更好（少一次去重开销）

```sql
SELECT username FROM user
UNION
SELECT username FROM user_backup;

SELECT username FROM user
UNION ALL
SELECT username FROM user_backup;
```


---

## 9. 数据库三大范式是什么？

| 范式 | 核心要求 |
|---|---|
| 第一范式（1NF） | 字段具有原子性，不可再分 |
| 第二范式（2NF） | 非主属性完全依赖整个主键，消除部分依赖 |
| 第三范式（3NF） | 非主属性不能传递依赖于主键 |

主要目的：减少数据冗余和更新异常。

缺点：表拆得过细会增加 `JOIN`，实际业务中常**适当反范式**（冗余热点字段）换查询性能。
