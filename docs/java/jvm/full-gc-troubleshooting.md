# Full GC 频繁排查

## 一、排查思路

线上出现 **Full GC 频繁** 时，不要一上来就调整 JVM 参数，而应该按照：

```
确认现象 → 查看 JVM 配置 → 分析 GC → 分析对象 → Dump + MAT 定位 → 结合业务代码解决 → 最后考虑调整 JVM 参数
```

核心目标是回答两个问题：

1. 为什么 Full GC 会频繁发生？
2. Full GC 之后，为什么内存没有被有效释放？

---

## 二、第一步：确认是不是 Full GC 频繁

首先查看 JVM 进程：

```bash
jps -lvm
```

重点关注 JVM 启动参数：

- `-Xms`
- `-Xmx`
- 垃圾收集器类型
- 其他与 GC、堆内存相关的参数

然后使用：

```bash
jstat -gc <pid>
```

例如：

```bash
jstat -gc 12345
```

重点关注：

| 参数 | 含义 |
|------|------|
| OU | Old 老年代已使用空间 |
| OC | Old 老年代容量 |
| YGC | Young GC 次数 |
| YGCT | Young GC 总耗时 |
| FGC | Full GC 次数 |
| FGCT | Full GC 总耗时 |

主要通过 **FGC、FGCT、OU、OC** 判断 Full GC 是否频繁，以及老年代内存使用情况。

---

## 三、第二步：动态观察 GC 情况

可以持续观察 GC：

```bash
jstat -gc <pid> 1s 1000
```

含义：

- 每 1 秒采样一次
- 最多采样 1000 次

重点观察：

- FGC 是否快速增加
- OU 是否持续增长
- Full GC 之后 OU 是否明显下降

例如：

**Full GC 后回收明显：**

```
Full GC 前：OU = 900M
Full GC 后：OU = 200M
```

说明 Full GC 回收了大量对象。如果之后又快速增长，就需要进一步分析为什么对象创建、晋升速度这么快。

**Full GC 后几乎没降：**

```
Full GC 前：OU = 900M
Full GC 后：OU = 850M
```

说明 Full GC 后仍然有大量对象存活。这时候需要重点怀疑：

- 内存泄漏
- 缓存无限增长
- 静态集合持有大量对象
- ThreadLocal 使用不当
- 长生命周期对象持有大量短生命周期对象
- 业务确实存在大量长期存活对象

---

## 四、第三步：分析堆中是什么对象

使用：

```bash
jmap -histo <pid>
```

> 注意：是 `jmap -histo`，不是 `jmap -histor`。

可以看到类似：

```
num     #instances         #bytes
1       5000000            800MB
2       3000000            400MB
3       2000000            300MB
```

重点关注：哪些对象数量特别多，或者占用内存特别大。

例如发现 `byte[]`、`HashMap$Node`、`String`、`User`、`Order` 占用大量内存，就需要结合业务进一步分析。

| 异常对象 | 可能原因 |
|----------|----------|
| HashMap 特别多 | 本地缓存无限增长、集合没有清理、`static Map` 持有大量对象 |
| `byte[]` 特别多 | 文件、图片、网络请求数据、大对象处理 |
| 业务对象特别多（如 `User`、`Order`、`Product`） | 业务代码中大量对象长期存活 |

---

## 五、第四步：生成 Heap Dump

如果通过 `jmap -histo` 仍然无法定位，可以生成 Heap Dump：

```bash
jmap -dump:live,format=b,file=heap.hprof <pid>
```

例如：

```bash
jmap -dump:live,format=b,file=/tmp/heap.hprof 12345
```

生成 `/tmp/heap.hprof`，然后将 Heap Dump 文件拿到开发环境，使用 **MAT（Eclipse Memory Analyzer）** 进行分析。

> 注意：线上执行 Dump 可能会产生较大的性能影响，需要谨慎操作，并确保有足够的磁盘空间。

---

## 六、Heap Dump 是自动生成的吗？

默认情况下：**不是自动生成的**。

可以通过 `jmap` 手动生成：

```bash
jmap -dump:live,format=b,file=heap.hprof <pid>
```

如果希望 JVM 在发生 OOM 时自动生成 Heap Dump，可以配置：

```bash
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/
```

发生 `OutOfMemoryError` 时，JVM 会自动生成 `.hprof` 文件，例如 `/tmp/java_pid12345.hprof`。

| 场景 | Dump 获取方式 |
|------|----------------|
| 主动排查 Full GC | `jmap -dump` 手动生成 |
| OOM 自动留证 | `HeapDumpOnOutOfMemoryError` 自动生成 |

---

## 七、第五步：使用 MAT 分析 Heap Dump

使用 MAT 打开 `heap.hprof`，重点关注以下几个功能。

### 7.1 Histogram

Histogram 用于查看：堆中有哪些对象，以及每种对象占用了多少内存。

重点关注：

- 对象数量
- Shallow Heap
- 对象类型
- 占用内存最大的对象

例如：

```
Class              Objects       Shallow Heap
byte[]             2000000       800 MB
User               1000000       100 MB
HashMap$Node       500000        80 MB
```

可以进一步判断：到底是哪种对象异常占用了大量内存。

### 7.2 Dominator Tree

Dominator Tree 主要用于分析：**到底是谁占住了大量内存**。

例如：

```
static Map
    ↓
HashMap
    ↓
大量 User
    ↓
大量 Order
```

