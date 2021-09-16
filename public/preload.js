
const fs = require("fs/promises");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const { contextBridge, ipcRenderer } = require("electron");
const { v4: uuidv4 } = require("uuid");
const ffmpegUtils = require("./utils/ffmpeg");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

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

const extractFrames = async (workDir, videoPath) => {
  const framesDir = path.join(workDir, "frames");
  
  await fs.mkdir(framesDir, { recursive: true });
  await ffmpegUtils.extractFrames(videoPath, framesDir);
};

const writeCsv = async (workDir, withModel, prediction) => {
  const csvPath = path.join(workDir, `${withModel}.csv`);

  const csvWriter = createCsvWriter({
    path: csvPath,
    header: [
      { id: "", title: "" },
      { id: "predict", title: "predict" },
    ],
  });

  const records = prediction.map((predict, i) => ({ "": i, predict }));

  await csvWriter.writeRecords(records);

  return csvPath;
};

const predict = async (workDir, withModel) => {
  const command = `docker run --rm -i -v ${path.join(__dirname, "oob")}:/OOB_RECOG -v ${path.dirname(workDir.replace(" ", ""))}:/OOB_RECOG/mount evaltool python test.py ${path.basename(workDir)} ${withModel}`;
  console.log(command);

  const { stdout } = await exec(command);

  if (stdout) {
    const prediction = JSON.parse(stdout);
    console.log(prediction);
    
    const csvPath = await writeCsv(workDir, withModel, prediction);

    return csvPath;
  }
};

const evalPrediction = async (csvPath, gtPath) => {
  await fs.copyFile(gtPath, path.join(path.dirname(csvPath), path.basename(gtPath)));

  const command = `docker run --rm -i -v ${path.join(__dirname, "oob")}:/OOB_RECOG -v ${path.dirname(csvPath.replace(" ", ""))}:/OOB_RECOG/mount evaltool python eval.py --model_output_csv_path ./mount/${path.basename(csvPath)} --gt_json_path ./mount/${path.basename(gtPath)} --save_dir_path ${path.dirname(csvPath).replace(" ", "")} --inference_step 5`;
  console.log(command);

  const { stdout } = await exec(command);

  if (stdout) {
    console.log(stdout);
  }
};

contextBridge.exposeInMainWorld("api", {
  getPath,
  getWorkDir,
  extractFrames,
  predict,
  evalPrediction,
});
