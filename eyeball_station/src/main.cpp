#include <Arduino.h>
#include <Servo.h>
#include "WiFiS3.h"

Servo eyeballServo;

int servoPin = 9;
int leftEyePin = A0;
int rightEyePin = A1;
int socketPin = A2;

int output;

int count = 0;

const int lightThreshold = 33;

int averageLightLeft;
int averageLightRight;
int averageLightSocket;
int eyeCondition;

const int sockHyst = 10; // hysteresis for socket "connected" threshold
const int eyeHyst = 0;

// function to calibrate the photoresistor to the room light level
void calibrate(int resistorPin)
{
  int sensorLow = 1000;
  int sensorHigh = 0;
  int timer = 0;

  while (timer < 1000)
  {
    int calibratingLightValue = analogRead(resistorPin);
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
  if (resistorPin == A0)
  {
    averageLightLeft = (sensorHigh + sensorLow) / 2;
  }
  else if (resistorPin == A1)
  {
    averageLightRight = (sensorHigh + sensorLow) / 2;
  }
  else if (resistorPin == A2)
  {
    averageLightSocket = (sensorHigh + sensorLow) / 2;
  }
}
String go = "false";
void eyeballSetup()
{
  Serial.begin(9600);
  delay(200);
  // while (!Serial)
  //{ /* wait on native USB boards */
  // }

  eyeballServo.attach(servoPin);
  eyeballServo.write(0);

  calibrate(leftEyePin);
  delay(200);
  calibrate(rightEyePin);
  delay(200);
  calibrate(socketPin);

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

void popout(){

  if (Serial.available() > 0)
  {
    char key = Serial.read();
  }
  if (go == "true")
    {

      eyeballServo.write(90);
      delay(500);
      eyeballServo.write(0);
      delay(500);

      eyeCondition = 0;

      // Serial.println("Command: Turn servo to 180°");
      // eyeballServo.write(90);
      // delay(500);
      count = 0;
      output = 0;
      //calibrate(leftEyePin);
      //calibrate(rightEyePin);
      go = "false";
    }
}

int eyeballLoop()
{

  int leftLight = analogRead(leftEyePin);
  int rightLight = analogRead(rightEyePin);

  int connectionLight = analogRead(socketPin);

  bool connected = connectionLight > (averageLightSocket + sockHyst);

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
  if (eyeCondition == 0)
  {
    // go to 1 when both eyes are covered
    if (eyesCovered(leftLight, rightLight))
    {
      eyeCondition = 1;
    }
  }
  else if (eyeCondition == 1)
  {
    // if eyes become bright:
    if (eyesBright(leftLight, rightLight))
    {
      if (connected)
      {
        // socket light present -> OK to go back to 0
        eyeCondition = 0;
      }
      else
      {
        // socket dark -> latch "popped out"
        eyeCondition = 2;
      }
    }
    // (stay 1 if still covered)
  }
  else if (eyeCondition == 2)
  {
    // popped out: must see socket light before allowing return to 0
    if (connected && eyesBright(leftLight, rightLight))
    {
      eyeCondition = 0;
    }
    // user can cover again anytime -> show 1
    else if (eyesCovered(leftLight, rightLight))
    {
      eyeCondition = 1;
      output += 2;
    }
    else{
      return 0; //This is to prevent the 2 from triggering completion
    }
  }

  // delay(200);
  //Serial.print(" | eyeCondition=");
  Serial.println(eyeCondition);
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
      go = (String)value;
      // Serial.print(String(go));
      popout();
    }
  }
}

/* just wrap the received data up to 80 columns in the serial print*/
/* -------------------------------------------------------------------------- */
void read_request() { //Purpose is to read the response from the server and send the body to where it can be parsed
/* -------------------------------------------------------------------------- */  
  uint32_t received_data_num = 0;
  char response[12]; //have it so it buffers as much as possible
  int index = 0;
  bool bodyStarted = false;
  String line = "";

  // Wait for server data
  unsigned long timeout = millis();
  while (!client.available() && millis() - timeout < 2000) {
    delay(10);
  }

  // Read and print all available characters
  if (client.connected()) {
    while (client.available()) {
      char c = client.read();

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
  }
  response[index] = '\0';  // Null-terminate C string

  parsing((char*)response);

  // Serial.println("\n--- End of Response ---"); 
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
