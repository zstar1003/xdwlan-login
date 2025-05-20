# Xidian WLAN Login

<h4>
<a href="README.md">🇨🇳 中文</a>
<span> | </span>
<a href="README_EN.md">🇬🇧 English</a>
</h4>

Xidian Campus Network Login Assistant using Web Portal authentication. It can run in the background to maintain a network connection and supports automatic reconnection and auto-start on boot.

## How It Works

This program [simulates browser login behavior](https://github.com/silverling/xdwlan-login/blob/main/src/js/login.ts). In theory, as long as your device can access the login page, you can use this program for automatic login.

Authentication principle:

- When your device loses internet connection, any HTTP request will be redirected by the gateway to `http://w.xidian.edu.cn`, prompting the user to log in.
- The program will automatically detect network disconnection and, upon redirection, will fill in your student ID and password to log in.

Compared to [reversing JavaScript logic](https://github.com/silverling/srun-login/), this method is more robust and easier to maintain.

## Instructions

### Windows

- Download the zip file from the [Release](https://github.com/silverling/xdwlan-login/releases) page and unzip it.
- Modify `config.yaml` and fill in your student ID and password.
- Run `xdwlan-login.exe`. (The program will run in the background with a buttock icon in the system tray.)
- (Optional) Right-click the tray icon and select “AutoStart” to enable auto-start on boot.

### Linux

1. Method 1: One-click script installation

```bash
curl -sSL https://github.com/silverling/xdwlan-login/raw/refs/heads/main/scripts/install.sh | bash
```

Note: This script installs the program to the `/opt/xdwlan-login` directory and creates a symbolic link at `/usr/local/bin/xdwlan-login`.

Note: If you cannot access GitHub and the download fails, you can manually download [`install.sh`](https://github.com/silverling/xdwlan-login/raw/refs/heads/main/scripts/install.sh) and [`xdwlan-login-x86_64-unknown-linux-gnu.tar.xz`](https://github.com/silverling/xdwlan-login/releases/latest/download/xdwlan-login-x86_64-unknown-linux-gnu.tar.xz) to the same directory, then run:

```bash
bash ./install.sh xdwlan-login-x86_64-unknown-linux-gnu.tar.xz
```

2. Method 2: Manual installation

   - Download and extract:

     ```bash
     curl -sSL https://github.com/silverling/xdwlan-login/releases/latest/download/xdwlan-login-x86_64-unknown-linux-gnu.tar.xz -O xdwlan-login.tar.xz
     tar -xf xdwlan-login.tar.xz
     ```

3. Create the configuration file `~/.config/xdwlan-login/config.yaml` with the following content:

   ```yaml
   username: "your_student_id"
   password: "your_password"
   ```

4. Run the program in one of the following modes:

   - `xdwlan-login --oneshot`: Log into the campus network and exit.
   - `xdwlan-login`: Log in and continuously monitor network status, auto-reconnecting if disconnected.
   - `sudo systemctl enable --now xdwlan-login.service`: Enable on boot, monitor and auto-reconnect.

Note:

- If you encounter problems, check the `log.txt` file in the same directory (you can set the `RUST_LOG` environment variable to adjust log level), and report issues on the [Issue](https://github.com/silverling/xdwlan-login/issues) page.

### Build from Source

If you want to test or modify the program, clone this repository and build it yourself.

```bash
git clone https://github.com/silverling/xdwlan-login.git
cd xdwlan-login

# Windows
cargo build --release --target x86_64-pc-windows-msvc
deno install
deno task bundle
deno task compile:windows
cp .\build\xdwlan-login-worker.exe .\target\x86_64-pc-windows-msvc\release\

# Linux
cargo build --release --target x86_64-unknown-linux-gnu
deno install
deno task bundle
deno task compile:linux
cp ./build/xdwlan-login-worker ./target/x86_64-unknown-linux-gnu/release/
```

Create a `config.yaml` file in the same directory with login information:

```yaml
username: "23000000000"
password: "xxxxxxxxxxx"
```

Run the program. (On Windows, it will run in the system tray background.)