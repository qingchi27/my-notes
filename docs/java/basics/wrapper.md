# 包装类

## 15. 基本类型和包装类型

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

## 16. 自动拆装箱

- **装箱**：基本类型 → 包装类型。`Integer i = 10;` 等价于 `Integer.valueOf(10)`
- **拆箱**：包装类型 → 基本类型。`int n = i;` 等价于 `i.intValue()`

注意：`null` 拆箱会抛 `NullPointerException`。

---

## 17. Integer 缓存

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
