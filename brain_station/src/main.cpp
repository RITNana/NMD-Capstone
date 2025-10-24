
#include "WiFiS3.h"


#include <Arduino.h>

// Pin assignments
const int photoresistorPin = A0;
const int buttonPins[4] = {2, 3, 4, 5};
const int recalibratePin = 8;

// Light threshold calibration
int averageLight;
const int lightThreshold = 33;
bool lightOn = false;

// Button state tracking
int lastBtn = 5; // starts on button that doesnt exist
bool btnState[4] = {false, false, false, false};
bool lastReadState[4] = {false, false, false, false};

// Charge number
int chargeNum = 0;
const int maxCharge = 100;
const int chargeAdd = 7;
const int chargeLose = 1;

// function to calibrate the photoresistor to the room light level
void calibrate()
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
    delay(1);
    timer++;
  }
  averageLight = (sensorHigh + sensorLow) / 2;
}

void brainSetup()
{
  // Serial.begin(9600);

  // Set button pins as input pullups
  for (int i = 0; i < 4; i++)
  {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }

  calibrate();
}

int brainLoop()
{
  int lightLevel = analogRead(photoresistorPin);
  bool lightOn = lightLevel > (averageLight + lightThreshold);

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
      if (lightOn)
      {
        chargeNum += chargeAdd;
        if (chargeNum > maxCharge)
          chargeNum = maxCharge;
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
  if (!anyPress || chargeNum > 0)
  {
    chargeNum -= chargeLose;
    // keep lowest 0
    if (chargeNum < 0)
      chargeNum = 0;
  }

  // brain station photoresistor
  Serial.print("BRAIN_LIGHT:");
  Serial.print(lightOn ? "ON " : "OFF ");

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

// this method makes a HTTP connection to the server:
/* -------------------------------------------------------------------------- */
void httpRequest(int data) {
/* -------------------------------------------------------------------------- */  
  // close any connection before send a new request.
  // This will free the socket on the NINA module
  client.stop();

  // if there's a successful connection:
  if (client.connect(server, 3000)) { //Server address from above & Port
    Serial.println("connecting..."); //Really here for logging 
    // send the HTTP GET request:
    client.println("GET /brain HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Brain"); //Required but the input doesnt matter
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
  int valuedata = brainLoop();
  httpRequest(valuedata);
}
