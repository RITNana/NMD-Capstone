#include <Arduino.h>
#include <Servo.h>

#include "WiFiS3.h"

Servo servoL;
Servo servoR;
// Pin assignments
const int photoresistorLeftRedPin = A0;
const int photoresistorLeftBluePin = A1;
const int photoresistorRightRedPin = A2;
const int photoresistorRightBluePin = A3;

const int buttonPin = 2;
const int servoPinR = 9; // left
const int servoPinL = 8; // right

const int leftPortPin = 10;
const int rightPortPin = 11;
const int stationPin1 = 12;
const int stationPin2 = 13;

// angles for recalibration
int angleL = 90;
int angleR = 180;

int lightThreshold = 15;

int averageLight;

// output for wifi
int output = 2;
String remoteOpen = "false";

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

// change to tummySetup()
void tummySetup()
{
  // put your setup code here, to run once:
  // while (!Serial)
  //{ /* wait on native USB boards */
  //}
  // Serial.begin(9600);
  Serial.println("starting...");

  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(leftPortPin, OUTPUT);
  pinMode(rightPortPin, OUTPUT);
  pinMode(stationPin1, OUTPUT);
  pinMode(stationPin2, OUTPUT);
  servoR.attach(servoPinR);
  servoL.attach(servoPinL);
  servoR.write(angleR);
  servoL.write(angleL);

  calibrateAll();
}
void close(){
    delay(3000);
    servoR.write(angleR);
    servoL.write(angleL);
    Serial.println("closing");
}


String direction = "_";
void task(){

  if (Serial.available() > 0)
  {
    char key = Serial.read();
  }
  
  if (direction == "go")
  {
    digitalWrite(stationPin1,HIGH);
    digitalWrite(stationPin2,HIGH);
    Serial.println("opening");
    servoR.write(90);
    servoL.write(180);
    delay(500);

    output = 0; // open
    direction = "_";
    close();
  }
  if(direction == "stop"){
    digitalWrite(stationPin1,LOW);
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
    direction = "_"
  }
}


// void popout()
// {

//   if (Serial.available() > 0)
//   {
//     char key = Serial.read();
//   }
//   if (remoteOpen == "true")
//   {
//     Serial.println("opening");
//     servoR.write(90);
//     servoL.write(180);
//     delay(500);

//     output = 0; // open
//     remoteOpen = "false"; // this really doesnt need to be here but cause it gets overridden very soon but whatever
//     close();
//   }
// }


bool redConnected = false;
bool blueConnected = false;
//the station loop
int tummyLoop()
{
  int leftRedVal  = analogRead(photoresistorLeftRedPin);
  int leftBlueVal  = analogRead(photoresistorLeftBluePin);
  int rightRedVal = analogRead(photoresistorRightRedPin);
  int rightBlueVal = analogRead(photoresistorRightBluePin);

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
  redConnected = leftRedOn;
  blueConnected = leftBlueOn;
  
  bool pressed = (digitalRead(buttonPin) == LOW);

  Serial.println(pressed);

  if (Serial.available() > 0)
  {
    char key = Serial.read();

    // manual test
    if (key == 'k' || key == 'K')
    {
      Serial.println("opening");
      servoR.write(0);
      servoL.write(190);
      delay(500);

      output = 0; // open
    }
    else if (key == 'l' || key == 'L')
    {
      Serial.println("close");
      servoR.write(angleR);
      servoL.write(angleL);
      delay(500);

      output = 2; // closed
    }
  }

  //Where it closes
  if (anyLightOn && pressed)
    {output += 2;}
  else if( output > 0){output -= 2;}

  // Serial.println(connectionLight);
  // Serial.println(output);
  // output = servoR.read();

  return output;
}

// // -----------------------------------------------------
// // WIFI SETUP
// // -----------------------------------------------------
char ssid[] = "F00KKA9";    // your network SSID (name)
char pass[] = "PleaseWork"; // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;           // your network key index number (needed only for WEP)

int status = WL_IDLE_STATUS;

// Initialize the WiFi client library
WiFiClient client;

// server address:
char server[] = "192.168.137.1";
// char example[] = "1";
// IPAddress server(64,131,82,241);

unsigned long lastConnectionTime = 0;              // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 10L * 1000L; // delay between updates, in milliseconds

void parsing(char* response){
  Serial.print("Raw body: ");
  Serial.println(response);

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
  char response[16]; //buffer the area to fill the http response into
  int index = 0;
  bool bodyStarted = false;
  String line = "";

  // Wait for server data
  unsigned long timeout = millis();
  while (!client.available()) { // wait till client is available
    delay(1);
  }

  // Read and print all available characters
  // if (client.connected()) {
    while (client.available()) {
      char c = client.read();
      if(c == '~'){ //the end of message
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
  client.stop(); // kill connection
  // Serial.println("\n--- End of Response ---"); 
}

// this method makes a HTTP connection to the server:
/* -------------------------------------------------------------------------- */
void httpRequest(int data)
{
  /* -------------------------------------------------------------------------- */
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  

  // if there's a successful connection:
  if (client.connect(server, 3000))
  { // Server address from above & Port
    // Serial.println("connecting..."); //Really here for logging
    // send the HTTP GET request:
    client.println("GET /tummy HTTP/1.1"); // GET request at '/tummy' using HTTP/1.1
    client.println("Host: Tummy");         // Required but the input doesnt matter
    client.print("Data:");
    client.println(data);
    client.print("Red:");
    client.println(redConnected);
    client.print("Blue:");
    client.println(blueConnected);
    // client.println("User-Agent: ArduinoWiFi/1.1"); //Not required
    // client.println("Connection: close");
    client.println();
    // note the time that the connection was made:
    lastConnectionTime = millis();
    read_request();
  }
  else
  {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
}

/* -------------------------------------------------------------------------- */
void printWifiStatus()
{
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
void setup()
{
  /* -------------------------------------------------------------------------- */
  // Initialize serial and wait for port to open:
  Serial.begin(9600);
  tummySetup();
  while (!Serial)
  {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE)
  {
    Serial.println("Communication with WiFi module failed!");
    // don't continue
    while (true)
      ;
  }

  String fv = WiFi.firmwareVersion();
  if (fv < WIFI_FIRMWARE_LATEST_VERSION)
  {
    Serial.println("Please upgrade the firmware");
  }

  // attempt to connect to WiFi network:
  while (status != WL_CONNECTED)
  {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    // delay(10000);
  }
  // you're connected now, so print out the status:
  printWifiStatus();
}

/* -------------------------------------------------------------------------- */
void loop()
{
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
  int valuedata = tummyLoop();
  httpRequest(valuedata);
}

// // -----------------------------------------------------
// // COM TESTING
// // -----------------------------------------------------
// void setup()
// {
//   Serial.begin(9600);
//   while (!Serial)
//   {
//     ; // Wait for serial connection (important for USB boards)
//   }
//   // servo.write(90);
//   // delay(500);
//   // servo.write(0);
//   // delay(500);
//   tummySetup();
// }

// void loop()
// {
//   tummyLoop();
// }
