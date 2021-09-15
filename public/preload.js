
const fs = require("fs/promises");
const path = require("path");
const { contextBridge, ipcRenderer } = require("electron");
const { v4: uuidv4 } = require("uuid");
const ffmpegUtils = require("./utils/ffmpeg");

const getWindowId = async () => {
  const windowId = await ipcRenderer.invoke("get-window-id", "app");
  
  return windowId;
};

const getPath = async (dirname) => {
  const pathname = await ipcRenderer.invoke("getPath", dirname);

  return pathname;
};

const getWorkDir = async () => {
  const appDataPath = await ipcRenderer.invoke("getPath", "appData");
  const appName = await ipcRenderer.invoke("getName");
  const workDir = path.join(appDataPath, appName, "storage", uuidv4());
  
  return workDir;
};

const extractFrames = async (videoPath) => {
  const framesPath = path.join(await getWorkDir(), "frames");
  
  await fs.mkdir(framesPath, { recursive: true });
  await ffmpegUtils.extractFrames(videoPath, framesPath);

  return framesPath;
};

contextBridge.exposeInMainWorld("api", {
  getPath,
  getWorkDir,
  extractFrames,
});
