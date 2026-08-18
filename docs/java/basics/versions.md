# Java 版本

对高级 Java 岗位，重点掌握 **Java 8 + 11 + 17 + 21** 这些 LTS，不必逐个背 9、10、12、13 的小特性。

---

## 1. Java 8（LTS，必须掌握）

- Lambda
- Stream
- Optional
- 接口默认方法 / 静态方法
- 新日期时间 API（`java.time`）
- 方法引用
- ConcurrentHashMap 优化（分段锁改为 CAS + synchronized）
- 元空间 Metaspace 替代永久代

---

## 2. Java 11（LTS）

- HTTP Client 正式标准化，支持异步
- ZGC 首次出现（当时为实验性）
- String 新方法：`isBlank()`、`lines()`、`strip()`、`repeat()`
- `var` 可用于 Lambda 参数
- Flight Recorder 开源

---

## 3. Java 17（LTS，企业常用）

现在企业大量使用 Java 8 / 11 / 17 / 21，其中 17 是很常见的长期支持版本。

- Sealed Classes（密封类，限制继承层次）
- Records 正式化
- Pattern Matching 相关增强
- ZGC / Shenandoah 正式可用
- 弃用 Security Manager

---

## 4. Java 21（LTS）

- **虚拟线程 Virtual Threads**（Project Loom）：轻量级线程，大幅提升高并发 IO 场景的吞吐
- Record Patterns、Pattern Matching for switch
- Sequenced Collections：统一首尾操作
- 结构化并发（预览）
- 分代 ZGC

面试优先能讲清：Java 8 的 Lambda / Stream，Java 17 的 Records / Sealed，Java 21 的虚拟线程。
