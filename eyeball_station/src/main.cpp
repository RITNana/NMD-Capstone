#include <Arduino.h>
#include <Servo.h>
#include "WiFiS3.h"

Servo eyeballLeftServo;
Servo eyeballRightServo;
int servoLeftPin = 8;
int servoRightPin = 9;
const int photoresistorLeftRedPin = A0;
const int photoresistorLeftBluePin = A1;
const int photoresistorRightRedPin = A2;
const int photoresistorRightBluePin = A3;
const int leftEyePin = A4;
const int rightEyePin = A5;

//PORT LIGHTS
int leftPortPin = 10;
int rightPortPin = 11; 
//STATION LIGHTS
const int stationPin1 = 12;
const int stationPin2 = 13;

int output;

int count = 0;

int leftLightThreshold = 15;
int rightLightThreshold = 15;

int averageLightLeft;
int averageLightRight;
int averageLightSocket;
int eyeCondition;

const int sockHyst = 10; // hysteresis for socket "connected" threshold
const int eyeHyst = 1;

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
  calibrateOne(leftEyePin, averageLightLeft);
  calibrateOne(rightEyePin, averageLightRight);
  Serial.print("RECALIBATED");
}


void eyeballSetup()
{
  Serial.begin(9600);
  // delay(200);
  // while (!Serial)
  //{ /* wait on native USB boards */
  // }
  pinMode(leftPortPin, OUTPUT);
  pinMode(rightPortPin, OUTPUT);
  pinMode(stationPin1,OUTPUT);
  pinMode(stationPin2,OUTPUT);

  eyeballLeftServo.attach(servoLeftPin);
  eyeballRightServo.attach(servoRightPin);
  eyeballLeftServo.write(180);
  eyeballRightServo.write(0);

  calibrateAll();

  eyeCondition = 1;
}

// helper: are eyes covered/bright?
bool eyesCovered(int L, int R)
{
  return (L <= (averageLightLeft - eyeHyst)) &&
         (R <= (averageLightRight - eyeHyst));
}
bool eyesBright(int L, int R)
{
  return (L > (averageLightLeft + eyeHyst)) &&
         (R > (averageLightRight + eyeHyst));
}
String direction = "_";
void task(){

  if (Serial.available() > 0)
  {
    char key = Serial.read();
  }
  
  if (direction == "go")
  {
  // Serial.println(go);
    eyeballLeftServo.write(0);
    eyeballRightServo.write(180);
    delay(500);
    eyeballLeftServo.write(180);
    eyeballRightServo.write(0);
    // delay(500);

    eyeCondition = 0;

    // Serial.println("Command: Turn servo to 180°");
    // eyeballServo.write(90);
    // delay(500);
    count = 0;
    output = 0;
    //calibrate(leftEyePin);
    //calibrate(rightEyePin);
    digitalWrite(stationPin1, HIGH);
    digitalWrite(stationPin2, HIGH);
    direction = "_";
  }
  if(direction == "stop"){
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
bool redConnected = false;
bool blueConnected = false;
int eyeballLoop()
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
  if(leftBlueOn || leftRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(leftPortPin, LOW);}
  if(rightBlueOn || rightRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(rightPortPin, LOW);}

  // NTS REMINDER TO ADD THE OTHER PINS 
  redConnected = leftRedOn || rightRedOn;
  blueConnected = leftBlueOn || rightBlueOn;


  int leftLight = analogRead(leftEyePin);
  int rightLight = analogRead(rightEyePin);


  bool covered = eyesCovered(leftLight,rightLight);
  //Serial.print("L=");
  //Serial.print(leftLight);
  //Serial.print(" R=");
  //Serial.print(rightLight);
  //Serial.print(" Sock=");
  //Serial.print(connectionLight);
  //Serial.print(" | AvgL=");
  //Serial.print(averageLightLeft);
  //Serial.print(" AvgR=");
  //Serial.print(averageLightRight);
  //Serial.print(" AvgSock=");
  //Serial.print(averageLightSocket);
  //Serial.print(" | conn=");
  //Serial.print(connected ? "Y" : "N");
  // popout();
  



  // --- State machine ---
  // 0 = eyes bright (normal), 1 = eyes covered, 2 = eyes popped out (latched)
  // if (eyeCondition == 0)
  // {
  //   // go to 1 when both eyes are covered
  //   if (eyesCovered(leftLight, rightLight))
  //   {
  //     eyeCondition = 1;
  //   }
  // }
  // else if (eyeCondition == 1)
  // {
  //   // if eyes become bright:
  //   if (eyesBright(leftLight, rightLight))
  //   {
  //     if (connected)
  //     {
  //       // socket light present -> OK to go back to 0
  //       eyeCondition = 0;
  //     }
  //     else
  //     {
  //       // socket dark -> latch "popped out"
  //       eyeCondition = 2;
  //     }
  //   }
  //   // (stay 1 if still covered)
  // }
  // else if (eyeCondition == 2)
  // {
  //   // popped out: must see socket light before allowing return to 0
  //   if (connected && eyesBright(leftLight, rightLight))
  //   {
  //     eyeCondition = 0;
  //   }
  //   // user can cover again anytime -> show 1
  //   else if (eyesCovered(leftLight, rightLight))
  //   {
  //     eyeCondition = 1;
  //     output += 2;
  //   }
  //   else{
  //     return 0; //This is to prevent the 2 from triggering completion
  //   }
  // }
  if(anyLightOn && covered){output += 2;}
  else if( output > 0){output -= 2;}
  // delay(200);
  //Serial.print(" | eyeCondition=");
  // Serial.println(eyeCondition);
  return output;
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
  char response[18]; //buffer out an area to fill the response into 16 should be enough
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

// this method makes a HTTP connection to the server:
/* -------------------------------------------------------------------------- */
void httpRequest(int data) {
/* -------------------------------------------------------------------------- */  
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  // client.stop();

  // if there's a successful connection:
  if (client.connect(server, 3000)) { //Server address from above & Port
    // Serial.println("connecting..."); //Really here for logging 
    // send the HTTP GET request:
    client.println("GET /eyeball HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Eyeball"); //Required but the input doesnt matter
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
    client.println(); //leave this it ends the headers
    // note the time that the connection was made:
    lastConnectionTime = millis();
    read_request();
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
  eyeballSetup();
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
  int valuedata = eyeballLoop();
  if(WiFi.status() != WL_CONNECTED){
    connectToWifi();
  }
  httpRequest(valuedata);
}
