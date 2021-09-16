const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ffmpegUtils = require("./ffmpeg");

const extract = async (guide, srcPath, dstPath) => {
  const tmpDir = path.join(path.dirname(dstPath), uuidv4());

  await fs.mkdir(tmpDir);

  const sliced = [];
  
  const sliceTasks = guide.map(
    (curr, i) => {
      const { start, end } = curr;
      const filePath = path.join(tmpDir, `${i}.mp4`);

      sliced.push(filePath);

      return ffmpegUtils.slice(srcPath, start, end - start, filePath);
    },
    [],
  );

  await Promise.all(sliceTasks);
  await ffmpegUtils.concat(sliced, dstPath, tmpDir);

  await fs.rmdir(tmpDir, { recursive: true, force: true });
};

module.exports = {
  extract,
};
