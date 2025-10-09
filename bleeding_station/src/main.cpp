#include <Arduino.h>

// Pin assignments
const int photoresistorPin = A0;
const int ledPins[] = {2, 3, 4};
const int buttonPin = 7;
const int recalibratePin = 8;

// Light threshold value
const int lightThreshold = 33;

// LED state flag
bool ledsOn = false;

// Button state tracking
bool lastButtonState = HIGH;

// Time between each LED lighting up
const int delayBetweenLEDs = 1000;

// value for buttonHold
int chargeNum = 0;

// value on from the photoresistor calibration
int averageLight;
// function to calibrate the photoresistor to the room light level
int calibrate() {
  int sensorLow = 1000;
  int sensorHigh = 0;
  int timer = 0;

  while (timer < 1000) {
    int calibratingLightValue = analogRead(photoresistorPin);
    if (calibratingLightValue > sensorHigh) {
      sensorHigh = calibratingLightValue;
    }
    if (calibratingLightValue < sensorLow) {
      sensorLow = calibratingLightValue;
    }
    timer++;
  }
  averageLight = (sensorHigh + sensorLow)/2;
  
}


void setup()
{
  // Set LED pins as OUTPUT
  for (int i = 0; i < 3; i++)
  {
    pinMode(ledPins[i], OUTPUT);
  }

  // Set button pin as INPUT_PULLUP (active LOW)
  pinMode(buttonPin, INPUT_PULLUP);
  // recalibrate pin is setup the same
  pinMode(recalibratePin, INPUT_PULLUP);

  // Debugging
  Serial.begin(9600);
  // Calibrate the photoresistor to start
  calibrate();
}

void loop()
{
  int lightLevel = analogRead(photoresistorPin);
  bool pressed = (digitalRead(buttonPin) == LOW); // INPUT_PULLUP: LOW = pressed

  // use only ONE of these definitions for bothTrueStreak (either global OR static)
  static uint8_t bothTrueStreak = 0;

  if (lightLevel > averageLight + lightThreshold && pressed)
  {
    if (bothTrueStreak < 3)
      bothTrueStreak++;
  }
  else
  {
    bothTrueStreak = 0;
  }

  if (bothTrueStreak >= 3)
  {
    chargeNum++;
    bothTrueStreak = 0;
  }
  else if (!pressed || lightLevel <= lightThreshold)
  {
    if (chargeNum > 0)
      chargeNum--;
  }

  digitalWrite(ledPins[0], chargeNum > 10 ? HIGH : LOW);
  digitalWrite(ledPins[1], chargeNum > 20 ? HIGH : LOW);
  digitalWrite(ledPins[2], chargeNum > 30 ? HIGH : LOW);

  //call calibrate if the button is hit during runtime
  bool recalibrate = (digitalRead(recalibratePin) == LOW);
  if(recalibrate){calibrate(); delay(200);}

  // ✅ send ONLY the charge number
  Serial.println(chargeNum);

  delay(100);
}
