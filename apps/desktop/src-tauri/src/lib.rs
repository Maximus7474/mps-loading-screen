use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FilePath};

/// The bundled FiveM resource template. Resolved relative to this crate once,
/// at compile time, using the monorepo layout (`apps/desktop/../../apps/...`).
fn default_resource_dir() -> Result<PathBuf, String> {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for ancestor in manifest.ancestors() {
        let candidate = ancestor.join("fivem-resource");
        if candidate.join("package.json").is_file() && candidate.join("resource").is_dir() {
            return candidate
                .canonicalize()
                .map_err(|e| format!("Cannot resolve resource template: {e}"));
        }
    }
    Err("Cannot resolve resource template: no `fivem-resource` package was found in the repository layout. Run `bun install` in the repo root first.".to_string())
}

#[derive(Deserialize)]
struct GeneratedFiles {
    #[serde(rename = "load.html")]
    load_html: String,
    #[serde(rename = "config.json")]
    config_json: String,
}

#[derive(Serialize)]
struct ResourceMetaInfo {
    name: String,
    author: String,
    version: String,
}

#[derive(Serialize)]
struct ExportResult {
    zip_path: String,
    resource_dir: String,
}

/// Identity of the bundled resource, read from `apps/fivem-resource/package.json`.
fn load_resource_meta(resource_dir: &Path) -> Result<ResourceMetaInfo, String> {
    let raw = fs::read_to_string(resource_dir.join("package.json")).map_err(|e| e.to_string())?;
    let pkg: serde_json::Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    let name = pkg["name"]
        .as_str()
        .unwrap_or("loadscreen-resource")
        .to_string();
    let version = pkg["version"].as_str().unwrap_or("0.0.0").to_string();
    let author = pkg["author"]["name"]
        .as_str()
        .or_else(|| pkg["author"].as_str())
        .unwrap_or("")
        .to_string();
    Ok(ResourceMetaInfo {
        name,
        author,
        version,
    })
}

/** The resource folder name used in the exported zip (the `ensure` name).
 *  The resource template's package.json keeps its own display `name`; FiveM
 *  only cares about this folder name, so keep this in sync with where you
 *  actually host the resource (`resources/<this>/`). */
const RESOURCE_NAME: &str = "mps-loading-screen";

fn fp_to_path(fp: &FilePath) -> Option<PathBuf> {
    match fp {
        FilePath::Path(path) => Some(path.clone()),
        FilePath::Url(_) => None,
    }
}

