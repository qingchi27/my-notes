# 垃圾回收与内存分配

## 对象存活判断

### 1. 引用计数法

每个对象维护一个引用计数器，引用 +1，失效 -1，为 0 时回收。

**缺点：** 无法解决循环引用问题，JVM 不采用。

### 2. 可达性分析（JVM 采用）

从 **GC Roots** 出发，不可达的对象判定为可回收。

**GC Roots 包括：**

- 虚拟机栈中引用的局部变量
- 方法区中静态变量引用的对象
- 方法区中常量引用的对象
- 本地方法栈中 JNI 引用的对象
- JVM 内部引用（基本类型 Class、系统类加载器等）

---

## 四种引用类型

| 类型 | 回收时机 | 典型用途 |
|------|----------|----------|
| 强引用（Strong） | 不回收 | 普通 `new` 对象 |
| 软引用（Soft） | 内存不足时回收 | 缓存 |
| 弱引用（Weak） | 下次 GC 即回收 | `WeakHashMap`、ThreadLocal Entry |
| 虚引用（Phantom） | 无法通过虚引用获取对象，不影响生命周期 | 跟踪对象回收状态 |

```java
// 软引用
SoftReference<byte[]> cache = new SoftReference<>(new byte[1024]);

// 弱引用
WeakReference<Object> weak = new WeakReference<>(obj);

// 虚引用
PhantomReference<Object> phantom = new PhantomReference<>(obj, queue);
```

---

## GC 算法

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 复制算法 | 将存活对象复制到另一块内存 | 无碎片、效率高 | 浪费一半空间 |
| 标记-清除 | 标记存活对象，清除未标记对象 | 不浪费空间 | 产生内存碎片 |
| 标记-整理 | 标记后将存活对象向一端移动 | 无碎片 | 移动对象开销大 |
| 分代收集 | 新生代用复制，老年代用标记-整理 | 综合各算法优点 | 实现复杂 |

**分代思想：**

- 新生代：对象存活率低 → 复制算法
- 老年代：对象存活率高 → 标记-整理

---

## 垃圾回收器

| 收集器 | 区域 | 特点 |
|--------|------|------|
| Serial | 新生代 | 单线程，STW |
| ParNew | 新生代 | Serial 的多线程版本 |
| Parallel Scavenge | 新生代 | 关注吞吐量 |
| Serial Old | 老年代 | Serial 的老年代版本 |
| Parallel Old | 老年代 | 吞吐量优先 |
| CMS | 老年代 | 并发、低延迟（JDK 14 废弃） |
| G1 | 全堆 | 主流，可预测停顿 |
| ZGC | 全堆 | 超低延迟（< 1ms） |

---

## JDK 默认垃圾回收器是什么？

默认垃圾回收器**取决于 JDK 版本**：

| JDK 版本 | 默认垃圾回收器 | 说明 |
|----------|----------------|------|
| JDK 8 | Parallel GC | 年轻代 Parallel Scavenge + 老年代 Parallel Old，**吞吐量优先** |
| JDK 9+ | G1 GC | 可预测停顿时间，更适合现代服务端应用 |

**补充说明：**

- **CMS** 从来不是默认垃圾回收器，后来已被废弃（JDK 14 移除）
- **ZGC**、**Shenandoah** 等低延迟收集器需通过 JVM 参数显式启用

```bash
# 查看当前 JDK 默认 GC
java -XX:+PrintCommandLineFlags -version

# 显式启用 G1
-XX:+UseG1GC

# 显式启用 ZGC（JDK 15+）
-XX:+UseZGC
```


## CMS / G1 / ZGC 对比

CMS、G1、ZGC 是 HotSpot JVM 三代具有代表性的垃圾回收器，目标都是回收垃圾，但**设计思想完全不同**：

| 收集器 | 核心目标 | 关键词 |
|--------|----------|--------|
| CMS | 最短停顿 | Concurrent（并发） |
| G1 | 兼顾吞吐量与停顿 | Region（分区） |
| ZGC | 极低停顿 | Colored Pointer（染色指针） |

**理解它们，建议从这几个问题入手：**

1. 内存如何划分？
2. 如何判断垃圾？
3. 回收流程是什么？
4. 为什么会 STW？
5. 如何解决对象移动的问题？

**演进关系：**

```
CMS（低停顿，有碎片，已淘汰）
   ↓
G1（可预测停顿，默认收集器）
   ↓
ZGC（极致低延迟，TB 级堆）
```

---

### CMS（Concurrent Mark Sweep）

JDK 5 引入，JDK 9 开始弃用，JDK 14 删除。

**设计目标：缩短 STW 时间**

传统 Serial / Parallel GC 全程 STW：

```
GC 开始 ── STW ██████████████████████ ── GC 结束
```

CMS 希望只在开始和结束短暂暂停：

```
GC 开始 ── STW ██ ── 并发标记 □□□□□□□□□□□ ── STW ██ ── 并发清除 □□□□□□□□□□□ ── GC 结束
```

名字含义：**Concurrent**（并发）+ **Mark**（标记）+ **Sweep**（清除）

**作用区域**

