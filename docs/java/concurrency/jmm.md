# JMM（Java Memory Model）

## 什么是 JMM？

**什么是 JMM？**

JMM（Java Memory Model，Java 内存模型）是 Java 定义的一套多线程并发访问共享变量的规范。

JMM 主要解决三类问题：线程之间的可见性、CPU 缓存一致性、编译器和 CPU 指令重排序。

JMM 围绕并发编程三大特性展开：原子性、可见性、有序性。

常见实现手段：`volatile`、`synchronized`、`ReentrantLock`、`Atomic` 类。

---

## JMM 的内存模型

**JMM 将内存抽象为哪两部分？**

JMM 把内存分为线程共享的主内存和线程私有的工作内存，线程不能直接访问彼此的工作内存。

- **主内存（Main Memory）**：所有线程共享，存放实例变量、静态变量、数组元素等。例如 `int count = 0` 中的 `count` 存储在主内存中。
- **工作内存（Working Memory）**：每个线程私有，是主内存变量在本线程的副本。

**线程如何读写共享变量？**

```
读取：主内存 → 工作内存 → 线程执行
写入：线程 → 工作内存 → 主内存
```

线程之间不能直接访问彼此工作内存，只能通过主内存进行通信。

---

## 并发三大特性

### 原子性

**什么是原子性？**

原子性指一个操作执行过程中不能被其他线程打断。

**示例：**

```java
i++;
```

看起来是一行代码，实际包含三步：读取 `i` → `i + 1` → 写回 `i`。

多个线程同时执行 `i++` 可能出错：

```
i = 0
线程 A 读取 0，线程 B 读取 0
线程 A 写回 1，线程 B 写回 1
最终结果 i = 1（而不是 2）
```

**总结：**

原子性 = 操作要么全部完成，要么完全不执行，中间不会被其他线程打断。

保证原子性的方式：`synchronized`、`ReentrantLock`、`AtomicInteger`、CAS。

### 可见性

**什么是可见性？**

可见性指一个线程修改共享变量后，其他线程能够立即看到最新值。

**示例：**

```java
boolean flag = true;

// 线程 A
while (flag) { }

// 线程 B
flag = false;
```

如果没有可见性保证，线程 A 可能一直读取自己的工作内存缓存，永远无法退出循环。

使用 `volatile boolean flag` 后：

```
线程 B 修改 flag → 刷新到主内存 → 线程 A 重新读取 → 立即看到最新值
```

**总结：**

可见性 = 一个线程对共享变量的修改，对其他线程立即可见。

保证可见性的方式：`volatile`、`synchronized`、`Lock`。

### 有序性

**什么是有序性？**

有序性指程序执行结果应符合代码逻辑顺序。

**示例：**

```java
int a = 1;
int b = 2;
```

为提高性能，编译器或 CPU 可能重排序为 `b = 2; a = 1;`，单线程下没有问题，多线程下可能出问题。

**总结：**

有序性 = 程序执行的先后顺序符合预期逻辑，不会被编译器或 CPU 随意重排导致多线程异常。

保证有序性的方式：`volatile`（禁止部分重排）、`synchronized`、Happens-Before 规则。

---

## 指令重排序

**什么是指令重排序？**

为了提升执行效率，编译器优化、CPU 流水线、CPU 乱序执行都可能导致指令顺序发生变化。

**示例：**

```java
instance = new Singleton();
```

`new` 操作实际分为三步：

1. 分配内存
2. 初始化对象
3. 将 `instance` 指向内存

经过重排序后，2 和 3 可能交换，变成：

1. 分配内存
2. 将 `instance` 指向内存（此时对象尚未初始化）
3. 初始化对象

此时另一个线程可能拿到一个尚未初始化完成的对象。

**总结：**

指令重排序 = 编译器或 CPU 为提高性能，在不改变单线程语义的前提下调整指令执行顺序。

双重检查锁（DCL）必须使用 `volatile`：

```java
private static volatile Singleton instance;
```

`volatile` 禁止 2 和 3 的重排序，防止其他线程拿到未初始化完成的对象。

---

## Happens-Before

**什么是 Happens-Before？**

Happens-Before 是 JMM 定义的一组规则，用于保证多线程下的可见性和有序性。

**总结：**

如果操作 A Happens-Before 操作 B，那么：

- A 的执行结果对 B 一定可见
- A 的执行顺序排在 B 之前

它并不要求 A 在真实时间上一定先发生，而是保证可见性和有序性的语义。

---

**常见的 Happens-Before 规则有哪些？**

| 规则 | 说明 | 示例 |
|------|------|------|
| 程序次序规则 | 同一线程内，前面的操作 Happens-Before 后面的操作 | `a = 1;` → `b = a;` |
| volatile 规则 | 对 volatile 变量的写 Happens-Before 后续对该变量的读 | `flag = true;` → `if (flag)` |
| 锁规则 | 对同一把锁，`unlock()` Happens-Before 后续的 `lock()` | `synchronized` 释放锁 → 另一线程获取锁 |
| 线程启动规则 | `thread.start()` Happens-Before 线程内的 `run()` | 主线程启动子线程 |
| 线程终止规则 | 线程内所有操作 Happens-Before `thread.join()` 返回 | `join()` 后一定能看到线程执行结果 |
| 传递性 | A Happens-Before B，B Happens-Before C，则 A Happens-Before C | 多条规则链式推导 |

**总结（记忆版）：**

1. **程序次序规则**：同线程内，前面的操作 Happens-Before 后面的操作
2. **volatile 规则**：volatile 写 Happens-Before 后续 volatile 读
3. **锁规则**：同一把锁，unlock Happens-Before 后续 lock
4. **线程启动规则**：`start()` Happens-Before `run()`
5. **线程终止规则**：`join()` 返回后一定能看到线程执行结果
6. **传递性**：A → B → C，则 A → C