#[tauri::command]
fn save_project(path: String, config_json: String) -> Result<(), String> {
    fs::write(&path, config_json).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_project(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn resource_meta() -> Result<ResourceMetaInfo, String> {
    let resource_dir = default_resource_dir()?;
    load_resource_meta(&resource_dir)
}

#[tauri::command]
fn open_project_dialog(app: AppHandle) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("Loading Screen project", &["loadscreen", "json"])
        .blocking_pick_file();
    Ok(file.and_then(|fp| fp_to_path(&fp).map(|p| p.to_string_lossy().into_owned())))
}

#[tauri::command]
fn save_project_dialog(
    app: AppHandle,
    default_name: Option<String>,
) -> Result<Option<String>, String> {
    let name = default_name.unwrap_or_else(|| "loading-screen.loadscreen".to_string());
    let file = app
        .dialog()
        .file()
        .set_file_name(&name)
        .add_filter("Loading Screen project", &["loadscreen"])
        .blocking_save_file();
    Ok(file.and_then(|fp| fp_to_path(&fp).map(|p| p.to_string_lossy().into_owned())))
}

#[tauri::command]
fn export_resource(app: AppHandle, files: GeneratedFiles) -> Result<ExportResult, String> {
    let resource_dir = default_resource_dir()?;
    let public_dir = resource_dir.join("public");
    fs::create_dir_all(&public_dir).map_err(|e| e.to_string())?;
    fs::write(public_dir.join("load.html"), &files.load_html).map_err(|e| e.to_string())?;
    fs::write(public_dir.join("config.json"), &files.config_json).map_err(|e| e.to_string())?;

    // Rebuild the resource (tsdown bundles server/client TS → dist/server.js,
    // postBuild emits fxmanifest.lua and copies public/ into dist/).
    let build = std::process::Command::new("bun")
        .current_dir(&resource_dir)
        .args(["run", "build"])
        .output()
        .map_err(|e| format!("Failed to start `bun run build`: {e}"))?;
    if !build.status.success() {
        let stderr = String::from_utf8_lossy(&build.stderr);
        let stdout = String::from_utf8_lossy(&build.stdout);
        return Err(format!("`bun run build` failed:\n{stdout}\n{stderr}"));
    }

    let dist = resource_dir.join("dist");
    if !dist.is_dir() {
        return Err(format!("Build did not produce `{}`", dist.display()));
    }

    let Some(zip_path) = save_zip_dialog(&app, RESOURCE_NAME)? else {
        return Err("Export cancelled.".to_string());
    };

    create_resource_zip(&resource_dir, &zip_path, RESOURCE_NAME)?;

    Ok(ExportResult {
        zip_path: zip_path.to_string_lossy().into_owned(),
        resource_dir: resource_dir.to_string_lossy().into_owned(),
    })
}

fn save_zip_dialog(app: &AppHandle, resource_name: &str) -> Result<Option<PathBuf>, String> {
    let file = app
        .dialog()
        .file()
        .set_file_name(&format!("{resource_name}.zip"))
        .add_filter("ZIP archive", &["zip"])
        .blocking_save_file();
    Ok(file.and_then(|fp| fp_to_path(&fp)).map(|mut p| {
        if p.extension().is_none() {
            p.set_extension("zip");
        }
        p
    }))
}
/// Rebuild the deployable resource folder (`fxmanifest.lua` + `dist/**` +
/// `locales/**`) from the resource template root, nesting it under
/// `resource_name/` so unzipping straight into `resources/` yields a working
/// `resources/<name>/` that can be `ensure`d. Everything else in the template
/// (TS sources, build config, `node_modules`, …) is excluded.
fn create_resource_zip(
    resource_dir: &Path,
    target: &Path,
    resource_name: &str,
) -> Result<(), String> {
    let out = fs::File::create(target).map_err(|e| format!("Cannot write zip: {e}"))?;
    let mut writer = zip::ZipWriter::new(io::BufWriter::new(out));
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    writer
        .add_directory(resource_name, options)
        .map_err(|e| e.to_string())?;

    fn should_include(rel: &str) -> bool {
        rel == "fxmanifest.lua" || rel.starts_with("dist/") || rel.starts_with("locales/")
    }
    fn should_descend(dir: &str) -> bool {
        dir == "dist" || dir == "locales"
    }

    let mut stack: Vec<PathBuf> = vec![resource_dir.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
        for entry in entries.flatten() {
            let path = entry.path();
            let rel = path
                .strip_prefix(resource_dir)
                .map_err(|_| "bad path".to_string())?;
            let rel_str = rel.to_string_lossy().replace('\\', "/");

            if path.is_dir() {
                if should_descend(&rel_str) {
                    let name = format!("{}/{}", resource_name, rel_str);
                    writer
                        .add_directory(&name, options)
                        .map_err(|e| e.to_string())?;
                    stack.push(path);
                }
            } else if should_include(&rel_str) {
                let name = format!("{}/{}", resource_name, rel_str);
                let contents = fs::read(&path).map_err(|e| e.to_string())?;
                writer
                    .start_file(&name, options)
                    .map_err(|e| e.to_string())?;
                writer.write_all(&contents).map_err(|e| e.to_string())?;
            }
        }
    }

    writer.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_bundled_resource_template() {
        let dir = default_resource_dir()
            .expect("default_resource_dir should resolve apps/fivem-resource");
        assert!(
            dir.join("resource/server").is_dir(),
            "resolved {} but it has no resource/server",
            dir.display()
        );
    }
    #[test]
    fn zips_deployable_resource_layout() {
        let resource = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("fivem-resource");
        let target = std::env::temp_dir().join("loadscreen-export-test.zip");
        create_resource_zip(&resource, &target, "nightfall-rp").expect("zip should build");

        let file = std::fs::File::open(&target).expect("open zip");
        let archive = zip::ZipArchive::new(file).expect("read zip");
        let names: Vec<String> = archive.file_names().map(String::from).collect();

        assert!(
            names.contains(&"nightfall-rp/fxmanifest.lua".to_string()),
            "fxmanifest must be included, got {names:?}"
        );
        assert!(
            names.contains(&"nightfall-rp/dist/server.js".to_string()),
            "dist/server.js must be included, got {names:?}"
        );
        assert!(
            names.contains(&"nightfall-rp/dist/load.html".to_string()),
            "dist/load.html must be included, got {names:?}"
        );
        assert!(
            names.iter().any(|n| n.starts_with("nightfall-rp/locales/")),
            "locales must be included, got {names:?}"
        );
        assert!(
            !names
                .iter()
                .any(|n| n.contains("node_modules") || n.ends_with("package.json")),
            "build sources must be excluded, got {names:?}"
        );
        assert_eq!(names.len(), archive.len());

        let _ = std::fs::remove_file(&target);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_project,
            load_project,
            resource_meta,
            open_project_dialog,
            save_project_dialog,
            export_resource
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
