
const fs = require("fs/promises");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const { contextBridge, ipcRenderer, shell } = require("electron");
const { v4: uuidv4 } = require("uuid");
const ffmpegUtils = require("./utils/ffmpeg");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { parsePrediction, filterPrediction } = require("./utils/parser");
const { extract } = require("./utils/ffmpeg-helper");

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
  
  try {
    await fs.access(workDir);
  } catch {
    await fs.mkdir(workDir, { recursive: true });
  }
  
  return workDir;
};

const extractFrames = async (workDir, videoPath) => {
  const framesDir = path.join(workDir, "frames");
  
  try {
    await fs.access(framesDir);
  } catch {
    await fs.mkdir(framesDir, { recursive: true });
  }

  const copiedVideoPath = path.join(workDir, path.basename(videoPath));

  try {
    await fs.access(copiedVideoPath);
  } catch (error) {
    await fs.copyFile(videoPath, copiedVideoPath);
  }

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

const predict = async (workDir, videoName, withModel) => {
  const command = `docker run --rm -i -v ${path.join(__dirname, "oob")}:/OOB_RECOG -v ${path.dirname(workDir.replace(" ", ""))}:/OOB_RECOG/mount evaltool python test.py ${path.basename(workDir)} ${withModel}`;
  console.log(command);

  const { stdout } = await exec(command);

  if (stdout) {
    console.log(stdout);

    let prediction;

    try {
      prediction = JSON.parse(stdout);
    } catch (error) {
      prediction = JSON.parse(stdout.trim().split("\n").pop());
    } finally {
      console.log(prediction);
    }
    
    const parsedPrediction = parsePrediction(prediction);
    const inBody = filterPrediction(parsedPrediction, true);
    const outOfBody = filterPrediction(parsedPrediction, false);

    console.log(parsedPrediction, inBody, outOfBody);

    const videoPath = path.join(workDir, videoName);

    const extractPromises = [];

    if (inBody.length > 0) {
      const inBodyVideoPath = path.resolve(videoPath, videoPath.replace(".mp4", `_in_body_${withModel}.mp4`));
      extractPromises.push(extract(inBody, videoPath, inBodyVideoPath));
    }

    if (outOfBody.length > 0) {
      const outOfBodyVideoPath = path.resolve(videoPath, videoPath.replace(".mp4", `_out_of_body_${withModel}.mp4`));
      extractPromises.push(extract(outOfBody, videoPath, outOfBodyVideoPath));
    }

    await Promise.all(extractPromises);

    const csvPath = await writeCsv(workDir, withModel, prediction);

    return csvPath;
  }
};

const evalPrediction = async (csvPath, gtPath) => {
  const copiedGtPath = path.join(path.dirname(csvPath), path.basename(gtPath));

  try {
    await fs.access(copiedGtPath);
  } catch (error) {
    await fs.copyFile(gtPath, copiedGtPath);
  }

  const command = `docker run --rm -i -v ${path.join(__dirname, "oob")}:/OOB_RECOG -v ${path.dirname(csvPath.replace(" ", ""))}:/OOB_RECOG/mount evaltool python eval.py --model_output_csv_path ./mount/${path.basename(csvPath)} --gt_json_path ./mount/${path.basename(gtPath)} --save_dir_path ${path.dirname(csvPath).replace(" ", "")} --inference_step 5`;
  console.log(command);

  const { stdout } = await exec(command);

  if (stdout) {
    console.log(stdout);
  }
};

const openPath = (path) => {
  shell.openPath(path);
};

contextBridge.exposeInMainWorld("api", {
  getPath,
  getWorkDir,
  extractFrames,
  predict,
  evalPrediction,
  openPath,
});