如果发现一个长期存在的 `static Map` 持有大量业务对象，那么这些对象就可能因为一直存在引用而无法被 GC。

### 7.3 Path to GC Roots

如果发现某个对象占用异常，需要继续分析：为什么这个对象一直无法被 GC？

可以通过 **Path to GC Roots** 查看对象到 GC Root 的引用链。

例如：

```
User
 ↓
HashMap
 ↓
static Cache
 ↓
XXX.class
 ↓
GC Root
```

说明 `static Cache` 一直持有 `User` 对象，导致 User 无法被 GC。这时候就可以进一步定位业务代码。

### 7.4 Leak Suspects

MAT 还提供 **Leak Suspects**，可以自动分析并给出一些疑似内存泄漏的位置。

它可以作为辅助工具，但最终还是需要结合：

```
Dominator Tree + GC Roots 引用链 + 业务代码
```

进行确认。

---

## 八、第六步：结合业务代码定位问题

找到异常对象之后，需要继续分析：为什么这些对象一直存在？

常见原因包括：

### 1. 本地缓存无限增长

```java
Map<String, User> cache = new HashMap<>();
```

不断往里面放数据，却没有淘汰、过期、大小限制。

### 2. Static 集合持有大量对象

```java
private static Map<String, Object> cache = new HashMap<>();
```

因为 static 对象生命周期很长，可能一直持有大量对象。

### 3. ThreadLocal 使用不当

线程池中的线程生命周期很长，如果使用不当可能导致对象长期存活。

### 4. 长生命周期对象持有短生命周期对象

```
全局对象
   ↓
集合
   ↓
大量业务对象
```

虽然业务对象本身已经不再使用，但是由于仍然存在引用，所以 GC 无法回收。

### 5. 业务本身产生大量长期存活对象

这种情况下不一定是内存泄漏，需要结合业务判断：这些对象到底是不是应该存在？

---

## 九、第七步：如果没有明显异常，再考虑 JVM 参数

如果通过：

```
jstat → jmap → Heap Dump → MAT
```

都没有发现明显的内存泄漏或异常对象，同时确认：**业务确实需要较大的堆空间，只是当前堆配置不足**。

这时才考虑调整 JVM 参数，例如 `-Xms`、`-Xmx`。

适当增大堆内存，然后继续观察：

- Full GC 次数
- Full GC 耗时
- 老年代使用率
- 应用响应时间
- 系统整体资源使用情况

**不要看到 Full GC 频繁就直接增加 `-Xmx`。**

如果真正原因是内存泄漏：

```
-Xmx 4G
    ↓
-Xmx 8G
    ↓
-Xmx 16G
    ↓
最终还是 OOM
```

只是把问题推迟了。

---

## 十、完整排查流程

```
发现 Full GC 频繁
        ↓
jps -lvm
        ↓
查看 JVM 参数
-Xms / -Xmx / GC 类型
        ↓
jstat -gc
        ↓
查看 GC 和老年代
        ↓
FGC 是否快速增加？
        ↓
查看 OU / OC
        ↓
Full GC 后 OU 降不降？
       ↙              ↘
   降很多              降很少
     ↓                   ↓
对象创建/晋升          大量对象存活
     ↓                   ↓
结合 GC 日志          jmap -histo
                         ↓
                     看大对象
                         ↓
                   jmap -dump
                         ↓
                        MAT
                         ↓
                 Histogram
                         ↓
                Dominator Tree
                         ↓
                 Path to GC Roots
                         ↓
                   找谁一直持有
                         ↓
                 结合业务代码
                         ↓
              缓存/集合/ThreadLocal
                         ↓
                       修复
```

---

## 十一、面试标准回答

面试官问：**「Full GC 频繁怎么排查？」**

可以直接回答：

> 我会先通过 `jstat -gc` 查看 FGC、FGCT、OU、OC 等指标，确认 Full GC 是否频繁，同时持续采样观察 Full GC 前后老年代使用量的变化。
>
> 如果 Full GC 后老年代使用量仍然比较高，说明可能存在大量长期存活对象或者内存泄漏，我会进一步通过 `jmap -histo` 查看堆中对象的数量和内存占用情况。
>
> 如果发现某些对象占用异常，会通过 `jmap -dump` 生成 Heap Dump，然后使用 MAT 分析 Histogram、Dominator Tree 以及 GC Roots 引用链，定位哪些对象占用大量内存，以及为什么这些对象一直无法被回收。
>
> 最后结合业务代码排查，比如缓存无限增长、静态集合、ThreadLocal 或长生命周期对象持有大量对象等问题。如果确认业务没有异常，只是堆配置不足，再考虑调整 `-Xms`、`-Xmx` 等 JVM 参数。

---

## 十二、最终记忆版

你不用把整篇文章全部背下来，只记住这一条：

```
Full GC频繁
    ↓
jps -lvm
看 JVM 配置
    ↓
jstat -gc
看 FGC / FGCT / OU / OC
    ↓
看 Full GC 后 OU 是否下降
    ↓
jmap -histo
看谁占内存
    ↓
jmap -dump
生成 Heap Dump
    ↓
MAT
    ↓
Dominator Tree
    ↓
GC Roots
    ↓
找到谁持有对象
    ↓
结合业务代码解决
    ↓
最后才考虑调大堆
```

**一句话口诀：**

> jps 看配置，jstat 看 GC，jmap-histo 看对象，dump + MAT 找根因。
