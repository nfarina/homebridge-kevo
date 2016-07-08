
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

Find "lock_id" values by logging in to your Kevo account on a web browser, then inspecting the page source and looking for "data-lock-id". The surrounding pieces of data should identify which lock is which.

NOTE: When modifying lock state rapidly or as a group, only the first request will work. The lock state must be modified with a short gap in between requests. This is true even on Kevo's own website when attempting to modify the state of multiple locks at once.