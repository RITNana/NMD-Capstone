#include "WiFiS3.h"


#include <Arduino.h>

// Pin assignments
const int photoresistorLeftRedPin = A0;
const int photoresistorLeftBluePin = A1;
const int photoresistorRightRedPin = A2;
const int photoresistorRightBluePin = A3;

const int ledPins[] = {2, 3, 4};
const int buttonPin = 7;
const int recalibratePin = 8;

const int leftPortPin = 10;
const int rightPortPin = 11;

const int stationPin1 = 12;
const int stationPin2 = 13;

// Light threshold value
int lightThreshold = 15;

// LED state flag
bool ledsOn = false;

// Button state tracking
bool lastButtonState = HIGH;

// Time between each LED lighting up
const int delayBetweenLEDs = 1000;

// value for buttonHold
int chargeNum = 0;

// function to calibrate the photoresistor to the room light level
// Baseline averages established via calibration
int averageLightLeftBlue  = 0;
int averageLightLeftRed = 0;
int averageLightRightBlue = 0;
int averageLightRightRed = 0;

// Calibrate a single photoresistor and update its baseline
void calibrateOne(int analogPin, int &averageOut) {
  int sensorLow = 1000;
  int sensorHigh = 0;

  for (int i = 0; i < 1000; i++) {
    int v = analogRead(analogPin);
    if (v > sensorHigh) sensorHigh = v;
    if (v < sensorLow)  sensorLow  = v;
  }
  averageOut = (sensorHigh + sensorLow) / 2;
}

// Calibrate All sensors
void calibrateAll() {
  calibrateOne(photoresistorLeftRedPin,  averageLightLeftRed);
  calibrateOne(photoresistorLeftBluePin, averageLightLeftBlue);
  calibrateOne(photoresistorRightRedPin,  averageLightRightRed);
  calibrateOne(photoresistorRightBluePin, averageLightRightBlue);
  Serial.print("RECALIBATED");
}

void bleedingSetup()
{
  // Set LED pins as OUTPUT
  for (int i = 0; i < 3; i++)
  {
    pinMode(ledPins[i], OUTPUT);
  }

  pinMode(stationPin1, OUTPUT);
  pinMode(stationPin2, OUTPUT);
  pinMode(leftPortPin, OUTPUT);
  pinMode(rightPortPin, OUTPUT);
  // Set button pin as INPUT_PULLUP (active LOW)
  pinMode(buttonPin, INPUT_PULLUP);
  // recalibrate pin is setup the same
  pinMode(recalibratePin, INPUT_PULLUP);

  // Debugging
  // Serial.begin(9600);
  // Calibrate the photoresistor to start
  calibrateAll();
}
bool redConnected = false;
bool blueConnected = false;

int bleedingLoop()
{
  int leftRedVal  = analogRead(photoresistorLeftRedPin);
  int leftBlueVal  = analogRead(photoresistorLeftBluePin);
  int rightRedVal = analogRead(photoresistorRightRedPin);
  int rightBlueVal = analogRead(photoresistorRightBluePin);
  Serial.println(leftRedVal);
  Serial.println(leftBlueVal);
  Serial.println(rightRedVal);
  Serial.println(rightBlueVal);

  bool leftRedOn  = leftRedVal  > (averageLightLeftRed  + lightThreshold);
  bool leftBlueOn  = leftBlueVal  > (averageLightLeftBlue  + lightThreshold);
  bool rightRedOn = rightRedVal > (averageLightRightRed + lightThreshold);
  bool rightBlueOn = rightBlueVal > (averageLightRightBlue + lightThreshold);
  bool anyLightOn = leftRedOn || leftBlueOn || rightRedOn || rightBlueOn;

  //Port lights
  if(leftBlueOn || leftRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(leftPortPin, LOW);}
  if(rightBlueOn || rightRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(rightPortPin, LOW);}

  // NTS REMINDER TO ADD THE OTHER PINS 
  redConnected = leftRedOn || rightRedOn;
  blueConnected = leftBlueOn || rightBlueOn;

  bool pressed = (digitalRead(buttonPin) == LOW); // INPUT_PULLUP: LOW = pressed

  // use only ONE of these definitions for bothTrueStreak (either global OR static)
  static uint8_t bothTrueStreak = 0;

  if (anyLightOn && pressed)
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
    chargeNum+= 4;
    bothTrueStreak = 0;
  }
  else if (!pressed || !anyLightOn)
  {
    if (chargeNum > 0)
      chargeNum-= 2;
  }

  digitalWrite(ledPins[0], chargeNum > 10 ? HIGH : LOW);
  digitalWrite(ledPins[1], chargeNum > 20 ? HIGH : LOW);
  digitalWrite(ledPins[2], chargeNum > 30 ? HIGH : LOW);

  //call calibrate if the button is hit during runtime
  bool recalibrate = (digitalRead(recalibratePin) == LOW);
  if(recalibrate){calibrateAll(); delay(200);}

  // if(lightLevel > averageLight + lightThreshold){
  //   Serial.print("ON ");
  // }
  // else{
  //   Serial.print("OFF ");
  // }

  // Serial.println(chargeNum);
  return chargeNum;
  // delay(100);
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
const unsigned long postingInterval = 1L * 10L; // delay between updates, in milliseconds
String direction = "_";
void task(){

  if (Serial.available() > 0)
  {
    char key = Serial.read();
  }
  
  if (direction == "go")
  {
    digitalWrite(stationPin1, HIGH);
    digitalWrite(stationPin2, HIGH);
    direction = "_";
  }
  if(direction == "stop"){
    digitalWrite(stationPin1, LOW);
    digitalWrite(stationPin2,LOW);
    direction = "_";
  }
  if(direction == "reset"){
    calibrateAll();
    direction = "_";
  }
  if(direction == "incre"){
    lightThreshold += 3;
    direction = "_";
  }
  if(direction == "decre"){
    lightThreshold -= 3;
    direction = "_";
  }
}

