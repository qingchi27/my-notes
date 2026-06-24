# 线程池（ThreadPool）

## 什么是线程池

**定义**

线程池是一种池化技术，用于管理和复用线程。

线程池会提前创建一定数量的线程，当任务到来时直接使用已有线程执行，而不是每次都创建和销毁线程。

**为什么使用线程池**

线程的创建和销毁都需要消耗系统资源：

```
创建线程
   ↓
分配内存
   ↓
系统调度
   ↓
执行任务
   ↓
销毁线程
```

如果频繁创建和销毁线程，会带来较大的性能开销。

**线程池的作用：**

- 降低线程创建和销毁开销
- 提高响应速度
- 提高线程复用率
- 控制线程数量
- 防止系统资源耗尽
- 提高系统稳定性

---

## 线程池核心组成

一个线程池主要由以下部分组成：

```
ThreadPoolExecutor
├── 工作线程（Worker）
├── 任务队列（BlockingQueue）
├── 线程工厂（ThreadFactory）
└── 拒绝策略（RejectedExecutionHandler）
```

---

## ThreadPoolExecutor 七大参数

ThreadPoolExecutor 是 Java 线程池的核心实现类。

**构造方法：**

```java
ThreadPoolExecutor(
    int corePoolSize,
    int maximumPoolSize,
    long keepAliveTime,
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    ThreadFactory threadFactory,
    RejectedExecutionHandler handler
)
```

### 1. corePoolSize（核心线程数）

线程池长期保留的线程数量。

**特点：**

- 即使空闲也不会被回收（默认情况下）
- 任务优先使用核心线程执行

**例如：**

```
corePoolSize = 5
```

表示线程池至少保留 5 个线程。

### 2. maximumPoolSize（最大线程数）

线程池允许创建的最大线程数量。

**例如：**

```
maximumPoolSize = 10
```

表示线程池最多创建 10 个线程。

### 3. keepAliveTime（空闲存活时间）

非核心线程空闲多久后被回收。

**例如：**

```
keepAliveTime = 60
```

表示空闲 60 秒后回收。

### 4. unit（时间单位）

keepAliveTime 对应的时间单位。

**例如：**

```java
TimeUnit.SECONDS
TimeUnit.MILLISECONDS
TimeUnit.MINUTES
```

### 5. workQueue（任务队列）

用于存放等待执行的任务。

**常见实现：**

**LinkedBlockingQueue**

```java
new LinkedBlockingQueue<>()
```

**特点：**

- 链表结构
- 默认容量 `Integer.MAX_VALUE`
- 近似无界队列

**ArrayBlockingQueue**

```java
new ArrayBlockingQueue<>(1000)
```

**特点：**

- 数组结构
- 有界队列
- 生产环境常用

**SynchronousQueue**

```java
new SynchronousQueue<>()
```

**特点：**

- 不存储任务
- 提交一个任务必须立即被线程处理

### 6. threadFactory（线程工厂）

负责创建线程。

**作用：**

- 设置线程名称
- 设置是否为守护线程
- 设置优先级

**例如：**

```java
new Thread(r, "order-thread")
```

### 7. handler（拒绝策略）

线程池和队列都满时的处理方式。

---

## 线程池执行流程（高频面试题）

**假设：**

```
corePoolSize = 5
maximumPoolSize = 10
```

**执行流程如下：**

```
提交任务
    ↓
当前线程数 < corePoolSize ?
    ↓ 是
创建核心线程执行任务
    ↓ 否
尝试放入工作队列
    ↓
队列已满？
    ↓ 否
进入队列等待
    ↓ 是
当前线程数 < maximumPoolSize ?
    ↓ 是
创建非核心线程执行任务
    ↓ 否
执行拒绝策略
```

**总结：**

```
核心线程
    ↓
任务队列
    ↓
非核心线程
    ↓
拒绝策略
```

---

## 拒绝策略（RejectedExecutionHandler）

当：

- 线程数达到 `maximumPoolSize`
- 工作队列已满

新任务无法继续处理时触发。

### 1. AbortPolicy（默认）

```java
new ThreadPoolExecutor.AbortPolicy()
```

**特点：**

- 直接抛出异常
- `RejectedExecutionException`

### 2. CallerRunsPolicy

```java
new ThreadPoolExecutor.CallerRunsPolicy()
```

**特点：**

- 不丢弃任务
- 由提交任务的线程执行任务

**例如：**

```
main 线程提交任务
   ↓
线程池已满
   ↓
main 线程执行任务
```

**作用：**

降低任务提交速度，实现削峰。

### 3. DiscardPolicy

```java
new ThreadPoolExecutor.DiscardPolicy()
```

**特点：**

- 直接丢弃任务
- 不抛异常

