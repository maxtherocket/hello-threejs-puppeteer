require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(express.static("public"));

const NUM_FRAMES = 30;
const BUCKET = 'threejs-renderer';

// app.get('/', function (req, res) {
//   res.send('Hello World');
// });

function bufferDataFromBase64(result) {
  const regex = /^data:.+\/(.+);base64,(.*)$/;
  const matches = result.match(regex);
  const data = matches[2];
  const bufferData = Buffer.from(data, 'base64');
  return bufferData;
}

function padNum(num, pad = 3){
  return String(num).padStart(pad, '0'); // '0009'
}

console.info('process.env.SPACES_KEY:', process.env.SPACES_KEY);
console.info('process.env.SPACES_SECRET:', process.env.SPACES_SECRET);

const s3 = new S3Client({
  endpoint: "https://nyc3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
  }
});

const ffmpegProcess = ({
                        uid,
                         videoFile,
                         videoFitBox,
                         outputFilename = 'processed',
                         usePublicDir = false
                       }) => {
  //const localDirPath = usePublicDir ? PUBLIC_DIR_PATH : LOCAL_STORAGE;
  // const outputFileFiltered = path.resolve(__dirname, localDirPath, `${outputFilename}_filtered.mp4`);
  // const outputFileResized = path.resolve(__dirname, localDirPath, `${outputFilename}_resized.mp4`);
  // const outputFileAudio = path.resolve(__dirname, localDirPath, `${outputFilename}_audio.mp3`);

  //const minDimension = Math.min(videoFitBox.width, videoFitBox.height);

  let startDateTime;
  let endDateTime;

  return new Promise((res, rej) => {
    const onStart = (commandLine) => {
      startDateTime = new Date();
      // console.info('Spawned FFmpeg with command: ' + commandLine);
      // console.info('Start ffmpegProcess:', videoFile);
      console.info('FFMPEG_PROCESS starting');
    };
    const onError = (err) => {
      console.info('FFMPEG_PROCESS error', err);
      rej(err);
    };
    const onEnd = () => {
      endDateTime = new Date();
      const secondsDuration = (endDateTime.getTime() - startDateTime.getTime()) / 1000;
      // console.info('End ffmpegProcess:', outputFileFiltered);
      console.info('End ffmpegProcess\nTotal processing time (seconds):', secondsDuration);
      //res({resized: outputFileResized, filtered: outputFileFiltered, audio: outputFileAudio});
      res();
    };
    const onProgress = progress => console.info(`FFMPEG_PROCESS progress: ${videoFile}: ${progress.timemark}`);

    const filesPath = path.resolve(__dirname, `./tmp/${uid}/file%03d.png`);

    const ffmpegRef = ffmpeg({source: filesPath})
      .on('start', onStart)
      .on('error', onError)
      .on('end', onEnd)
      .on('progress', onProgress)
      //.input(videoFile)
      //.setStartTime(videoStartOffset);

    ffmpegRef
      .withFpsInput(24)
      .withFpsOutput(24)
      .withVideoCodec('libx264')
      .toFormat('mp4')
      .withSize('1280x720')
      .saveToFile(path.resolve(__dirname, `./public/${uid}.mp4`));

    // Add more inputs if applying filters
    // ffmpegRef
    //   .input(path.resolve(__dirname, '../assets/vig-lines.jpg')).loop()
    //   .input(path.resolve(__dirname, '../assets/bg.png'))
    //   .input(path.resolve(__dirname, '../assets/midnight-sky-logo-scaled.png'));

    // ffmpegRef
    //   .complexFilter(filters)
    //   .output(outputFileResized)
    //   .outputOptions([ '-map [resized-out]', '-map 0:a', '-threads 0' ])
    //   .videoCodec('libx264')
    //   .audioCodec('aac')
    //   .audioBitrate('320')
    //   .output(outputFileFiltered)
    //   .outputOptions([ '-map [out]', '-map 0:a', '-threads 0' ])
    //   .videoCodec('libx264')
    //   .audioCodec('aac')
    //   .audioBitrate('320')
    //   .output(outputFileAudio)
    //   .outputOptions([ '-map 0:a', '-threads 0' ])
    //   .audioCodec('libmp3lame')
    //   .audioBitrate('320')
    //   .run();
  });
};

// Uploads the specified file to the chosen path.
const uploadFile = async (filename, content) => {
  const bucketParams = {
    Bucket: BUCKET,
    Key: filename,
    Body: content,
    ContentType: 'image/png',
    ACL: 'public-read'
  };
  try {
    const data = await s3.send(new PutObjectCommand(bucketParams));
    console.log(
      "Successfully uploaded object: " +
      bucketParams.Bucket +
      "/" +
      bucketParams.Key
    );
    return data;
  } catch (err) {
    console.log("Error", err);
  }
};

app.listen(3000);

async function main() {
  const url = "http://localhost:3000/";
  const API_CAPTURE_URL="/api/capture";

  const args=[
    "--no-sandbox",
    "--use-gl=swiftshader",
    // "--use-gl=angle",
    "--enable-webgl",
  ];
  // const args=[
  //   '--no-sandbox',
  //   '--disable-setuid-sandbox',
  //   '--single-process',
  // ];

  const browser = await puppeteer.launch({
    args,
    headless: true,
    dumpio: true,
    defaultViewport: { width: 1280, height: 720 },
  });



  // process.kill(process.pid, "SIGINT");

  app.get(API_CAPTURE_URL, async (req,res)=>{
    const page = await browser.newPage();

    await page.goto(url);
    //await page.waitForNetworkIdle();

    const uid = uuidv4();

    const results = await page.evaluate(async ()=>{
      await window.app.setupPromise;
      const res = window.app.drawFrames(60);
      return res;
    });
    await page.close();

    const dirPath = `./tmp/${uid}`;
    const resolvedDirPath = path.resolve(__dirname, dirPath);
    fs.mkdirSync(resolvedDirPath, { recursive: true });

    const filePaths = results.map((result, i) => {
      const bufData = bufferDataFromBase64(result);
      const filename = `file${padNum(i, 3)}.png`;
      const filePath = `${dirPath}/${filename}`;
      const resolvedFilePath = path.resolve(__dirname, filePath);
      fs.writeFileSync(resolvedFilePath, bufData);
      // uploadFile(filePath, bufData);
      return resolvedFilePath;
    });

    await ffmpegProcess({uid: uid});

    // const bufDataArr = results.map((result, i) => {
    //   const bufData = bufferDataFromBase64(result);
    //   return bufData;
    // });
    //
    // await uploadFile('test.png', bufDataArr[0]);
    //
    // res.writeHead(200, {
    //   'Content-Type': 'image/png',
    //   'Content-Length': bufDataArr[0].length
    // });
    // res.end(bufDataArr[0]);

    res.json({ok: true, uid: uid, url: `https://threejs-renderer.nyc3.digitaloceanspaces.com/output/${uid}/file000.png`, video: `/output/${uid}.mp4` });

  });
  console.log(`begin ${API_CAPTURE_URL}`);
}

main();

