# Git 基础

## 1. Git 简介

Git 是一个开源的分布式版本控制系统，可以有效、高速地处理从很小到非常大的项目版本管理，也是 Linus Torvalds（林纳斯·本纳第克特·托瓦兹）为了帮助管理 Linux 内核开发而开发的一个开放源码的版本控制软件。

![Git History](/images/git/git-history.png)

- 官网：https://git-scm.com/
- W3Cschool：https://www.w3cschool.cn/git/

### 版本控制

#### 集中式版本控制（CVS、SVN、VSS）
![Git Center](/images/git/git-center.png)

集中化的版本控制系统诸如 CVS、SVN 等，都有一个单一的集中管理的服务器，保存所有文件的修订版本，而协同工作的人们都通过客户端连到这台服务器，取出最新的文件或者提交更新。

这种做法带来了许多好处，每个人都可以在一定程度上看到项目中的其他人正在做些什么。而管理员也可以轻松掌控每个开发者的权限，并且管理一个集中化的版本控制系统，要远比在各个客户端上维护本地数据库来得轻松容易。

这么做显而易见的缺点是中央服务器的单点故障。如果服务器宕机一小时，那么在这一小时内，谁都无法提交更新，也就无法协同工作。

#### 分布式版本控制 - Git
![Git Distribution](/images/git/git-distribution.png)

分布式版本控制系统没有"中央服务器"，每一个人的电脑上都是一个完全的版本库，这样，你工作的时候，就不需要联网了，因为版本库就在你自己的电脑上。既然每一个人电脑上都有一个完全的版本库，那多个人如何协作呢？比方说你在自己电脑上改了文件 A，你的同事也在他的电脑上改了文件 A，这时候，你们俩之间只需把各自的修改推送给对方，就可以相互看到对方的修改了。

## 2. 安装 Git

参考链接：https://blog.csdn.net/mukes/article/details/115693833

## 3. Git 基础命令

```bash
# 配置用户信息
git config --global user.name 用户名
git config --global user.email 邮箱

```
![](/images/git/git-config-1.png)

```bash
# 初始化 Git 仓库（在右键 Git Bash 输入以下命令）
git init
```
![](/images/git/git-config-2.png)

```bash
# 获取远程仓库代码
git clone
```
![](/images/git/git-config-3.png)

```bash
# 查看本地库状态
git status
```
![](/images/git/git-config-4.png)

```bash
# 将工作区文件添加到暂存区
git add 文件名
```
![](/images/git/git-config-5.png)

```bash
# 提交文件
git commit -m "提交信息" 文件名称
```
![](/images/git/git-config-6.png)

```bash
# 推送本地仓库代码到远程仓库（SSH 方式需要配置 SSH 公钥）
git push
```
![](/images/git/git-config-7.png)

```bash
# 查看日志提交记录
git log
```
![](/images/git/git-config-8.png)

```bash
# 获取远程分支 master 并 merge 到当前分支
git pull origin master
```

## 4. 添加 SSH Key

### 生成 SSH Key

```bash
ssh-keygen -t rsa -C "你的邮箱"
```
![](/images/git/git-config-9.png)

一直回车，你的邮箱就是 config 中配置的 `user.email`。

公钥位置：`C:\Users\Administrator\.ssh\id_rsa.pub`
![](/images/git/git-config-10.png)

### 以 GitLab 为例添加 SSH 公钥

1. 打开 GitLab 首页，点击我的头像，选择"首选项"
2. 复制 `id_rsa.pub` 中的内容
3. 粘贴到 GitLab Preferences → SSH Keys
4. 设置好过期时间，点击 Add Key
![](/images/git/git-config-11.png)
![](/images/git/git-config-12.png)
![](/images/git/git-config-13.png)
### 添加多个 SSH Key

可以指定名称生成对应的密钥，上传到不同的项目或者平台使用。

```bash
ssh-keygen -t rsa -C 'chenhengji@luckybus.me' -f ~/.ssh/bettips_id_rsa
```
![](/images/git/git-config-14.png)

## 5. 分支

### SVN 原理

SVN 将存储的信息看作是一组基本文件和每个文件随时间逐步累积的差异，因此称为是基于差异的版本控制，存储的是文件的变化或者差异。

### Git 分支存储原理

Git 把数据看作是对小型文件系统的一系列快照。每当你提交更新或保存项目状态时，它基本上就会对当时的全部文件创建一个快照并保存这个快照的索引。为了效率，如果文件没有修改，Git 不再重新存储该文件，而是只保留一个链接指向之前存储的文件。

### Git 快照原理

**文件存储：** 文件并不是连续存储的，文件内容数据会被分成一块一块分布存储到各个存储空间中。平常能够看到的文件实际上是由数据块描述结构组成的，每个数据块描述结构记录着数据块指针、数据块长度、数据块修改时间等信息。而这个数据块描述结构中的数据块指针指向的就是这一小块文件内容数据在存储空间中存储的地址。

**快照原理：** 备份在存储空间多了全部的数据块，在数据块描述结构中，数据块指针全部指向新的数据块。而快照在存储空间中只多了修改过的数据块，在数据块描述结构中，被修改过的数据块指针指向新的数据块，没被修改过的数据块指针不变。这也就是为什么 Git 使用快照作为保存数据的方式如此高效的原因。

### Git 分支管理

所谓的 Git 分支，本质上就是一个指向 commit 对象的指针。每进行一次 commit 操作，该分支的指针就会指向刚刚那个 commit 对象。Git 有一个 HEAD 的特殊指针，指向使用者当前处在的分支指针。

### 分支相关基本命令

### 合并分支冲突解决

**产生原因：** 合并分支时，两个分支在同一个文件的同一行有两个不同的修改。Git 无法替我们决定使用哪一个。必须人为决定新代码内容。

**合并分支：**

```bash
git merge --no-ff feature/xuqiu
```

将 `feature/xuqiu` 分支合并到当前分支 `feature/xuqiuB`。

- 如果有冲突会提示冲突，有三个选项：直接选择某个分支的或者手动解决
- 提交解决冲突后的文件（解决冲突后需要 `git add` 再 `git push`）

**特殊情况：** 如果我们需要将 A 分支合并到 B 分支，但是我们没有 B 分支的提交权限，就需要先将 B 分支的代码合并到 A 分支解决冲突后再提交到 B 分支。

## 6. 项目分支管理

### 理想的分支管理方案
![](/images/git/git-version-control.png)
### 管理办法（xx 为上线日期或版本号）

1. **版本开发分支**：一般命名规则 `dev/feature-xxx`，从 dev 拉取，开发完成之后合并到dev分支，删除feature-xxx分支
2. **版本转测试分支**：release分支，将dev需要测试的内容合并到release分支测试
3. **不确定何时发布功能分支**：`dev/feature-xxx`（从dev分支拉取）
4. **测试 bug 修改分支**：`fix/fix-bug单号`，从 `release` 分支拉取，修复完成后合并到 release 分支并删除fix-xxx
5. **线上 bug 修改**：`hot-fix/hot-fix-bug单号`（从当前线上版本拉取master V2.0.0）
6. **打包上线**：从测试分支 `release` 打包部署
7. **上线稳定后**：将 `release` 合并到 master 分支并从master中拉出归档版本V2.0.1
8. **master分支**：是生产版本，用户各个版本归档

### 参考资源

- Git 常用命令大全：https://www.runoob.com/git/git-tutorial.html
