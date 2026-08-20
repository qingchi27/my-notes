# 异常

## 23. Exception / Error

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

## 24. throw / throws

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

## 25. try-catch-finally

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
