require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
//const stream = require("stream");
const puppeteer = require('puppeteer');
const queryString = require('query-string');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const perf = require('execution-time')();
const cors = require('cors');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(express.static("dist"));

const NUM_FRAMES = 24*5;
const SERVER_PORT = process.env.SERVER_PORT || 3000;
const FE_PORT = 3006;
const BUCKET = 'threejs-renderer';
const IS_DEV = process.env.NODE_ENV !== 'production';

app.get('/', function (req, res) {
  res.send('Hello World');
});

function fileDataFromBase64(base64) {
  return base64.split(",")[1];
}

function bufferDataFromBase64(base64) {
  const bufferData = Buffer.from(fileDataFromBase64(base64), 'base64');
  return bufferData;
}

function padNum(num, pad = 3){
  return String(num).padStart(pad, '0'); // '0009'
}

console.info('process.env.NODE_ENV:', process.env.NODE_ENV);

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

  console.info('Initiating ffmpegProcess');

  let startDateTime;
  let endDateTime;

  return new Promise((res, rej) => {

    const filename = `${uid}.mp4`;
    const outputFile = path.resolve(__dirname, `./tmp/${filename}`);

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
      res({outputFile, uid, filename });
    };
    const onProgress = progress => console.info(`FFMPEG_PROCESS progress: ${videoFile}: ${progress.timemark}`);

    const filesPath = path.resolve(__dirname, `./tmp/${uid}/file%04d.png`);

    const ffmpegRef = ffmpeg({source: filesPath}).loop()
      .on('start', onStart)
      .on('error', onError)
      .on('end', onEnd)
      .on('progress', onProgress)
      //.input(videoFile)
      //.setStartTime(videoStartOffset);

    ffmpegRef
      .duration(5)
      .withFpsInput(24)
      .withFpsOutput(24)
      .withVideoCodec('libx264')
      .outputOptions(['-pix_fmt yuv420p']) //
      .addInput(path.resolve(__dirname, './src/assets/song1.mp3'))
      .toFormat('mp4')
      .withSize('720x1280')
      .saveToFile(outputFile);

    // Add more inputs if applying filters
    // ffmpegRefd
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
    //ContentType: 'image/png',
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

app.listen(SERVER_PORT);

async function main() {
  const url = IS_DEV ? `http://localhost:${FE_PORT}/` : `http://localhost:${SERVER_PORT}/`;
  const API_CAPTURE_URL = `/api/capture`;

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
    defaultViewport: { width: 720, height: 1280 },
  });

  app.get(API_CAPTURE_URL, cors(), async (req, res)=>{
    req.setTimeout(500000);

    const page = await browser.newPage();

    const params = {
      bg: req.query.bg,
      render: true
    }

    const paramsString = queryString.stringify(params);

    console.info('paramsString:', paramsString);

    const pageURL = `${url}?${paramsString}`;
    console.info('pageURL:', pageURL);

    await page.goto(pageURL);
    await page.waitForNetworkIdle();
    await page.waitForFunction(
      'window._renderSetupReady',
    );

    const uid = uuidv4();

    const results = await page.evaluate(({numFrames})=>{
      //await window.app.setupPromise;
      //const result = window._renderFrames(numFrames);
      console.info('window.devicePixelRatio:', window.devicePixelRatio);
      const result = window._renderFrames(numFrames);
      return result;
    }, {numFrames: NUM_FRAMES});
    console.info('Waiting for page.close()');
    await page.close();
    console.info('page.close() complete');

    const dirPath = `./tmp/${uid}`;
    const resolvedDirPath = path.resolve(__dirname, dirPath);
    fs.mkdirSync(resolvedDirPath, { recursive: true });

    fs.mkdirSync(path.resolve('./public/output'), { recursive: true });

    const filePaths = results.map((result, i) => {
      const filename = `file${padNum(i, 4)}.png`;
      const filePath = `${dirPath}/${filename}`;
      const resolvedFilePath = path.resolve(__dirname, filePath);

      // const inputStream = new stream.Readable();
      // inputStream.push(new Base64Decode(result))
      //   .pipe(fs.createWriteStream(resolvedFilePath));

      perf.start();
      const bufData = bufferDataFromBase64(result);
      const bufferDataFromBase64Time = perf.stop();
      console.info('bufferDataFromBase64Time:', bufferDataFromBase64Time);

      perf.start();
      fs.writeFileSync(resolvedFilePath, bufData);
      const writeFileSyncTime = perf.stop();
      console.info('writeFileSyncTime:', writeFileSyncTime);
      // uploadFile(filePath, bufData);
      return resolvedFilePath;
    });

    const ffmpegResult = await ffmpegProcess({uid: uid});

    // const bufDataArr = results.map((result, i) => {
    //   const bufData = bufferDataFromBase64(result);
    //   return bufData;
    // });
    //
    const videoFileData = fs.readFileSync(ffmpegResult.outputFile);
    await uploadFile(ffmpegResult.filename, videoFileData);
    //
    // res.writeHead(200, {
    //   'Content-Type': 'image/png',
    //   'Content-Length': bufDataArr[0].length
    // });
    // res.end(bufDataArr[0]);

    res.json({
      ok: true,
      uid: uid,
      video: `https://threejs-renderer.nyc3.digitaloceanspaces.com/${ffmpegResult.filename}`
    });

  });
  console.log(`begin ${API_CAPTURE_URL}`);
}

main();

