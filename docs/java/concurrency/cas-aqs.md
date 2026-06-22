# CAS & AQS

## CAS 是什么？

**CAS 是什么？**

CAS（Compare And Swap，比对并交换）是一种无锁的原子更新机制，包含三个操作数：

| 操作数 | 含义 |
|--------|------|
| V | 内存值 |
| A | 期望值 |
| B | 新值 |

执行逻辑：如果 `V == A`，则将 V 更新为 B，否则不做任何操作。

**底层实现：**

CAS 不是"锁"，而是 CPU 提供的原子指令（`cmpxchg`），通过硬件保证原子性。Java 中通过 `Unsafe.compareAndSwapXXX` 或 `VarHandle`（JDK 9+）实现。

**总结：**

CAS = CPU 级原子操作 + 自旋重试的乐观锁机制。

---

## CAS 为什么是乐观锁？

**CAS 为什么是乐观锁？**

乐观锁默认认为不会发生冲突：不加锁直接修改，失败后重试。

CAS 就是：不加锁 → 直接改 → 失败就重试（自旋）。

---

## CAS 的优缺点

**CAS 有什么优缺点？**

| 优点 | 缺点 |
|------|------|
| 无需阻塞，避免线程挂起/唤醒 | 高竞争时大量 CAS 失败，CPU 空转 |
| 性能高（低竞争场景） | ABA 问题 |
| 不涉及用户态/内核态切换 | 无法管理复杂临界区和等待队列 |

### ABA 问题

**什么是 ABA 问题？**

线程 A 读取值，期间值从 A → B → A，线程 A 以为没变，但实际上变过。

**解决方案：**

```java
// 版本号
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(100, 1);

// 标记位
AtomicMarkableReference<T> ref;
```

**总结：**

ABA = 值没变但过程变过，用 `AtomicStampedReference`（版本号）或 `AtomicMarkableReference`（标记位）解决。

---

## AtomicInteger 原理

**AtomicInteger 的实现原理是什么？**

核心结构：`private volatile int value;`

核心操作：`compareAndSet(int expect, int update)`，底层通过 Unsafe CAS + 自旋重试。

```
读取 value → CAS 尝试更新 → 成功返回 / 失败自旋重试
```

---

## CAS 为什么不能替代所有锁？

**CAS 为什么不能替代所有锁？**

| 不适用场景 | 原因 |
|------------|------|
| 高竞争 | CAS 失败率高，CPU 浪费严重 |
| 复杂临界区 | 需要阻塞等待，CAS 无法管理队列 |
| 协调机制 | 无法实现 Condition 等待、多线程顺序控制 |

**总结：**

CAS 适合低竞争 + 短操作；锁适合高竞争 + 阻塞场景。

---

## AQS 是什么？

**AQS 是什么？**

AQS（AbstractQueuedSynchronizer）是 Java 并发包的核心框架类，用于构建 `ReentrantLock`、`Semaphore`、`CountDownLatch`、`ReentrantReadWriteLock` 等。

**核心结构：**

| 组件 | 说明 |
|------|------|
| state（volatile） | 锁状态 / 资源数量 / 重入次数 |
| FIFO 双向队列（CLH 变体） | 线程封装为 Node，`prev ← node → next` |
| CAS 修改 state | `compareAndSetState()` |

**总结：**

AQS = state + CLH 队列 + 模板方法。CAS 是基础原子操作，AQS 是基于 CAS + 队列实现的同步框架。

---

## AQS 工作流程

**AQS 加锁和解锁流程是什么？**

**加锁：**

```
tryAcquire() 成功 → 直接获取锁
       ↓ 失败
加入 CLH 队列 → 自旋 + park 阻塞 → 前驱释放后唤醒
```

**解锁：**

```
release() → state-- → 为 0 时唤醒队列头节点
```

---

## CAS 和 AQS 的关系

| 对比 | CAS | AQS |
|------|-----|-----|
| 本质 | CPU 原子指令 | 同步框架 |
| 作用 | 状态更新 | 阻塞 + 队列管理 |
| 是否阻塞 | 不阻塞 | 阻塞 |
| 是否依赖 CAS | 是 | 是（核心依赖） |

---

## CountDownLatch

**CountDownLatch 的作用和原理是什么？**

让一个或多个线程等待其他线程完成。

```java
countDown(); // state - 1
await();     // 等待 state 为 0
```

**使用场景：** 多线程初始化完成、并发任务汇总、批量任务完成控制。

**底层：** AQS 的 state 作为计数器，`countDown` 通过 CAS 减 1，`await` 在 state 不为 0 时入队阻塞。

---

## Semaphore

**Semaphore 的作用和原理是什么？**

控制同时访问资源的线程数量（限流）。

```java
acquire(); // 获取许可
release(); // 释放许可
```

**底层：** state = 可用许可数，`acquire` 通过 CAS 减 state，不够则入队阻塞。

**使用场景：** 限流、数据库连接池、并发控制、资源池管理。

---

## ReentrantLock

**ReentrantLock 是什么？**

基于 AQS 实现的可重入独占锁。

| 特点 | 说明 |
|------|------|
| 可重入 | 同一线程再次获取，state++ |
| 可中断 | 支持 `lockInterruptibly()` |
| 公平/非公平 | `new ReentrantLock(true/false)` |
| Condition | 支持多条件等待 |

**底层：** state = 0 无锁，state > 0 已加锁；释放时 state--，为 0 时完全释放。

---

## 用 AQS 实现可重入公平锁

**如何用 AQS 实现一个可重入公平锁？**

核心设计：state 表示锁状态 + 重入次数，FIFO 队列保证公平性，CAS 控制 state。

```java
class MyFairLock extends AbstractQueuedSynchronizer {

    @Override
    protected boolean tryAcquire(int arg) {
        Thread current = Thread.currentThread();
        int c = getState();

        if (c == 0) {
            // 公平锁：判断是否有前驱节点
            if (!hasQueuedPredecessors() &&
                compareAndSetState(0, arg)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        } else if (current == getExclusiveOwnerThread()) {
            setState(c + arg); // 可重入
            return true;
        }
        return false;
    }

    @Override
    protected boolean tryRelease(int arg) {
        int c = getState() - arg;
        if (Thread.currentThread() != getExclusiveOwnerThread()) {
            throw new IllegalMonitorStateException();
        }
        boolean free = false;
        if (c == 0) {
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }
}
```

**公平锁关键点：** `hasQueuedPredecessors()` 判断是否有比当前线程更早排队的线程。

---

## 面试加分点

**AQS 为什么用 CLH 队列？**

- FIFO 保证公平
- 自旋 + 阻塞结合，性能更好

**为什么 AQS 不用纯 CAS？**

- CAS 不能阻塞
- 不能管理等待队列

**为什么需要 park / unpark？**

比 `synchronized` 的 `wait` / `notify` 更轻量，可精确唤醒指定线程。

---

## 面试总结（推荐背诵版）

**CAS：** CPU 级原子操作 + 自旋重试的乐观锁机制。

**ABA：** 值没变但过程变过，用版本号解决。

**AQS：** 基于 state + CLH 队列 + CAS 构建的同步框架。

**ReentrantLock：** 基于 AQS 实现的可重入独占锁。

**CountDownLatch：** 基于 AQS 的计数器同步工具。

**Semaphore：** 基于 AQS 的资源限流工具。
