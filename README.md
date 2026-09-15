# Personal GitHub Pages site

一个不依赖框架的静态个人主页，发布内容位于 `dist/`。

## 个性化

编辑 `dist/index.html` 中的姓名、介绍和文案。页面中的 GitHub 链接目前指向：

```text
https://github.com/real-fzw
```

颜色和版式集中在 `dist/styles.css`，其中 `--accent` 是页面强调色。

## 本地预览

```bash
python3 -m http.server 8000 --directory dist
```

浏览器访问 `http://localhost:8000`。

## 发布到 GitHub Pages

1. 在 GitHub 创建公开仓库 `你的用户名.github.io`。
2. 把此目录提交并推送到仓库的 `main` 分支。
3. 打开仓库 `Settings → Pages`，把 Source 选择为 **GitHub Actions**。
4. 等待名为 **Deploy GitHub Pages** 的工作流完成。

网站地址即 `https://你的用户名.github.io`。
