# 语言特点与运行原理

本笔记覆盖 Java 基础面试高频考点，建议结合源码与实战理解记忆。

## 1. Java 语言特点

- **面向对象**：封装、继承、多态
- **跨平台**：一次编译，到处运行（Write Once, Run Anywhere）
- **自动内存管理**：垃圾回收机制（GC），降低内存泄漏风险
- **安全性**：字节码验证、安全管理器、没有指针直接操作
- **多线程支持**：内置 `Thread` 类和 `java.util.concurrent` 包
- **丰富的类库**：标准库庞大，生态成熟

---

## 2. Java 为什么跨平台

- Java 源代码编译为字节码（`.class`），而非机器码
- 字节码由 JVM（Java Virtual Machine）解释 / 编译执行
- 不同操作系统有对应的 JVM 实现，屏蔽底层硬件差异

**本质：JVM 是跨平台的桥梁，Java 本身不直接依赖操作系统。**

```text
Java 源码
   ↓ javac
字节码 .class
   ↓
Windows JVM / Linux JVM / macOS JVM
   ↓
对应平台机器码
```

---

## 3. JVM / JDK / JRE

| 组件 | 全称 | 作用 |
|---|---|---|
| JVM | Java Virtual Machine | 运行字节码，内存管理、GC、即时编译 |
| JRE | Java Runtime Environment | JVM + 核心类库（rt.jar），仅运行不开发 |
| JDK | Java Development Kit | JRE + 开发工具（javac、javadoc、jdb 等） |

关系：`JDK ⊃ JRE ⊃ JVM`

现代 JDK 通常不再单独发布传统意义上的 JRE，发行版本身已包含运行程序所需环境。

---

## 4. 字节码

- 中间代码，介于源代码和机器码之间
- 文件格式：`.class`
- 特点：平台无关、结构紧凑、可被 JVM 验证和执行
- 查看工具：`javap -c Hello.class`（反汇编字节码）

---

## 5. 编译与解释

- **编译型**：C/C++ 直接编译为机器码，执行快，移植性差
- **解释型**：Python、JS 逐行解释执行，启动快，执行慢
- **Java 是两者结合**：
  1. 先编译（`javac`）为字节码
  2. 再解释执行（解释器）或 JIT 编译为机器码

标准说法：源码由 `javac` 编译成字节码；JVM 运行时既可解释执行，也可把热点代码 JIT 成本地机器码，因此 Java 是编译与解释相结合的语言。

---

## 6. AOT / JIT

| 技术 | 全称 | 说明 |
|---|---|---|
| JIT | Just-In-Time | 运行时把热点代码编译为机器码并缓存复用（如 HotSpot 的 C1/C2 编译器） |
| AOT | Ahead-Of-Time | 运行前编译为机器码（如 GraalVM Native Image），启动快、内存小，但丧失动态特性 |

JDK 9+ 引入 `jaotc` 工具支持 AOT 编译。传统 Java 服务更依赖 JIT；启动速度、内存敏感的场景可考虑 AOT。
