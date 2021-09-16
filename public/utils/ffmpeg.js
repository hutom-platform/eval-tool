const fs = require("fs/promises");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static").replace(
  "app.asar",
  "app.asar.unpacked",
);
const ffprobeStatic = require("ffprobe-static").path.replace(
  "app.asar",
  "app.asar.unpacked",
);

const readMetadata = (input) => {
  return new Promise((resolve, reject) => {
    new ffmpeg()
      .setFfprobePath(ffprobeStatic)
      .input(input)
      .ffprobe((error, data) => {
        if (error) {
          reject(error);
          
          return;
        }

        const { width, height } = data.streams[0];
        const { duration, size } = data.format;
        
        resolve({ width, height, duration, size });
      });
  });
};

/**
 * 시작점부터 n초 후까지의 부분 영상을 생성
 * @async
 * @param {string} input
 * @param {number} start
 * @param {number} duration
 * @param {string} output
 */
const slice = (input, start, duration, output) => {
  return new Promise((resolve, reject) => {
    new ffmpeg(input)
      .setFfmpegPath(ffmpegStatic)
      .inputOptions([`-ss ${start}`])
      .outputOptions([`-t ${duration}`, "-c copy"])
      .save(output)
      .on("error", reject)
      .on("end", resolve);
  });
};

/**
 * 하나 이상의 비디오 클립들을 하나로 이어붙임
 * @async
 * @param {string[]} inputs
 * @param {string} output
 */
const concat = async (inputs, output, tmpDir) => {
  const list = inputs.map((input) => `file '${input}'`).join("\n");
  const listPath = path.join(tmpDir, "list.txt");

  await fs.writeFile(listPath, list);

  try {
    await new Promise((resolve, reject) => {
      new ffmpeg(listPath)
        .setFfmpegPath(ffmpegStatic)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"])
        .save(output)
        .on("error", reject)
        .on("end", resolve);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await fs.unlink(listPath);
  }
};

const extractFrames = async (input, outputDir) => {
  await new Promise((resolve, reject) => {
    new ffmpeg(input)
      .outputOptions(["-vf fps=1,scale=224:224"])
      .save(`${outputDir}/frame%d.jpg`)
      .setFfmpegPath(ffmpegStatic)
      .on("error", reject)
      .on("end", resolve);
  });
};

module.exports = {
  readMetadata,
  slice,
  concat,
  extractFrames,
};
