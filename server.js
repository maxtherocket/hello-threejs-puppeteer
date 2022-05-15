const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

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
      const res = window.app.drawFrames(100);
      return res;
    });
    await page.close();

    const dirPath = `./public/output/${uid}`;
    const resolvedDirPath = path.resolve(__dirname, dirPath);
    fs.mkdirSync(resolvedDirPath, { recursive: true });

    const filePaths = results.map((result, i) => {
      const bufData = bufferDataFromBase64(result);
      const filePath = path.resolve(__dirname, dirPath, `file${padNum(i, 3)}.png`);
      fs.writeFileSync(filePath, bufData);
      return filePath;
    });



    res.json({ok: true, uid: uid, url: `${url}output/${uid}/file000.png`});


    // res.writeHead(200, {
    //   'Content-Type': 'image/png',
    //   'Content-Length': img.length
    // });
    // res.end(img);

  });
  console.log(`begin ${API_CAPTURE_URL}`);
}

main();

