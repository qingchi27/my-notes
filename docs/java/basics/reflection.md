# 反射、动态代理与 SPI

## 1. 反射

反射是 Java 在运行时获取类的信息，并动态操作类、对象、方法、字段、构造器等的一种机制。

```java
Class<?> clazz = User.class;
```

可以通过反射：获取类信息、创建对象、调用方法、访问字段。

核心类：`Class`、`Field`、`Method`、`Constructor`。

### 应用场景

Spring IOC、Spring MVC、MyBatis、JUnit、各种 ORM、动态代理、注解处理。这是框架能「动态」工作的基石。

### 优缺点

| | 说明 |
|---|---|
| 优点 | 灵活、解耦，可实现框架级动态操作 |
| 缺点 | 类型检查较弱；可读性和维护性下降；有性能开销；可能破坏封装（可访问 private） |

JDK 对反射调用有缓存和优化（如 `MethodAccessor`），但业务代码仍应少用。

---

## 2. JDK 动态代理

基于接口：

```text
目标对象实现接口
        ↓
Proxy
        ↓
InvocationHandler
```

核心：`java.lang.reflect.Proxy` + `InvocationHandler`。运行时生成实现目标接口的代理类，主要通过反射调用目标方法。

限制：目标类必须实现接口。

---

## 3. CGLIB

基于继承，通过 ASM 生成目标类的子类并重写方法：

```text
目标类
 ↓
生成子类
 ↓
重写方法
```

核心：`Enhancer` + `MethodInterceptor`。无需接口；`final` 类和方法无法代理。

### Spring AOP 怎么选？

不要简单背成「有接口就 JDK、没接口就 CGLIB」这么绝对。Spring 可根据配置选择代理方式。Spring Boot 2.x+ 默认更偏向 CGLIB（`spring.aop.proxy-target-class=true`）。

---

## 4. SPI

SPI（Service Provider Interface）是一种服务发现机制：接口定义方规定服务接口，具体实现方提供实现，运行时通过配置发现并加载实现，从而实现解耦和可扩展。

Java SPI：在 `META-INF/services/` 下配置接口实现类，通过 `ServiceLoader` 加载。

典型：JDBC、Java SPI、Dubbo SPI。

Spring 自己的扩展机制不能简单等同于 JDK SPI。Spring 有 `SpringFactories`、`ImportSelector`、`BeanFactoryPostProcessor` 等。面试最好说：JDBC、Dubbo 等大量使用 SPI 思想或 SPI 机制。

---

## 5. SPI 和 API

| | 说明 |
|---|---|
| API | 服务提供方提供给调用方使用的接口（上层调用下层） |
| SPI | 框架方定义扩展接口，由第三方提供实现（下层扩展上层） |

一句话：

```text
API：我提供功能给你调用
SPI：我定义规则，你来实现
```
