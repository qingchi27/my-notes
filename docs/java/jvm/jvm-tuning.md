# Full GC 触发条件总结

## 一、什么是 Full GC

**Full GC（Major GC）** 指的是对整个 Java 堆进行垃圾回收，包括：

- 新生代（Young Generation）
- 老年代（Old Generation）

此外，对于部分垃圾收集器（如 G1、CMS），Full GC 还会尝试回收：

- 元空间（Metaspace）中的无用类（Class Unloading）

> 注意：
>
> Full GC 不仅回收堆内存，还可能进行类卸载，因此暂停时间（Stop The World）通常较长，应尽量避免频繁发生。

---

# 二、Full GC 的主要触发条件

## 1、老年代空间不足（最常见 ⭐⭐⭐⭐⭐）

这是线上最常见的 Full GC 原因。

对象经过多次 Minor GC 后，会晋升到老年代。

```
Eden
 ↓
Survivor
 ↓
Old
```

如果老年代没有足够空间存放晋升对象：

```
Old 满
    │
    ▼
触发 Full GC
    │
    ├── 回收成功
    │      │
    │      ▼
    │   晋升对象
    │
    └── 回收后仍然不足
           │
           ▼
 OutOfMemoryError
```

---

## 2、大对象直接进入老年代

某些垃圾收集器支持：

```bash
-XX:PretenureSizeThreshold
```

超过指定大小的对象，会直接进入老年代。

例如：

```java
byte[] data = new byte[20 * 1024 * 1024];
```

如果老年代空间不足：

```
大对象分配
      │
      ▼
Old 放不下
      │
      ▼
Full GC
```

---

## 3、Minor GC 后对象晋升失败（Promotion Failed）

Minor GC 后：

```
Eden
 ↓
Survivor
 ↓
Old
```

如果存活对象需要晋升到老年代，而老年代空间不足：

```
Minor GC
      │
      ▼
对象晋升
      │
      ▼
Old 空间不足
      │
      ▼
Full GC
```

若 Full GC 后仍无法晋升：

```
OutOfMemoryError
```

---

## 4、空间分配担保失败（Allocation Guarantee）

Minor GC 之前，JVM 会进行空间担保。

即判断：

```
Old 剩余空间

是否能够容纳

本次可能晋升的对象
```

如果判断不能保证成功：

```
Minor GC 前
       │
       ▼
空间担保失败
       │
       ▼
直接 Full GC
```

这是 JVM 为避免晋升失败而采取的保护机制。

---

## 5、主动调用 System.gc()

代码：

```java
System.gc();
```

作用：

- 只是**建议 JVM 执行 GC**
- 不是强制执行

很多 JVM 实现会倾向于执行一次 Full GC。

生产环境一般建议关闭：

```bash
-XX:+DisableExplicitGC
```

---

## 6、元空间（Metaspace）不足

JDK8 后：

```
永久代（PermGen）
        ↓
元空间（Metaspace）
```

元空间用于存放：

- 类元数据（Class Metadata）
- 方法信息
- 字段信息
- 注解
- 运行时常量池

> **注意：**
>
> Metaspace 使用的是 **Native Memory（本地内存）**，不是 Java 堆，也不是 Direct Memory（直接内存）。
>
> Metaspace 与 Direct Memory 都属于 Native Memory，是并列关系。

当元空间不足时：

```
Metaspace 满
        │
        ▼
Full GC
        │
        ▼
尝试卸载无用 Class
        │
        ├── 成功
        │
        └── 失败
               │
               ▼
OutOfMemoryError: Metaspace
```

---

## 7、CMS 并发失败（Concurrent Mode Failure）

CMS 特有。

CMS 在并发回收老年代期间：

```
程序仍然创建对象
```

如果：

```
对象创建速度

>

CMS 回收速度
```

导致老年代耗尽：

```
Concurrent Mode Failure
          │
          ▼
Serial Old
          │
          ▼
Full GC
```

这是 CMS 最大的缺点之一。

---

