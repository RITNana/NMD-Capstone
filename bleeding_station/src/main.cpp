#include <Arduino.h>

// Pin assignments
const int photoresistorPin = A0;
const int ledPins[] = {2, 3, 4};
const int buttonPin = 7;

// Light threshold value
const int lightThreshold = 300;

// LED state flag
bool ledsOn = false;

// Button state tracking
bool lastButtonState = HIGH;

// Time between each LED lighting up
const int delayBetweenLEDs = 1000;

// value for buttonHold
int chargeNum = 0;

void setup()
{
  // Set LED pins as OUTPUT
  for (int i = 0; i < 3; i++)
  {
    pinMode(ledPins[i], OUTPUT);
  }

  // Set button pin as INPUT_PULLUP (active LOW)
  pinMode(buttonPin, INPUT_PULLUP);

  // Debugging
  Serial.begin(9600);
}

void loop()
{
  //Serial.println("starting");

  

  // Read the photoresistor
  int lightLevel = analogRead(photoresistorPin);

  // allow button
  bool currentButtonState = digitalRead(buttonPin);

  if ((lightLevel > lightThreshold) &&
      (currentButtonState == LOW))
  {

    chargeNum += 1;
    Serial.println(chargeNum);


    if (chargeNum > 10)
    {
      digitalWrite(ledPins[0], HIGH);
    }
    if (chargeNum > 20)
    {
      digitalWrite(ledPins[1], HIGH);
    }
    if (chargeNum > 30)
    {
      digitalWrite(ledPins[2], HIGH);
    }

    // Turn off LEDs
  }
  else
  {

    if (chargeNum > 0)
    {
      chargeNum -= 1;
      Serial.println(chargeNum);

      if (chargeNum < 10)
      {
        digitalWrite(ledPins[0], LOW);
      }
      if (chargeNum < 20)
      {
        digitalWrite(ledPins[1], LOW);
      }
      if (chargeNum < 30)
      {
        digitalWrite(ledPins[2], LOW);
      }
    }

    ledsOn = false;
  }

  // Update the last button state
  lastButtonState = currentButtonState;

  delay(100);
}
