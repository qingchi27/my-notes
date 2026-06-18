# volatile

## volatile 作用

**volatile 有什么作用？**

`volatile` 有两个核心作用：保证变量的可见性、禁止指令重排序。但需要注意，`volatile` 不能保证原子性。

### 1. 保证可见性

当一个线程修改了 `volatile` 变量后：

- 会立即刷新到主内存
- 其他线程读取时不会使用工作内存中的旧值，而是直接从主内存重新读取

**示例：**

```java
private volatile boolean flag = true;

// 线程 A
flag = false;

// 线程 B
while (flag) {
    // do something
}
```

如果没有 `volatile`，线程 B 可能一直读取自己工作内存中的 `true`，导致死循环。

加上 `volatile` 后，`flag = false` 会立即对其他线程可见。

### 2. 禁止指令重排序

JVM 和 CPU 为了提高执行效率会进行指令重排序。

**示例：**

```java
obj = new User();
```

实际上可能被拆成：

1. 分配内存
2. 初始化对象
3. 将引用指向内存

重排序后可能变成：

1. 分配内存
3. 引用指向内存
2. 初始化对象

如果此时另一个线程拿到引用：

```java
if (obj != null) {
    obj.doSomething();
}
```

可能访问到一个尚未初始化完成的对象。

`volatile` 会通过内存屏障（Memory Barrier）禁止这种重排序。

**总结：**

`volatile` 有两个核心作用：第一保证可见性，一个线程修改变量后会立即刷新到主内存，其他线程能够马上看到最新值；第二禁止指令重排序，通过内存屏障保证操作顺序，常用于状态标志位和 DCL 单例模式。`volatile` 不能保证原子性，因此不能完全保证线程安全。

---

## volatile 能保证线程安全吗？

**volatile 能保证线程安全吗？**

不能。`volatile` 只能保证可见性和有序性，不能保证原子性，因此不能完全保证线程安全。

**示例：**

```java
private volatile int count = 0;

public void add() {
    count++;
}
```

`count++` 实际包含三步：读取 count → count + 1 → 写回 count。

```
线程 A 读取到 0，线程 B 读取到 0
线程 A 写回 1，线程 B 写回 1
最终结果 count = 1（而不是 2）
```

发生了丢失更新。

**如何保证原子性？**

- `synchronized`
- `ReentrantLock`
- `AtomicInteger`

```java
AtomicInteger count = new AtomicInteger();
count.incrementAndGet();
```

**总结：**

`volatile` 只能保证可见性和有序性，不能保证原子性。像 `count++` 这样的操作包含读取、修改、写回三个步骤，`volatile` 只能保证每一步结果对其他线程可见，但无法保证整个操作过程不被其他线程打断，因此仍然会出现线程安全问题。

---

## volatile 和 synchronized 区别

**volatile 和 synchronized 有什么区别？**

| 对比项 | volatile | synchronized |
|--------|----------|--------------|
| 可见性 | 支持 | 支持 |
| 有序性 | 支持 | 支持 |
| 原子性 | 不支持 | 支持 |
| 是否阻塞线程 | 不阻塞 | 会阻塞 |
| 性能 | 较高 | 相对较低 |
| 使用场景 | 状态标记、双重检查锁 | 共享资源同步 |

**总结：**

`volatile` 只能保证可见性和有序性，适用于一个线程写、多个线程读的场景；`synchronized` 除了保证可见性和有序性之外，还能保证原子性，通过 Monitor 机制实现互斥访问，因此能够真正保证线程安全。

---

## volatile 原理

**volatile 的实现原理是什么？**

`volatile` 变量读写时，JVM 会插入内存屏障（Memory Barrier）。

- **写操作**：工作内存 → 主内存
- **读操作**：主内存 → 工作内存

从而保证数据最新。

---

## synchronized 原理

**synchronized 的实现原理是什么？**

JDK 1.6 之后，`synchronized` 底层依赖 Monitor 实现。

字节码中对应：

```
monitorenter
monitorexit
```

同一时刻只有一个线程获得 Monitor，因此能够保证可见性、有序性、原子性。

---

## 指令重排序

**什么是指令重排序？**

指令重排序（Instruction Reordering）是为了提高 CPU 执行效率，编译器和 CPU 在不影响单线程执行结果的前提下，调整指令执行顺序的一种优化手段。

### 重排序分类

| 类型 | 说明 |
|------|------|
| 编译器重排序 | Java 源码 → 字节码，JIT 编译时优化 |
| CPU 重排序 | CPU 流水线执行时优化 |
| 内存系统重排序 | CPU 缓存导致的执行顺序变化 |

### 为什么单线程没问题

```java
int a = 1;
int b = a + 1;
```

即使发生重排序，只要最终结果一致，程序就是正确的。这叫 **as-if-serial 原则**——看起来像串行执行一样。

### 为什么多线程有问题

**示例：**

```java
class Singleton {

    private static volatile Singleton INSTANCE;

    public static Singleton getInstance() {

        if (INSTANCE == null) {

            synchronized (Singleton.class) {

                if (INSTANCE == null) {
                    INSTANCE = new Singleton();
                }
            }
        }

        return INSTANCE;
    }
}
```

这里必须使用 `volatile`，否则 `INSTANCE = new Singleton()` 可能发生重排序：

1. 分配内存
2. 引用赋值
3. 对象初始化

其他线程可能拿到半初始化对象。

**总结：**

指令重排序 = 编译器或 CPU 为提高性能，在不改变单线程语义的前提下调整指令执行顺序。多线程场景下需要通过 `volatile` 或 `synchronized` 等手段防止有害重排序。

---

## 面试总结（推荐背诵版）

**volatile 作用**

`volatile` 有两个作用：第一保证可见性，一个线程修改变量后会立即刷新到主内存，其他线程能够马上看到最新值；第二禁止指令重排序，通过内存屏障保证操作顺序，常用于状态标志位和 DCL 单例模式。`volatile` 不能保证原子性，因此不能完全保证线程安全。

**volatile 和 synchronized 区别**

`volatile` 只能保证可见性和有序性，适用于一个线程写多个线程读的场景；`synchronized` 除了保证可见性和有序性之外，还能保证原子性，通过 Monitor 机制实现互斥访问，因此能够真正保证线程安全。

**volatile 为什么不能保证原子性**

因为像 `count++` 这样的操作并不是一个原子操作，而是读取、修改、写回三个步骤组成。`volatile` 只能保证每一步结果对其他线程可见，但无法保证整个操作过程不被其他线程打断，因此仍然会出现线程安全问题。
