---
outline: [2, 3]
---

# Java集合

## 集合概述

### 1. 常用的集合分类以及区别？

Java 集合主要分为两大体系：`Collection` 和 `Map`。

```text
Collection
    |
    |-- List
    |     |
    |     |-- ArrayList
    |     |-- LinkedList
    |     |-- Vector
    |
    |-- Set
          |
          |-- HashSet
          |-- LinkedHashSet
          |-- TreeSet

Map
    |
    |-- HashMap
    |-- LinkedHashMap
    |-- TreeMap
    |-- ConcurrentHashMap
```

#### Collection

存储单个对象：

```java
List<String> list = new ArrayList<>();
list.add("A");
```

特点：

- 存储的是 value
- 继承 `Collection` 接口

#### Map

存储键值对：

```java
map.put("name", "张三");
```

特点：

- 存储 key-value
- key 不能重复
- value 可以重复

#### List

特点：

- 有序
- 可重复
- 支持索引访问

例如：`[张三, 李四, 张三]`

| 实现 | 特点 |
|---|---|
| ArrayList | 数组结构，查询快 |
| LinkedList | 链表结构，插入删除快 |
| Vector | 线程安全，性能低 |

#### Set

特点：

- 无序（部分实现有序）
- 不允许重复

例如：`[A, B, C]`，不能是 `[A, A, B]`

| 实现 | 特点 |
|---|---|
| HashSet | 无序，基于 HashMap |
| LinkedHashSet | 保持插入顺序 |
| TreeSet | 自动排序 |

---

### 2. 最常用的集合实现类有哪些？

#### List

**ArrayList**（最常用）

底层：`Object[] elementData`

特点：

- 查询快 O(1)
- 插入删除慢 O(n)

**LinkedList**

底层是双向链表：

```text
Node {
    prev
    item
    next
}
```

特点：

- 插入删除快
- 查询慢

#### Set

**HashSet**

底层是 HashMap。`HashSet.add("abc")` 内部实际是 `HashMap.put("abc", PRESENT)`。

**TreeSet**

底层是 TreeMap（红黑树），特点是自动排序。

#### Map

**HashMap**（最常用）

底层（Java 8）：数组 + 链表 + 红黑树

**ConcurrentHashMap**

线程安全的 HashMap，用于高并发缓存、多线程共享数据。

---

### 3. 集合遍历的方法有哪些？

#### 方式 1：for 循环

适用于 List：

```java
for (int i = 0; i < list.size(); i++) {
    System.out.println(list.get(i));
}
```

缺点：`LinkedList` 效率低。因为 `get(i)` 需要遍历链表。

#### 方式 2：增强 for

底层使用 Iterator：

```java
for (String s : list) {
    System.out.println(s);
}
```

#### 方式 3：Iterator

```java
Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    String s = iterator.next();
}
```

优点：可以安全删除当前元素：`iterator.remove()`。

#### 方式 4：Stream

Java 8：

```java
list.stream().forEach(System.out::println);
```

---

### 4. Iterator 是什么？

Iterator 是 Java 集合提供的统一遍历接口。

核心方法：

```java
boolean hasNext();
E next();
void remove();
```

例如：

```java
Iterator<Integer> iterator = list.iterator();
while (iterator.hasNext()) {
    Integer i = iterator.next();
}
```

#### 为什么不用 for 循环？

不同集合底层结构不同：

- ArrayList：数组
- LinkedList：链表
- HashSet：Hash 表

Iterator 屏蔽底层差异。

---

### 5. 怎么确保集合不能被修改？

#### 方法 1：`Collections.unmodifiableXXX`

```java
List<String> list = Collections.unmodifiableList(new ArrayList<>());
list.add("A"); // 抛 UnsupportedOperationException
```

#### 方法 2：使用不可变集合

Java 9：

```java
List.of("A", "B");
```

不能修改。

#### 方法 3：private 封装

```java
private final List<String> list;
```

只提供查询方法。

---

### 6. 什么是 fail-fast，什么是 fail-safe？

#### fail-fast（快速失败）

遍历集合过程中，如果集合结构被修改，立即抛异常。

```java
List<Integer> list = new ArrayList<>();
list.add(1);
list.add(2);

for (Integer i : list) {
    list.add(3);
}
```

抛出：`ConcurrentModificationException`

代表：ArrayList、HashMap、HashSet。

