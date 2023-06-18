import {app, BrowserWindow, dialog, globalShortcut, ipcMain, shell} from "electron"
import Store from "electron-store"
import {autoUpdater} from "electron-updater"
import sharp from "sharp"
import fs from "fs"
import path from "path"
import process from "process"
import "./dev-app-update.yml"
import pack from "./package.json"
import functions from "./structures/Functions"
import child_process from "child_process"
import util from "util"
import electronDL from "electron-dl"
let writeLocation = path.join(app.getAppPath(), "../../scripts/output.txt")
if (!fs.existsSync(writeLocation)) writeLocation = "./scripts/output.txt"
let tempImgLocation = path.join(app.getAppPath(), "../../scripts/temp.png")
if (!fs.existsSync(tempImgLocation)) tempImgLocation = "./scripts/temp.png"
let networkRandomizerScript = path.join(app.getAppPath(), "../../scripts/networkrandomizer.py")
if (!fs.existsSync(networkRandomizerScript)) networkRandomizerScript = "./scripts/networkrandomizer.py"
let networkShifterScript = path.join(app.getAppPath(), "../../scripts/networkshifter.py")
if (!fs.existsSync(networkShifterScript)) networkShifterScript = "./scripts/networkshifter.py"
let invisibleWatermarkScript = path.join(app.getAppPath(), "../../scripts/invisiblewatermark.py")
if (!fs.existsSync(invisibleWatermarkScript)) invisibleWatermarkScript = "./scripts/invisiblewatermark.py"
let clipBreakerScript = path.join(app.getAppPath(), "../../scripts/run_clipbreaker.py")
if (!fs.existsSync(clipBreakerScript)) clipBreakerScript = "./scripts/run_clipbreaker.py"

electronDL({openFolderWhenDone: true, showBadge: false})

require("@electron/remote/main").initialize()
process.setMaxListeners(0)
let window: Electron.BrowserWindow | null
autoUpdater.autoDownload = false
const store = new Store()
ipcMain.handle("init-settings", () => {
  return store.get("settings", null)
})

