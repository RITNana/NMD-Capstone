
#include "WiFiS3.h"


#include <Arduino.h>

// Pin assignments
// Pin assignments
const int photoresistorLeftRedPin = A0;
const int photoresistorLeftBluePin = A1;
const int photoresistorRightRedPin = A2;
const int photoresistorRightBluePin = A3;

const int buttonPins[4] = {2, 3, 4, 5};
const int recalibratePin = 8;

const int leftPortPin = 10;
const int rightPortPin = 11;
const int stationPin1 = 12;
const int stationPin2 = 13;

// Light threshold calibration
// int averageLight;
int leftLightThreshold = 15;
int rightLightThreshold = 15;
// bool lightOn = false;

// Button state tracking
int lastBtn = 5; // starts on button that doesnt exist
bool btnState[4] = {false, false, false, false};
bool lastReadState[4] = {false, false, false, false};

// Charge number
int chargeNum = 0;
const int maxCharge = 100;
const int chargeAdd = 4;
const int chargeLose = 2;

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

void brainSetup()
{
  // Serial.begin(9600);
  pinMode(stationPin1, OUTPUT);
  pinMode(stationPin2, OUTPUT);
  pinMode(leftPortPin, OUTPUT);
  pinMode(rightPortPin, OUTPUT);
  // Set button pins as input pullups
  for (int i = 0; i < 4; i++)
  {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }

  calibrateAll();
}
  bool redConnected = false;
  bool blueConnected = false;
int brainLoop()
{
  int leftRedVal  = analogRead(photoresistorLeftRedPin);
  int leftBlueVal  = analogRead(photoresistorLeftBluePin);
  int rightRedVal = analogRead(photoresistorRightRedPin);
  int rightBlueVal = analogRead(photoresistorRightBluePin);

  bool leftRedOn  = leftRedVal  > (averageLightLeftRed  + leftLightThreshold);
  bool leftBlueOn  = leftBlueVal  > (averageLightLeftBlue  + leftLightThreshold);
  bool rightRedOn = rightRedVal > (averageLightRightRed + rightLightThreshold);
  bool rightBlueOn = rightBlueVal > (averageLightRightBlue + rightLightThreshold);
  bool anyLightOn = leftRedOn || leftBlueOn || rightRedOn || rightBlueOn;

  //Port lights
  if(leftBlueOn || leftRedOn){digitalWrite(leftPortPin, HIGH);}
  else{digitalWrite(leftPortPin, LOW);}
  if(rightBlueOn || rightRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(rightPortPin, LOW);}

  // NTS REMINDER TO ADD THE OTHER PINS 
  redConnected = leftRedOn || rightRedOn;
  blueConnected = leftBlueOn || rightBlueOn;

  // start false
  bool anyPress = false;

  // LOW = pressed
  for (int i = 0; i < 4; i++)
  {
    bool pressed = digitalRead(buttonPins[i]) == LOW;

    // different button than last pressed
    if (pressed && !lastReadState[i])
    {
      // light on
      if (anyLightOn)
      {
        chargeNum += chargeAdd;
        // if (chargeNum > maxCharge) Let it go over 100
        //   chargeNum = maxCharge;
      }
      // new last button
      lastBtn = i;
    }

    // track button pressed
    lastReadState[i] = pressed;
    if (pressed)
      anyPress = true;
  }

  // passive charge loss
  if (!anyPress && chargeNum > 0)
  {
    chargeNum -= chargeLose;
    // keep lowest 0
    // if (chargeNum < 0)
    //   chargeNum = 0;
  }

  // brain station photoresistor
  Serial.print("BRAIN_LIGHT:");
  // Serial.print(lightOn ? "ON " : "OFF ");
  // Serial.println(lightLevel);
  // charge num
  Serial.print("CHARGE:");
  Serial.println(chargeNum);

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
const unsigned long postingInterval = 10L * 1000L; // delay between updates, in milliseconds

String direction = "_";
void task(){

  if (Serial.available() > 0)
  {
    char key = Serial.read();
  }
  
  if (direction == "go")
  { //For some unknown reason the lights are backwards on this
    digitalWrite(stationPin1, HIGH);
    digitalWrite(stationPin2, HIGH);
    direction = "_";
  }
  if(direction == "stop"){
    //TURN OFF THE LIGHTS
    digitalWrite(stationPin1, LOW);
    digitalWrite(stationPin2, LOW);
    direction = "_";
  }
  if(direction == "reset"){
    calibrateAll();
    direction = "_";
  }
    if(direction == "leftInc"){
    leftLightThreshold += 3;
    direction = "_";
  }
  if(direction == "leftDec"){
    leftLightThreshold -= 3;
    direction = "_";
  }
    if(direction == "rightInc"){
    rightLightThreshold += 3;
    direction = "_";
  }
  if(direction == "rightDec"){
    rightLightThreshold -= 3;
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
void read_request() {
/* -------------------------------------------------------------------------- */  
  uint32_t received_data_num = 0;
  char response[16]; //buffer out an area to fill the response into 16 should be enough
  int index = 0;
  bool bodyStarted = false;
  String line = "";

  // Wait for server data
  unsigned long timeout = millis();
  while (!client.available()) {
    if (!client.connected()) {
      Serial.println("Client disconnected while waiting for data");
      client.stop();
      return;
    }
    delay(1);
  }

  // Read and print all available characters
  // if (client.connected()) {
    while (client.available()) {
      char c = client.read();
      if(c == '~'){
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
}

// this method makes a HTTP connection to the server:
/* -------------------------------------------------------------------------- */
void httpRequest(int data) {
/* -------------------------------------------------------------------------- */  
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  // client.stop();

  // if there's a successful connection:
  if (client.connect(server, 3000)) { //Server address from above & Port
    Serial.println("connecting..."); //Really here for logging 
    // send the HTTP GET request:
    client.println("GET /brain HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Brain"); //Required but the input doesnt matter
    client.print("Data:");
    client.println(data);
    client.print("Red:");
    client.println(redConnected);
    client.print("Blue:");
    client.println(blueConnected);
    client.print("LLT:");
    client.println(leftLightThreshold);
    client.print("RLT:");
    client.println(rightLightThreshold);
    // client.println("User-Agent: ArduinoWiFi/1.1"); //Not required
    // client.println("Connection: close");
    client.println();
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

void connectToWifi(){
    // attempt to connect to WiFi network:
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    //delay(10000);
  }
}



/* -------------------------------------------------------------------------- */
void setup() {
/* -------------------------------------------------------------------------- */  
  //Initialize serial and wait for port to open:
  Serial.begin(9600);
  brainSetup();
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
  connectToWifi();
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
  int valuedata = brainLoop();
  if(WiFi.status() != WL_CONNECTED){
    connectToWifi();
  }
  httpRequest(valuedata);
}


