# 包装类型与 String

## 1. 基本类型和包装类型

| | 基本类型 | 包装类型 |
|---|---|---|
| 例子 | `int`、`long`、`double`、`boolean` | `Integer`、`Long`、`Double`、`Boolean` |
| 是否对象 | 否 | 是 |
| 开销 | 通常更低 | 相对更高 |
| 泛型 | 不能直接用于泛型 | 可以 |
| null | 不能为 null | 可以表示 null |
| 其他 | 无方法 | 有工具方法和缓存机制 |

集合中只能存对象，必须用包装类型。

---

## 2. 为什么需要包装类？

Java 很多 API 需要对象，而基本类型不是对象，所以需要包装类型把基本类型包装成对象。最典型：`List<Integer>` 可以，`List<int>` 不行。

---

## 3. 自动装箱和拆箱

```java
Integer i = 10;   // 装箱，相当于 Integer.valueOf(10)
int j = i;        // 拆箱，相当于 i.intValue()
```

注意：包装类型为 `null` 时拆箱会抛 `NullPointerException`。

---

## 4. Integer 缓存

常见包装类缓存：

| 类型 | 缓存范围 |
|---|---|
| Byte | 全部 |
| Short | -128 ~ 127 |
| Integer | -128 ~ 127 |
| Long | -128 ~ 127 |
| Character | 0 ~ 127 |
| Boolean | true / false |

```java
Integer a = 100;
Integer b = 100;
a == b;   // true，走缓存

Integer c = 200;
Integer d = 200;
c == d;   // false，超出缓存，不能依赖 ==
```

面试直接说：**包装类比较值应该使用 `equals`。**

---

## 5. 浮点数为什么有精度问题？

`float` 和 `double` 使用 IEEE 754 **二进制**浮点数格式。很多十进制小数无法用有限的二进制小数精确表示，因此计算可能出现精度误差。

不要说「按十进制存储」。

经典：`0.1 + 0.2 != 0.3`。金融计算应使用 `BigDecimal`。

超过 `long` 范围的整数可以使用 `BigInteger`（任意精度整数）。

---

## 6. String、StringBuilder、StringBuffer

| 类 | 可变性 | 线程安全 | 适用场景 |
|---|---|---|---|
| String | 不可变 | 只读安全 | 字符串常量、少量操作 |
| StringBuilder | 可变 | 非线程安全 | 单线程大量拼接 |
| StringBuffer | 可变 | 方法大量同步 | 多线程拼接 |

单线程字符串拼接优先 `StringBuilder`，性能通常优于 `StringBuffer`。

```java
String s = "abc";
s = s + "d";  // 不是改原来的 String，而是产生新结果
```

---

## 7. String 为什么不可变？

不要只说「String 是 final，所以不可变」。`final` 只能保证这个类不能被继承。

真正不可变还与内部设计有关：

- 类不能被继承
- 内部数据不提供修改自身状态的公开方法
- 字符串内容一旦创建就不会改变
- 对外操作通常返回新的 String

好处：线程安全、可作为 HashMap 的 key、常量池复用、更安全。缺点：频繁修改会产生大量临时对象。

---

## 8. String + 拼接

```java
String s = "hello" + "world";  // 编译期常量，通常直接优化成 "helloworld"
String s = a + b;              // 运行时拼接
```

不要死背「一定是 StringBuilder」。不同 JDK 版本实现可能不同。现代编译器 / JVM 常用 `invokedynamic` 等机制生成高效拼接代码。

可以说：编译器 / JVM 会对字符串拼接做优化，现代 JDK 不应简单理解成固定使用 StringBuilder。循环中仍应避免用 `+` 反复拼接。

---

## 9. `new String("abc")` 创建几个对象？

```java
String s = new String("abc");
```

- 若常量池还没有 `"abc"`：常量池一份 + 堆上一个 String 对象
- 若常量池已有 `"abc"`：只需新建堆上的 String 对象

不要说「栈中创建了一个 String 对象」。正确说法：

**栈中保存引用变量 `s`，堆中创建 String 对象，字符串字面量存在字符串常量池中。**

JDK 7 起字符串常量池在堆中（此前在方法区 / 永久代）。

---

## 10. intern()

`intern()` 的核心作用：返回字符串常量池中对应字符串的规范引用。

```java
String s1 = new String("abc");
String s2 = s1.intern();
// 若池中已有 "abc"，s2 指向常量池中的 "abc"
```

不要死记「一定把对象复制到常量池」。Java 7 之后实现有变化。更准确：

`intern` 会尝试返回字符串常量池中的规范引用；若不存在，则根据 JVM 实现和版本将相应字符串纳入字符串池，然后返回池中的引用。
