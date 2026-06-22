# synchronized

## synchronized 原理

**synchronized 的实现原理是什么？**

`synchronized` 是 Java 内置同步机制，用于保证多线程环境下共享资源访问的线程安全，底层依赖 JVM 的 **Monitor（监视器锁）** 实现。

**编译层面：**

- **同步代码块**：生成 `monitorenter`、`monitorexit` 指令
- **同步方法**：在方法访问标志中增加 `ACC_SYNCHRONIZED` 标记

JVM 执行时会关联到对象对应的 Monitor，实现互斥访问。同时利用对象头中的 **Mark Word** 记录锁状态。

**总结：**

`synchronized` 底层依赖 JVM 的 Monitor 实现。同步代码块通过 `monitorenter` 和 `monitorexit` 完成加锁解锁，同步方法通过 `ACC_SYNCHRONIZED` 标记实现。锁关联在对象上，而非代码本身。

---

## 可重入锁

**什么是可重入锁？**

同一个线程在已经持有锁的情况下，可以再次获取同一把锁，不会发生死锁。

**示例：**

```java
public synchronized void a() {
    b();
}

public synchronized void b() { }
```

线程进入 `a()` 后再次进入 `b()` 不会被阻塞。

**synchronized 如何实现可重入？**

Monitor 内部维护 **Owner**（持有锁的线程）和 **Recursion Count**（重入次数）：

- 当前线程 == Owner 时，Count++
- 释放锁时 Count--，直到 Count == 0 才真正释放 Monitor

**总结：**

可重入锁 = 同一线程可多次获取同一把锁。`synchronized` 通过 Monitor 的 Owner + 重入计数实现。

---

## 锁升级过程

**synchronized 锁升级流程是什么？**

```
无锁 → 偏向锁 → 轻量级锁 → 重量级锁
```

只能升级，不能降级。

| 阶段 | 说明 |
|------|------|
| 无锁 | 对象刚创建，Mark Word 记录对象信息，无线程持有锁 |
| 偏向锁 | 第一个线程访问时，将线程 ID 写入 Mark Word，同一线程再次进入无需 CAS（JDK 15 默认关闭，JDK 18+ 基本移除，现代 JDK 17/21 已不再使用） |
| 轻量级锁 | 出现第二个线程竞争时，偏向锁撤销；通过 CAS 将 Mark Word 替换为 Lock Record 地址，失败则自旋等待 |
| 重量级锁 | 竞争激烈时膨胀为 ObjectMonitor，竞争失败线程进入 BLOCKED 状态被挂起 |

**关于自旋：**

早期 HotSpot 存在固定自旋次数，JDK 后期采用 **自适应自旋（Adaptive Spinning）**，JVM 根据历史获取成功率动态调整是否继续自旋及自旋时长。

**Monitor 结构：**

| 组件 | 作用 |
|------|------|
| Owner | 当前持有锁的线程 |
| EntryList | 竞争失败线程，BLOCKED 状态，等待获取锁 |
| WaitSet | 调用 `wait()` 后进入，WAITING 状态，等待 `notify()` / `notifyAll()` 唤醒 |

**总结：**

JVM 利用对象头 Mark Word 记录锁状态，经历无锁 → 偏向锁 → 轻量级锁 → 重量级锁的升级。偏向锁通过记录线程 ID 减少 CAS；轻量级锁通过 CAS + 自旋提高性能；竞争激烈时膨胀为 ObjectMonitor 重量级锁。

---

## 公平锁与非公平锁

**什么是公平锁？**

按照线程请求锁的先后顺序分配锁，遵循 FIFO 原则，等待时间最长的线程优先获得锁。

**synchronized 是公平锁吗？**

不是。`synchronized` 是非公平锁，JVM 不保证获取顺序。

**ReentrantLock 如何选择？**

```java
new ReentrantLock(true);   // 公平锁
new ReentrantLock(false);  // 非公平锁（默认）
```

**非公平锁特点：**

- 允许线程插队（Barging），新线程仍有机会先获得锁
- 优点：吞吐量更高
- 缺点：可能导致线程饥饿

**总结：**

`synchronized` 是可重入、非公平锁。公平锁按 FIFO 分配；非公平锁允许插队，吞吐量更高但可能饥饿。

---

## 死锁

**什么是死锁？**

多个线程互相持有对方需要的资源，且都不主动释放，导致永久等待。

**死锁四个必要条件：**

1. 互斥条件
2. 请求与保持
3. 不可剥夺
4. 循环等待

只要破坏其中一个条件即可避免死锁。

---

## JVM 优化

| 优化 | 说明 |
|------|------|
| 锁消除 | JIT 通过逃逸分析发现对象不会逃逸到其他线程，则去掉同步 |
| 锁升级 | 无锁 → 偏向锁 → 轻量级锁 → 重量级锁 |
| 自适应自旋 | 根据历史自旋成功率动态调整自旋策略 |
| 锁粗化 | 将循环内多次加锁合并为一次，减少频繁加锁解锁 |

**锁粗化示例：**

```java
// 优化前
for (int i = 0; i < 10000; i++) {
    synchronized (lock) { ... }
}

// JIT 可能优化为
synchronized (lock) {
    for (...) { ... }
}
```

---

## 常见追问

**为什么对象计算过 hashCode 后不能使用偏向锁？**

偏向锁和 hashCode 都需要占用 Mark Word 存储空间。对象生成 `identityHashCode` 后，Mark Word 无法同时保存线程 ID 和 hashCode，因此偏向锁会被撤销。

**synchronized 锁的是代码还是对象？**

锁的不是代码，而是对象对应的 Monitor。例如 `synchronized(obj)` 锁的是 `obj` 对应的 Monitor。

---

## 面试总结（推荐背诵版）

`synchronized` 底层依赖 JVM 的 Monitor 实现。同步代码块通过 `monitorenter` 和 `monitorexit` 指令完成加锁解锁，同步方法通过 `ACC_SYNCHRONIZED` 标记实现。

JVM 利用对象头 Mark Word 记录锁状态，锁会经历无锁 → 偏向锁 → 轻量级锁 → 重量级锁的升级过程（现代 JDK 17/21 已不再使用偏向锁）。

偏向锁通过记录线程 ID 减少 CAS，轻量级锁通过 CAS + 自旋提高性能，竞争激烈时膨胀为 ObjectMonitor 重量级锁。

`synchronized` 是可重入、非公平锁。JVM 还提供锁消除、自适应自旋、锁粗化等优化手段提升性能。
