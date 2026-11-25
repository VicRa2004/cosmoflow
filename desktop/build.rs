use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=icons/icon.ico");

    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows") {
        return;
    }

    if let Err(mensaje) = embeber_icono_windows() {
        println!("cargo:warning=No se pudo embeber icons/icon.ico en cosmoflow.exe: {mensaje}");
    }
}

fn embeber_icono_windows() -> Result<(), String> {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .map_err(|_| "falta CARGO_MANIFEST_DIR".to_string())?;
    let out_dir = std::env::var("OUT_DIR")
        .map(PathBuf::from)
        .map_err(|_| "falta OUT_DIR".to_string())?;

    let icono = manifest_dir.join("icons").join("icon.ico");
    if !icono.is_file() {
        return Err(format!("no existe {}", icono.display()));
    }

    let rc_path = out_dir.join("icono.rc");
    let res_path = out_dir.join("icono.res");
    let ruta_icono = icono.to_string_lossy().replace('\\', "/");
    std::fs::write(&rc_path, format!("1 ICON \"{ruta_icono}\"\n"))
        .map_err(|e| format!("error al escribir {}: {e}", rc_path.display()))?;

    let rc_exe = buscar_rc_exe().ok_or_else(|| "no se encontró rc.exe".to_string())?;
    let estado = Command::new(&rc_exe)
        .arg("/nologo")
        .arg("/fo")
        .arg(&res_path)
        .arg(&rc_path)
        .status()
        .map_err(|e| format!("no se pudo ejecutar {}: {e}", rc_exe.display()))?;

    if !estado.success() {
        return Err(format!("rc.exe terminó con estado {estado}"));
    }

    println!("cargo:rustc-link-arg-bin=cosmoflow={}", res_path.display());
    Ok(())
}

fn buscar_rc_exe() -> Option<PathBuf> {
    if let Some(paths) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&paths) {
            let candidato = dir.join("rc.exe");
            if candidato.is_file() {
                return Some(candidato);
            }
        }
    }

    let program_files_x86 = std::env::var_os("ProgramFiles(x86)")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(r"C:\Program Files (x86)"));
    let kits_bin = program_files_x86
        .join("Windows Kits")
        .join("10")
        .join("bin");
    buscar_rc_en_kits(&kits_bin)
}

fn buscar_rc_en_kits(kits_bin: &Path) -> Option<PathBuf> {
    let entradas = std::fs::read_dir(kits_bin).ok()?;
    let mut candidatos: Vec<(String, PathBuf)> = entradas
        .filter_map(|entrada| {
            let entrada = entrada.ok()?;
            let ruta = entrada.path();
            if !ruta.is_dir() {
                return None;
            }
            let rc = ruta.join("x64").join("rc.exe");
            rc.is_file()
                .then(|| (entrada.file_name().to_string_lossy().into_owned(), rc))
        })
        .collect();

    candidatos.sort_by(|a, b| b.0.cmp(&a.0));
    candidatos.into_iter().next().map(|(_, ruta)| ruta)
}
