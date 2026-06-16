# 并发编程基础

## 1. 什么是 Java 多线程？

Java 多线程是指在一个 JVM 进程中，同时运行多个线程来执行不同任务。

### 线程之间的特点

**每个线程拥有：**

- 独立的程序计数器
- 虚拟机栈
- 本地方法栈

**线程之间共享：**

- 堆内存
- 线程间通过共享内存通信（不是消息传递）

### 多线程带来的核心问题

- 原子性（Atomicity）
- 可见性（Visibility）
- 有序性（Ordering）

## 2. 三大特性（JMM）

### 2.1 原子性（Atomicity）

一个操作要么全部执行，要么全部不执行，中间不会被线程切换打断。

**例子：**

```java
i++;
```

`i++` 不是原子操作（包含读取 + 修改 + 写入）。

**保障方式：**

- `synchronized`
- `Lock`
- `AtomicInteger`（CAS）

### 2.2 可见性（Visibility）

当一个线程修改共享变量后，其他线程不一定立即可见，因为：

- CPU 缓存
- 指令重排
- 工作内存机制（JMM）

**保障方式：**

- `volatile`
- `synchronized`
- `Lock`
- `final`（初始化安全）

### 2.3 有序性（Ordering）

代码执行顺序可能被编译器 / CPU 指令重排优化。

**例子：**

```java
a = 1;
b = 2;
```

可能被重排，但单线程语义不变。

**保障方式：**

- `volatile`（禁止部分重排）
- `synchronized`
- Happens-Before 规则

## 3. Java 线程 vs 操作系统线程

### 3.1 平台线程（Platform Thread）

- Java 传统线程（JDK 21 之前默认）
- 1:1 对应 OS 线程
- 由操作系统调度
- 上下文切换成本高
- 创建成本高（约 MB 级栈内存）

**特点：**

- 适合 CPU 密集型
- 不适合超高并发 IO

### 3.2 虚拟线程（Virtual Thread / JDK 21）

- Java 21 引入（Project Loom）
- M:N 模型（多个虚拟线程映射少量平台线程）
- 由 JVM 调度（不是 OS）
- 运行在 ForkJoinPool + scheduler
- 栈内存非常小（按需增长）
- 可以轻松创建百万级线程

**适用场景：**

- IO 密集型（HTTP / DB / RPC）

::: warning 注意
虚拟线程 ≠ 协程（只是类似思想，不完全等价）
:::

## 4. 创建线程方式

### 4.1 继承 Thread

```java
class MyThread extends Thread {
    public void run() {}
}
```

### 4.2 实现 Runnable

```java
class MyTask implements Runnable {
    public void run() {}
}
```

### 4.3 Callable + FutureTask（可返回结果）

```java
Callable<Integer> task = () -> 123;
FutureTask<Integer> future = new FutureTask<>(task);
new Thread(future).start();
```

## 5. 启动线程

```java
thread.start();
```

::: warning 注意
- `start()` 才是启动新线程
- `run()` 只是普通方法调用
:::

## 6. 如何停止线程

Java 没有安全的强制停止线程机制。

### 6.1 正确方式：interrupt

```java
thread.interrupt();
```

线程内部需要配合：

```java
if (Thread.currentThread().isInterrupted()) {
    return;
}
```

### 6.2 阻塞状态被 interrupt

如果线程处于 `sleep`、`wait`、`join` 等阻塞状态，会发生：

- 立刻退出阻塞
- 抛出 `InterruptedException`

### 6.3 stop()（错误方式）

::: danger 已废弃
`stop()` 方法已被废弃，原因：

- 直接杀线程
- 可能破坏数据一致性
- 不释放锁 → 死锁风险
:::

### 6.4 推荐模式（标准写法）

```java
while (!Thread.currentThread().isInterrupted()) {
    // do work
}
```

## 7. Java 线程状态

### 正确状态（JDK 标准）

| 状态 | 说明 |
|------|------|
| `NEW` | 线程创建但未启动 |
| `RUNNABLE` | 可运行状态（包括运行中 + 就绪） |
| `BLOCKED` | 等待进入 synchronized 监视器锁 |
| `WAITING` | 无限等待（需要手动唤醒） |
| `TIMED_WAITING` | 有时间限制的等待 |
| `TERMINATED` | 线程执行结束 |

::: tip 状态说明
Java 没有 `RUNNING` / `READY` 这两个状态。`RUNNABLE` 已包含就绪（ready）和运行中（running）。
:::

### 状态详解

#### NEW

线程创建但未启动。

#### RUNNABLE

可运行状态（包括运行中 + 就绪）。

#### BLOCKED

- 等待进入 synchronized 监视器锁
- 卡在"抢锁"

#### WAITING

无限等待（需要手动唤醒）。

**触发方式：**

- `wait()`
- `join()`
- `LockSupport.park()`

#### TIMED_WAITING

有时间限制的等待：

- `sleep(time)`
- `wait(time)`
- `join(time)`

#### TERMINATED

线程执行结束。

## 8. sleep vs wait

| 对比项 | sleep | wait |
|--------|-------|------|
| 释放锁 | 不释放 synchronized 锁 | 释放锁 |
| 恢复方式 | 到时间自动恢复 | 需要 `notify` / `notifyAll` 唤醒 |
| 所属类 | `Thread` 方法 | `Object` 方法 |
| 使用条件 | 无 | 必须在 synchronized 中使用 |

## 9. BLOCKED vs WAITING

| 对比项 | BLOCKED | WAITING |
|--------|---------|---------|
| 触发原因 | 竞争锁失败，等待进入 synchronized | 主动进入等待 |
| 恢复方式 | 获取锁后自动继续 | 必须被唤醒（notify / interrupt） |

## 10. interrupt 原理

### 本质

每个线程都有一个 **interrupt flag**（中断标记位）。

### interrupt 做了什么？

```java
thread.interrupt();
```

会做两件事：

1. **设置中断标记**：`interrupt flag = true`
2. **如果线程在阻塞状态**（`sleep` / `wait` / `join`）：
   - 清除阻塞
   - 抛出 `InterruptedException`
   - 清除 interrupt flag（部分情况）
3. **如果线程在运行中**：
   - 不会打断执行，只是标记 `interrupt = true`
   - 需要业务代码主动检测

### 正确使用方式

```java
while (!Thread.currentThread().isInterrupted()) {
    // do work
}
```
