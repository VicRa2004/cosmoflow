#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif
#ifndef AppArch
  #define AppArch "x64"
#endif
#ifndef ExePath
  #define ExePath "..\dist\windows\cosmoflow.exe"
#endif
#ifndef IconPath
  #define IconPath "..\icons\icon.ico"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist"
#endif

[Setup]
AppId=com.cosmoflow.desktop
AppName=Cosmoflow
AppVersion={#AppVersion}
AppPublisher=Cosmoflow
DefaultDirName={autopf}\Cosmoflow
DefaultGroupName=Cosmoflow
SetupIconFile={#IconPath}
UninstallDisplayIcon={app}\cosmoflow.exe
OutputDir={#OutputDir}
OutputBaseFilename=cosmoflow-{#AppVersion}-windows-{#AppArch}-setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#ExePath}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Cosmoflow"; Filename: "{app}\cosmoflow.exe"
Name: "{autodesktop}\Cosmoflow"; Filename: "{app}\cosmoflow.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\cosmoflow.exe"; Description: "{cm:LaunchProgram,Cosmoflow}"; Flags: nowait postinstall skipifsilent
; Actualización automática (la app lanza el instalador con /VERYSILENT): reabrirla al terminar.
Filename: "{app}\cosmoflow.exe"; Flags: nowait; Check: WizardSilent
