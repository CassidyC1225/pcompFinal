#include "Adafruit_VL53L0X.h"

Adafruit_VL53L0X lox = Adafruit_VL53L0X();

const int motorPin=7;
const int doorPin=8;
int doorState;


void setup() {
  //Serial.begin(9600);
  pinMode(doorPin,INPUT);
  pinMode(motorPin,OUTPUT);
  Serial.begin(115200);

  // // wait until serial port opens for native USB devices
  // while (! Serial) {
  //   delay(1);
  // }
  

  if (!lox.begin()) {
   // Serial.println(F("Failed to boot VL53L0X"));
    while(1);
  }
  // power 
  //Serial.println(F("VL53L0X API Simple Ranging example\n\n")); 



}

void loop() {
  int number;

  VL53L0X_RangingMeasurementData_t measure;
    
  //Serial.print("Reading a measurement... ");
  lox.rangingTest(&measure, false); // pass in 'true' to get debug data printout!

  if (measure.RangeStatus != 4) {  // phase failures have incorrect data
    //Serial.print("Distance (mm): "); Serial.println(measure.RangeMilliMeter);
    number = measure.RangeMilliMeter;
  } else {
    //Serial.println("10000");
    number = 100000;
  }

  doorState=digitalRead(doorPin);
  //int motorState=digitalRead(motorPin);

  //Serial.println(doorState);


  if (doorState==0){
    digitalWrite(motorPin, LOW);
  }
  else{
    digitalWrite(motorPin, HIGH);
  }

  if(Serial.available()>0){

    int fromP5 = Serial.read();
    // Serial.print("ldrStatus =");
    //Serial.print(" ");
    Serial.print(number);
    Serial.print(",");
    Serial.println(doorState);
  }

 // delay(100);
}