## 8、Promotion Failed（CMS 老版本）

Minor GC 后：

```
对象晋升 Old
```

如果：

```
Old 空间不足
```

则：

```
Promotion Failed
        │
        ▼
Full GC
```

目前较新的 JVM 已较少出现该问题。

---

## 9、G1 Evacuation Failure

G1 回收对象时：

```
Region A

↓

Region B
```

如果没有足够的空 Region：

```
Evacuation Failure
        │
        ▼
退化 Full GC
```

---

## 10、ZGC / Shenandoah 回收失败

ZGC、Shenandoah 设计目标是：

- 几乎没有 Full GC
- 极低停顿

只有：

- 内存真正耗尽
- GC 跟不上对象创建速度
- 回收失败

才可能退化为 Full GC。

---

# 三、不同垃圾收集器触发 Full GC 的情况

| 垃圾收集器 | 是否存在 Full GC | 常见触发原因 |
|------------|----------------|-------------------------------|
| Serial | 是 | 老年代满 |
| Parallel | 是 | 老年代满、晋升失败 |
| CMS | 是 | 老年代满、Concurrent Mode Failure、Promotion Failed |
| G1 | 是（较少） | 老年代不足、Evacuation Failure |
| ZGC | 极少 | 内存耗尽、回收失败 |
| Shenandoah | 极少 | 内存耗尽、回收失败 |

---

# 四、Full GC 执行流程

```
对象不断创建
        │
        ▼
老年代空间不足
        │
        ▼
Stop The World
        │
        ▼
Mark（标记）
        │
        ▼
Sweep（清除）
        │
        ▼
Compact（整理）
        │
        ▼
释放内存
        │
        ├── 成功
        │      │
        │      ▼
        │   程序继续运行
        │
        └── 失败
               │
               ▼
      OutOfMemoryError
```

---

# 五、Full GC 与 Minor GC 对比

| 对比项 | Minor GC | Full GC |
|---------|-----------|----------|
| 回收区域 | 新生代 | 新生代 + 老年代（部分收集器还会回收元空间） |
| STW | 有 | 有（时间更长） |
| 回收速度 | 快 | 慢 |
| 发生频率 | 高 | 应尽量少 |
| 是否整理内存 | 一般复制算法 | 可能涉及标记-整理（Mark-Compact） |

---

# 六、如何减少 Full GC

1. 增大堆内存（`-Xms`、`-Xmx`）
2. 合理设置新生代大小（`-Xmn`）
3. 减少大对象创建
4. 减少对象长期存活
5. 避免频繁动态生成类
6. 不随意调用 `System.gc()`
7. 合理设置 Metaspace 大小（`-XX:MaxMetaspaceSize`）
8. 选择合适的垃圾收集器（如 G1、ZGC）

---

# 七、面试回答（推荐背诵）

> **Full GC 是对整个 Java 堆进行垃圾回收，同时部分垃圾收集器还会尝试卸载无用类以回收元空间。最常见的触发原因是老年代空间不足，其次包括对象晋升失败、空间分配担保失败、大对象直接进入老年代、调用 `System.gc()`、元空间不足，以及不同垃圾收集器的回收失败，例如 CMS 的 Concurrent Mode Failure、Promotion Failed，G1 的 Evacuation Failure。Full GC 会发生 Stop-The-World，暂停所有用户线程，因此耗时较长，应尽量减少其发生频率。**

---

# 八、面试记忆口诀

```
老年代满最常见，
晋升失败也会现；
空间担保先判断，
System.gc() 能触发；

元空间满卸类元，
CMS 并发易失败；
G1 Region 若搬迁难，
退化 Full GC 再上场。
```

---

# 九、常见线上问题排查（面试）

## 1、Full GC 频繁怎么排查？

