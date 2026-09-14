use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct AppSettings {
    #[serde(rename = "read-only")]
    pub read_only: bool,
    #[serde(rename = "app-theme")]
    pub app_theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            read_only: false,
            app_theme: "system".to_string(),
        }
    }
}

fn is_valid_theme(theme: &str) -> bool {
    matches!(theme, "system" | "light" | "dark")
}

fn get_config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let home = app
        .path()
        .home_dir()
        .or_else(|_| std::env::var("HOME").map(PathBuf::from).map_err(|e| e.to_string()))
        .or_else(|_| std::env::var("USERPROFILE").map(PathBuf::from).map_err(|e| e.to_string()))
        .map_err(|e| format!("Failed to resolve home directory: {}", e))?;
    Ok(home.join(".markdown-workspace.json"))
}

fn read_settings_from_path(config_path: &Path) -> Result<AppSettings, String> {
    if !config_path.exists() {
        let defaults = AppSettings::default();
        let json_str = serde_json::to_string_pretty(&defaults)
            .map_err(|e| format!("Failed to serialize default settings: {}", e))?;
        fs::write(config_path, format!("{}\n", json_str))
            .map_err(|e| format!("Failed to write config file to {:?}: {}", config_path, e))?;
        return Ok(defaults);
    }

    let contents = fs::read_to_string(config_path)
        .map_err(|e| format!("Failed to read config file from {:?}: {}", config_path, e))?;

    let parsed_val: serde_json::Value = serde_json::from_str(&contents).unwrap_or(serde_json::Value::Null);

    let mut needs_repair = false;

    let read_only = match parsed_val.get("read-only") {
        Some(serde_json::Value::Bool(b)) => *b,
        _ => {
            needs_repair = true;
            false
        }
    };

    let app_theme = match parsed_val.get("app-theme") {
        Some(serde_json::Value::String(s)) if is_valid_theme(s) => s.clone(),
        _ => {
            needs_repair = true;
            "system".to_string()
        }
    };

    let settings = AppSettings {
        read_only,
        app_theme,
    };

    if needs_repair {
        let json_str = serde_json::to_string_pretty(&settings)
            .map_err(|e| format!("Failed to serialize repaired settings: {}", e))?;
        let _ = fs::write(config_path, format!("{}\n", json_str));
    }

    Ok(settings)
}

fn save_settings_to_path(config_path: &Path, settings: AppSettings) -> Result<AppSettings, String> {
    if !is_valid_theme(&settings.app_theme) {
        return Err(format!(
            "Invalid 'app-theme': '{}'. Only 'system', 'light', and 'dark' are accepted.",
            settings.app_theme
        ));
    }

    let json_str = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(config_path, format!("{}\n", json_str))
        .map_err(|e| format!("Failed to write settings to {:?}: {}", config_path, e))?;

    Ok(settings)
}

// ============================================================================
// DIRECTORY FILTERING CONFIGURATION
// ============================================================================
// The following directories are skipped during workspace scanning.
// To ignore additional directories in the future (e.g., custom build outputs,
// IDE folders, or vendor caches), simply add their folder names to this array.
// Note: Any directory or file starting with '.' is also ignored automatically.
// ============================================================================
pub const IGNORED_DIRECTORIES: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".cache",
    ".gemini",
    "target",
    "out",
    ".turbo",
    ".vercel",
    ".output",
    "coverage",
    "vendor",
];

