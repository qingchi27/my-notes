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