ipcMain.handle("clipbreaker-predict", async (event, base64: string, models: string[]) => {
  fs.writeFileSync(tempImgLocation, functions.base64ToBuffer(base64))
  let modelStr = ""
  if (models.includes("deepdanbooru")) modelStr += "-d "
  if (models.includes("wdtagger")) modelStr += "-w "
  if (models.includes("blip")) modelStr += "-b "
  try {
    if (process.platform === "darwin") {
      child_process.execSync(`PYTORCH_ENABLE_MPS_FALLBACK=1 /usr/local/bin/python3 "${clipBreakerScript}" -m "predict" -i "${tempImgLocation}" -o "${writeLocation}" ${modelStr}`)
    } else {
      child_process.execSync(`python3 "${clipBreakerScript}" -m "predict" -i "${tempImgLocation}" -o "${writeLocation}" ${modelStr}`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
  return fs.readFileSync(writeLocation).toString()
})

ipcMain.handle("clipbreaker-attack", async (event, input: string, models: string[], attack: string, epsilon: string) => {
  let modelStr = ""
  if (models.includes("deepdanbooru")) modelStr += "-d "
  if (models.includes("wdtagger")) modelStr += "-w "
  if (models.includes("blip")) modelStr += "-b "
  try {
    if (process.platform === "darwin") {
      child_process.execSync(`PYTORCH_ENABLE_MPS_FALLBACK=1 /usr/local/bin/python3 "${clipBreakerScript}" -m "attack" -i "${input}" -o "${tempImgLocation}" ${modelStr} -a "${attack}" -e "${epsilon}"`)
    } else {
      child_process.execSync(`python3 "${clipBreakerScript}" -m "attack" -i "${input}" -o "${tempImgLocation}" ${modelStr} -a "${attack}" -e "${epsilon}"`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
  return fs.readFileSync(tempImgLocation)
})

ipcMain.handle("invisible-watermark-decode", async (event, input: string, length: string) => {
  try {
    if (process.platform === "darwin") {
      child_process.execSync(`/usr/local/bin/python3 "${invisibleWatermarkScript}" -a decode -i "${input}" -o "${writeLocation}" -l "${length}"`)
    } else {
      child_process.execSync(`python3 "${invisibleWatermarkScript}" -a decode -i "${input}" -o "${writeLocation}" -l "${length}"`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
  return fs.readFileSync(writeLocation).toString()
})

ipcMain.handle("invisible-watermark-encode", async (event, input: string, output: string, watermark: string) => {
  try {
    if (process.platform === "darwin") {
      child_process.execSync(`/usr/local/bin/python3 ${invisibleWatermarkScript} -a encode -i "${input}" -o "${output}" -w "${watermark}" -q 90`)
    } else {
      child_process.execSync(`python3 ${invisibleWatermarkScript} -a encode -i "${input}" -o "${output}" -w "${watermark}" -q 90`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
  shell.showItemInFolder(path.normalize(output))
})

ipcMain.handle("shift-network", async (event, input: string, output: string, shift: string, probability: string) => {
  try {
    if (process.platform === "darwin") {
      child_process.execSync(`/usr/local/bin/python3 ${networkShifterScript} -i "${input}" -o "${output}" -s ${shift} -p ${probability}`)
    } else {
      child_process.execSync(`python3 ${networkShifterScript} -i "${input}" -o "${output}" -s ${shift} -p ${probability}`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
  shell.showItemInFolder(path.normalize(output))
})

ipcMain.handle("randomize-network", async (event, input: string, output: string) => {
  try {
    if (process.platform === "darwin") {
      child_process.execSync(`/usr/local/bin/python3 ${networkRandomizerScript} -i "${input}" -o "${output}"`)
    } else {
      child_process.execSync(`python3 ${networkRandomizerScript} -i "${input}" -o "${output}"`)
    }
  } catch (error) {
    return Promise.reject(error)
  }
  shell.showItemInFolder(path.normalize(output))
})

ipcMain.handle("store-settings", (event, settings) => {
  const prev = store.get("settings", {}) as object
  store.set("settings", {...prev, ...settings})
})

ipcMain.handle("install-update", async (event) => {
  if (process.platform === "darwin") {
    const update = await autoUpdater.checkForUpdates()
    const url = `${pack.repository.url}/releases/download/v${update.updateInfo.version}/${update.updateInfo.files[0].url}`
    await shell.openExternal(url)
    app.quit()
  } else {
    await autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall()
  }
})

ipcMain.handle("check-for-updates", async (event, startup: boolean) => {
  window?.webContents.send("close-all-dialogs", "version")
  const update = await autoUpdater.checkForUpdates()
  const newVersion = update.updateInfo.version
  if (pack.version === newVersion) {
    if (!startup) window?.webContents.send("show-version-dialog", null)
  } else {
    window?.webContents.send("show-version-dialog", newVersion)
  }
})

ipcMain.handle("select-files", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "tiff"]}
    ],
    properties: ["multiSelections", "openFile"]
  })
  return files.filePaths
})

ipcMain.handle("get-downloads-folder", async (event, force: boolean) => {
  if (store.has("downloads") && !force) {
    return store.get("downloads")
  } else {
    const downloads = app.getPath("downloads")
    store.set("downloads", downloads)
    return downloads
  }
})

ipcMain.handle("select-directory", async (event, dir: string) => {
  if (!window) return
  if (dir === undefined) {
    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"]
    })
    dir = result.filePaths[0]
  }
  if (dir) {
    store.set("downloads", dir)
    return dir
  }
})

const singleLock = app.requestSingleInstanceLock()

if (!singleLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
  })

  app.on("ready", () => {
    window = new BrowserWindow({width: 870, height: 770, minWidth: 720, minHeight: 450, frame: false, backgroundColor: "#0f142a", center: true, webPreferences: {nodeIntegration: true, contextIsolation: false}})
    window.loadFile(path.join(__dirname, "index.html"))
    window.removeMenu()
    require("@electron/remote/main").enable(window.webContents)
    window.on("closed", () => {
      window = null
    })
    if (process.env.DEVELOPMENT === "true") {
      globalShortcut.register("Control+Shift+I", () => {
        window?.webContents.toggleDevTools()
      })
    }
  })
}
