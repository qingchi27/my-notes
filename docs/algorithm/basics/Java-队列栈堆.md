# Java 队列 / 栈 / 堆

> 用法：每天早上花 10 分钟，把「第一部分速查表」看一遍，然后**不看答案**默写「第三部分每日一练」的当天内容。坚持两周即可形成肌肉记忆。

---

## 第一部分：核心速查表

### 1. Stack（栈）—— 先进后出

```java
Deque<Integer> stack = new ArrayDeque<>();  // 官方推荐：别用老的 Stack 类，用 ArrayDeque 当栈
```

| 操作 | 方法 | 说明 |
| --- | --- | --- |
| 入栈 | `push(x)` | 压入栈顶 |
| 出栈 | `pop()` | 弹出栈顶（空栈抛异常） |
| 看栈顶 | `peek()` | 查看不删除（空栈返回 null） |
| 判空 | `isEmpty()` |  |
| 大小 | `size()` |  |

记忆口诀：**push 进，pop 出，peek 看一眼**。

### 2. Queue（队列）—— 先进先出

```java
Queue<Integer> queue = new ArrayDeque<>();   // 普通队列
Queue<int[]> bfs = new LinkedList<>();       // BFS 常用 LinkedList
```

| 操作 | 会抛异常 | 返回特殊值（推荐） |
| --- | --- | --- |
| 入队 | `add(x)` | `offer(x)` ✅ |
| 出队 | `remove()` | `poll()` ✅ 空返回 null |
| 看队头 | `element()` | `peek()` ✅ 空返回 null |

记忆口诀：**offer 进，poll 出，peek 看头**。带 e 的方法不抛异常。

### 3. Deque（双端队列）—— 两头都能进出

```java
Deque<Integer> deque = new ArrayDeque<>();
```

| 操作 | 队头 | 队尾 |
| --- | --- | --- |
| 插入 | `offerFirst(x)` | `offerLast(x)` |
| 删除 | `pollFirst()` | `pollLast()` |
| 查看 | `peekFirst()` | `peekLast()` |

> ArrayDeque 当栈用：`push/pop/peek` 等价于 `offerFirst/pollFirst/peekFirst`。
> 滑动窗口最大值就是靠 `pollFirst / offerLast / peekLast` 这一套。

### 4. PriorityQueue（优先队列 / 堆）

```java
// 小顶堆（默认）：堆顶最小
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// 大顶堆：堆顶最大，核心就是换个比较器
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> b - a);

// 你问的那个写法：按 map 里的 value 排序建堆（TopK 高频模板）
PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> map.get(a) - map.get(b));

// 按数组某个维度排：比如按区间的起点排序
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
```

| 操作 | 方法 | 复杂度 |
| --- | --- | --- |
| 入堆 | `offer(x)` | O(log n) |
| 出堆顶 | `poll()` | O(log n) |
| 看堆顶 | `peek()` | O(1) |

易错点：

- `(a, b) -> a - b` 是**小顶堆**（升序，小的先出）；`(a, b) -> b - a` 是**大顶堆**。
- 更安全的写法防溢出：`Comparator.comparingInt(a -> map.get(a))`。
- **不要**在堆里放会被外部修改的元素，堆不会自动重排。

### 5. LinkedList

```java
LinkedList<Integer> list = new LinkedList<>();
```

它同时实现了 `List` 和 `Deque` 接口，所以两套方法都有：

```java
list.add(x);           // 尾部插入
list.addFirst(x);
list.addLast(x);
list.removeFirst();
list.removeLast();
list.getFirst();
list.getLast();
list.get(i);           // 按下标取，O(n)，算法题里尽量别用
```

> 算法题里 LinkedList 主要两个用途：① BFS 队列 ② 需要头尾 O(1) 增删的场景（如 LRU 缓存配合 HashMap）。
> 性能上 ArrayDeque 通常更快，能用一个就不用另一个。

---

## 第二部分：算法高频模板（这 8 个模板覆盖 90% 的题）

### 模板 1：TopK 问题（大顶堆 / 小顶堆）

```java
// 求数组中第 K 大的元素：维护一个大小为 k 的【小顶堆】
// 堆顶就是第 K 大
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();  // 小顶堆
    for (int num : nums) {
        heap.offer(num);
        if (heap.size() > k) heap.poll();  // 踢掉最小的，留下 k 个最大的
    }
    return heap.peek();
}
```

### 模板 2：频率 TopK（你的例子就是这个）

```java
// 前 K 个高频元素（LeetCode 347）
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int num : nums) map.merge(num, 1, Integer::sum);

    // 按频率建小顶堆：频率小的在堆顶，方便踢掉
    PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> map.get(a) - map.get(b));
    for (int key : map.keySet()) {
        heap.offer(key);
        if (heap.size() > k) heap.poll();
    }
    int[] res = new int[k];
    for (int i = 0; i < k; i++) res[i] = heap.poll();
    return res;
}
```