### 4. DiscardOldestPolicy

```java
new ThreadPoolExecutor.DiscardOldestPolicy()
```

**特点：**

- 丢弃队列中最早进入的任务
- 尝试执行当前任务

### 5. 自定义拒绝策略

实现接口：

```java
RejectedExecutionHandler
```

**例如：**

```java
public class MyRejectHandler
        implements RejectedExecutionHandler {

    @Override
    public void rejectedExecution(
            Runnable r,
            ThreadPoolExecutor executor) {

        System.out.println("任务被拒绝");
    }
}
```

---

## 线程池队列选择

### 无界队列

**LinkedBlockingQueue**

**特点：**

- 任务优先进入队列
- 基本不会创建非核心线程
- `maximumPoolSize` 形同虚设

**风险：**

- 任务堆积
- 内存溢出（OOM）

### 有界队列

**ArrayBlockingQueue**

**特点：**

- 容量可控
- 防止任务无限堆积

生产环境推荐。

### 直接提交队列

**SynchronousQueue**

**特点：**

- 不存储任务
- 来了任务直接找线程执行

**常用于：**

```java
newCachedThreadPool()
```

---

## 线程池大小设置

### CPU 密集型

**特点：**

- 大量计算
- 很少 IO

**例如：**

- 加密
- 图片处理
- 数学计算

**推荐：**

```
CPU 核心数 + 1
```

**获取 CPU 核数：**

```java
Runtime.getRuntime()
       .availableProcessors();
```

### IO 密集型

**特点：**

- 数据库
- Redis
- 网络请求
- RPC 调用
- 文件读写

线程大部分时间在等待。

**推荐：**

```
CPU 核心数 × 2
```

或者：

```
CPU 核心数 × (1 + 等待时间 / 计算时间)
```

---

## 常见线程池

生产环境不建议直接使用 `Executors` 创建线程池，推荐使用 `ThreadPoolExecutor` 显式指定参数。

**原因：**

- 容易导致 OOM
- 参数不可控

### 1. FixedThreadPool

```java
Executors.newFixedThreadPool(n)
```

**特点：**

- `corePoolSize = n`
- `maximumPoolSize = n`
- `LinkedBlockingQueue`（无界）

**适合：**

固定并发数场景。

### 2. SingleThreadExecutor

```java
Executors.newSingleThreadExecutor()
```

**特点：**

- 单线程执行
- 保证任务顺序

### 3. CachedThreadPool

```java
Executors.newCachedThreadPool()
```

**特点：**

- `corePoolSize = 0`
- `maximumPoolSize = Integer.MAX_VALUE`
- `SynchronousQueue`

**风险：**

- 线程无限增长
- 可能 OOM

### 4. ScheduledThreadPool

```java
Executors.newScheduledThreadPool()
```

**特点：**

- 支持定时任务
- 支持周期任务

**例如：**

```java
schedule()
scheduleAtFixedRate()
scheduleWithFixedDelay()
```

---

## shutdown 与 shutdownNow

### shutdown()

优雅关闭线程池。

```java
pool.shutdown();
```

**特点：**

- 不再接收新任务
- 已提交任务继续执行
- 所有任务执行完成后关闭

### shutdownNow()

立即关闭线程池。

```java
pool.shutdownNow();
```

**特点：**

- 尝试中断正在执行的任务
- 返回未执行任务列表
- 不保证任务一定停止

---

## 生产环境线程池推荐写法

```java
ExecutorService executor = new ThreadPoolExecutor(
        10,                     // 核心线程数
        20,                     // 最大线程数
        60,
        TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(1000),
        Executors.defaultThreadFactory(),
        new ThreadPoolExecutor.CallerRunsPolicy()
);
```

---

## 线程池面试总结（必背）

**为什么使用线程池？**

降低线程创建和销毁成本，提高响应速度，控制线程数量，提高系统稳定性。

**ThreadPoolExecutor 七大参数？**

- corePoolSize
- maximumPoolSize
- keepAliveTime
- unit
- workQueue
- threadFactory
- handler

**线程池执行流程？**

```
核心线程
   ↓
任务队列
   ↓
非核心线程
   ↓
拒绝策略
```

**四种拒绝策略？**

- AbortPolicy
- CallerRunsPolicy
- DiscardPolicy
- DiscardOldestPolicy

**shutdown 和 shutdownNow 区别？**

- **shutdown**：不接收新任务，等待已提交任务执行完
- **shutdownNow**：尝试中断正在执行任务，返回未执行任务

**生产环境如何创建线程池？**

直接使用 `ThreadPoolExecutor`，显式指定线程数、队列大小和拒绝策略，不建议直接使用 `Executors` 提供的快捷创建方法。
