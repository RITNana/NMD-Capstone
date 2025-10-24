#include "WiFiS3.h"


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


void bleedingSetup()
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
  // Serial.begin(9600);
  // Calibrate the photoresistor to start
  calibrate();
}

int bleedingLoop()
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

  if(lightLevel > averageLight + lightThreshold){
    Serial.print("ON ");
  }
  else{
    Serial.print("OFF ");
  }

  // ✅ send ONLY the charge number
  Serial.println(chargeNum);
  return chargeNum;
  delay(100);
}











char ssid[] = "F00KKA9";        // your network SSID (name)
char pass[] = "PleaseWork";    // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;            // your network key index number (needed only for WEP)

int status = WL_IDLE_STATUS;

// Initialize the WiFi client library
WiFiClient client;

// server address:
char server[] = "192.168.137.1";
// char example[] = "1";
//IPAddress server(64,131,82,241);

unsigned long lastConnectionTime = 0;            // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 10L * 1000L; // delay between updates, in milliseconds

/* just wrap the received data up to 80 columns in the serial print*/
/* -------------------------------------------------------------------------- */
void read_request() {
/* -------------------------------------------------------------------------- */  
  uint32_t received_data_num = 0;

  while (client.available()) {
    /* actual data reception */
    char c = client.read();
    /* print data to serial port */
    Serial.print(c);
    /* wrap data to 80 columns*/
    received_data_num++;
    if(received_data_num % 80 == 0) {}
    
  }  
}

// This things sends a group of headers in a httpRequest
/* -------------------------------------------------------------------------- */
void httpRequest(int data) {
/* -------------------------------------------------------------------------- */  
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  client.stop();

  //Each print line is a header

  // if there's a successful connection:
  if (client.connect(server, 3000)) { //Server address from above & Port
    // Serial.println("connecting..."); //Really here for logging 
    client.println("GET / HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Bleeding"); //Required but the input doesnt matter
    client.print("Data:");
    client.println(data);
    // client.println("User-Agent: ArduinoWiFi/1.1"); //Not required
    // client.println("Connection: close");
    client.println(); // Leave this here since this ends the headers
    // note the time that the connection was made:
    lastConnectionTime = millis();
  } else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
}

/* -------------------------------------------------------------------------- */
void printWifiStatus() {
/* -------------------------------------------------------------------------- */  
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your board's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}





/* -------------------------------------------------------------------------- */
void setup() {
/* -------------------------------------------------------------------------- */  
  //Initialize serial and wait for port to open:
  Serial.begin(9600);
  bleedingSetup();
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    // don't continue
    while (true);
  }

  String fv = WiFi.firmwareVersion();
  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("Please upgrade the firmware");
  }

  // attempt to connect to WiFi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    //delay(10000);
  }
  // you're connected now, so print out the status:
  printWifiStatus();
}


/* -------------------------------------------------------------------------- */
void loop() {
/* -------------------------------------------------------------------------- */  
  // if there's incoming data from the net connection.
  // send it out the serial port.  This is for debugging
  // purposes only:
  read_request();
  
  // if ten seconds have passed since your last connection,
  // then connect again and send data:
  // if (millis() - lastConnectionTime > postingInterval) {
  //   httpRequest();
  // }
  int valuedata = bleedingLoop();
  httpRequest(valuedata);
}
