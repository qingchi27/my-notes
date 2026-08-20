# Java 基础

本笔记覆盖 Java 基础面试高频考点，建议结合源码与实战理解记忆。

---

## 语言特点与运行原理

### 1. Java 语言特点

- **面向对象**：封装、继承、多态
- **跨平台**：一次编译，到处运行（Write Once, Run Anywhere）
- **自动内存管理**：垃圾回收机制（GC），降低内存泄漏风险
- **安全性**：字节码验证、安全管理器、没有指针直接操作
- **多线程支持**：内置 `Thread` 类和 `java.util.concurrent` 包
- **丰富的类库**：标准库庞大，生态成熟

---

### 2. Java 为什么跨平台

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

### 3. JVM / JDK / JRE

| 组件 | 全称 | 作用 |
|---|---|---|
| JVM | Java Virtual Machine | 运行字节码，内存管理、GC、即时编译 |
| JRE | Java Runtime Environment | JVM + 核心类库（rt.jar），仅运行不开发 |
| JDK | Java Development Kit | JRE + 开发工具（javac、javadoc、jdb 等） |

关系：`JDK ⊃ JRE ⊃ JVM`

现代 JDK 通常不再单独发布传统意义上的 JRE，发行版本身已包含运行程序所需环境。

---

### 4. 字节码

- 中间代码，介于源代码和机器码之间
- 文件格式：`.class`
- 特点：平台无关、结构紧凑、可被 JVM 验证和执行
- 查看工具：`javap -c Hello.class`（反汇编字节码）

---

### 5. 编译与解释

- **编译型**：C/C++ 直接编译为机器码，执行快，移植性差
- **解释型**：Python、JS 逐行解释执行，启动快，执行慢
- **Java 是两者结合**：
  1. 先编译（`javac`）为字节码
  2. 再解释执行（解释器）或 JIT 编译为机器码

标准说法：源码由 `javac` 编译成字节码；JVM 运行时既可解释执行，也可把热点代码 JIT 成本地机器码，因此 Java 是编译与解释相结合的语言。

---

### 6. AOT / JIT

| 技术 | 全称 | 说明 |
|---|---|---|
| JIT | Just-In-Time | 运行时把热点代码编译为机器码并缓存复用（如 HotSpot 的 C1/C2 编译器） |
| AOT | Ahead-Of-Time | 运行前编译为机器码（如 GraalVM Native Image），启动快、内存小，但丧失动态特性 |

JDK 9+ 引入 `jaotc` 工具支持 AOT 编译。传统 Java 服务更依赖 JIT；启动速度、内存敏感的场景可考虑 AOT。

---

## 语法与面向对象

### 7. 基本数据类型

| 类型 | 字节 | 默认值 | 包装类 |
|---|---|---|---|
| byte | 1 | 0 | Byte |
| short | 2 | 0 | Short |
| int | 4 | 0 | Integer |
| long | 8 | 0L | Long |
| float | 4 | 0.0f | Float |
| double | 8 | 0.0d | Double |
| char | 2 | `'\u0000'` | Character |
| boolean | 1 bit / 1 byte（JVM 实现相关） | false | Boolean |

局部变量没有默认值，使用前必须初始化。

---

### 8. == 和 equals

| 比较方式 | 作用 |
|---|---|
| `==` | 基本类型：比较值；引用类型：比较内存地址 |
| `equals()` | 默认比较地址（继承自 Object）；通常重写后比较内容（如 String、Integer） |

```java
String a = new String("hello");
String b = new String("hello");
a == b;      // false（地址不同）
a.equals(b); // true（内容相同）
```

`equals` 到底比较什么，取决于具体类有没有重写。

---

### 9. hashCode

返回对象的哈希码（`int`），用于哈希表（HashMap、HashSet）快速定位。

约定：

- `equals()` 为 true 的两个对象，`hashCode()` **必须相同**
- `hashCode()` 相同，`equals()` 不一定为 true（哈希冲突）
- **必须同时重写 `equals()` 和 `hashCode()`**，否则 HashMap 等集合行为异常

原因：哈希集合先用 `hashCode` 定位桶，再用 `equals` 判断是否真正相等。

---

### 10. final

| 修饰目标 | 作用 |
|---|---|
| 类 | 不可被继承（如 `String`、`System`） |
| 方法 | 不可被重写 |
| 变量 | 基本类型：值不可变；引用类型：引用不可变，对象内容可变 |
| 参数 | 方法内不可修改该参数 |

