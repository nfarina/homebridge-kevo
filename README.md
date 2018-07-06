
# Kevo Plugin

You MUST have a Kevo Plus for this plugin to work!

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

Kevo now provides the lock IDs from the web portal or app within the lock detail information. You can also find "lock_id" values by excluding lock_id from your config.json. When you start homebridge the next time, all "lock_id" values for your Kevo account will be printed in the logs.

NOTE: When commanding groups of locks, there will be a 15 second delay between each lock command firing because Kevo does not support rapid API requests. This causes Siri to usually say "Sorry x, I didn't hear back" as a result.
