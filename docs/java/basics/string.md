# String

## 18. String 不可变

`String` 类被 `final` 修饰，内部字符数组 `value[]` 也是 `final`。真正不可变还依赖：不提供修改自身内容的公开方法，对外操作通常返回新的 String。

好处：

- 线程安全（无需同步）
- 可作为 HashMap 的 key（哈希值不变）
- 字符串常量池复用，节省内存
- 更安全（网络连接、文件路径等不易被篡改）

缺点：频繁修改会产生大量临时对象。

---

## 19. String / StringBuilder / StringBuffer

| 类 | 可变性 | 线程安全 | 适用场景 |
|---|---|---|---|
| String | 不可变 | 安全（只读） | 字符串常量、少量操作 |
| StringBuilder | 可变 | 不安全 | 单线程大量拼接 |
| StringBuffer | 可变 | 安全（synchronized） | 多线程大量拼接 |

单线程下 `StringBuilder` 性能远优于 `StringBuffer`。

---

## 20. String + 拼接

- 编译期常量拼接（如 `"a" + "b"`）→ 编译器优化为 `"ab"`
- 变量拼接（如 `String s = a + b;`）→ 通常编译为 `new StringBuilder().append(a).append(b).toString()`
- 循环中避免用 `+`：每次循环都可能创建新的 `StringBuilder` 对象

不同 JDK 版本对运行时拼接的实现可能不同（现代版本也可能用 `invokedynamic`），面试不要死背「一定是 StringBuilder」，但循环拼接应明确用 `StringBuilder`。

---

## 21. String 常量池

- JDK 7 之前：位于方法区（永久代）
- JDK 7+：移至堆内存
- 作用：存储字符串字面量，避免重复创建相同字符串
- `"hello"` 直接放入常量池；`new String("hello")` 在堆中创建对象，同时常量池有一份

不要说「栈中创建了一个 String 对象」。正确说法：栈中保存引用变量，堆中创建 String 对象，字面量在字符串常量池中。

---

## 22. intern()

```java
String s1 = new String("hello");
String s2 = s1.intern(); // 返回常量池中的规范引用
```

- 如果常量池已有该字符串，返回常量池引用
- 如果没有，将当前字符串纳入常量池并返回引用
- JDK 7+：`intern()` 不再把字符串复制到永久代，而是在堆中记录引用