```java
final User user = new User();
user = new User();      // ❌ 不能换引用
user.setName("张三");   // ✅ 可以改对象内部状态
```

---

### 11. static

属于类，不属于实例。

- **静态变量**：所有实例共享，类加载时初始化
- **静态方法**：只能访问静态成员，不能使用 `this` / `super`
- **静态代码块**：类加载时执行，只执行一次，用于初始化静态资源
- **静态内部类**：不持有外部类引用，可独立存在

调用静态方法时不一定存在对象，所以不能直接访问实例成员。

---

### 12. 重载与重写

| 特性 | 重载（Overload） | 重写（Override） |
|---|---|---|
| 位置 | 同一类中 | 子类中 |
| 方法名 | 相同 | 相同 |
| 参数列表 | 必须不同 | 必须相同 |
| 返回类型 | 可不同（协变返回） | 相同或子类型 |
| 访问修饰符 | 可不同 | 不能更严格（可更宽松） |
| 异常 | 可不同 | 不能抛出更宽泛的受检异常 |
| 绑定方式 | 编译期静态绑定 | 运行期动态绑定 |

返回值不能作为重载的判断条件。

---

### 13. 可变参数

```java
public void print(String... args) { }
```

- 本质上是数组
- 只能放在参数列表最后
- 一个方法只能有一个可变参数
- 调用时可传 0 个或多个参数

---

### 14. 继承、封装、多态

- **封装**：隐藏内部实现，暴露公共接口（`private` + getter/setter）
- **继承**：子类复用父类属性和方法，支持代码复用和扩展
- **多态**：
  - 编译时多态：方法重载
  - 运行时多态：方法重写 + 父类引用指向子类对象

```java
Parent p = new Child();
p.method(); // 调用 Child 的 method
```

---

## 包装类

### 15. 基本类型和包装类型

- **基本类型**：存于栈（局部变量）或方法区（静态变量），效率高
- **包装类型**：对象，存于堆，提供方法（如 `Integer.parseInt()`）
- 集合中只能存对象，必须用包装类型

| | 基本类型 | 包装类型 |
|---|---|---|
| 例子 | `int`、`long`、`boolean` | `Integer`、`Long`、`Boolean` |
| 是否对象 | 否 | 是 |
| 泛型 | 不能直接用于泛型 | 可以，如 `List<Integer>` |
| null | 不能为 null | 可以表示 null |

Java 很多 API 需要对象，所以需要包装类把基本类型包装成对象。最典型：可以 `List<Integer>`，不能 `List<int>`。

---

### 16. 自动拆装箱

- **装箱**：基本类型 → 包装类型。`Integer i = 10;` 等价于 `Integer.valueOf(10)`
- **拆箱**：包装类型 → 基本类型。`int n = i;` 等价于 `i.intValue()`

注意：`null` 拆箱会抛 `NullPointerException`。

---

### 17. Integer 缓存

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b); // true

