# Docker 旧版本迁移（v0.2.2- 迁移至 V0.2.3+）

从 `v0.2.3` 开始，Markoun 简化了 Docker 的数据挂载路径，请务必使用新的启动命令运行。

旧版本需要分别挂载多个文件和目录到容器内的 `/app`，例如：

- `/app/data`
- `/app/log`
- `/app/welcome.md`
- `/app/config.yaml`

同时还需要在宿主机提前创建对应的文件（如 `welcome.md`、`config.yaml`）并指定每个挂载路径。

新版只需将整个工作目录挂载到容器内的 `/markoun`：

```bash
-v ${MARKOUN_ROOT:-$(pwd)}:/markoun
```

Markoun 会自动在 `/markoun` 下使用或创建 `data/`、`log/`、`welcome.md` 和 `config.yaml`，无需再分别挂载这些文件和目录。

> [!IMPORTANT]
> 如果你正在从 `v0.2.2` 或更早版本升级，请务必使用 [README](README_CN.md) 中提供的最新部署命令启动。
>
> 同时，请将原来的 `data/`、`welcome.md` 和 `config.yaml` 一并迁移到新的 `MARKOUN_ROOT` 目录中。否则，已有文档、欢迎页或配置将无法被新版正确加载。

# 旧版本启动命令

如果你仍在使用 v0.2.2 及更早版本，请使用以下启动命令：

```bash
export MARKOUN_PORT=10000
export MARKOUN_ROOT=./

touch ${MARKOUN_ROOT:-./}/welcome.md
touch ${MARKOUN_ROOT:-./}/config.yaml

docker run -itd --name markoun \
  --restart unless-stopped \
  -p ${MARKOUN_PORT:-10000}:80 \
  -e DEFAULT_ADMIN_NAME=admin \
  -e DEFAULT_ADMIN_EMAIL=admin@example.com \
  -e DEFAULT_ADMIN_PASSWORD=change-this-password \
  -v ${MARKOUN_ROOT:-$(pwd)}/data:/app/data \
  -v ${MARKOUN_ROOT:-$(pwd)}/log:/app/log \
  -v ${MARKOUN_ROOT:-$(pwd)}/welcome.md:/app/welcome.md \
  -v ${MARKOUN_ROOT:-$(pwd)}/config.yaml:/app/config.yaml \
  tropicalalgae/markoun:latest

```