#### fail-safe（安全失败）

遍历时不会因原集合被修改而抛 `ConcurrentModificationException`。

代表：`CopyOnWriteArrayList`、`ConcurrentHashMap`。

- `CopyOnWriteArrayList`：遍历的是快照副本，修改原集合不影响遍历
- `ConcurrentHashMap`：弱一致性迭代器，不保证看到遍历开始后的全部修改，但不会抛 CME

---

### 7. fail-fast 底层原理是什么？

核心是 `modCount`（集合修改次数）。

ArrayList：

```java
private int modCount;
```

每次结构修改（如 `add()`、`remove()`）都会 `modCount++`。

Iterator 创建时保存：

```java
expectedModCount = modCount;
```

遍历时调用 `checkForComodification()`：

```java
if (modCount != expectedModCount)
    throw new ConcurrentModificationException();
```

流程：

```text
创建 Iterator
expectedModCount = 10
        ↓
集合修改
modCount = 11
        ↓
next()
比较失败
        ↓
抛 ConcurrentModificationException
```

---

### 8. Collection 和 Collections 区别？

这是经典面试题。

**Collection** 是接口，代表集合顶层接口。例如 `List`、`Set`、`Queue`：

```text
Collection
    |
    List
    Set
```

**Collections** 是工具类，提供集合操作方法：

```java
Collections.sort(list);              // 排序
Collections.reverse(list);           // 反转
Collections.synchronizedList(list);  // 线程安全包装
```

| | Collection | Collections |
|---|---|---|
| 类型 | 接口 | 工具类 |
| 作用 | 定义集合规范 | 操作集合 |
| 位置 | `java.util` | `java.util` |

---

## HashMap

### 1. HashMap 的工作原理？

#### 核心结构

Java 8 HashMap：数组 + 链表 + 红黑树。

```text
table 数组

[0] -> Node -> Node
[1]
[2] -> Node -> Node -> 红黑树
[3]
```

节点结构：

```java
Node<K, V> {
    int hash;
    K key;
    V value;
    Node next;
}
```

#### 存储过程

例如：`map.put("name", "张三");`

**第一步：计算 key 的 hash 值**

调用 `key.hashCode()` 得到 hashCode，再做扰动：

```java
hash = h ^ (h >>> 16)
```

目的：让高位参与计算，减少冲突。

**第二步：计算数组下标**

```java
(n - 1) & hash
```

数组长度默认 16，即 `(16 - 1) & hash`，得到 `0 ~ 15` 的位置。

**第三步：判断当前位置**

- 没有元素：直接插入，如 `table[3] = Node`
- 已有元素：发生 hash 冲突。比较 hash 是否相同且 key 是否相等
  - 相同：覆盖 value
  - 不同：形成链表

```text
Node
 |
Node
 |
Node
```

**第四步：链表过长转红黑树**

链表长度达到 8，并且数组长度 `>= 64` 时，链表转红黑树。

---

### 2. HashMap put 流程？（面试必背）

```text
put(key, value)
        ↓
hash(key)
        ↓
判断 table 是否初始化
        ↓
计算数组位置
        ↓
当前位置为空？
    是 → 创建 Node
    否 → hash / key 相同？
            是 → 覆盖 value
            否 → 插入链表
                  链表长度 >= 8？
                      转红黑树
        ↓
size++
        ↓
size > threshold？
        ↓
扩容
```

---

### 3. Java 8 对 HashMap 做了哪些优化？

主要三点：

#### ① 链表升级为红黑树

- Java 7：数组 + 链表
- Java 8：数组 + 链表 + 红黑树

链表查询 O(n)，红黑树 O(log n)，避免 hash 碰撞严重导致性能下降。

#### ② 插入方式变化

- Java 7：头插法，新节点放头部
- Java 8：尾插法，新节点放尾部

原因：避免扩容时链表成环。

#### ③ 扩容优化

- Java 7：重新计算 hash
- Java 8：利用原 hash 判断落在「原位置」或「原位置 + oldCap」

提高扩容效率。

---

### 4. HashMap 扩容机制？

#### 什么时候扩容？

**条件 1：容量超过阈值**

```text
threshold = capacity * loadFactor
```

默认：`16 * 0.75 = 12`，超过 12 个元素扩容。

**条件 2：树化时数组长度 < 64**

不会树化，而是先扩容。