Integer c = 128;
Integer d = 128;
System.out.println(c == d); // false
```

- `Integer.valueOf()` 对 **-128 ~ 127** 使用缓存（`IntegerCache`）
- 超出范围则创建新对象（`Integer` 构造方法自 JDK 9 起已废弃，内部直接创建对象）
- `Byte`、`Short`、`Long`、`Character` 也有类似缓存机制

包装类比较值应使用 `equals`，不要依赖 `==`。

---

## String

### 18. String 不可变

`String` 类被 `final` 修饰，内部字符数组 `value[]` 也是 `final`。真正不可变还依赖：不提供修改自身内容的公开方法，对外操作通常返回新的 String。

好处：

- 线程安全（无需同步）
- 可作为 HashMap 的 key（哈希值不变）
- 字符串常量池复用，节省内存
- 更安全（网络连接、文件路径等不易被篡改）

缺点：频繁修改会产生大量临时对象。

---

### 19. String / StringBuilder / StringBuffer

| 类 | 可变性 | 线程安全 | 适用场景 |
|---|---|---|---|
| String | 不可变 | 安全（只读） | 字符串常量、少量操作 |
| StringBuilder | 可变 | 不安全 | 单线程大量拼接 |
| StringBuffer | 可变 | 安全（synchronized） | 多线程大量拼接 |

单线程下 `StringBuilder` 性能远优于 `StringBuffer`。

---

### 20. String + 拼接

- 编译期常量拼接（如 `"a" + "b"`）→ 编译器优化为 `"ab"`
- 变量拼接（如 `String s = a + b;`）→ 通常编译为 `new StringBuilder().append(a).append(b).toString()`
- 循环中避免用 `+`：每次循环都可能创建新的 `StringBuilder` 对象

不同 JDK 版本对运行时拼接的实现可能不同（现代版本也可能用 `invokedynamic`），面试不要死背「一定是 StringBuilder」，但循环拼接应明确用 `StringBuilder`。

---

### 21. String 常量池

- JDK 7 之前：位于方法区（永久代）
- JDK 7+：移至堆内存
- 作用：存储字符串字面量，避免重复创建相同字符串
- `"hello"` 直接放入常量池；`new String("hello")` 在堆中创建对象，同时常量池有一份

不要说「栈中创建了一个 String 对象」。正确说法：栈中保存引用变量，堆中创建 String 对象，字面量在字符串常量池中。

---

### 22. intern()

```java
String s1 = new String("hello");
String s2 = s1.intern(); // 返回常量池中的规范引用
```

- 如果常量池已有该字符串，返回常量池引用
- 如果没有，将当前字符串纳入常量池并返回引用
- JDK 7+：`intern()` 不再把字符串复制到永久代，而是在堆中记录引用

---

## 异常

### 23. Exception / Error

```text
Throwable
├── Error（严重错误，不可恢复）
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── ...
└── Exception（可捕获处理）
    ├── RuntimeException（运行时异常，非受检）
    │   ├── NullPointerException
    │   ├── ArrayIndexOutOfBoundsException
    │   └── ...
    └── 其他 Exception（受检异常，必须处理）
        ├── IOException
        ├── SQLException
        └── ...
```

- **受检异常（Checked）**：编译器强制要求处理（`try-catch` 或 `throws`）
- **非受检异常（Unchecked）**：`RuntimeException` 和 `Error`，不强制处理

`Error` 通常表示 JVM 或系统层面较严重的问题，一般不应由业务代码主动处理。

---

### 24. throw / throws

| 关键字 | 作用 |
|---|---|
| `throw` | 在方法内部主动抛出一个异常对象 |
| `throws` | 在方法声明上声明可能抛出的异常类型，交给调用方处理 |

```java
throw new RuntimeException();
public void test() throws IOException { }
```

一句话：**throw 负责抛，throws 负责声明。**

---

### 25. try-catch-finally

```java
try {
    // 可能抛出异常的代码
} catch (ExceptionType e) {
    // 异常处理
} finally {
    // 无论是否异常都执行（通常用于释放资源）
}
```

`finally` 中的代码几乎一定执行，除非 `System.exit()` 或 JVM 崩溃。即使 `try/catch` 中 `return`，正常情况下 `finally` 也会在方法真正返回前执行。

JDK 7+ 引入 try-with-resources：自动关闭实现了 `AutoCloseable` 的资源。

```java
try (InputStream in = new FileInputStream("file.txt")) { }
```

---

## 泛型

### 26. 什么是泛型

参数化类型，允许在定义类、接口、方法时使用类型参数。例如 `List<String>`、`Map<K, V>`。

泛型让代码能在保证类型安全的同时实现复用。

---

### 27. 泛型的作用

- **类型安全**：编译期检查类型，避免 `ClassCastException`
- **消除强制类型转换**：如 `List<String>` 取出的元素直接是 `String`
- **代码复用**：一套逻辑适配多种类型

---

### 28. 泛型类、接口、方法

```java
// 泛型类
public class Box<T> {
    private T data;
}

// 泛型接口
public interface Comparator<T> {
    int compare(T o1, T o2);
}

