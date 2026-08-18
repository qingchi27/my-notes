# IO 与序列化

## 1. BIO / NIO / AIO

不要说「BIO 一次只能处理一件事」。BIO 也可以通过线程池同时处理很多连接，只是每个连接通常对应阻塞等待。

| 模型 | 全称 | 特点 |
|---|---|---|
| BIO | Blocking IO | 线程发起 IO 后阻塞等待完成，再继续执行。模型简单，高并发下线程开销大 |
| NIO | Non-blocking IO | 不必一直阻塞，可通过 Selector 让一个线程管理多个 Channel |
| AIO | Asynchronous IO | 发起 IO 后立即返回，完成后通过回调 / Future 通知 |

```text
BIO：调用者等
NIO：调用者可以不等
AIO：IO 完成后主动通知调用者
```

NIO 核心组件：Buffer（数据容器）、Channel（双向通道）、Selector（多路复用器）。

---

## 2. 同步、异步、阻塞、非阻塞

这两对概念必须分开。

**同步 / 异步**：谁负责等待结果？

- 同步：我调用你，我等你结果
- 异步：我调用你，你自己处理，处理完通知我

**阻塞 / 非阻塞**：调用线程在等待过程中是否被挂起？

- 阻塞：线程挂起等待，期间不能做其他事
- 非阻塞：立即返回，通过轮询或事件获取结果

**同步 ≠ 阻塞，异步 ≠ 非阻塞。** 这句话很重要。

常见组合：

| | 模型 |
|---|---|
| 同步 + 阻塞 | BIO |
| 同步 + 非阻塞 | NIO |
| 异步 + 非阻塞 | AIO |

---

## 3. 序列化与反序列化

序列化是将对象转换为可以保存或传输的字节流 / 数据表示；反序列化是把这种数据重新恢复为对象。不要只说「对象转二进制」——还可以是 JSON 文本等。

```text
Java 对象
 ↓
JSON / ProtoBuf / Java Serialization / Hessian / Kryo
 ↓
字节或文本数据
 ↓
反序列化
 ↓
Java 对象
```

Java 原生方式：实现 `Serializable`，使用 `ObjectOutputStream` / `ObjectInputStream`。`serialVersionUID` 用于版本控制。

原生序列化性能差、体积大，且有反序列化安全风险。微服务中更应关注 JSON（Jackson / Gson）、Protobuf、Hessian、Kryo，而不是只背 `Serializable`。
