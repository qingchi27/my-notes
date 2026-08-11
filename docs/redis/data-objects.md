# Redis 数据对象与底层数据结构

Redis 对外暴露多种**数据类型**，对内统一封装为对象，再按编码选择不同**底层数据结构**，在性能与内存之间做平衡。


---

## 1. Redis 数据类型有哪些？

| 数据类型 | 使用场景 |
|---|---|
| String | 缓存、计数器、分布式锁 |
| List | 消息队列、列表操作 |
| Set | 标签、去重、集合运算 |
| ZSet | 排行榜、范围查询 |
| Hash | 对象存储 |
| GEO | 地理位置计算 |
| Stream | 消息队列 |


---

## 2. Redis 底层数据结构有哪些？

| 数据结构 | 说明 |
|---|---|
| SDS | Redis 字符串底层实现 |
| IntSet | 整数集合 |
| ZipList | 压缩列表（Redis 7 之前常用） |
| ListPack | 紧凑列表（Redis 7 起逐步替代 ZipList） |
| LinkedList | 双向链表（早期 List 编码，现多作历史概念） |
| QuickList | 快速列表（List 现行底层） |
| SkipList | 跳表 |
| HashTable | 哈希表（dict） |


---

## 3. String

### 3.1 SET 一个已经存在的 key 会发生什么？

会直接覆盖原来的 value。

```bash
SET username tom
SET username jack
# 最终 username = jack
```

### 3.2 Redis 字符串是怎么实现的？

Redis 没有直接使用 C 语言字符串，而是自己实现了 **SDS**（Simple Dynamic String，简单动态字符串）。

经典结构示意（便于理解；实际 Redis 按长度有多种 header）：

```c
struct sdshdr {
    int len;      // 当前字符串长度
    int free;     // 剩余可用空间
    char buf[];   // 字符数组
};
```

相比 C 字符串：

| 对比点 | C 字符串 | SDS |
|---|---|---|
| 获取长度 | 需遍历到 `\0`，O(n) | 读 `len`，O(1) |
| 扩容 | 常需重新分配 | 预留空间，减少频繁扩容 |
| 二进制安全 | 依赖 `\0`，不能存任意二进制 | 不依赖 `\0` 判结束，可存图片等二进制数据 |

### 3.3 SDS 中 free 如何扩容？

Redis 会预留空间，减少频繁扩容：

- 字符串长度 **小于 1MB**：扩容后通常预留与当前长度相当的空间（近似「翻倍」策略）
- 字符串长度 **≥ 1MB**：每次额外预留约 **1MB**

### 3.4 String 有哪些编码？浮点如何存储？

String 对象常见编码：

| 编码 | 条件（简化） |
|---|---|
| `INT` | 可用 long 表示的整数 |
| `EMBSTR` | 较短的字符串（对象与 SDS 一次分配） |
| `RAW` | 较长的字符串 |

浮点（如 `INCRBYFLOAT`）在 Redis 中按**字符串形式**保存，再按内容长度等规则落在 `EMBSTR` / `RAW`（本身是整数则可能用 `INT`），并没有单独的「浮点编码」。


---

## 4. List

### 4.1 List 是完全先进先出吗？

不是。Redis List 支持**双端** push / pop：

- 左端：`LPUSH` / `LPOP`
- 右端：`RPUSH` / `RPOP`

因此既可以当 **队列（FIFO）**，也可以当 **栈（LIFO）**。

### 4.2 List 底层编码是什么？

历史变化：

**Redis 3.2 之前**

- `ZipList`
- `LinkedList`

**Redis 3.2 之后**

统一使用 **QuickList**：

```text
QuickList
   |
   +-- Node --> ZipList
   +-- Node --> ZipList
   ...
```

即：双向链表的每个节点挂一块压缩列表，兼顾链表灵活性与连续内存省指针的优势。

**Redis 7 之后**

节点内的 ZipList 逐步被 **ListPack** 替代：

```text
QuickList
   |
   +-- Node --> ListPack
```

### 4.3 ZipList 是如何压缩数据的？

ZipList 是一块**连续内存**：

```text
| entry | entry | entry | entry |
```

每个 entry 会记录与长度相关的信息（含**前一个节点长度**等），从而：

- 不需要额外指针串联
- 减少内存占用

### 4.4 ZipList 可以从后往前遍历吗？

可以。每个节点保存 `previous_entry_length`，可根据前一个节点长度反推前一个节点的位置。

### 4.5 查询 List 长度的时间复杂度？

早期 LinkedList 内部维护 `len` 字段，查询长度为 **O(1)**。现行 QuickList 同样维护长度，`LLEN` 也是 **O(1)**。