#### 扩容流程

旧容量 16 扩到 32。原来 `index = 5`，容量翻倍后新位置可能是 `5` 或 `5 + 16 = 21`。

判断：`hash & oldCap`

- 结果为 0：低位不变，还在原位置
- 结果为 1：移动到原位置 + 旧容量

---

### 5. HashMap 长度为什么是 2 的幂次方？

因为计算下标用的是 `(n - 1) & hash`。

如果 n 是 2 的幂，例如 16：

```text
n     = 10000
n - 1 = 01111
```

与 hash 做 `&`，可以快速取低 4 位，效果等价于 `hash % 16`，但位运算更快。

如果不是 2 的幂，例如 15，hash 高位无法充分参与，容易分布不均、增加冲突。

---

### 6. HashMap 默认负载因子为什么是 0.75？

负载因子 `loadFactor` 表示数组填充比例。

```text
容量 × 负载因子 = 扩容阈值
16 × 0.75 = 12
```

| loadFactor | 优点 | 缺点 |
|---|---|---|
| 1 | 空间利用率高 | 大量 hash 冲突，链表变长，查询慢 |
| 0.5 | 冲突少 | 频繁扩容，浪费空间 |
| **0.75** | **空间和性能的折中** | — |

---

### 7. Java 8 链表转红黑树和红黑树转链表的条件？

#### 链表转红黑树

两个条件都要满足：

1. 链表长度 `>= 8`
2. 数组容量 `>= 64`

否则优先扩容。数组太小时，冲突可能只是容量不足，扩容比树化更划算。

#### 红黑树转链表

节点数量 `<= 6`（`UNTREEIFY_THRESHOLD`）。

为什么不是 8：避免 7、8 之间频繁转换造成抖动（8 个树化 → 7 个链化 → 8 个树化）。

---

### 8. 为什么 hashCode 右移 16 位再异或？

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

hashCode 是 32 位，但数组长度通常较小（如 16），`(hash & 15)` 只用低 4 位。

如果不同对象低 16 位相同，会产生大量冲突。把高 16 位移到低位再异或，让高低位混合，提高散列均匀性。

---

### 9. 解决 hash 冲突的方式有哪些？

#### 1. 链地址法（HashMap 使用）

多个元素放链表：

```text
index
  A
  |
  B
  |
  C
```

#### 2. 开放寻址法

冲突后寻找其他空位置，如 `hash + 1`、`hash + 2`。ThreadLocal 部分思想类似。

#### 3. 再哈希

重新计算 hash。

#### 4. 建立公共溢出区

冲突元素放到另外的区域。

---

### 10. HashMap 多线程操作有什么问题？

HashMap 不是线程安全的。

#### ① 数据覆盖

线程 A、B 同时读到 `size = 10`，各自 `size++`，结果可能是 11，丢失一次。

#### ② 链表成环（Java 7）

扩容时使用头插法，两个线程同时 resize，可能 `A.next = B` 且 `B.next = A`，形成环，导致死循环。

#### ③ 数据不一致

一个线程 put，另一个线程 get，可能读不到。

---

### 11. HashMap 的 key 可以为 null 吗？

可以。HashMap 特殊处理：`hash(null) = 0`，所以 null key 永远放在 `table[0]`。

但只能有一个 null key，因为 key 不能重复。

---

### 12. HashMap、Hashtable、TreeMap、LinkedHashMap 区别？

| | HashMap | Hashtable | TreeMap | LinkedHashMap |
|---|---|---|---|---|
| 线程安全 | 否 | 是 | 否 | 否 |
| null key | 支持 | 不支持 | 不支持 | 支持 |
| 底层 | 数组 + 链表 + 树 | 数组 + 链表 | 红黑树 | HashMap + 链表 |
| 顺序 | 无序 | 无序 | 排序 | 插入顺序 |
| 性能 | 高 | 低 | 较低 | 较高 |

---

### 13. 为什么 ConcurrentHashMap 比 Hashtable 效率高？

**Hashtable**：方法全部加锁，如 `public synchronized put()`。锁粒度是整个对象，一个线程操作时其他全部等待。

**ConcurrentHashMap（Java 8）**：CAS + synchronized，锁粒度是 Node 节点。多个桶可以同时操作，所以性能更高。

---

### 14. ConcurrentHashMap 核心原理？1.7 和 1.8 区别？

