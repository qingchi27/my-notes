# Java 版本

对高级 Java 岗位，重点掌握 **Java 8 + 11 + 17 + 21** 这些 LTS。

---

## 37. Java 8（LTS）

- Lambda 表达式：`() -> {}`，函数式编程
- Stream API：链式操作集合，支持过滤、映射、归约
- Optional：避免空指针，显式处理可能为空的情况
- 方法引用：`ClassName::methodName`
- 接口默认方法 / 静态方法：`default` 关键字
- 新日期时间 API：`LocalDateTime`、`ZonedDateTime`（`java.time` 包）
- ConcurrentHashMap 优化：分段锁改为 CAS + synchronized
- 元空间（Metaspace）：替代永久代（PermGen）

---

## 38. Java 11（LTS）

- HTTP Client API：标准化，支持异步
- ZGC：低延迟垃圾回收器（实验性）
- String 新方法：`isBlank()`、`lines()`、`strip()`、`repeat()`
- 局部变量类型推断增强：`var` 可用于 Lambda 参数
- 移除 Java EE 和 CORBA 模块
- Flight Recorder：开源（之前是商业版功能）

---

## 39. Java 17（LTS）

- 密封类（Sealed Classes）：`sealed`、`permits`，限制继承层次
- 模式匹配 for switch：预览转正
- 恢复始终严格的浮点运算
- 弃用 Security Manager
- 增强的伪随机数生成器
- ZGC / Shenandoah 正式可用
- Records 正式化

---

## 40. Java 21（LTS）

- 虚拟线程（Virtual Threads）：轻量级线程，极大提升并发处理能力（Project Loom）
- 结构化并发（Structured Concurrency）：简化多线程编程，API 预览
- 序列集合（Sequenced Collections）：`SequencedSet`、`SequencedMap`，统一首尾操作
- Record 模式匹配：`instanceof` 和 `switch` 中直接解构 Record
- String Templates（预览）：更安全的字符串拼接
- 分代 ZGC：降低延迟，提升吞吐量
- 弃用 32 位 Windows 支持
