// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();
// HTML button object:
let portButton;
let inData; // for incoming serial data
//let x = 0;
//let y = 0;
//let s = 50;
let lastButtonState = 0;
let lastDoorState=0;

let video; // 创建视频变量
let captureMe, playBtn; // 创建按钮变量
let space = 20; // 设置方块间距
let captures = []; // 创建捕捉对象数组
let barriers = []; // 创建边界数组
let propeller = []; // 创建旋转物体数组
let isPlaying = false; // 是否正在播放
let debug = false;

function setup() {
  
  // createCanvas(windowWidth, windowHeight); // make the canvas
  // check to see if serial is available:
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is available, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:

  serial.on("data", serialEvent);

  serial.on("close", makePortButton);
  textSize(40);
  
  createCanvas(windowWidth, windowHeight); // 创建画布

  matter.init(); // 初始化物理引擎
  initBorder(null, barriers, 20); // 初始化边界

  video = createCapture(VIDEO); // 创建视频捕捉对象
  video.size(200, 160); // 设置视频尺寸
  video.hide(); // 隐藏视频

  captureMe = createButton("Capture me"); // 创建捕捉按钮
  captureMe.position(0, 0); // 设置按钮位置
  captureMe.mousePressed(handleCaptureMe); // 绑定按钮事件

  playBtn = createButton("Play"); // 创建播放按钮
  playBtn.position(100, 0); // 设置按钮位置
  playBtn.mousePressed(handlePlay); // 绑定按钮事件

  playBtn = createButton("Clear"); // 创建播放按钮
  playBtn.position(160, 0); // 设置按钮位置
  playBtn.mousePressed(reset); // 绑定按钮事件
}

// 初始化边界
function initBorder(points, list, w) {
  let v = width / 4;

  points = points || [
    [
      { x: v, y: 0 },
      { x: width - v, y: 0 },
    ],
    [
      { x: v, y: 0 },
      { x: 0, y: height / 2 },
    ],
    [
      { x: 0, y: height / 2 },
      { x: v, y: height },
    ],
    [
      { x: v, y: height },

      { x: width - v, y: height },
    ],
    [
      { x: v, y: height },
      { x: width - v, y: height },
    ],
    [
      { x: width - v, y: height },
      { x: width, y: height / 2 },
    ],
    [
      { x: width, y: height / 2 },
      { x: width - v, y: 0 },
    ],
  ];

  for (let i = 0; i < points.length; i++) {
    let p1 = points[i][0];
    let p2 = points[i][1];
    var x = (p1.x + p2.x) / 2;
    var y = (p1.y + p2.y) / 2;
    var length = dist(p1.x, p1.y, p2.x, p2.y);
    var theta = atan2(p2.y - p1.y, p2.x - p1.x);
    var barrier = matter.makeBarrier(x, y, length, w, {
      angle: theta,
    });
    list.push(barrier);
  }
}

function draw() {
  background(0); // 设置背景色为黑色
  for (let i = 0; i < captures.length; i++) {
    captures[i].display(); // 显示捕捉对象
  }

  for (let i = 0; i < propeller.length; i++) {
    propeller[i].setAngle(propeller[i].getAngle() + 0.04); // 旋转物体
    if (debug) {
      propeller[i].show();
    }
  }

  if (debug) {
    for (let i = 0; i < barriers.length; i++) {
      barriers[i].show();
    }
  }
}

function handleCaptureMe() {
  let v = width / 4 + 50;
  if (isPlaying) {
    reset();
    captures.push(
      new Capture(createVector(random(v, width - video.width - v), 50))
    ); // 添加新的捕捉对象
  } else {
    captures.push(
      new Capture(createVector(random(v, width - video.width - v), 50))
    ); // 添加新的捕捉对象
  }
}

function reset() {
  isPlaying = false;
  for (let i = 0; i < captures.length; i++) {
    captures[i].forgetBox(); // 清除捕捉对象
  }
  captures = [];
  for (let i = 0; i < propeller.length; i++) {
    matter.forget(propeller[i]); // 清除旋转物体
  }
  propeller = [];
  barriers = [];
  initBorder(null, barriers, 20); // 重新初始化边界
}

function handlePlay() {
  initBorder(
    [
      [
        { x: width / 2, y: -100 },
        { x: width / 2, y: height + 100 },
      ], // 上下边界
      [
        { x: -100, y: height / 2 },
        { x: width + 100, y: height / 2 },
      ], // 左右边界
    ],
    propeller,
    50
  ); // 初始化旋转物体

  for (let i = 0; i < captures.length; i++) {
    captures[i].split(); // 拆分捕捉对象
  }
  isPlaying = true; // 设置正在播放状态
}

