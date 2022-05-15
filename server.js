require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(express.static("public"));

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

// Uploads the specified file to the chosen path.
const uploadFile = async (filename, content) => {
  const bucketParams = {
    Bucket: "threejs-renderer",
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
    defaultViewport: { width: 400, height: 300 },
  });



  // process.kill(process.pid, "SIGINT");

  app.get(API_CAPTURE_URL, async (req,res)=>{
    const page = await browser.newPage();

    await page.goto(url);
    //await page.waitForNetworkIdle();

    const uid = uuidv4();

    const results = await page.evaluate(async ()=>{
      await window.app.setupPromise;
      const res = window.app.drawFrames(5);
      return res;
    });
    await page.close();

    // const dirPath = `./public/output/${uid}`;
    // const resolvedDirPath = path.resolve(__dirname, dirPath);
    // fs.mkdirSync(resolvedDirPath, { recursive: true });

    const filePaths = results.map((result, i) => {
      const bufData = bufferDataFromBase64(result);
      const filename = `file${padNum(i, 3)}.png`;
      const filePath = `output/${uid}/${filename}`;
      fs.writeFileSync(path.resolve(__dirname, './public/test.png'), bufData);
      uploadFile(filePath, bufData);
      return filePath;
    });

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

    res.json({ok: true, uid: uid, url: `https://threejs-renderer.nyc3.digitaloceanspaces.com/output/${uid}/file000.png`});

  });
  console.log(`begin ${API_CAPTURE_URL}`);
}

main();

