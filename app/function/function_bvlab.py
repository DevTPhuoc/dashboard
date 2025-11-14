#không dùng tới
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import pandas as pd

def login_bvlab(username, password, session):
    login_url = "https://bvlabng.bureauveritas.com/BVLabNG/web/main/login.faces"
    headers = {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "vi,en;q=0.9,vi-VN;q=0.8,en-US;q=0.7,fr-FR;q=0.6,fr;q=0.5",
        "cache-control": "max-age=0",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "application/x-www-form-urlencoded",
        "referer": login_url,
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    }

    response = session.get(login_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    viewstate_input = soup.find('input', {'name': 'javax.faces.ViewState'})
    viewstate = viewstate_input['value']
    login_data = {
        "loginForm": "loginForm",
        "loginForm:login": username,
        "loginForm:password": password,
        "loginForm:j_id5": "Login",
        "javax.faces.ViewState": viewstate
    }

    login_response = session.post(login_url, data=login_data, headers=headers)
    
    soup = BeautifulSoup(login_response.text, 'html.parser')

    login_form = soup.find('form', {'id': 'loginForm'})

    if not login_form:
        cookies = session.cookies
        cookie_str = '; '.join([f'{key}={value}' for key, value in cookies.items()])
        return cookie_str
    else:
        return("Lỗi: Đăng nhập không thành công")

def get_cookie_from_id(session, id = "2085404"):
    try: 
        url = "https://bvlabng.bureauveritas.com/Adhoc_Query1_AWS//NonARGNGAPServlet"
        params = {
            "id": id,
            "target": "/web/Query/adhocQueryBody.faces",
            "amCode": "",
            "pendingFieldMsNo": ""
        }
        response = session.get(url, params=params)
        cookies = session.cookies
        cookie_str = '; '.join([f'{key}={value}' for key, value in cookies.items()])
        return cookie_str
    except Exception as e:
        return f"Error: getting cookie: {e}"

def get_qty(rpno):
    try:
        url = "https://bvlabng-pr.bureauveritas.com/Adhoc_Query1_AWS/web/main/adhoc/individualDetails.htm"
        payload = {"action": "SEARCH",
                "companyId": "9030",
                "currentMode":"view",
                "masterActsNo": rpno,
                "msSubmitterId":"0"}
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            result =  data["individualFix"]["individualSamples"][rpno]["IS_SAMPLE_QTY_DESC"]
            if result is None: result = ""
            return result
        else:
            return f"error: {response.status_code}"
    except Exception as e:
        return f"error: getting quantity: {e}"

def get_status(rpno):
    try:
        url = "https://bvlabng-pr.bureauveritas.com/Adhoc_Query1_AWS/web/main/adhoc/statusDetails.htm"
        payload = {"indiCheck":"1",
                "isampleNo": rpno,
                "sampleNo": rpno}
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            status = data["statusHistory"][0]["STATUS"]
            if status in ["CANCEL", "VOID", "OMIT"]:
                act_rp_due = data["statusHistory"][0]["SA_MODIFIED_DATE"]
            else:
                act_rp_due =  data["Msdates"][0]["MSACTREPORT"]
            return  status, act_rp_due
        else:
            return f"error: {response.status_code}", f'error: {response.status_code}'
    except Exception as e:
        return f"error: getting status: {e}", f"error: getting act report due: {e}"

def get_submitting_for(rpno):
    try:
        url = "https://bvlabng-pr.bureauveritas.com/Adhoc_Query1_AWS/web/main/adhoc/basicDetails.htm"
        payload = {"sampleNo": rpno}
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data["basic"]['SUBMITTING_FOR']
        else:
            return f"error: {response.status_code}"
    except Exception as e:
        return f"error: getting submitting for: {e}"

def get_wip(cookie, logout_today = False):
    today = datetime.today().strftime('%m/%d/%Y')
    if logout_today:
        status_id = [8]
        from_day = today
        date_field = "MS_ACT_REPORT_DUE_DATE"
        additional_field_list = [{"CONDITION": "And", 
                             "FIELD_ID": "125", 
                             "FIELD_NAME": "ms_act_report_due_date", 
                             "OPERATOR": "=", 
                             "TABLE_NAME":"MASTER_SAMPLE",
                             "TEXTTYPE": "Date", 
                             "VALUE": today
                             }]
    else:
        status_id = [1, 3, 2, 10, 9]
        from_day = "01/01/2021"
        date_field = "MS_RECEIVED_DATE"
        additional_field_list = [{"CONDITION": "And", 
                             "FIELD_ID": "125", 
                             "FIELD_NAME": "ms_act_report_due_date", 
                             "OPERATOR": "=", 
                             "TABLE_NAME":"MASTER_SAMPLE",
                             "TEXTTYPE": "Date", 
                             "VALUE": None
                             }]
    url = "https://bvlabng.bureauveritas.com/Adhoc_Query1_AWS/web/main/adhoc/advanceSearch.htm"
    headers = {"cookie": cookie}
    payload = {
    "actSubmissionType": [],
    "additionalFieldList": additional_field_list,
    "agency": None,
    "complementaryRush": None,
    "countOnly": True,
    "countValue": 2,
    "cpdLocation": [46],
    "cvo": True,
    "dateField": date_field,
    "dateFrom": from_day,
    "dateOption": "3",
    "dateTo": today,
    "diffSearchType": 2,
    "dynamicColumn": [
        {"label": "Status", "colId": "STATUS", "dyQuery": "STA"},
        {"label": "Est.Report Due Date", "colId": "ESTREPORTDUEDATE", "dyQuery": "MS"},
        {"label": "Act. Report Due Date", "colId": "ACTREPORTDUEDATE", "dyQuery": "MS"}
    ],
    
    "dynamicColumnAll": [
        {"label": "Status", "colId": "STATUS", "dyQuery": "STA"},
        {"label": "Est.Report Due Date", "colId": "ESTREPORTDUEDATE", "dyQuery": "MS"},
        {"label": "Act. Report Due Date", "colId": "ACTREPORTDUEDATE", "dyQuery": "MS"}
    ],
    "groupCompany": [],
    "internalExpress": None,
    "itemNo": None,
    "limitValue": 100,
    "loggedInBy": [],
    "mainDescription": None,
    "overallResult": [],
    "pendingFieldConfirmation": None,
    "poNo": None,
    "pretestFor": [],
    "program": [],
    "refType": 1,
    "sampleType": [2],
    "serviceLevel": [],
    "sknSku": None,
    "sourceLocation": [],
    "startValue": 1,
    "statusId":  status_id,
    "styleDescription": None,
    "styleNo": None,
    "submissionType": [],
    "submitter": [],
    "submittingFor": [],
    "upcNo": None,
    "vendor": None
}

    response = requests.post(url, json=payload, headers=headers)
    try: 
        df = response.json()['data']
        return pd.DataFrame(df)
    except Exception as e:
        return f"Error: writing file: {e}"

def get_cookie_history_scan(id = '2042309'):
    url = 'https://bvlabng.bureauveritas.com/BVLabNG_JB_IN1_AWS//NonARGNGAPServlet'
    payload = {
        'id': id, 
        'target': '/web/Query/TrackingHistoryMigration.faces',
        'amCode': '',
        'pendingFieldMsNo': ''
        
    }
    
    response = requests.get(url=url, params=payload)
    try:
        cookies = response.cookies
        cookie_str = '; '.join([f'{key}={value}' for key, value in cookies.items()])
        return cookie_str
    except Exception as e:
        return f"Error: getting cookie history scan: {e}"

def get_history_scan(cookie, rpno):
    url = 'https://bvlabng.bureauveritas.com/BVLabNG_JB_IN1_AWS/web/main/trackingHis/do-search.htm'
    payload = {
        'beginScnDate': None,
        'endScnDate': None,
        'masterActsNo': rpno,
        'sampleNo': rpno,
        'searchBy': 0,
        'sampleLoginParams': {
            'action': 'SEARCH',
            'companyId': '9030',
            'currentMode': 'view',
            'msSubmitterId': '0'
        }
    }
    headers = {
        'Cookie': cookie
    }
    response = requests.post(url, json=payload, headers=headers)
    
    try:
        data = response.json()['hisData']
        return data
    except Exception as e:
        return f"Error: getting history scan: {e}"

def get_1st_logout_time_status_audit(rpno):
    url = 'https://bvlabng.bureauveritas.com/BVLabNG_JB_IN1_AWS//NonARGNGAPServlet'
    params = {
        'id': '2042309', 
        'target': '/web/Query/StatusResultAuditFormBody.faces', 
        'amCode': '', 
        'pendingFieldMsNo': ''
    }
    
    response = requests.get(url, params=params)
    soup = BeautifulSoup(response.text, 'html.parser')
    view_state =  soup.find('input', {'name': 'javax.faces.ViewState'})['value']
    cookies = response.cookies
    cookie = '; '.join([f'{key}={value}' for key, value in cookies.items()])
    
    url = 'https://bvlabng.bureauveritas.com/BVLabNG_JB_IN1_AWS/web/Query/StatusResultAuditFormBody.faces'
    payload = {
        'statusResultAudit': 'statusResultAudit', 
        'statusResultAudit:sampleNo': rpno, 
        'statusResultAudit:auditType': '1', 
        'statusResultAudit:sampleType': '1', 
        'statusResultAudit:search': 'Search (Alt+F)', 
        'javax.faces.ViewState': view_state
    }
    header = {
        'Cookie': cookie
    }

    response = requests.post(url, data=payload, headers=header)
    soup = BeautifulSoup(response.text, 'html.parser')
    result_div = soup.find('div', id='resultContainer')
    table = result_div.find('table')
    tbody = table.find('tbody')
    rows = tbody.find_all('tr')
    
    for row in reversed(rows):
        desc_div = row.find('div', class_='desc')
        if desc_div and 'LOGGED' in desc_div.get_text(strip=True):
            td_col3 = row.find('td', class_='col3')
            return td_col3.get_text(strip=True)
    return '0'
    
