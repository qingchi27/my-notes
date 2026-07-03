# 类加载机制

## 类加载过程

类从被加载到 JVM 内存，到卸载出内存，完整生命周期如下：

```
加载 → 验证 → 准备 → 解析 → 初始化 → 使用 → 卸载
```

### 各阶段说明

| 阶段 | 说明 |
|------|------|
| 加载 | 找到 `.class` 文件，转换为方法区的运行时数据结构 |
| 验证 | 文件格式、元数据、字节码、符号引用等校验 |
| 准备 | 为类静态变量分配内存并赋**默认值**（零值） |
| 解析 | 符号引用转换为直接引用 |
| 初始化 | 执行类构造器 `<clinit>()`，为静态变量赋**实际值** |
| 使用 | 类被正常使用 |
| 卸载 | 类从方法区卸载（条件苛刻，很少发生） |

**注意：** 准备阶段赋默认值，初始化阶段才赋实际值。

```java
public static int value = 123;
// 准备阶段：value = 0
// 初始化阶段：value = 123
```

---

## 触发初始化的场景

以下情况会触发类的初始化（`<clinit>()` 执行）：

1. 使用 `new` 创建对象
2. 调用类的静态方法
3. 访问类的静态变量（final 编译期常量除外）
4. 使用反射访问类
5. 初始化子类时，先初始化父类
6. JVM 启动时的主类（含 `main` 方法的类）

**不会触发初始化的情况：**

- 通过子类引用父类的静态字段，仅初始化父类
- 通过数组定义引用类，如 `MyClass[] arr = new MyClass[10]`
- 引用编译期常量（`static final` 且编译期可确定）

---

## 类加载器

### 类型

| 类加载器 | 加载范围 |
|----------|----------|
| Bootstrap ClassLoader | `rt.jar` 等核心类库 |
| Platform ClassLoader（JDK 9+）/ Extension ClassLoader（JDK 8） | 平台扩展类库 |
| Application ClassLoader | classpath 下的应用类 |
| Custom ClassLoader | 自定义加载逻辑 |

**层级关系：**

```
Bootstrap ClassLoader
   ↓
Platform / Extension ClassLoader
   ↓
Application ClassLoader
   ↓
Custom ClassLoader
```

Bootstrap ClassLoader 由 C++ 实现，在 Java 中表现为 `null`。

### 如何判断两个类是否相同

**类全限定名 + 类加载器** 共同决定类的唯一性。

同一个 `.class` 文件被不同 ClassLoader 加载，JVM 视为两个不同的类。

---

## 双亲委派模型

### 原理

```
收到加载请求
   ↓
先委托父加载器加载
   ↓
父加载器无法加载？
   ↓ 是
子加载器才尝试自己加载
```

**流程：**

1. 类加载器收到加载请求
2. 先委托给父加载器
3. 父加载器再向上委托，直到 Bootstrap
4. 父加载器无法加载时，子加载器才尝试加载

### 作用

- 防止类被重复加载
- 保证核心类库的安全（如 `java.lang.String` 不会被自定义类替换）

---

## 打破双亲委派

### 常见方式

- 自定义 ClassLoader，重写 `loadClass()` 方法
- 使用 Thread Context ClassLoader

### 典型应用场景

| 场景 | 原因 |
|------|------|
| JDBC | 核心类需要加载厂商 Driver 实现类 |
| Tomcat | 不同 Web 应用隔离，各自加载独立类 |
| Spring Boot DevTools | 热部署，优先加载新类 |
| OSGi | 模块化，按需加载 |
| SPI（Service Provider Interface） | 接口在核心库，实现在 classpath |

**SPI 机制示例：**

```
ServiceLoader 加载实现类
   ↓
Bootstrap 加载接口
   ↓
Thread Context ClassLoader 加载实现
   ↓
打破双亲委派
```

---

## 面试总结

**类加载过程？**

加载 → 验证 → 准备 → 解析 → 初始化 → 使用 → 卸载

**双亲委派的作用？**

防止类重复加载，保证核心类库安全。

**如何打破双亲委派？**

自定义 ClassLoader 或 Thread Context ClassLoader，典型场景：JDBC、Tomcat、SPI。

**如何判断两个类是否相同？**

类全限定名 + 类加载器。