#### Java 7

结构：Segment 数组 + HashEntry 数组 + 链表。相当于把一个大 HashMap 拆成 16 个小 HashMap。

Segment 继承 `ReentrantLock`，使用分段锁。默认 16 个 Segment，最多 16 个线程并发。

#### Java 8

取消 Segment。结构：Node 数组 + 链表 + 红黑树。

同步方式：

- 插入空桶：CAS
- 发生冲突：`synchronized` 锁当前 Node

锁粒度：桶级别。

#### Java 8 put 流程

```text
put()
    ↓
计算 hash
    ↓
table 为空？ → 初始化
    ↓
桶为空？ → CAS 插入
    ↓
桶有数据 → synchronized 锁头节点
    ↓
链表 / 红黑树插入
    ↓
size 统计
```

---

## List

### 1. List 的几种实现区别是什么？

List 特点：有序、可重复、支持索引访问。

| 实现 | 底层结构 | 特点 |
|---|---|---|
| ArrayList | 动态数组 | 查询快，增删慢 |
| LinkedList | 双向链表 | 增删快，查询慢 |
| Vector | 动态数组 | 线程安全，性能低 |
| CopyOnWriteArrayList | 数组复制 | 适合读多写少 |

---

### 2. ArrayList 和 Array 的区别？

**Array（数组）**：固定长度，例如 `int[] arr = new int[10];`

- 长度固定
- 可以存储基本类型
- 性能高

**ArrayList**：动态数组，底层 `Object[] elementData`

- 自动扩容
- 只能存对象
- API 更丰富

```java
ArrayList<Integer> list = new ArrayList<>();
```

| | Array | ArrayList |
|---|---|---|
| 长度 | 固定 | 动态 |
| 基本类型 | 支持 | 不支持（需包装类） |
| 扩容 | 手动 | 自动 |
| 性能 | 高 | 稍低 |
| API | 少 | 丰富 |

---

### 3. 数组和 List 之间如何转换？

#### 数组转 List

```java
String[] arr = {"A", "B"};
List<String> list = Arrays.asList(arr);
```

注意：返回的是 `Arrays` 内部类 `Arrays.ArrayList`，长度不可变。`list.add("C")` 会抛 `UnsupportedOperationException`。

推荐：

```java
List<String> list = new ArrayList<>(Arrays.asList(arr));
```

可以修改。

#### List 转数组

```java
String[] arr = list.toArray(new String[0]);
```

推荐这种写法。

---

### 4. ArrayList 线程安全吗？

不是。ArrayList 方法没有加锁。两个线程同时 `add()`，可能出现数据覆盖、数组越界、`size` 错误。

---

### 5. ArrayList 变成线程安全的方法有哪些？

#### 方法 1：`Collections.synchronizedList`

```java
List list = Collections.synchronizedList(new ArrayList<>());
```

原理：给方法加 `synchronized`。

#### 方法 2：`CopyOnWriteArrayList`

位于 `java.util.concurrent`。写时复制：写操作复制数组、修改后替换引用；读操作不加锁。适合读多写少，例如配置列表、黑名单、白名单。

#### 方法 3：使用 Vector

```java
Vector vector = new Vector<>();
```

历史方案，性能低。

---

### 6. 为什么 ArrayList 的 elementData 加 transient？

```java
transient Object[] elementData;
```

`transient` 表示不参与默认序列化。

因为 ArrayList 底层数组容量可能大于实际元素数量。例如容量 10、`size = 6`，直接序列化会保存 10 个空间，其中 4 个是 null，浪费空间。

所以 ArrayList 自己实现 `writeObject()` / `readObject()`，只序列化 `size` 个元素：

```text
序列化
    ↓
写入 size
    ↓
遍历有效元素
    ↓
反序列化恢复
```

---

### 7. ArrayList 扩容机制？

Java 8 默认初始容量 10。注意：`new ArrayList<>()` 初始容量是 0，第一次 `add` 才创建容量为 10 的数组。

扩容条件：`size >= capacity`

扩容比例：1.5 倍。

```java
newCapacity = oldCapacity + (oldCapacity >> 1);
```

例如：10 → 15 → 22。

```text
添加元素
    ↓
容量不足
    ↓
创建新数组
    ↓
Arrays.copyOf()
    ↓
旧数据复制
    ↓
替换 elementData
```

---

