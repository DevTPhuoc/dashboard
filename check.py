import requests
def get_ruote():
    url="http://127.0.0.1:5003/historyrepair/device_history?lab_id=4&limit=10"
    response = requests.get(url)
    if response.status_code==200:
        data = response.text
        return data
    else:
        print("loi khi lay data")
print(get_ruote())