# 异常与泛型

## 1. Java 异常体系

```text
Throwable
├── Error
└── Exception
    ├── RuntimeException（非受检）
    └── 其他受检异常（Checked Exception）
```

**Error**：通常表示 JVM 或系统层面较严重的问题，如 `OutOfMemoryError`、`StackOverflowError`。一般不应由业务代码主动处理。

**Exception**：程序运行中可以处理的异常。

- 运行时异常：`NullPointerException`、`IndexOutOfBoundsException`
- 受检异常：`IOException`、`SQLException`，编译器强制 `try-catch` 或 `throws`

---

## 2. throw 和 throws

| 关键字 | 作用 |
|---|---|
| `throw` | 方法内部真正抛出异常对象 |
| `throws` | 方法声明上声明可能抛出的异常，交给调用方处理 |

```java
throw new RuntimeException();
public void test() throws IOException { }
```

一句话：**throw 负责抛，throws 负责声明。**

---

## 3. finally 一定执行吗？

正常情况下，无论 `try/catch` 中是否 `return`，`finally` 都会执行。

但不是绝对保证。例如 `System.exit(0)`，或 JVM 直接退出 / 崩溃时，`finally` 可能不会执行。

释放资源优先用 try-with-resources。

---

## 4. 泛型是什么？

泛型允许在类、接口、方法中使用类型参数，使代码能在保证类型安全的同时实现复用。

```java
List<String>
List<Integer>
```

主要作用：类型安全、减少强制类型转换、提高代码复用。

---

## 5. 泛型类、接口、方法

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

---

## 6. 通配符与 PECS

| 通配符 | 含义 |
|---|---|
| `?` | 未知类型 |
| `? extends T` | 上界，只读（Producer） |
| `? super T` | 下界，只写（Consumer） |

PECS：Producer-Extends，Consumer-Super。

---

## 7. 类型擦除

编译后泛型信息会被擦除，替换为边界类型（或 `Object`）。字节码中没有真正的泛型类型，这是 Java 泛型能兼容旧代码的原因，也解释了为什么不能直接 `new T()`、不能有 `List<int>`。
