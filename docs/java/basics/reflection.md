# 反射、动态代理与 SPI

## 29. 反射

在运行期动态获取类的信息（字段、方法、构造器等）并操作对象。

核心类：`Class`、`Field`、`Method`、`Constructor`。

```java
Class<?> clazz = User.class;
```

可以通过反射：获取类信息、创建对象、调用方法、访问字段。

应用场景：Spring IOC、Spring MVC、MyBatis、JUnit、ORM、动态代理、注解处理。

| | 说明 |
|---|---|
| 优点 | 灵活，是框架的基石（Spring、MyBatis） |
| 缺点 | 性能开销大（绕过编译期优化）；破坏封装（可访问 private）；代码可读性差 |

JDK 对反射调用有缓存和优化（如 `MethodAccessor`）。

---

## 30. JDK 动态代理

基于接口实现代理。

核心：`java.lang.reflect.Proxy` + `InvocationHandler`。

原理：运行时生成一个实现目标接口的代理类，通过反射调用目标方法。

限制：目标类必须实现接口。

```text
目标对象实现接口
        ↓
Proxy
        ↓
InvocationHandler
```

---

## 31. CGLIB

基于继承实现代理，通过 ASM 字节码技术生成目标类的子类。

核心：`Enhancer` + `MethodInterceptor`。

优点：无需接口，性能略优（直接调用方法而非反射）。

缺点：

- 无法代理 `final` 类和方法
- 生成代理类较慢，占用更多 Metaspace

**Spring AOP**：默认有接口用 JDK，无接口用 CGLIB；Spring Boot 2.x+ 默认全部使用 CGLIB。

---

## 32. SPI / API

| 概念 | 说明 |
|---|---|
| API | 调用方使用服务方提供的接口（上层调用下层） |
| SPI | 服务方定义接口，由第三方实现（下层扩展上层） |

一句话：API 是「我提供功能给你调用」；SPI 是「我定义规则，你来实现」。

Java SPI：在 `META-INF/services/` 下配置接口实现类，通过 `ServiceLoader` 加载。

典型应用：JDBC 驱动加载（`DriverManager`）、Spring Boot 自动配置（思想相近；Spring 自身还有 `SpringFactories` 等扩展机制）。
