config_home="${XDG_CONFIG_HOME:-$HOME/.config}/markoun"
data_home="${XDG_DATA_HOME:-$HOME/.local/share}/markoun"
state_home="${XDG_STATE_HOME:-$HOME/.local/state}/markoun"

export MARKOUN_CONFIG_FILE="${MARKOUN_CONFIG_FILE:-$config_home/config.yaml}"
export DOCUMENT_ROOT="${DOCUMENT_ROOT:-$data_home/data}"
export WELCOME_NOTE_PATH="${WELCOME_NOTE_PATH:-$data_home/welcome.md}"
export SQL_DATABASE_URI="${SQL_DATABASE_URI:-sqlite+aiosqlite:///$data_home/database.db}"
export LOG_ROOT="${LOG_ROOT:-$state_home/log}"

unset config_home data_home state_home
