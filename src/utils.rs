use std::{env, path::PathBuf};

pub fn get_program_path() -> PathBuf {
    env::current_exe()
        .expect("Failed to get current executable path")
        .canonicalize()
        .expect("Failed to canonicalize path")
}

pub fn get_program_folder() -> PathBuf {
    get_program_path()
        .parent()
        .expect("The program has no parent folder.")
        .to_path_buf()
}

pub fn add_program_folder_to_path() -> anyhow::Result<()> {
    let mut path = env::var("PATH")?;
    let program_folder = get_program_folder();
    let program_folder = program_folder
        .to_str()
        .ok_or(anyhow::anyhow!("Failed to convert path to string"))?;

    #[cfg(target_os = "linux")]
    path.push(':');

    #[cfg(target_os = "windows")]
    path.push(';');

    // Append the directory of the executable to the PATH
    path.push_str(program_folder);
    // Set the new PATH
    env::set_var("PATH", path);

    log::debug!("Executable directory added to PATH: {}", program_folder);
    Ok(())
}

#[cfg(target_os = "windows")]
const REG_KEY_NAME: &str = "Xidian WLAN Login";

#[cfg(target_os = "windows")]
pub fn is_autostart() -> bool {
    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    let reg = hkcu.open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run");
    if reg.is_err() {
        return false;
    }

    let path: Result<String, _> = reg.unwrap().get_value(REG_KEY_NAME);
    if path.is_err() {
        return false;
    }

    if path.unwrap() == get_program_path().to_str().unwrap() {
        return true;
    } else {
        return false;
    }
}

#[cfg(target_os = "windows")]
pub fn toggle_autostart() -> anyhow::Result<bool> {
    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    let (reg, _) = hkcu.create_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run")?;
    let current_status = is_autostart();
    if current_status {
        reg.delete_value(REG_KEY_NAME)?;
        log::debug!("Disabled autostart.")
    } else {
        reg.set_value(REG_KEY_NAME, &get_program_path().to_str().unwrap())?;
        log::debug!("Enabled autostart.")
    }

    Ok(!current_status)
}