---

## 5. Set

### 5.1 Set 底层编码方式？

两种：

**方式一：IntSet**

适用于：

- 元素较少
- 全部是整数

结构：连续内存数组（内部有序，便于二分查找）。

**方式二：HashTable**

适用于：

- 数据量较大，或含非整数
- key → value，value 为空（只用 key 集合语义）

### 5.2 Set 是有序的吗？

**对外语义：无序。**

说明：

- IntSet 内部为了二分会有序存放
- HashTable 本身无序

因此不能依赖 Set 的遍历顺序。

### 5.3 为什么 Set 使用两种编码？

空间与性能的平衡：

| 编码 | 优点 |
|---|---|
| IntSet | 更省内存，整数场景查询快 |
| HashTable | 支持字符串等类型，平均查找 O(1) |


---

## 6. Hash

### 6.1 Hash 底层编码方式？

- Redis 7 之前：小 Hash 常用 **ZipList**，大 Hash 用 **HashTable**
- Redis 7 之后：小 Hash 用 **ListPack**，大 Hash 仍用 **HashTable**

达到字段数 / 单字段长度阈值后，会从紧凑编码转为 HashTable。

### 6.2 Hash 查询某个 field 的时间复杂度？

| 编码 | 时间复杂度 |
|---|---|
| ListPack / ZipList | O(n) |
| HashTable | 平均 O(1) |

### 6.3 Hash 查询元素数量的时间复杂度？

Hash 对象内部维护元素数量，**O(1)**。

### 6.4 HashTable 如何计算存储位置？

```text
hash = hash(key)
index = hash & mask   # mask 通常为 数组长度 - 1
```

得到桶数组下标。

### 6.5 HashTable 如何扩容？

采用**渐进式 rehash**，避免一次性迁移卡住服务：

```text
ht[0]  --->  逐步迁移  --->  ht[1]
```

过程中：

- 在增删改查时顺带迁移一部分
- 后台定时任务也会迁移尚未访问的桶

迁移完成后，`ht[1]` 成为主表。

### 6.6 什么时候扩容？什么时候缩容？

看**负载因子**（元素数量 / 数组长度）：

- **扩容**：负载因子偏高时（例如通常 ≥ 1；若正在 `BGSAVE` / `BGREWRITEAOF`，可能提高到更高阈值再扩，避免与 fork 争用内存）
- **缩容**：数据减少、负载因子偏低时（例如低于 0.1）


---

## 7. ZSet

### 7.1 ZSet 底层编码方式？

两种：

**方式一：ZipList / ListPack**

适用于元素较少、member 与 score 较短的场景。

**方式二：HashTable + SkipList**

适用于数据量较大时：

```text
HashTable:  member -> score     # 按 member 查分
SkipList:   按 score 有序排列   # 排序、范围、排名
```

### 7.2 跳表查询节点数量时间复杂度？

SkipList 维护 `length` 字段，**O(1)**。

### 7.3 跳表插入时间复杂度？

平均 **O(log N)**：

- 定位插入位置：O(log N)
- 调整指针：O(1) 量级

### 7.4 为什么 ZSet 使用 HashTable + SkipList？

两者互补：

| 结构 | 作用 | 复杂度 |
|---|---|---|
| HashTable | 按 member 查 / 改 score | 平均 O(1) |
| SkipList | 按 score 排序、范围查询、取排名 | O(log N) |

### 7.5 跳表节点高度如何确定？

**随机**决定。Redis 中每升高一层的概率约为 **1/4（0.25）**。

### 7.6 ZSet 为什么不用红黑树，而用跳表？

- **实现更简单**：跳表主要是多层链表；红黑树要旋转、染色，实现与维护更复杂
- **已满足需求**：排序、范围查询、排名跳表都能做
- **范围查询友好**：找到起点后沿底层链表顺序扫描，适合排行榜等场景（约 O(log N + M)）


---

## 8. 面试总结

Redis 对象底层设计的核心思想：**同一数据类型，按数据规模切换编码，在性能与内存之间取得平衡。**

| 类型 | 底层结构 | 目的 |
|---|---|---|
| String | SDS（int / embstr / raw） | 高效、二进制安全的字符串 |
| List | QuickList（ZipList → ListPack） | 平衡灵活性与内存 |
| Set | IntSet / HashTable | 小整数省空间，大集合快查询 |
| Hash | ListPack / HashTable | 小对象紧凑，大对象 O(1) 访问 |
| ZSet | ListPack 或 SkipList + HashTable | 排序 + 按 member 快查 |