void parsing(char* response){
  Serial.print("Raw body: ");
  Serial.println(response);
  // Serial.println("boop");

  // Now parse with strtok
  char* token = strtok(response, "=");  // split by '='

  if (token != NULL) { //
    char* key = token;
    token = strtok(NULL, "=");
    if (token != NULL) {
      char* value = token;
      Serial.print("Key: ");
      Serial.println(key);
      Serial.print("Value: ");
      Serial.println(value);
      direction = (String)value;
      // Serial.print(String(go));
      task();
    }
  }
}

/* just wrap the received data up to 80 columns in the serial print*/
/* -------------------------------------------------------------------------- */
void read_request() { //Purpose is to read the response from the server and send the body to where it can be parsed
/* -------------------------------------------------------------------------- */  
  uint32_t received_data_num = 0;
  char response[20]; //buffer out an area to fill the response into 20 should be enough
  int index = 0;
  bool bodyStarted = false;
  String line = "";

  // Wait for server data
  unsigned long timeout = millis();
  while (!client.available()) {
    delay(1);
  }

  // Read and print all available characters
  // if (client.connected()) {
    while (client.available()) {
      char c = client.read();
      if(c == '~'){
          // client.stop();
          // Serial.println("break");
        break;
      }
      if (bodyStarted) {
        
        // Store response characters until buffer is full or connection ends
        if (index < sizeof(response) - 1) {
          response[index++] = c;
        }
        
      } 
      else {
        // Detect end of HTTP headers (\r\n\r\n)
        line += c;
        if (line.endsWith("\r\n\r\n")) {
          bodyStarted = true;
        }
      }
    }
    
  // }
  response[index] = '\0';  // Null-terminate C string
  
  parsing((char*)response);
  client.stop();
  // Serial.println("\n--- End of Response ---"); 
}

// This things sends a group of headers in a httpRequest
/* -------------------------------------------------------------------------- */
void httpRequest(int data) {
/* -------------------------------------------------------------------------- */  
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  // client.stop();

  //Each print line is a header

  // if there's a successful connection:
  if (client.connect(server, 3000)) { //Server address from above & Port
    // Serial.println("connecting..."); //Really here for logging 
    client.println("GET /bleeding HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Bleeding"); //Required but the input doesnt matter
    client.print("Data:");
    client.println(data);
    client.print("Red:");
    client.println(redConnected);
    client.print("Blue:");
    client.println(blueConnected);
    client.print("LT:");
    client.println(lightThreshold);
    // client.println("User-Agent: ArduinoWiFi/1.1"); //Not required
    // client.println("Connection: close");
    client.println(); // Leave this here since this ends the headers
    // note the time that the connection was made:
    lastConnectionTime = millis();
  } else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
  read_request();
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
  // read_request();
  
  // if ten seconds have passed since your last connection,
  // then connect again and send data:
  // if (millis() - lastConnectionTime > postingInterval) {
  //   httpRequest();
  // }
  int valuedata = bleedingLoop();
  httpRequest(valuedata);
}