class Capture {
  constructor(pos) {
    this.boxs = []; // 方块数组
    this.genBoxs(); // 生成方块
    this.matterBlock = matter.makeBlock(
      pos.x,
      pos.y,
      video.width,
      video.height
    ); // 创建物理对象
    this.active = true; // 是否激活
  }

  get x() {
    return this.matterBlock.getPositionX(); // 获取x坐标
  }

  get y() {
    return this.matterBlock.getPositionY(); // 获取y坐标
  }

  get angle() {
    return this.matterBlock.getAngle(); // 获取旋转角度
  }

  get width() {
    return this.matterBlock.getWidth(); // 获取宽度
  }

  get height() {
    return this.matterBlock.getHeight(); // 获取高度
  }

  genBoxs() {
    for (let i = 0; i < video.width; i += space) {
      for (let j = 0; j < video.height; j += space) {
        let smallImage = createImage(space, space);
        smallImage.copy(video, i, j, space, space, 0, 0, space, space);
        this.boxs.push(new Box(createVector(i, j), smallImage));
      }
    }
  }

  display() {
    if (this.active) {
      push();
      translate(this.x, this.y);
      rotate(this.angle);
      push();
      translate(-this.width / 2, -this.height / 2);
      for (let i = 0; i < this.boxs.length; i++) {
        this.boxs[i].display(); // 显示方块
      }
      pop();
      pop();
    } else {
      for (let i = 0; i < this.boxs.length; i++) {
        this.boxs[i].display(); // 显示方块
      }
    }
  }

  split() {
    this.active = false;
    matter.forget(this.matterBlock); // 清除物理对象
    // for (let i = 0; i < barriers.length; i++) {
    //   matter.forget(barriers[i]); // 清除边界
    // }
    for (let i = 0; i < this.boxs.length; i++) {
      this.boxs[i].genMatter(this.x - this.width / 2, this.y - this.height / 2); // 生成新的物理对象
    }
  }

  forgetBox() {
    for (let i = 0; i < this.boxs.length; i++) {
      matter.forget(this.boxs[i].matterBlock); // 清除物理对象
    }
  }
}

class Box {
  constructor(pos, img) {
    this.pos = pos;
    this.img = img;
    this.wh = space;
    this.matterBlock = null;
  }

  get x() {
    return this.matterBlock ? this.matterBlock.getPositionX() : this.pos.x;
  }

  get y() {
    return this.matterBlock ? this.matterBlock.getPositionY() : this.pos.y;
  }

  display() {
    push();
    noFill();
    stroke(255);
    strokeWeight(0.5);
    rect(this.x, this.y, this.wh, this.wh); // 绘制方块边框
    image(this.img, this.x, this.y); // 绘制方块图像
    pop();
  }

  genMatter(x, y) {
    this.matterBlock = matter.makeBlock(
      this.pos.x + x,
      this.pos.y + y,
      this.wh,
      this.wh
    ); // 生成新的物理对象
  }
}

function serialEvent() {

  // read a string from the serial port
  // until you get carriage return and newline:
  let inString = serial.readStringUntil("\r\n");
  //let inString = serial.readLine();
  //check to see that there's actually a string there:

  //let inString =serial.read();
  console.log(inString)
  
  let buttonState;
  let doorState;

  if (inString != null) {
    let sensors = split(inString, ",");
    console.log(sensors);
    
//光敏电阻
    buttonState = Number(sensors[2]);
    //console.log(sensors);
    //console.log(buttonState);

    if (buttonState != lastButtonState && lastButtonState >= 100) {
      //console.log('hi')
      if(buttonState < 100 && buttonState != 0){
        
        handleCaptureMe();
        // snapshots.push(video.get())     
        
      }
//       if(buttonState==0){
        
        
//       }    
 }
    
    lastButtonState= buttonState;
    
    
//door sensor
    
    doorState= Number(sensors[3]);
    
    if(doorState!= lastDoorState){
      
      if(doorState==1){
       handlePlay(); 
      }
       if(doorState==0){
         reset();
       }
      
    }
    
   lastDoorState=doorState
  
    //y = Number(sensors[1]);
   // s = Number(sensors[2]);

    serial.write("x");
  }
}

/////////////////////////////////////////////
// UTILITY FUNCTIONS TO MAKE CONNECTIONS  ///
/////////////////////////////////////////////
// if there's no port selected,
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("choose port");
  portButton.position(10, 10);
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}

// make the port selector window appear:
function choosePort() {
  serial.requestPort();
}

// open the selected port, and make the port
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open({baudRate: 115200}).then(initiateSerial);

  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
    serial.write("x");
  }
  // hide the port button once a port is chosen:
  if (portButton) portButton.hide();
}

// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}

// try to connect if a new serial port
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}

// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}

// function mousePressed (){
// serial.write ("x");
// }

