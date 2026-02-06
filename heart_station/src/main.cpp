 #include <Arduino.h>
 #include "WiFiS3.h"

// --- Pin assignments ---
// Port 1 (left)  -> A1
// Port 2 (right) -> A0
// const int leftPin  = A1;
// const int rightPin = A0;
const int photoresistorLeftRedPin = A0;
const int photoresistorLeftBluePin = A1;
const int photoresistorRightRedPin = A2;
const int photoresistorRightBluePin = A3;

//Port LEDS
const int leftPortPin = 10;
const int rightPortPin = 11;
//Station LEDs
const int stationPin1 = 12;
const int stationPin2 = 13;

// light level threshold
int lightThreshold = 15;

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
}

// setup
void heartSetup() {
  // Serial.begin(9600); // Initialize serial monitor for debugging output
  pinMode(stationPin1, OUTPUT);
  pinMode(stationPin2, OUTPUT);
  pinMode(leftPortPin, OUTPUT);
  pinMode(rightPortPin, OUTPUT);
  //Heart Station is always on
  digitalWrite(stationPin1,HIGH);
  digitalWrite(stationPin2, HIGH);
  calibrateAll();
}

// Returns a single code per spec:
// 0 = neither threshold reached
// 1 = left reached, right not
// 2 = right reached, left not
// 3 = both reached
bool redConnected = false;
bool blueConnected = false;
int  heartLoop() {
  int leftRedVal  = analogRead(photoresistorLeftRedPin);
  int leftBlueVal  = analogRead(photoresistorLeftBluePin);
  int rightRedVal = analogRead(photoresistorRightRedPin);
  int rightBlueVal = analogRead(photoresistorRightBluePin);

  bool leftRedOn  = leftRedVal  > (averageLightLeftRed  + lightThreshold);
  bool leftBlueOn  = leftBlueVal  > (averageLightLeftBlue  + lightThreshold);
  bool rightRedOn = rightRedVal > (averageLightRightRed + lightThreshold);
  bool rightBlueOn = rightBlueVal > (averageLightRightBlue + lightThreshold);

  redConnected = leftRedOn || rightRedOn;
  blueConnected = leftBlueOn || rightBlueOn;
  
  //Port light managing
  if(leftBlueOn || leftRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(leftPortPin, LOW);}
  if(rightBlueOn || rightRedOn){digitalWrite(rightPortPin, HIGH);}
  else{digitalWrite(rightPortPin, LOW);}

  int code = 0;
  if (leftRedOn || leftBlueOn && rightRedOn || rightBlueOn ) {
    code = 3;
  } else if (leftRedOn || leftBlueOn) {
    code = 1;
  } else if (rightRedOn || rightBlueOn) {
    code = 2;
  }
  
  //Reminder to add the logic for the headers

  // Serial.print("Left: ");
  // Serial.print(leftVal);
  // Serial.print(" (avg ");
  // Serial.print(averageLightLeft);
  // Serial.print(") | Right: ");
  // Serial.print(rightVal);
  // Serial.print(" (avg ");
  // Serial.print(averageLightRight);
  // Serial.print(") -> Code: ");

  Serial.println(code);
  return code;
}




///////please enter your sensitive data in the Secret tab/arduino_secrets.h
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
  {
    digitalWrite(stationPin1,HIGH);
    digitalWrite(stationPin2,HIGH);
    direction = "_";
  }
  if(direction == "stop"){
    digitalWrite(stationPin1,LOW);
    digitalWrite(stationPin2,LOW);
    direction = "_";
  }
  if(direction == "reset"){
    //update ports to be the correct ones
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



void read_request() { //Purpose is to read the response from the server and send the body to where it can be parsed
/* -------------------------------------------------------------------------- */  
  uint32_t received_data_num = 0;
  char response[20]; //buffer out an area to fill the response into 16 should be enough
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
    client.println("GET /heart HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Heart"); //Required but the input doesnt matter
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
  } else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
  read_request();
}

/* -------------------------------------------------------------------------- */
void printWifiStatus() { //TBH can be removed not really needed
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
  heartSetup();
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
  int valuedata = heartLoop();
  httpRequest(valuedata);
}
