#include <Arduino.h>
#include <Servo.h>
#include "WiFiS3.h"


Servo eyeballServo;

int servoPin = 9;
int leftEyePin = A0;
int rightEyePin = A1;
int socketPin = A2;

int count = 0;

const int lightThreshold = 33;

//temp var
int countTurn = 0;

enum State
{
  IDLE,
  DROP,
  WAIT_FOR_RETURN,
  RESTORE,
  COOLDOWN
};
State state = IDLE;

int averageLightLeft;
int averageLightRight;
int averageLightSocket;
// function to calibrate the photoresistor to the room light level
int calibrate(int resistorPin) {
  int sensorLow = 1000;
  int sensorHigh = 0;
  int timer = 0;

  while (timer < 1000) {
    int calibratingLightValue = analogRead(resistorPin);
    if (calibratingLightValue > sensorHigh) {
      sensorHigh = calibratingLightValue;
    }
    if (calibratingLightValue < sensorLow) {
      sensorLow = calibratingLightValue;
    }
    timer++;
  }
  if(resistorPin == A0){
    averageLightLeft = (sensorHigh + sensorLow)/2;
  }
  else if(resistorPin == A1){
    averageLightRight = (sensorHigh + sensorLow)/2;
  }
  else if(resistorPin = A2){
    averageLightSocket = (sensorHigh + sensorLow)/2;
  }
  
}


void eyeballSetup()
{
  // Serial.begin(9600);
  // delay(200);
  while (!Serial)
  { /* wait on native USB boards */
  }

  //Serial.println("Booting...");

  eyeballServo.attach(servoPin);
  eyeballServo.write(0);

  calibrate(leftEyePin);
  calibrate(rightEyePin);
  calibrate(socketPin);
}

int eyeballLoop()
{

  int leftLight = analogRead(leftEyePin);
  int rightLight = analogRead(rightEyePin);

  int connectionLight = analogRead(socketPin);

  //if(connectionLight > (averageLightSocket-20)){
  //  Serial.print("Connected | ");
  //}
  //else{
  //  Serial.print("Not Connected | ");
  //}

  // Print the readings to the console
  //Serial.print("Left: ");
  //Serial.print(leftLight);
  //Serial.print(" | Right: ");
  //Serial.println(rightLight);

  if (Serial.available() > 0) {
    char key = Serial.read(); // read one character

    // if (key == 'k' || key == 'K') {
    if(countTurn == 0){ //NTS Change this condition
      //Serial.println("Command: Turn servo to 180°");
      eyeballServo.write(180);
      delay(500); 
      count = 0;
      calibrate(averageLightLeft);
      calibrate(averageLightRight);
      countTurn = 1;
    }
  }

  bool preconditions = (count == 0) && (connectionLight > (averageLightSocket));
  if (leftLight < averageLightLeft && rightLight < averageLightRight && preconditions) {
    //Serial.println("Low light detected! Returning to initial position...");

    // Smoothly move back to 0°
    for (int pos = 180; pos >= 0; pos--) {
      eyeballServo.write(pos);
      delay(10);  // slow movement
    }
    count = 1;
    calibrate(averageLightLeft);
    calibrate(averageLightRight);
  }

  delay(200);

  int eyeAngle = eyeballServo.read();

  Serial.println(eyeAngle);

  return eyeAngle;
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
    // Serial.println("connecting..."); //Really here for logging 
    // send the HTTP GET request:
    client.println("GET /eyeball HTTP/1.1"); //GET request at '/' using HTTP/1.1
    client.println("Host: Eyeball"); //Required but the input doesnt matter
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
  int valuedata = eyeballLoop();
  httpRequest(valuedata);
}