// Supported markdown file extensions (case-insensitive)
pub const SUPPORTED_MARKDOWN_EXTENSIONS: &[&str] = &[
    "md",
    "markdown",
    "mdown",
    "mkdn",
];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileSystemNodeDto {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String, // "file" | "folder"
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorkspaceScanResult {
    pub root_name: String,
    pub root_path: String,
    pub file_system: HashMap<String, FileSystemNodeDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CliTarget {
    pub directory_path: String,
    pub file_path: Option<String>,
}

pub fn parse_cli_target(args: &[String]) -> Option<CliTarget> {
    if args.len() < 2 {
        return None;
    }
    let param = args.iter().skip(1).find(|arg| !arg.starts_with('-'))?;
    let path = Path::new(param);

    let abs_path = if path.is_relative() {
        std::env::current_dir().map(|cwd| cwd.join(path)).unwrap_or_else(|_| path.to_path_buf())
    } else {
        path.to_path_buf()
    };

    let canonical = fs::canonicalize(&abs_path).ok()?;

    if canonical.is_dir() {
        Some(CliTarget {
            directory_path: canonical.to_string_lossy().to_string(),
            file_path: None,
        })
    } else if canonical.is_file() {
        let parent = canonical.parent()?;
        Some(CliTarget {
            directory_path: parent.to_string_lossy().to_string(),
            file_path: Some(canonical.to_string_lossy().to_string()),
        })
    } else {
        None
    }
}

fn should_ignore_entry(name: &str) -> bool {
    if name.starts_with('.') {
        return true;
    }
    IGNORED_DIRECTORIES.iter().any(|&ignored| ignored.eq_ignore_ascii_case(name))
}

fn is_markdown_file(path: &Path) -> bool {
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        let ext_lower = ext.to_ascii_lowercase();
        SUPPORTED_MARKDOWN_EXTENSIONS.contains(&ext_lower.as_str())
    } else {
        false
    }
}

fn generate_node_id(path: &Path) -> String {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    path.to_string_lossy().hash(&mut hasher);
    let hash_val = hasher.finish();
    let safe_name = path
        .file_name()
        .map(|n| n.to_string_lossy().replace(|c: char| !c.is_alphanumeric() && c != '_', "_"))
        .unwrap_or_else(|| "item".to_string());
    format!("node_{}_{:x}", safe_name, hash_val)
}

fn scan_dir_recursive(
    dir_path: &Path,
    nodes: &mut HashMap<String, FileSystemNodeDto>,
) -> Result<Vec<String>, String> {
    let mut entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory {:?}: {}", dir_path, e))?
        .filter_map(Result::ok)
        .collect::<Vec<_>>();

    // Sort entries: folders first, then alphabetical by name
    entries.sort_by(|a, b| {
        let is_dir_a = a.path().is_dir();
        let is_dir_b = b.path().is_dir();
        if is_dir_a != is_dir_b {
            return is_dir_b.cmp(&is_dir_a);
        }
        a.file_name().cmp(&b.file_name())
    });

    let mut children_ids = Vec::new();

    for entry in entries {
        let entry_path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if should_ignore_entry(&file_name) {
            continue;
        }

        let node_id = generate_node_id(&entry_path);
        let path_str = entry_path.to_string_lossy().to_string();

        if entry_path.is_dir() {
            let sub_children = scan_dir_recursive(&entry_path, nodes)?;
            let folder_node = FileSystemNodeDto {
                id: node_id.clone(),
                name: file_name,
                node_type: "folder".to_string(),
                path: path_str,
                children: Some(sub_children),
                content: None,
            };
            nodes.insert(node_id.clone(), folder_node);
            children_ids.push(node_id);
        } else if is_markdown_file(&entry_path) {
            let content = match fs::metadata(&entry_path) {
                Ok(meta) if meta.len() < 1024 * 1024 => fs::read_to_string(&entry_path).ok(),
                _ => None,
            };

            let file_node = FileSystemNodeDto {
                id: node_id.clone(),
                name: file_name,
                node_type: "file".to_string(),
                path: path_str,
                children: None,
                content,
            };
            nodes.insert(node_id.clone(), file_node);
            children_ids.push(node_id);
        }
    }

    Ok(children_ids)
}

fn scan_workspace_directory_internal(dir_path: &Path) -> Result<WorkspaceScanResult, String> {
    if !dir_path.exists() || !dir_path.is_dir() {
        return Err(format!("Path '{:?}' is not a valid directory", dir_path));
    }

    let root_path_str = dir_path.to_string_lossy().to_string();
    let root_name = dir_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Workspace".to_string());

    let mut file_system: HashMap<String, FileSystemNodeDto> = HashMap::new();

    let root_children = scan_dir_recursive(dir_path, &mut file_system)?;

    let root_node = FileSystemNodeDto {
        id: "root".to_string(),
        name: root_name.clone(),
        node_type: "folder".to_string(),
        path: root_path_str.clone(),
        children: Some(root_children),
        content: None,
    };

    file_system.insert("root".to_string(), root_node);

    Ok(WorkspaceScanResult {
        root_name,
        root_path: root_path_str,
        file_system,
    })
}

#[tauri::command]
fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let config_path = get_config_path(&app)?;
    read_settings_from_path(&config_path)
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    let config_path = get_config_path(&app)?;
    save_settings_to_path(&config_path, settings)
}

