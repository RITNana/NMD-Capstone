 #include <Arduino.h>
 #include "WiFiS3.h"

// --- Pin assignments ---
// Port 1 (left)  -> A1
// Port 2 (right) -> A0
const int leftPin  = A1;
const int rightPin = A0;

// light level threshold
const int lightThreshold = 33;

// Baseline averages established via calibration
int averageLightLeft  = 0;
int averageLightRight = 0;

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

// Calibrate both sensors
void calibrateBoth() {
  calibrateOne(leftPin,  averageLightLeft);
  calibrateOne(rightPin, averageLightRight);
}

// setup
void heartSetup() {
  // Serial.begin(9600); // Initialize serial monitor for debugging output
  calibrateBoth();
}

// Returns a single code per spec:
// 0 = neither threshold reached
// 1 = left reached, right not
// 2 = right reached, left not
// 3 = both reached
int  heartLoop() {
  int leftVal  = analogRead(leftPin);
  int rightVal = analogRead(rightPin);

  bool leftOn  = leftVal  > (averageLightLeft  + lightThreshold);
  bool rightOn = rightVal > (averageLightRight + lightThreshold);

  int code = 0;
  if (leftOn && rightOn) {
    code = 3;
  } else if (leftOn) {
    code = 1;
  } else if (rightOn) {
    code = 2;
  }

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
    if(received_data_num % 80 == 0) { 
      
    }
    
  }  
}

// this method makes a HTTP connection to the server:
/* -------------------------------------------------------------------------- */
void httpRequest(int data) {
/* -------------------------------------------------------------------------- */  
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  client.stop();

  // if there's a successful connection:
  if (client.connect(server, 3000)) { //Server address from above & Port
    // Serial.println("connecting..."); //Really here for logging 
    // send the HTTP GET request:
    client.println("GET /heart HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Heart"); //Required but the input doesnt matter
    client.print("Data:");
    client.println(data);
    // client.println("User-Agent: ArduinoWiFi/1.1"); //Not required
    // client.println("Connection: close");
    client.println();
    // note the time that the connection was made:
    lastConnectionTime = millis();
  } else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
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
  read_request();
  
  // if ten seconds have passed since your last connection,
  // then connect again and send data:
  // if (millis() - lastConnectionTime > postingInterval) {
  //   httpRequest();
  // }
  int valuedata = heartLoop();
  httpRequest(valuedata);
}