### 模板 3：BFS 层序遍历（队列）

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();          // 关键：先固定本层大小
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        res.add(level);
    }
    return res;
}
```

### 模板 4：单调栈（下一个更大元素）

```java
// LeetCode 739 每日温度 / 496 下一个更大元素
// 栈里存下标，从栈底到栈顶单调递减
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] res = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        // 当前温度比栈顶高 → 栈顶找到了"下一个更大"
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int idx = stack.pop();
            res[idx] = i - idx;
        }
        stack.push(i);
    }
    return res;
}
```

### 模板 5：单调队列（滑动窗口最大值）

```java
// LeetCode 239：双端队列存下标，队头永远是窗口最大值
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] res = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        // 1. 队头滑出窗口 → 移除
        if (!deque.isEmpty() && deque.peekFirst() < i - k + 1) deque.pollFirst();
        // 2. 队尾比当前小的都是废物 → 移除
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) deque.pollLast();
        deque.offerLast(i);
        // 3. 窗口形成后，队头就是答案
        if (i >= k - 1) res[i - k + 1] = nums[deque.peekFirst()];
    }
    return res;
}
```

### 模板 6：栈模拟（括号匹配 / 计算器）

```java
// LeetCode 20 有效的括号
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '[') stack.push(']');
        else if (c == '{') stack.push('}');
        // 遇到右括号：栈空 或 栈顶不匹配 → false
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}
```

### 模板 7：合并 K 个有序链表（堆的经典应用）

```java
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode node : lists) {
        if (node != null) heap.offer(node);
    }
    ListNode dummy = new ListNode(0), cur = dummy;
    while (!heap.isEmpty()) {
        ListNode min = heap.poll();
        cur.next = min;
        cur = cur.next;
        if (min.next != null) heap.offer(min.next);  // 后继进堆
    }
    return dummy.next;
}
```

### 模板 8：数据流中位数（双堆法）

```java
class MedianFinder {
    // 大顶堆存较小的一半，小顶堆存较大的一半
    PriorityQueue<Integer> left = new PriorityQueue<>((a, b) -> b - a);
    PriorityQueue<Integer> right = new PriorityQueue<>();

    public void addNum(int num) {
        left.offer(num);
        right.offer(left.poll());          // 保证左边都 ≤ 右边
        if (left.size() < right.size()) {  // 保持平衡
            left.offer(right.poll());
        }
    }

    public double findMedian() {
        if (left.size() > right.size()) return left.peek();
        return (left.peek() + right.peek()) / 2.0;
    }
}
```

---

## 第三部分：每日一练（14 天循环）

**规则：每天默写一遍对应代码，写不出来就回去看模板，直到能 5 分钟内默写出来。**

| 天数 | 内容 | 核心要记的方法 |
| --- | --- | --- |
| Day 1 | 手写：声明栈/队列/双端队列/大小顶堆各一行 | `ArrayDeque`、比较器 |
| Day 2 | 默写：模板 6 有效的括号 | `push / pop / isEmpty` |
| Day 3 | 默写：模板 3 BFS 层序遍历 | `offer / poll / size 固定` |
| Day 4 | 默写：模板 1 第 K 大元素 | 小顶堆 + `size > k 就 poll` |
| Day 5 | 默写：模板 2 频率 TopK | `(a,b) -> map.get(a) - map.get(b)` |
| Day 6 | 默写：模板 4 每日温度（单调栈） | `while + peek + pop + push` |
| Day 7 | 休息 + 把前 6 天的方法名各抄 3 遍 |  |
| Day 8 | 默写：模板 5 滑动窗口最大值 | `pollFirst / pollLast / peekFirst` |
| Day 9 | 默写：模板 7 合并 K 个链表 | 堆里放节点 + 后继进堆 |
| Day 10 | 默写：模板 8 数据流中位数 | 大顶堆 + 小顶堆配平 |
| Day 11 | 实战：LeetCode 155 最小栈 | 辅助栈同步 push/pop |
| Day 12 | 实战：LeetCode 232 用栈实现队列 | 两个栈倒一次 |
| Day 13 | 实战：LeetCode 215 / 347 / 239 三连（限时 30 分钟） | 综合 |
| Day 14 | 实战：LeetCode 23 / 295 / 739 三连（限时 40 分钟） | 综合 |

**第 15 天起从头循环，直到每个模板都能 5 分钟内默写。**

---

## 第四部分：30 秒默写卡（贴在工位上）

```text
栈      Deque<Integer> s = new ArrayDeque<>();     push  pop  peek
队列    Queue<Integer> q = new LinkedList<>();     offer poll peek
双端    Deque<Integer> d = new ArrayDeque<>();     offerFirst/Last  pollFirst/Last  peekFirst/Last
小顶堆  new PriorityQueue<>()                       小的先出
大顶堆  new PriorityQueue<>((a,b) -> b - a)         大的先出
按值排  new PriorityQueue<>((a,b) -> map.get(a) - map.get(b))
TopK大 → 小顶堆，size>k 就 poll
BFS   → while(!q.isEmpty()) { 固定size; for循环poll }
单调栈 → 找"下一个更大"，while 当前 > 栈顶 就 pop
```

---

## 常见易错点清单

1. **ArrayDeque 不允许存 null**（offer(null) 直接 NPE），LinkedList 可以。
2. `poll()` 空队列返回 `null`，`remove()` 空队列抛异常 —— 判空逻辑想清楚。
3. `peek()` 拿到的是 `Integer`，空时返回 null，直接 `peek() + 1` 会 NPE。
4. 比较器里 `a - b` 在极端值下会溢出，正式代码用 `Integer.compare(a, b)`。
5. PriorityQueue 的 `remove(x)` 是 O(n)，别在循环里用。
6. 遍历 PriorityQueue **不是**有序的，只有逐个 poll 才是有序的。
7. LinkedList 用下标 `get(i)` 是 O(n)，需要随机访问请用 ArrayList。
8. 老的 `Stack` 类和 `Vector` 一样过时了，面试手写可以，工程代码用 ArrayDeque。