> 我会先通过 `jstat -gc` 查看 FGC、FGCT、OU、OC 等指标，确认 Full GC 是否频繁，同时持续采样观察 Full GC 前后老年代使用量的变化。
>
> 如果 Full GC 后老年代使用量仍然比较高，说明可能存在大量长期存活对象或者内存泄漏，我会进一步通过 `jmap -histo` 查看堆中对象的数量和内存占用情况。
>
> 如果发现某些对象占用异常，会通过 `jmap -dump` 生成 Heap Dump，然后使用 MAT 分析 Histogram、Dominator Tree 以及 GC Roots 引用链，定位哪些对象占用大量内存，以及为什么这些对象一直无法被回收。
>
> 最后结合业务代码排查，比如缓存无限增长、静态集合、ThreadLocal 或长生命周期对象持有大量对象等问题。如果确认业务没有异常，只是堆配置不足，再考虑调整 `-Xms`、`-Xmx` 等 JVM 参数。

排查顺序可以拆成四步：

1. 用 `jps -lvm` 看 JVM 配置，再用 `jstat -gc` 确认 Full GC 是否真的频繁
2. 持续采样，观察 Full GC 后老年代（OU）是否下降
3. 若不下降，用 `jmap -histo` 看谁占内存，必要时 `jmap -dump` + MAT 找引用链
4. 结合业务代码修复；确认不是泄漏后，才考虑调大堆

完整排查流程如下：

```
Full GC 频繁
        │
        ▼
jps -lvm（看 -Xms / -Xmx / GC 类型）
        │
        ▼
jstat -gc（看 FGC / FGCT / OU / OC）
        │
        ▼
Full GC 后 OU 是否下降？
        │
        ├── 下降很多 → 对象创建/晋升过快，结合 GC 日志分析
        │
        └── 几乎不降 → 大量对象存活
               │
               ▼
         jmap -histo（看谁占内存）
               │
               ▼
         jmap -dump（生成 Heap Dump）
               │
               ▼
         MAT：Histogram → Dominator Tree → GC Roots
               │
               ▼
         找到谁一直持有对象
               │
               ▼
         结合业务代码解决（缓存 / 集合 / ThreadLocal）
               │
               ▼
         最后才考虑调大堆
```

**一句话口诀：**

> jps 看配置，jstat 看 GC，jmap-histo 看对象，dump + MAT 找根因。

**简版回答：**

> 用 `jstat -gcutil <pid> 1000` 持续看 GC，观察老年代对象是否不断增长。GC 之后空间如果没有释放，就是内存泄漏；如果回收正常，可能只是堆分配太小，再调整启动参数。

---

## 2、线上突然 OOM，你怎么定位？

> 线上突然 OOM，我首先会查看应用日志，确认具体的 OOM 类型，比如 Java Heap Space、Metaspace、Direct Buffer Memory 或 unable to create native thread，因为不同类型的 OOM 排查方向不一样。
>
> 如果是 Java Heap Space，我会先通过 `jps -lvm` 查看 JVM 的 `-Xms`、`-Xmx` 等参数，然后通过 `jstat -gc` 查看老年代使用情况和 Full GC 情况，判断是不是老年代持续增长并且 Full GC 后仍然无法释放。
>
> 如果进程还没有退出，我会使用 `jmap -histo` 查看堆中对象的数量和内存占用，必要时使用 `jmap -dump` 生成 Heap Dump。如果进程已经因为 OOM 退出，就依赖 JVM 预先配置的 `-XX:+HeapDumpOnOutOfMemoryError` 自动生成的 hprof 文件。
>
> 然后使用 MAT 分析 Heap Dump，通过 Histogram、Dominator Tree 和 GC Roots 引用链定位占用大量内存的对象以及对象为什么无法被回收，最后结合业务代码排查，比如缓存无限增长、静态集合、ThreadLocal 或长生命周期对象持有大量对象等。
>
> 如果确认不是代码问题，而是业务正常增长导致堆空间不足，再考虑合理调整 `-Xmx` 等 JVM 参数。

不同类型的 OOM，排查方向不同：

