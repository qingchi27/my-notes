# ThreadLocal

## ThreadLocal 是什么

**核心定义**

ThreadLocal 用于为每个线程提供独立的变量副本，实现线程之间的数据隔离。

**一句话理解**

- 普通变量：所有线程共享
- ThreadLocal：每个线程一份「独立存储空间」

**示例：**

```java
ThreadLocal<User> tl = new ThreadLocal<>();

tl.set(user);
User u = tl.get();
```

**效果：**

```
线程 A → userA
线程 B → userB
```

互不影响。

---

## ThreadLocal 作用

### 1. 线程隔离

避免多线程共享变量冲突。

### 2. 传递上下文信息（非常重要）

- 用户信息
- TraceId（链路追踪）
- 权限信息

### 3. 解决线程不安全问题

典型场景：

- `SimpleDateFormat`
- `Random`（旧版本）

### 4. 减少参数传递

避免「方法层层传参」。

---

## ThreadLocal 原理（重点）

**核心一句话**

ThreadLocal 本身不存数据，数据存在 Thread 里面。

**结构图（必背）**

```
Thread
 └── ThreadLocalMap
        ├── Entry
        │     key   = ThreadLocal
        │     value = 业务数据
```

**set() 过程**

```
Thread.currentThread()
   ↓
获取 ThreadLocalMap
   ↓
存 Entry(ThreadLocal, value)
```

**get() 过程**

```
Thread.currentThread()
   ↓
ThreadLocalMap
   ↓
通过 ThreadLocal 找 value
```

---

## ThreadLocalMap 特点

### 1. 是 Thread 的内部结构

`Thread.threadLocals`

### 2. 类似 HashMap，但不是 HashMap

- open addressing（开放寻址）
- 不是链表结构
- 更轻量

### 3. Entry 结构特殊

```java
static class Entry extends WeakReference<ThreadLocal<?>>
```

---

## key/value 设计（超级重点）

**结构**

```
key   = ThreadLocal（弱引用）
value = Object（强引用）
```

**为什么 key 是弱引用？**

防止 ThreadLocal 对象无法被回收。

**为什么 value 不是弱引用？**

防止数据被提前回收，保证 ThreadLocal 可用性。

---

## ThreadLocal 内存泄漏问题（高频必问）

### 1. 发生机制

```
ThreadLocal 被回收
   ↓
key = null
   ↓
value 仍存在
   ↓
线程（线程池）长期存活
   ↓
内存无法释放
```

### 2. 根本原因

ThreadLocalMap 是线程级别的，而线程（尤其线程池）不会销毁。

### 3. 典型场景

- Tomcat 线程池
- 线程复用的 `ExecutorService`
- Web 请求上下文

### 4. 问题表现

- 内存泄漏
- 数据串号（脏数据）
- Full GC 频繁

---

## 为什么 ThreadLocal 会「失去引用」

**本质原因**

ThreadLocal 是普通 Java 对象：如果没有 GC Roots 引用 → 会被 GC。

**常见情况**

**1. 方法内创建**

```java
void test() {
    ThreadLocal tl = new ThreadLocal();
}
```

方法结束 → 栈销毁 → 引用消失。

**2. 匿名创建**

```java
new ThreadLocal().set("x");
```

没有变量接住。

**3. 被重新赋值**

```java
tl = new ThreadLocal();
```

旧对象失去引用。

---

## ThreadLocal 为什么容易泄漏（关键总结）

因为三点叠加：

1. ThreadLocalMap 生命周期 = Thread 生命周期
2. Thread（线程池）生命周期很长
3. value 是强引用

---

## ThreadLocal 如何正确使用（面试加分点）

**标准写法（必须背）**

```java
try {
    threadLocal.set(value);

    // business logic
} finally {
    threadLocal.remove();
}
```

**remove() 作用**

- 删除 Entry
- 避免 key = null + value 残留
- 防止线程复用污染

---

## ThreadLocal 使用场景（面试常问）

### 1. 用户上下文

`UserContextHolder`

### 2. 链路追踪

TraceId

### 3. 数据库连接管理

Connection 绑定线程

### 4. 日期格式化（旧方案）

`ThreadLocal<SimpleDateFormat>`

---

## ThreadLocal vs synchronized（对比题）

| 对比 | ThreadLocal | synchronized |
|------|-------------|--------------|
| 目标 | 数据隔离 | 数据共享安全 |
| 方式 | 各线程一份 | 多线程竞争 |
| 性能 | 高 | 低 |
| 本质 | 空间换时间 | 时间换安全 |

---

## 面试一句话总结（终极版）

ThreadLocal 通过为每个线程维护一个 ThreadLocalMap，实现线程级变量隔离。
数据存储在 Thread 内部结构中，key 为 ThreadLocal 的弱引用，value 为强引用。
在线程池场景下如果不调用 `remove()`，容易造成 value 无法回收，从而引发内存泄漏或数据污染问题。
