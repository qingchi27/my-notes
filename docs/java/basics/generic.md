# 泛型

## 26. 什么是泛型

参数化类型，允许在定义类、接口、方法时使用类型参数。例如 `List<String>`、`Map<K, V>`。

泛型让代码能在保证类型安全的同时实现复用。

---

## 27. 泛型的作用

- **类型安全**：编译期检查类型，避免 `ClassCastException`
- **消除强制类型转换**：如 `List<String>` 取出的元素直接是 `String`
- **代码复用**：一套逻辑适配多种类型

---

## 28. 泛型类、接口、方法

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
