# 语法与面向对象

## 1. 标识符和关键字

- **标识符**：程序员定义的名称，如类名、变量名、方法名
- **关键字**：语言预定义、有特殊语义的保留字，不能当普通标识符用

注意：

- 正确写法是 `implements`，不是 `implement`
- `main` **不是** 关键字，只是约定的入口方法名

```java
public static void main(String[] args)
```

- `public` / `static` / `void` → 关键字
- `main` → 普通方法名
- `String` → 类名
- `args` → 变量名

---

## 2. 自增自减

`b = a++`：先把 `a` 原来的值赋给 `b`，再 `a++`。

```java
int a = 10;
int b = a++;
// b = 10, a = 11
```

`b = ++a`：先 `a++`，再把 `a` 的新值赋给 `b`。

```java
int a = 10;
int b = ++a;
// a = 11, b = 11
```

---

## 3. 移位运算

对 `int`，移位距离只取低 5 位，相当于 `距离 % 32`。

```text
x << 42   等价于   x << 10    （42 % 32 = 10）
x << 0、x << 32、x << 64  对 int 都相当于移 0 位
```

对 `long`，移位距离相当于 `% 64`，所以 `x << 65` 等价于 `x << 1`。

---

## 4. final / finally / finalize

### 4.1 final

用于限制修改。

| 修饰目标 | 作用 |
|---|---|
| 变量 | 基本类型值不可再赋；引用不能指向另一个对象，但对象内部状态可变 |
| 方法 | 不能被子类重写 |
| 类 | 不能被继承（如 `String`） |
| 参数 | 方法内不可修改该参数引用 |

```java
final User user = new User();
user = new User();      // ❌ 不能换引用
user.setName("张三");   // ✅ 可以改对象内部状态
```

### 4.2 finally

异常处理中的代码块，通常用于释放资源。正常情况下，即使 `try/catch` 里 `return`，`finally` 也会在方法真正返回前执行。

**不是 100% 保证执行。** 例如 `System.exit(0)`，或 JVM 直接异常终止时，`finally` 可能无法执行。

JDK 7+ 可用 try-with-resources 自动关闭 `AutoCloseable` 资源：

```java
try (InputStream in = new FileInputStream("file.txt")) {
    // ...
}
```

### 4.3 finalize

对象被 GC 前的清理尝试，属于历史遗留。现代开发基本不要用，面试知道即可。

---

## 5. 静态变量与静态方法

`static` 成员属于类，而不是某一个具体对象。同一个类的多个对象共享同一份 static 变量。

```java
class User {
    static int count;
}
// 创建 100 个 User，count 只有一份
```

其他要点：

- 静态方法只能直接访问静态成员，不能使用 `this` / `super`
- 静态代码块在类加载时执行一次，用于初始化静态资源
- 静态内部类不持有外部类引用，可独立存在

### 为什么静态方法不能直接调用非静态成员？

静态方法属于类，实例成员属于对象。调用 `User.test()` 时不一定存在具体对象，无法确定该访问哪个对象的实例成员。

---

## 6. 重载和重写

| 特性 | 重载 Overload | 重写 Override |
|---|---|---|
| 位置 | 同一类中 | 子类中 |
| 方法名 | 相同 | 相同 |
| 参数列表 | 必须不同 | 必须相同 |
| 返回值 | 不能作为重载条件 | 可以协变（相同或子类型） |
| 访问权限 | 可不同 | 不能更严格，可更宽松 |
| 异常 | 可不同 | 不能抛出比父类更宽泛的受检异常 |
| 绑定 | 编译期静态绑定 | 运行期动态绑定 |

---

## 7. 封装、继承、多态

- **封装**：隐藏内部实现，暴露公共接口（`private` + getter/setter）
- **继承**：子类复用父类属性和方法；Java 类单继承，接口可多实现
- **多态**：
  - 编译时多态：方法重载
  - 运行时多态：方法重写 + 父类引用指向子类对象

```java
Parent p = new Child();
p.method(); // 调用 Child 的 method
```

---

## 8. 可变参数

```java
public void print(String... args) { }
```

本质上是数组；只能放在参数列表最后；一个方法只能有一个可变参数；调用时可传 0 个或多个参数。

---

## 9. 基本数据类型

Java 有 8 种基本类型。局部变量没有默认值，使用前必须初始化。

| 类型 | 字节 | 默认值 | 包装类 | 分类 |
|---|---|---|---|---|
| byte | 1 | 0 | Byte | 整数 |
| short | 2 | 0 | Short | 整数 |
| int | 4 | 0 | Integer | 整数 |
| long | 8 | 0L | Long | 整数 |
| float | 4 | 0.0f | Float | 浮点 |
| double | 8 | 0.0d | Double | 浮点 |
| char | 2 | `'\u0000'` | Character | 字符 |
| boolean | JVM 实现相关 | false | Boolean | 布尔 |

---

## 10. == 和 equals

| 比较方式 | 作用 |
|---|---|
| `==` | 基本类型比较值；引用类型比较是否指向同一个对象 |
| `equals()` | 默认（`Object.equals`）也是比较对象身份；很多类会重写后比较内容 |

```java
String a = new String("hello");
String b = new String("hello");
a == b;       // false，地址不同
a.equals(b);  // true，内容相同
```

`equals` 到底比较什么，取决于具体类有没有重写。

---

## 11. hashCode 有什么作用？

主要用于 `HashMap`、`HashSet` 等哈希结构，提高查找效率。

核心约定：

- 两个对象 `equals()` 为 true，则 `hashCode()` **必须相同**
- `hashCode` 相同 **不能推出** `equals` 相同（可能哈希冲突）

### 为什么重写 equals 必须重写 hashCode？

哈希集合先用 `hashCode` 定位桶，再用 `equals` 判断是否真正相等。如果 `a.equals(b) == true` 但 `hashCode` 不同，就会破坏哈希集合约定。所以：**重写 equals 必须同时重写 hashCode。**
