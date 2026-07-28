# Docker Migration Guide (v0.2.2 and Earlier → v0.2.3+)

Starting with **v0.2.3**, Markoun simplifies the Docker data mounting layout. Please make sure to use the new startup command when upgrading.

In previous versions, you had to mount multiple files and directories individually into the container under `/app`, including:

- `/app/data`
- `/app/log`
- `/app/welcome.md`
- `/app/config.yaml`

You also needed to create certain files (such as `welcome.md` and `config.yaml`) on the host before starting the container and specify each mount separately.

With **v0.2.3+**, you only need to mount the entire working directory to `/markoun`:

```bash
-v ${MARKOUN_ROOT:-$(pwd)}:/markoun
```

Markoun will automatically use or create `data/`, `log/`, `welcome.md`, and `config.yaml` under `/markoun`, so individual file and directory mounts are no longer required.

> [!IMPORTANT]
> If you are upgrading from v0.2.2 or earlier, make sure to use the latest deployment command provided in the [README](README.md).
>
> Also, migrate your existing `data/`, `welcome.md`, and `config.yaml` into the new `MARKOUN_ROOT` directory. Otherwise, your existing documents, welcome page, or configuration may not be loaded correctly by the new version.

# Legacy Startup Command

If you are still using **v0.2.2 or earlier**, use the following startup command:

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