CMS 只负责**老年代（Old Generation）**，年轻代通常搭配 **ParNew**：

```
Young → ParNew
Old   → CMS
```

**回收过程（四步）**

```
① Initial Mark（初始标记）
   ↓
② Concurrent Mark（并发标记）
   ↓
③ Remark（重新标记）
   ↓
④ Concurrent Sweep（并发清除）
```

**① Initial Mark（初始标记）— STW**

只标记 **GC Root 直接引用**的对象，速度很快。

```
GC Root → A → B → C    D（未标记）
              ↑
         只标记 A
```

**② Concurrent Mark（并发标记）— 并发**

最耗时的一步，GC 线程遍历对象图，**用户线程继续运行**。

```
A → B → C  全部标记完成
```

**问题：** 并发期间引用可能变化（如 `A.child = null` 或 `new D()`），标记结果可能过期。

**③ Remark（重新标记）— STW**

修正并发期间因引用变化导致的遗漏，采用**增量更新（Incremental Update）**：只重新扫描引用发生变化的区域，比全堆扫描快得多。

**④ Concurrent Sweep（并发清除）— 并发**

采用**标记-清除（Mark-Sweep）**：标记后直接删除垃圾，**不整理内存**。

```
清除前：A  垃圾  B  垃圾  C
清除后：A  空洞  B  空洞  C
```

**CMS 三大问题**

| 问题 | 原因 |
|------|------|
| 内存碎片 | Sweep 不整理，大对象可能放不下，触发 Full GC |
| 浮动垃圾（Floating Garbage） | 并发清除期间新产生的垃圾只能等下次 GC |
| CPU 占用高 | GC 线程与业务线程同时运行，竞争 CPU |

---

### G1（Garbage First）

JDK 7u4 引入，**JDK 9+ 默认 GC**。

**设计目标：可预测停顿时间** — 不是最快，而是停顿可控（`-XX:MaxGCPauseMillis`）。

**最大变化：堆不再连续分代，而是切成 Region**

```
传统：Young | Old（连续）
G1：  
      ┌──┬──┬──┬──┐
      │R1│R2│R3│R4│  每个 Region 可能是 Eden / Survivor / Old / Humongous
      ├──┼──┼──┼──┤
      │R5│R6│R7│R8│
      └──┴──┴──┴──┘
```

**回收流程**

```
Young GC（复制算法）
   ↓
Concurrent Mark（并发标记，统计各 Region 垃圾率）
   ↓
Mixed GC（混合回收，优先回收垃圾最多的 Region）
```

**Young GC**

Eden + Survivor 存活对象复制到新 Region，垃圾直接丢弃，速度快。

**Concurrent Mark**

步骤与 CMS 类似：Initial Mark → Concurrent Mark → Remark → Cleanup。

但 G1 的目的不是删除，而是**统计各 Region 的垃圾比例**：

```
Region1: 90% 垃圾
Region2: 20% 垃圾
Region3:  5% 垃圾
```

**Mixed GC（混合回收）**

优先回收垃圾最多的 Region（Garbage First 名字由来）：

```
回收：Young + Old Region1(90%) + Old Region2(85%) ...
不回收：Old Region3(5%)
```

**为什么没有碎片？**

采用**复制算法**：存活对象复制到新 Region，旧 Region 整体释放，基本无碎片。

**记忆集（Remembered Set）**

解决跨 Region 引用扫描问题。每个 Region 维护 Remembered Set，记录**哪些其他 Region 引用了我**，只需扫描相关 Region，无需扫描整个老年代。

```
传统：Old → Young，需扫描整个 Old（慢）
G1：  Region5 的 Remembered Set 记录引用来源，只扫相关 Region
```

---

### ZGC（Z Garbage Collector）

JDK 11 实验特性，JDK 15 正式可用。

**设计目标：TB 级内存，停顿 < 1ms** — 无论 8GB 还是 512GB，停顿几乎一样。

**核心思想：对象移动时不暂停用户线程**

CMS / G1 移动对象后需要 STW 更新引用；ZGC 通过以下技术实现**全程并发**：

**① Colored Pointer（染色指针）**

在指针高位嵌入状态信息（Marked / Remapped / Finalizable），无需额外数据结构记录标记状态。

```
普通指针：0x12345678
染色指针：高位几位表示对象状态 + 低位为地址
```

**② Load Barrier（读屏障）**

程序访问对象时（如 `obj.name`），先经过读屏障：

```
obj.name → Load Barrier → 检查对象是否已搬家 → 自动修正引用 → 访问对象
```

对象移动后，引用在**访问时**由读屏障自动修正，程序无感知。

**回收流程**

```
Pause Mark Start（STW，极短）
   ↓
Concurrent Mark（并发标记）
   ↓
Concurrent Relocate（并发搬迁，复制到新 Region）
   ↓
Concurrent Remap（并发重映射，逐步修正旧地址 → 新地址）
```

**Relocate（并发搬迁）**

```
旧 Region：A  B  垃圾  →  复制到新 Region
用户线程仍可访问旧地址，读屏障自动跳到新对象
```

**为什么停顿极低？**

