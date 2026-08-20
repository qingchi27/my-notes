# 语法与面向对象

## 7. 基本数据类型

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

## 8. == 和 equals

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

## 9. hashCode

返回对象的哈希码（`int`），用于哈希表（HashMap、HashSet）快速定位。

约定：

- `equals()` 为 true 的两个对象，`hashCode()` **必须相同**
- `hashCode()` 相同，`equals()` 不一定为 true（哈希冲突）
- **必须同时重写 `equals()` 和 `hashCode()`**，否则 HashMap 等集合行为异常

原因：哈希集合先用 `hashCode` 定位桶，再用 `equals` 判断是否真正相等。

---

## 10. final

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

## 11. static

属于类，不属于实例。

- **静态变量**：所有实例共享，类加载时初始化
- **静态方法**：只能访问静态成员，不能使用 `this` / `super`
- **静态代码块**：类加载时执行，只执行一次，用于初始化静态资源
- **静态内部类**：不持有外部类引用，可独立存在

调用静态方法时不一定存在对象，所以不能直接访问实例成员。

---

## 12. 重载与重写

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

## 13. 可变参数

```java
public void print(String... args) { }
```

- 本质上是数组
- 只能放在参数列表最后
- 一个方法只能有一个可变参数
- 调用时可传 0 个或多个参数

---

## 14. 继承、封装、多态

- **封装**：隐藏内部实现，暴露公共接口（`private` + getter/setter）
- **继承**：子类复用父类属性和方法，支持代码复用和扩展
- **多态**：
  - 编译时多态：方法重载
  - 运行时多态：方法重写 + 父类引用指向子类对象

```java
Parent p = new Child();
p.method(); // 调用 Child 的 method
```