| OOM 类型 | 含义 | 排查方向 |
|----------|------|----------|
| Java Heap Space | 堆内存不足 | 看堆对象、Heap Dump、MAT |
| Metaspace | 元空间不足 | 动态生成类、类加载器泄漏 |
| Direct Buffer Memory | 直接内存不足 | NIO / Netty 缓冲区未释放 |
| unable to create native thread | 无法创建本地线程 | 线程数过多、系统线程上限 |

如果确认是 **Java Heap Space**，按下面流程定位：

```
OOM
        │
        ▼
看日志，确定 OOM 类型
        │
        ▼
Java Heap Space
        │
        ▼
jps -lvm（看 -Xms / -Xmx）
        │
        ▼
jstat -gc（看 Old / Full GC）
        │
        ▼
进程是否还在？
        │
        ├── 还在 → jmap -histo → jmap -dump
        │
        └── 已退出 → 依赖 HeapDumpOnOutOfMemoryError 生成的 hprof
               │
               ▼
         MAT 分析
               │
               ▼
         Histogram → Dominator Tree → GC Roots
               │
               ▼
         定位异常对象
               │
               ▼
         结合业务代码
               │
               ├── 缓存 / 集合 / ThreadLocal / 泄漏 → 修代码
               │
               └── 业务正常增长、堆确实不够 → 再调 -Xmx
```

---

## 3、CPU 突然飙到 100%，怎么排查？

核心思路：先找到占用 CPU 最高的 **进程**，再定位到具体 **线程**，最后用堆栈判断它在干什么。

1. 通过 `top` 查看系统中 CPU 占用最高的进程，获取 PID
2. 通过 `top -Hp <pid>` 查看该 Java 进程中 CPU 占用最高的线程，获取线程 ID
3. 将线程 ID 转成十六进制，再通过 `jstack <pid>` 找到对应线程（`nid=`），分析当前在执行什么
4. 根据线程状态和堆栈判断原因，针对性处理并验证

常见原因包括：

- 频繁 GC
- 死循环 / 计算量过大
- 锁竞争或死锁
- 大量线程创建

从进程落到线程、再落到代码的流程如下：

```
CPU 100%
        │
        ▼
top（找到 Java PID）
        │
        ▼
top -Hp PID（找到高 CPU 线程）
        │
        ▼
线程 ID 转 16 进制
        │
        ▼
jstack PID（找到 nid 对应线程）
        │
        ▼
分析线程堆栈
        │
        ├── 频繁 GC
        ├── 死循环 / 计算量大
        ├── 锁竞争 / 死锁
        └── 线程创建过多
               │
               ▼
         针对原因解决
               │
               ▼
         观察 CPU 是否恢复
```

**一句话口诀：**

> top 找进程 → top -Hp 找线程 → ID 转 16 进制 → jstack 找线程 → 看堆栈 → 定位原因。

---

## 4、内存泄漏怎么排查？

内存泄漏和 Full GC 频繁、堆 OOM 经常是同一条链路：内存持续涨、Full GC 也回收不下来。

1. 查看监控和 GC，确认内存持续增长，并且 Full GC 后仍然无法明显释放
2. 使用 `jmap -histo <pid>` 查看哪些对象数量多、占用内存大
3. 生成 Heap Dump，用 MAT 通过 Dominator Tree 和 GC Roots 找到一直被引用、无法回收的对象
4. 根据引用链定位到具体代码，重点排查静态集合、本地缓存、ThreadLocal、监听器等长生命周期对象
5. 修复代码后，重新观察堆内存和 GC，确认内存不再持续增长

从「确认泄漏」到「修代码验证」的流程如下：

```
内存持续增长
        │
        ▼
Full GC 后是否释放？
        │
        ├── 明显释放 → 不一定是泄漏，可能是创建过快或堆偏小
        │
        └── 没明显释放
               │
               ▼
         jmap -histo（哪些对象占用最多）
               │
               ▼
         Heap Dump
               │
               ▼
         MAT：Dominator Tree → GC Roots
               │
               ▼
         谁一直持有对象？
               │
               ▼
         定位代码并修复
               │
               ▼
         再观察堆内存 / GC，确认不再持续增长
```