#[tauri::command]
async fn open_directory_dialog() -> Result<Option<String>, String> {
    let folder = tauri::async_runtime::spawn_blocking(|| {
        rfd::FileDialog::new()
            .set_title("Open Workspace Directory")
            .pick_folder()
    })
    .await
    .map_err(|e| e.to_string())?;

    Ok(folder.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn scan_workspace_directory(directory_path: String) -> Result<WorkspaceScanResult, String> {
    let path = Path::new(&directory_path);
    scan_workspace_directory_internal(path)
}

#[tauri::command]
fn read_file_content(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {}", file_path));
    }
    fs::read_to_string(path).map_err(|e| format!("Failed to read file '{}': {}", file_path, e))
}

#[tauri::command]
fn write_file_content(file_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }
    fs::write(path, content).map_err(|e| format!("Failed to write file '{}': {}", file_path, e))
}

#[tauri::command]
fn create_file_entry(
    parent_path: String,
    mut name: String,
    initial_content: Option<String>,
) -> Result<FileSystemNodeDto, String> {
    if !name.ends_with(".md") {
        name.push_str(".md");
    }
    let parent = Path::new(&parent_path);
    if !parent.exists() {
        return Err(format!("Parent directory does not exist: {}", parent_path));
    }
    let target_path = parent.join(&name);
    let content_to_write = initial_content.unwrap_or_else(|| {
        format!("# {}\n\nHover here and click the pencil to edit this block!", name.trim_end_matches(".md"))
    });
    fs::write(&target_path, &content_to_write)
        .map_err(|e| format!("Failed to create file {:?}: {}", target_path, e))?;

    let node_id = generate_node_id(&target_path);
    Ok(FileSystemNodeDto {
        id: node_id,
        name,
        node_type: "file".to_string(),
        path: target_path.to_string_lossy().to_string(),
        children: None,
        content: Some(content_to_write),
    })
}

#[tauri::command]
fn create_folder_entry(parent_path: String, name: String) -> Result<FileSystemNodeDto, String> {
    let parent = Path::new(&parent_path);
    if !parent.exists() {
        return Err(format!("Parent directory does not exist: {}", parent_path));
    }
    let target_path = parent.join(&name);
    fs::create_dir_all(&target_path)
        .map_err(|e| format!("Failed to create folder {:?}: {}", target_path, e))?;

    let node_id = generate_node_id(&target_path);
    Ok(FileSystemNodeDto {
        id: node_id,
        name,
        node_type: "folder".to_string(),
        path: target_path.to_string_lossy().to_string(),
        children: Some(Vec::new()),
        content: None,
    })
}

#[tauri::command]
fn rename_entry(old_path: String, new_name: String) -> Result<FileSystemNodeDto, String> {
    let source = Path::new(&old_path);
    if !source.exists() {
        return Err(format!("Path does not exist: {}", old_path));
    }
    let parent = source.parent().ok_or_else(|| "Cannot rename root directory".to_string())?;

    let is_dir = source.is_dir();
    let mut final_name = new_name.trim().to_string();
    if !is_dir && !final_name.ends_with(".md") {
        final_name.push_str(".md");
    }

    let dest = parent.join(&final_name);
    fs::rename(source, &dest).map_err(|e| format!("Failed to rename from {:?} to {:?}: {}", source, dest, e))?;

    let node_id = generate_node_id(&dest);
    let content = if !is_dir {
        fs::read_to_string(&dest).ok()
    } else {
        None
    };

    Ok(FileSystemNodeDto {
        id: node_id,
        name: final_name,
        node_type: if is_dir { "folder" } else { "file" }.to_string(),
        path: dest.to_string_lossy().to_string(),
        children: if is_dir { Some(Vec::new()) } else { None },
        content,
    })
}