## Set

### 1. Set 有什么特点？如何保证 key 不重复？

Set 特点：无序、不允许重复。

```java
Set<String> set = new HashSet<>();
set.add("A");
set.add("A"); // 结果只有 A
```

原因：Set 底层依赖 Map。HashSet 实际是 HashMap，存储为 `map.put(value, PRESENT)`，Set 元素就是 Map 的 key。

判断重复：先 `hashCode()`，再 `equals()`，两个都相同则认为重复。

---

### 2. HashSet、LinkedHashSet、TreeSet 区别？

| | HashSet | LinkedHashSet | TreeSet |
|---|---|---|---|
| 底层 | HashMap | LinkedHashMap | TreeMap |
| 顺序 | 无序 | 插入顺序 | 排序 |
| 性能 | 最高 | 稍低 | 最低 |
| null | 支持 | 支持 | 不支持 |
| 排序 | 否 | 否 | 支持 |

**HashSet**：顺序不保证，例如可能是 A、C、B。

**LinkedHashSet**：HashMap + 双向链表，保存插入顺序。插入 A B C，遍历也是 A B C。

**TreeSet**：红黑树，自动排序。

```java
TreeSet<Integer> set = new TreeSet<>();
set.add(3);
set.add(1);
set.add(2);
// 结果：1 2 3
```

---

### 3. HashSet 实现原理？

```java
private transient HashMap<E, Object> map;
private static final Object PRESENT = new Object();
```

`add(e)` 实际上是 `map.put(e, PRESENT)`。

```text
add()
    ↓
HashMap.put()
    ↓
计算 hash
    ↓
找到桶
    ↓
equals 比较
    ↓
不存在则保存 key
```

---

### 4. Comparable 和 Comparator 区别？

这是面试经典题。

**Comparable**：内部比较，接口 `java.lang.Comparable`，方法 `compareTo()`。

```java
class Student implements Comparable<Student> {
    public int compareTo(Student s) {
        return this.age - s.age;
    }
}
```

表示学生默认按年龄排序。

**Comparator**：外部比较器，接口 `java.util.Comparator`。

```java
Collections.sort(list, new Comparator<Student>() {
    public int compare(Student a, Student b) {
        return a.age - b.age;
    }
});
```

| | Comparable | Comparator |
|---|---|---|
| 位置 | 类内部 | 外部 |
| 方法 | `compareTo` | `compare` |
| 侵入性 | 高 | 低 |
| 排序方式 | 一种 | 多种 |
| 接口 | `java.lang` | `java.util` |

---

## Queue

### 1. Queue 和 Deque 区别？

**Queue**：单端队列，先进先出（FIFO）。例如 `A B C` 出队得到 A。

**Deque**：双端队列（Double Ended Queue），两端都可以操作：`addFirst` / `addLast`。

```text
Queue
  |
Deque
  |
ArrayDeque
```

---

### 2. ArrayDeque 和 LinkedList 区别？

**ArrayDeque**：底层循环数组。性能高、内存连续、不允许 null。

**LinkedList**：底层双向链表。同时支持 Queue 和 Deque，可以存 null。

| | ArrayDeque | LinkedList |
|---|---|---|
| 结构 | 数组 | 链表 |
| 性能 | 高 | 低 |
| 内存 | 连续 | 节点额外开销 |
| null | 不允许 | 允许 |
| 推荐 | 优先使用 | 兼容场景 |

---

### 3. PriorityQueue 作用和原理？

作用：优先级队列，不是先进先出。

普通队列 `1 5 3` 出队是 `1 5 3`；PriorityQueue 默认出队是 `1 3 5`。

底层：小顶堆，用数组实现 `Object[] queue`。

```text
        1
       / \
      3   5
     /
    7
```

添加：`add()` → 放到末尾 → 上浮 → 保持堆结构。

删除：`poll()` → 删除堆顶 → 最后元素补位 → 下沉。

| 操作 | 复杂度 |
|---|---|
| peek | O(1) |
| add | O(log n) |
| poll | O(log n) |

---

### 4. Queue 中 poll() 和 remove() 区别？

都是删除队头元素。

- `remove()`：队列为空时抛 `NoSuchElementException`
- `poll()`：队列为空时返回 `null`

| 方法 | 空队列 |
|---|---|
| `remove()` | 异常 |
| `poll()` | `null` |