```
传统：移动对象 → STW 更新全部引用 → 恢复程序
ZGC： 移动对象 → 程序继续运行 → 读屏障逐步修正引用
```

真正 STW 只有标记开始/结束，通常**几十微秒到亚毫秒级**。

---

### 三种收集器对比

| 对比项 | CMS | G1 | ZGC |
|--------|-----|-----|-----|
| 首次发布 | JDK 5 | JDK 7u4 | JDK 11（实验），JDK 15 成熟 |
| 默认情况 | 已废弃 | JDK 9+ 默认 | 需显式启用 |
| 回收范围 | 老年代 | 整个堆 | 整个堆 |
| 堆布局 | 新生代 / 老年代 | Region | Region（ZPage） |
| 回收算法 | 标记-清除 | 标记-复制 | 并发标记 + 并发复制 |
| 是否整理内存 | 否，易产生碎片 | 是 | 是 |
| 并发能力 | 标记、清除并发 | 标记并发，复制部分 STW | 标记、复制、重定位均高度并发 |
| 典型停顿 | 较短但不稳定 | 可预测（毫秒级） | 极低（亚毫秒～几毫秒） |
| 适用场景 | 老版本低停顿系统 | 大多数服务端应用 | 超大内存、低延迟服务 |

---

### CMS / G1 / ZGC 面试总结（建议背诵）

**CMS** 使用「标记-清除」算法，采用「初始标记 → 并发标记 → 重新标记 → 并发清除」四个阶段，优点是停顿时间较短，但会产生内存碎片和浮动垃圾，因此最终被淘汰。

**G1** 将整个堆划分为多个 Region，通过并发标记统计各 Region 的垃圾比例，优先回收垃圾最多的 Region（Garbage First），回收时采用复制算法，因此基本不会产生内存碎片，也是目前 HotSpot 的默认垃圾回收器。

**ZGC** 使用染色指针（Colored Pointer）和读屏障（Load Barrier）实现对象的并发标记、并发迁移和并发重定位。对象移动后，引用在访问时由读屏障自动修正，因此几乎不需要因对象迁移而长时间暂停用户线程，能够在大堆内存下保持极低的停顿时间。

---

## 堆内存分配与回收

### 分配策略

| 策略 | 说明 |
|------|------|
| Eden 优先分配 | 新对象优先在 Eden 区分配 |
| Survivor 复制 + 年龄递增 | Minor GC 后存活对象复制到 Survivor，年龄 +1 |
| 大对象直接进老年代 | 避免 Eden 和 Survivor 之间大量复制 |
| 年龄阈值晋升 | 对象年龄达到阈值（默认 15）晋升老年代 |
| 动态年龄判断 | Survivor 中相同年龄对象大小超过 Survivor 一半，则该年龄及以上对象直接晋升 |

### GC 流程

**Minor GC（Young GC）**

```
Eden 满 → 触发 Minor GC
   ↓
Eden + From Survivor 存活对象 → To Survivor（复制算法）
   ↓
年龄达标 → 晋升老年代
```

**Full GC（Major GC）**

```
老年代空间不足 / 方法区不足 / System.gc()
   ↓
标记-整理（或标记-清除）
   ↓
STW 时间通常较长
```

---

## 对象一定在堆上创建吗？

**结论：** 默认在堆上，但 JVM 可通过优化在栈上分配。

### 逃逸分析

如果对象不会逃逸出方法作用域，JVM 可能将其分配在栈上，方法结束自动回收，无需 GC。

```java
public void method() {
    Point p = new Point(1, 2); // 未逃逸，可能栈分配
    // ...
}
```

### 标量替换

若对象被拆解为基本类型（标量），JVM 可能直接消除对象，不分配内存。

**开启参数（JDK 默认开启）：**

```
-XX:+DoEscapeAnalysis
-XX:+EliminateAllocations
```

---

## 面试总结

**JDK 默认垃圾回收器是什么？**

取决于 JDK 版本：JDK 8 默认 Parallel GC（吞吐量优先）；JDK 9 起默认 G1 GC（可预测停顿）。CMS 从未是默认收集器且已废弃；ZGC、Shenandoah 需显式启用。

**JVM 如何判断对象可回收？**

可达性分析：从 GC Roots 出发，不可达则回收。

**四种引用类型？**

强引用、软引用、弱引用、虚引用，回收时机依次更激进。

**Minor GC 和 Full GC 区别？**

- Minor GC：新生代，频率高，停顿短
- Full GC：整堆 + 方法区，频率低，停顿长

**G1 和 CMS 区别？**

G1 基于 Region、可预测停顿、复制算法无碎片；CMS 标记-清除、有碎片和浮动垃圾、已废弃。

**CMS / G1 / ZGC 一句话区别？**

- CMS：并发标记-清除，低停顿但有碎片，已淘汰
- G1：Region 分区 + Garbage First，可预测停顿，默认收集器
- ZGC：染色指针 + 读屏障，对象移动全程并发，极低停顿

**对象一定在堆上吗？**

不一定。逃逸分析 + 标量替换可能实现栈上分配或对象消除。
