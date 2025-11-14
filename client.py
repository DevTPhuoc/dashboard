import requests

url = "http://10.141.14.130:5002/repair_requests"

print(requests.get(url).text)