// 泛型方法
public <T> T getFirst(List<T> list) {
    return list.get(0);
}
```

通配符：

| 通配符 | 含义 |
|---|---|
| `?` | 未知类型 |
| `? extends T` | 上界，只读 |
| `? super T` | 下界，只写 |

**PECS 原则**：Producer-Extends，Consumer-Super。

**类型擦除**：编译后泛型信息被擦除，替换为边界类型（或 `Object`），字节码中无泛型。这也解释了为什么不能 `new T()`、不能有 `List<int>`。

---

## 反射、动态代理与 SPI

### 29. 反射

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

### 30. JDK 动态代理

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

### 31. CGLIB

基于继承实现代理，通过 ASM 字节码技术生成目标类的子类。

核心：`Enhancer` + `MethodInterceptor`。

优点：无需接口，性能略优（直接调用方法而非反射）。

缺点：

- 无法代理 `final` 类和方法
- 生成代理类较慢，占用更多 Metaspace

**Spring AOP**：默认有接口用 JDK，无接口用 CGLIB；Spring Boot 2.x+ 默认全部使用 CGLIB。

---

### 32. SPI / API

| 概念 | 说明 |
|---|---|
| API | 调用方使用服务方提供的接口（上层调用下层） |
| SPI | 服务方定义接口，由第三方实现（下层扩展上层） |

一句话：API 是「我提供功能给你调用」；SPI 是「我定义规则，你来实现」。

Java SPI：在 `META-INF/services/` 下配置接口实现类，通过 `ServiceLoader` 加载。

典型应用：JDBC 驱动加载（`DriverManager`）、Spring Boot 自动配置（思想相近；Spring 自身还有 `SpringFactories` 等扩展机制）。

---

## IO

### 33. BIO / NIO / AIO

| 模型 | 全称 | 特点 | JDK 版本 |
|---|---|---|---|
| BIO | Blocking IO | 同步阻塞，一个连接一个线程，简单但并发低 | 1.0 |
| NIO | Non-blocking IO / New IO | 同步非阻塞，基于 Channel + Buffer + Selector，单线程处理多连接 | 1.4 |
| AIO | Asynchronous IO | 异步非阻塞，基于回调和 CompletionHandler，真正的异步 | 1.7 |

NIO 核心：Buffer（数据容器）、Channel（双向通道）、Selector（多路复用器）。

```text
BIO：调用者等
NIO：调用者可以不等
AIO：IO 完成后主动通知调用者
```

BIO 也可以配合线程池同时处理多个连接，只是每个连接上的 IO 仍然是阻塞等待。

---

### 34. 同步 / 异步

- **同步**：调用方主动等待结果返回（阻塞或非阻塞都可能是同步）
- **异步**：调用方发起请求后立即返回，结果通过回调、通知等方式被动接收

关注点是：**谁负责等待结果？**

---

### 35. 阻塞 / 非阻塞

- **阻塞**：线程挂起等待 I/O 完成，期间不能做其他事
- **非阻塞**：线程立即返回，通过轮询或事件通知获取结果

关注点是：**调用线程在等待过程中是否被挂起？**

**同步 ≠ 阻塞，异步 ≠ 非阻塞。**

组合：

```text
BIO = 同步 + 阻塞
NIO = 同步 + 非阻塞
AIO = 异步 + 非阻塞
```

---

## 序列化

### 36. 序列化 / 反序列化

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

---

## Java 版本

对高级 Java 岗位，重点掌握 **Java 8 + 11 + 17 + 21** 这些 LTS。

### 37. Java 8（LTS）

- Lambda 表达式：`() -> {}`，函数式编程
- Stream API：链式操作集合，支持过滤、映射、归约
- Optional：避免空指针，显式处理可能为空的情况
- 方法引用：`ClassName::methodName`
- 接口默认方法 / 静态方法：`default` 关键字
- 新日期时间 API：`LocalDateTime`、`ZonedDateTime`（`java.time` 包）
- ConcurrentHashMap 优化：分段锁改为 CAS + synchronized
- 元空间（Metaspace）：替代永久代（PermGen）

---

### 38. Java 11（LTS）

- HTTP Client API：标准化，支持异步
- ZGC：低延迟垃圾回收器（实验性）
- String 新方法：`isBlank()`、`lines()`、`strip()`、`repeat()`
- 局部变量类型推断增强：`var` 可用于 Lambda 参数
- 移除 Java EE 和 CORBA 模块
- Flight Recorder：开源（之前是商业版功能）

---

### 39. Java 17（LTS）

- 密封类（Sealed Classes）：`sealed`、`permits`，限制继承层次
- 模式匹配 for switch：预览转正
- 恢复始终严格的浮点运算
- 弃用 Security Manager
- 增强的伪随机数生成器
- ZGC / Shenandoah 正式可用
- Records 正式化

---

### 40. Java 21（LTS）

- 虚拟线程（Virtual Threads）：轻量级线程，极大提升并发处理能力（Project Loom）
- 结构化并发（Structured Concurrency）：简化多线程编程，API 预览
- 序列集合（Sequenced Collections）：`SequencedSet`、`SequencedMap`，统一首尾操作
- Record 模式匹配：`instanceof` 和 `switch` 中直接解构 Record
- String Templates（预览）：更安全的字符串拼接
- 分代 ZGC：降低延迟，提升吞吐量
- 弃用 32 位 Windows 支持
