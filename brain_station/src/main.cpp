#include <Arduino.h>

// Pin assignments
const int photoresistorPin = A0;
const int buttonPins[4] = {2, 3, 4, 5};

// Light threshold calibration
int averageLight;
const int lightThreshold = 33;

// Button state tracking
int lastBtn = 5; // starts on button that doesnt exist
bool btnState[4] = {false, false, false, false};
bool lastReadState[4] = {false, false, false, false};

// Charge number
int chargeNum = 0;
const int maxCharge = 100;
const int chargeAdd = 10;
const int chargeLose = 1;

// function to calibrate the photoresistor to the room light level
int calibrate()
{
  int sensorLow = 1000;
  int sensorHigh = 0;
  int timer = 0;

  while (timer < 1000)
  {
    int calibratingLightValue = analogRead(photoresistorPin);
    if (calibratingLightValue > sensorHigh)
    {
      sensorHigh = calibratingLightValue;
    }
    if (calibratingLightValue < sensorLow)
    {
      sensorLow = calibratingLightValue;
    }
    timer++;
  }
  averageLight = (sensorHigh + sensorLow) / 2;
}

void setup()
{
  Serial.begin(9600);

  // Set button pins as input pullups
  for (int i = 0; i < 4; i++)
  {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }

  calibrate();
}

void loop()
{
  int lightLevel = analogRead(photoresistorPin);
  bool lightOn = lightLevel > (averageLight + lightThreshold);

  // start false
  bool anyPress = false;

  // LOW = pressed
  for (int i = 0; i < 4; i++)
  {
    bool pressed = digitalRead(buttonPins[i]) == LOW;

    // different button than last pressed and light
    if (pressed && !lastReadState[i])
    {
      chargeNum += chargeAdd;
      // new last button
      lastBtn = i;
    }

    lastReadState[i] = pressed;
    if (pressed) anyPress = true;
  }

  // charge goes down
  if (!anyPress && chargeNum > 0)
  {
    chargeNum -= chargeLose;
  }

  // brain station photoresistor
  Serial.print("BRAIN_LIGHT:");
  Serial.print(lightOn ? "ON " : "OFF ");

  // charge num
  Serial.print("CHARGE:");
  Serial.print(chargeNum);

  delay(100);
}