#[tauri::command]
fn delete_entry(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Ok(());
    }
    if target.is_dir() {
        fs::remove_dir_all(target).map_err(|e| format!("Failed to delete directory {:?}: {}", target, e))?;
    } else {
        fs::remove_file(target).map_err(|e| format!("Failed to delete file {:?}: {}", target, e))?;
    }
    Ok(())
}

#[tauri::command]
fn get_cli_target() -> Option<CliTarget> {
    let args: Vec<String> = std::env::args().collect();
    parse_cli_target(&args)
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    let ver = app.package_info().version.to_string();
    if !ver.is_empty() {
        format!("v{}", ver)
    } else {
        format!("v{}", env!("CARGO_PKG_VERSION"))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            open_directory_dialog,
            scan_workspace_directory,
            read_file_content,
            write_file_content,
            create_file_entry,
            create_folder_entry,
            rename_entry,
            delete_entry,
            get_cli_target,
            get_app_version,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_creates_default_file_when_not_existing() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_md_ws_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let config_path = temp_dir.join(".markdown-workspace.json");

        assert!(!config_path.exists());
        let settings = read_settings_from_path(&config_path).unwrap();

        assert_eq!(settings, AppSettings::default());
        assert_eq!(settings.read_only, false);
        assert_eq!(settings.app_theme, "system");
        assert!(config_path.exists());

        let file_contents = fs::read_to_string(&config_path).unwrap();
        let expected_json = serde_json::to_string_pretty(&AppSettings::default()).unwrap();
        assert_eq!(file_contents.trim(), expected_json.trim());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_reads_existing_valid_settings() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_md_ws_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let config_path = temp_dir.join(".markdown-workspace.json");

        let custom = AppSettings {
            read_only: true,
            app_theme: "dark".to_string(),
        };
        save_settings_to_path(&config_path, custom.clone()).unwrap();

        let loaded = read_settings_from_path(&config_path).unwrap();
        assert_eq!(loaded, custom);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_repairs_corrupted_settings() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_md_ws_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let config_path = temp_dir.join(".markdown-workspace.json");

        let corrupted = r#"{ "read-only": "not-a-bool", "app-theme": "invalid-theme" }"#;
        fs::write(&config_path, corrupted).unwrap();

        let loaded = read_settings_from_path(&config_path).unwrap();
        assert_eq!(loaded.read_only, false);
        assert_eq!(loaded.app_theme, "system");

        let repaired_str = fs::read_to_string(&config_path).unwrap();
        let repaired_val: AppSettings = serde_json::from_str(&repaired_str).unwrap();
        assert_eq!(repaired_val, AppSettings::default());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_rejects_invalid_save() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_md_ws_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let config_path = temp_dir.join(".markdown-workspace.json");

        let invalid = AppSettings {
            read_only: false,
            app_theme: "purple".to_string(),
        };
        let result = save_settings_to_path(&config_path, invalid);
        assert!(result.is_err());
        assert!(!config_path.exists());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_scan_workspace_directory() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_md_scan_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        // Create sample structure
        fs::write(temp_dir.join("README.md"), "# Readme").unwrap();
        let docs_dir = temp_dir.join("docs");
        fs::create_dir_all(&docs_dir).unwrap();
        fs::write(docs_dir.join("guide.md"), "# Guide").unwrap();
        fs::write(docs_dir.join("notes.markdown"), "# Notes").unwrap();

        // Ignored folders and files
        let git_dir = temp_dir.join(".git");
        fs::create_dir_all(&git_dir).unwrap();
        fs::write(git_dir.join("config"), "git config").unwrap();

        let nm_dir = temp_dir.join("node_modules");
        fs::create_dir_all(&nm_dir).unwrap();
        fs::write(nm_dir.join("package.json"), "{}").unwrap();

        // Non-markdown file
        fs::write(temp_dir.join("photo.jpg"), "image bytes").unwrap();

        let scan_res = scan_workspace_directory_internal(&temp_dir).unwrap();

        // Root exists
        assert!(scan_res.file_system.contains_key("root"));
        let root = &scan_res.file_system["root"];
        assert_eq!(root.node_type, "folder");
        let root_children = root.children.as_ref().unwrap();

        // Root should contain docs and README.md, but NOT .git, node_modules, photo.jpg
        assert_eq!(root_children.len(), 2);

        // Docs folder should contain 2 markdown files
        let docs_node = scan_res.file_system.values().find(|n| n.name == "docs").unwrap();
        assert_eq!(docs_node.node_type, "folder");
        let docs_children = docs_node.children.as_ref().unwrap();
        assert_eq!(docs_children.len(), 2);

        // Verify README content read
        let readme_node = scan_res.file_system.values().find(|n| n.name == "README.md").unwrap();
        assert_eq!(readme_node.content.as_deref(), Some("# Readme"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_file_read_write_crud() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_md_crud_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        // Test create_file_entry
        let created_file = create_file_entry(
            temp_dir.to_string_lossy().to_string(),
            "Doc".to_string(),
            Some("# My Doc".to_string()),
        )
        .unwrap();
        assert_eq!(created_file.name, "Doc.md");
        assert!(Path::new(&created_file.path).exists());

        // Test read_file_content
        let read_back = read_file_content(created_file.path.clone()).unwrap();
        assert_eq!(read_back, "# My Doc");

        // Test write_file_content
        write_file_content(created_file.path.clone(), "# Updated Doc Content".to_string()).unwrap();
        let read_updated = read_file_content(created_file.path.clone()).unwrap();
        assert_eq!(read_updated, "# Updated Doc Content");

        // Test rename_entry
        let renamed = rename_entry(created_file.path.clone(), "NewDocName".to_string()).unwrap();
        assert_eq!(renamed.name, "NewDocName.md");
        assert!(Path::new(&renamed.path).exists());
        assert!(!Path::new(&created_file.path).exists());

        // Test create_folder_entry
        let created_folder = create_folder_entry(
            temp_dir.to_string_lossy().to_string(),
            "SubFolder".to_string(),
        )
        .unwrap();
        assert_eq!(created_folder.name, "SubFolder");
        assert!(Path::new(&created_folder.path).is_dir());

        // Test delete_entry
        delete_entry(renamed.path.clone()).unwrap();
        assert!(!Path::new(&renamed.path).exists());

        delete_entry(created_folder.path.clone()).unwrap();
        assert!(!Path::new(&created_folder.path).exists());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_parse_cli_target_directory() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_cli_dir_{}",
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        let canonical_dir = fs::canonicalize(&temp_dir).unwrap();
        let args = vec!["app".to_string(), temp_dir.to_string_lossy().to_string()];
        let target = parse_cli_target(&args).unwrap();

        assert_eq!(target.directory_path, canonical_dir.to_string_lossy().to_string());
        assert_eq!(target.file_path, None);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_parse_cli_target_file() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_cli_file_{}",
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let test_file = temp_dir.join("test.md");
        fs::write(&test_file, "# Test").unwrap();

        let canonical_file = fs::canonicalize(&test_file).unwrap();
        let canonical_parent = canonical_file.parent().unwrap();

        let args = vec!["app".to_string(), test_file.to_string_lossy().to_string()];
        let target = parse_cli_target(&args).unwrap();

        assert_eq!(target.directory_path, canonical_parent.to_string_lossy().to_string());
        assert_eq!(target.file_path, Some(canonical_file.to_string_lossy().to_string()));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_parse_cli_target_nonexistent() {
        let args = vec!["app".to_string(), "/this/path/does/not/exist/12345.md".to_string()];
        assert_eq!(parse_cli_target(&args), None);
    }

    #[test]
    fn test_parse_cli_target_empty() {
        let args = vec!["app".to_string()];
        assert_eq!(parse_cli_target(&args), None);
    }
}
