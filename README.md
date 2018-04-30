
# Kevo Plugin

Example config.json:

    {
      "accessories": [
        {
            "accessory": "Kevo",
            "name": "Front Door",
            "username": "test@example.com",
            "password": "<your kevo password>",
            "lock_id": "<your lock id>"
        },
        {
            "accessory": "Kevo",
            "name": "Back Door",
            "username": "test@example.com",
            "password": "<your kevo password>",
            "lock_id": "<your lock id>"
        },
      ]
    }

Find "lock_id" values by excluding lock_id from your config.json. When you start homebridge the next time, all "lock_id" values for your Kevo account will be printed in the logs.

NOTE: When commanding groups of locks, there will be a 15 second delay between each lock command firing because Kevo does not support rapid API requests. This causes Siri to usually say "Sorry x, I didn't hear back" as a result.

Basic SETUP instructions:

**Basic Setup Guide**
Guide is for a Raspberry Pi 3 (ARM7 chip set):
**REQUIREMENTS:**
Kevo lock
Kevo Plus 
Raspberry Pi 3 (with SD card)
iOS device (iPhone / iPad) – needed to control the lock at home 
Windows computer (*for SSH access to Raspberry Pi via SSH and PuTTy)

**OPTIONAL:** 
iOS device (iPad at least Gen 4 / AppleTV) – needed only for off-site access
Apple Watch - *Hey Siri capabilities for unlocking a device without unlocking your iPad/iPhone
**ASSUMPTIONS:**
You already have Kevo and Kevo plus installed and working. 

**LETS START!**
You will first need to flash your SD card with Raspbian (I used Raspbian Stretch Lite)

Let’s open this guide for imaging the SD card and using SSH on windows: 
 *STOP using this guide after: 
```
sudo apt-get update
sudo apt-get upgrade
```

http://www.mysmartcave.net/2017/08/25/adding-siri-functionality-to-smartthings-using-a-raspberry-pi-homebridge/
If you followed the guide above, you are able to login into you Raspberry Pi via SSH.

We are now going to jump to this set of directions: 
https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi
Starting at the command line:

> `sudo apt-get install git make`


We are using Raspbian so skip down to:

`curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -`
`sudo apt-get install -y nodejs`

Now skip to:
`sudo apt-get install libavahi-compat-libdnssd-dev`

Now switch guides to: 
https://github.com/nfarina/homebridge/blob/master/README.md
`sudo npm install -g --unsafe-perm homebridge`

If it ERRORS run this: 
```
sudo npm install -g --unsafe-perm homebridge hap-nodejs node-gyp
cd /usr/lib/node_modules/homebridge/
sudo npm install --unsafe-perm bignum
cd /usr/lib/node_modules/hap-nodejs/node_modules/mdns
sudo node-gyp BUILDTYPE=Release rebuild
```
You should now be able to run Homebridge (*but will ERROR on missing config.json)

Next step is to install the Kevo plugin and config.json
Installing the config.json

```
cd ~/.homebridge
sudo nano config.json
```

```
{
“bridge”: {
“name”: “Homebridge”,
“username”: “DD:22:AA:44:55:66”,
“port”: 51822,
“pin”: “031-45-154”
}
}

```
ALWAYS verify your Config.json here: https://jsonlint.com/
Re-run homebridge and confirm you have a working config.json
Now it’s time to install our Kevo plug-in: 
sudo npm install -g homebridge-kevo

We will also need to modify our config.json one more time
```
cd ~/.homebridge
sudo nano config.json
```

```
{
	"bridge": {
		"name": "Homebridge",
		"username": "DD:22:AA:44:55:66",
		"port": 51822,
		"pin": "031-45-154"
	},

	"accessories": [{
		"accessory": "Kevo",
		"name": "FRONT",
		"username": "your-email-address-for-kevo@gmail.com",
		"password": "your-password",
		"lock_id": "your-lock-id"
	}]
}
```
Save your config.json:

```
Ctrl+O
Enter key
Ctrl+X
```

*Your LOCK ID is easy to get in the iOS kevo app under LOCK INFO you can also get it by omitting it in your config.json as described here:  https://github.com/nfarina/homebridge-kevo

Rerun Homebridge

To setup Homebridge on iOS watch this video starting at: 11:55 (*you have a different plugin so yours will be different) https://www.youtube.com/watch?v=g4Smfn1Q5Qc
You can also follow this guide for iOS setup: http://www.mysmartcave.net/2017/08/25/adding-siri-functionality-to-smartthings-using-a-raspberry-pi-homebridge/

Guide to auto load homebridge on Rasbian boot-up:
https://timleland.com/setup-homebridge-to-start-on-bootup/

For remote offsite access you will need to setup AppleTV or a iPad (*Gen 4 or greater) as a hub!

Hope this helps others!
