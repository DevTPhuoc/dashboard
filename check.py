import requests

def get_info():
    url = "http://127.0.0.1:5003/historyrepair/device_history"
    payload = {
        #  "LabId": [4],
        #"TeamId": [10],
    }
    response = requests.post(url, json=payload)  # dùng POST + json
    # print(response)
    if response.status_code == 200:
        data = response.json()
        return data
    else:
        return "loi"

print(get_info())
