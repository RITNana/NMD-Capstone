#include <Arduino.h>
#include <Servo.h>


#include "WiFiS3.h"


Servo servo;

const int photoresistorPin = A0;
const int buttonPin = 2;
const int servoPin = 9;

const int lightThreshold = 33;

int averageLight;

int calibrate()
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
    timer++;
  }

  averageLight = (sensorHigh + sensorLow) / 2;
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

  servo.attach(servoPin);
  servo.write(0);

  calibrate();
}

// change to tummyLoop()
int tummyLoop()
{
  // put your main code here, to run repeatedly:

  // logic
  // at a random point the servo will unlock
  // intestines will fall out so give it a delay
  // wait for the button to be pressed for like 2 seconds
  // close the servo again

  int connectionLight = analogRead(photoresistorPin);
  bool pressed = (digitalRead(buttonPin) == LOW);

  if (Serial.available() > 0)
  {
    char key = Serial.read();

    if (key == 'k' || key == 'K')
    {
      //Serial.println("opening");
      servo.write(90);
      delay(500);
    }
  }

  if (connectionLight > averageLight && pressed)
  {
    delay(500);
    servo.write(0);
    //Serial.println("closing");
  }

  int output = servo.read();
  //Serial.println(connectionLight);
  Serial.println(output);

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
    client.println("GET /tummy HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Tummy"); //Required but the input doesnt matter
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
  tummySetup();
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
  int valuedata = tummyLoop();
  httpRequest(valuedata);
}
