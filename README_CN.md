<div align="center"><img style="width: 240px" src=".github/assets/logo.png"/></div>
<p align="center"><strong><span style="font-size: 1.25em;">一个可自托管、基于文件的 Markdown 编辑器</span></strong></p>
<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/Language-English-blue.svg"></a>
  <a href="README_CN.md"><img src="https://img.shields.io/badge/语言-简体中文-red.svg"></a>
  <a href="https://codecov.io/github/tropical-algae/markoun"><img src="https://codecov.io/github/tropical-algae/markoun/graph/badge.svg?token=5H3ZSVRZSE" alt="测试覆盖率"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg"></a>
</p>
<div align="center"><img src=".github/assets/preview.png"/></div>

Markoun 是一款轻量、可自托管且完全基于文件的 Markdown 编辑器，面向注重隐私和简洁体验的用户。

> Markoun 的界面布局参考了 [Haptic](https://github.com/chroxify/haptic) 和 [Obsidian](https://github.com/obsidianmd) 两种优秀的 Markdown 编辑工具。

## 功能特性

- **简洁界面**：简约的操作界面、流畅的动画和完整的编辑功能

- **基于文件的架构**：直接操作本地文件，无需数据库、索引构建，便于迁移

- **LaTeX 支持**：实时 Markdown 预览，内置 LaTeX 渲染支持

- **快捷键**：简单的图片粘贴与保存操作，支持拖拽上传或移动

- **丰富配置**：通过 `config.yaml` 灵活配置日志、身份认证和文件管理

## 部署

可以使用 Docker 部署 Markoun：

```bash
export MARKOUN_PORT=10000
export MARKOUN_ROOT=./

touch ${MARKOUN_ROOT:-./}/config.yaml

docker run -itd --name markoun \
  --restart unless-stopped \
  -p ${MARKOUN_PORT:-10000}:80 \
  -e DEFAULT_ADMIN_NAME=admin \
  -e DEFAULT_ADMIN_EMAIL=admin@example.com \
  -e DEFAULT_ADMIN_PASSWORD=change-this-password \
  -v ${MARKOUN_ROOT:-$(pwd)}/data:/app/data \
  -v ${MARKOUN_ROOT:-$(pwd)}/config.yaml:/app/config.yaml \
  tropicalalgae/markoun:latest

```

> [!WARNING]
> 启动容器前，请替换示例中的管理员凭据。如果没有提供这些环境变量，系统会自动创建默认管理员并生成随机密码。
> 运行 `docker logs -f markoun` 从日志查看生成的账户凭据。

也可以在首页创建新的普通用户。

### 挂载目录说明

| **路径**           | **说明**                       |
| ------------------ | ------------------------------ |
| `/app/data`        | 存放 Markdown 文件的目录。     |
| `/app/config.yaml` | 主配置文件。                   |
| `/app/welcome.md`  | 未打开文件时显示的可选欢迎页。 |

如需自定义 Docker 中的默认欢迎页，可以将自己的 Markdown 文件挂载到 `/app/welcome.md`，或者将 `WELCOME_NOTE_PATH` 指向其他已挂载的文件。

## 配置

Markoun 通过 `config.yaml` 进行配置。修改该文件后需要重启服务才能生效。以下是部分重要选项：

| **配置项**                             | **说明**                                                                      | **默认值**                                 | **引入版本** |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ | ------------ |
| `USER_WORKSPACE_ISOLATION`             | 启用身份认证时，将 `<DOCUMENT_ROOT>/<username>` 作为每个用户独立的工作区。    | false                                      | `v0.2.2`     |
| `MEDIA_DELIVERY_MODE`                  | 通过 FastAPI（`application`）或 Nginx 内部重定向（`nginx`）传输受保护的图片。 | `nginx`                                    | `v0.2.2`     |
| `AUTH_REQUIRED`                        | 访问和编辑工作区文件前是否要求用户登录。                                      | true                                       | `v0.2.1`     |
| `DEBUG`                                | 是否开启DEBUG日志。                                                           | false                                      | `v0.0.1`     |
| `ACCESS_TOKEN_DEFAULT_EXPIRE_MINUTES`  | 标准会话的有效时间，单位分钟。                                                | 1440                                       | `v0.0.1`     |
| `ACCESS_TOKEN_EXTENDED_EXPIRE_MINUTES` | 用户选择“Remember me”后，持久会话的有效时间，单位分钟。                       | 43200                                      | `v0.0.1`     |
| `ACCESS_TOKEN_COOKIE_SECURE`           | 是否仅通过 HTTPS 发送身份认证 Cookie。公网使用 HTTPS 时应启用。               | false                                      | `v0.1.4`     |
| `DISPLAYED_FILE_TYPES`                 | 允许编辑器显示的文件扩展名列表。                                              | ["md", "png", "jpg", "jpeg", "bmp", "svg"] | `v0.0.1`     |
| `WELCOME_NOTE_PATH`                    | 默认欢迎页显示内容的 Markdown 文件路径。                                      | `./welcome.md`                             | `v0.1.0`     |

更多配置选项请参阅 [config.py](src/markoun/common/config.py)。

> [!WARNING]
> 将 `AUTH_REQUIRED` 设置为 `false` 后，所有访问者都可以读取、创建、编辑、上传、移动和删除工作区文件。
> 仅应在可信网络中，或已部署其他访问控制机制时关闭身份认证。

## 编辑器说明

**快捷键**：

| **操作**       | **Windows / Linux** | **macOS**     |
| -------------- | ------------------- | ------------- |
| 粘贴剪贴板图片 | `Ctrl + V`          | `Command + V` |
| 保存当前文档   | `Ctrl + S`          | `Command + S` |

**相对图片路径**：
向 Markdown 文件插入图片时，图片路径将相对于 Markdown 文件所在位置生成，而不是相对于项目根目录。渲染器通过受保护的媒体接口解析这些路径，在不暴露实际工作区路径的同时保持文件的可移植性。

**长按重命名**：
长按侧边栏中的文件或文件夹名称即可重命名。

**拖拽上传**：
将本地文件拖到侧边栏中的文件夹，即可直接上传到该文件夹。

**文件显示规则**：
默认情况下，侧边栏仅显示 Markdown 文件和常见图片格式。如需显示其他文件类型，请修改 `config.yaml` 中的 `DISPLAYED_FILE_TYPES`。

**系统配置**：
管理员可以在侧边栏设置中管理以下选项：

- 启用或关闭用户注册。
- 按笔记组织粘贴的图片，将图片存放在与 Markdown 文件同名的文件夹中。

## 局限性与未来的更新路线图

- [x] **图片安全**：为静态图片访问提供身份认证保护
- [x] **文件系统架构**：优化文件系统的整体设计
- [x] **界面优化**：改善动画和样式一致性
- [ ] **扩展设置**：提供更多个性化和工作流配置
- [x] **快捷操作与交互增强**：提供更直观、高效的操作方式
- [x] **易用性提升**：带来更流畅、舒适的使用体验
- [x] **增强预览**：支持图片预览及 Markdown 中更丰富的内容预览，包括 ~~甘特图渲染~~
- [x] **前端重构**：持续优化前端代码结构
- [ ] **文件同步**：支持与远程数据源同步文件
- [ ] **版本管理**：提供文件历史记录、版本管理和恢复功能
- [ ] **部署方式扩展**：支持更多适用于不同环境的安装与部署方式

## 许可证

本项目基于 [MIT License](https://github.com/tropical-algae/markoun/blob/main/LICENSE) 开源。
