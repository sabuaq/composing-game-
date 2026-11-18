' Launch the app (electron.exe has no console window, so a normal window style is fine)
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
exe = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\SakkyokuRenshuGame\runtime\node_modules\electron\dist\electron.exe"
If Not fso.FileExists(exe) Then
  sh.Run "powershell -NoProfile -ExecutionPolicy Bypass -File """ & here & "\setup.ps1""", 1, True
End If
sh.Run """" & exe & """ """ & here & "\app""", 1, False
