# 序列化

## 36. 序列化 / 反序列化

- **序列化**：将对象转换为字节流，便于存储或网络传输
- **反序列化**：将字节流恢复为对象

也可以是 JSON 等文本表示，不局限于二进制。

```text
Java 对象
 ↓
JSON / ProtoBuf / Java Serialization
 ↓
字节或文本数据
 ↓
反序列化
 ↓
Java 对象
```

Java 原生方式：实现 `Serializable` 接口，使用 `ObjectOutputStream` / `ObjectInputStream`。

`serialVersionUID`：用于版本控制，类结构变化时反序列化可能失败。

缺点：

- 性能差、体积大
- 安全性问题（反序列化漏洞，如 RCE）

替代方案：JSON（Jackson / Gson）、Protobuf、Kryo、Hessian。微服务中更应关注这些方案，而不是只背原生 `Serializable`。
