#không dùng tới
import datetime
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import pandas as pd
from io import BytesIO

def mis_get_data(fromdate, todate, from_date_7days_ago, today_7day_ago, username = 'jack.doan@vn.bureauveritas.com', password = 'doan@Jack#46', sample_type = 'SL'):
    try: 
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument("--incognito")  
        options.add_argument("--window-size=1920,1080")

        service = Service()
        driver = webdriver.Chrome(service=service, options=options)
        driver.get('https://mis.bureauveritas.com/MIS/main/main.jsf')
        driver.find_element('id', 'form:loginForm:UserName').send_keys(username)
        driver.find_element('id', 'form:loginForm:Password').send_keys(password)
        
        submit_button = driver.find_element(By.ID, 'form:loginForm:submitButton')
        driver.execute_script("arguments[0].click();", submit_button)
        
        psd = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'form:j_id21::1:j_id24')))
        if not psd:
            return "Error: Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin đăng nhập."
        else:
            psd.click()
            a_hod_link = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'form:j_id29::1:j_id31')))
            a_hod_link.click()
            cookies = driver.get_cookies()
            for cookie in cookies:
                if cookie['name'] == 'JSESSIONID':
                    result_adhod = mis_search_adhod(f'JSESSIONID={cookie["value"]}', fromdate, todate)
                    result_adhod_7days = mis_search_adhod(f'JSESSIONID={cookie["value"]}', from_date_7days_ago, today_7day_ago)
                    return result_adhod, result_adhod_7days
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.ID, 'form:searchWindow1--closeButton'))).click()
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.ID, 'form:j_id21::0:j_id24'))).click()
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.ID, 'form:j_id29::12:j_id31'))).click()
            # driver.switch_to.frame(driver.find_element(By.ID, "searchFrame1"))
            # driver.switch_to.frame(driver.find_element(By.ID, "tenStepTestingIFrame"))
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.ID, 'datepicker'))).click()
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.CLASS_NAME, 'ui-datepicker-today'))).click()
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.CLASS_NAME, 'select2-selection--multiple'))).click()
            
            # checkbox = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, "//input[@class='psdNgSampleTypeListClass' and @id='2']")))
            # driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", checkbox)
            # ActionChains(driver).move_to_element(checkbox).click().perform()
            # WebDriverWait(driver,10).until(EC.presence_of_element_located((By.ID, 'showReportButton'))).click()
            
            # link = WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@onclick, 'fetchHrlyBrkpPostTestingPopUpPage')]")))
            # link.click()
            
            
            # WebDriverWait(driver, 10).until(lambda d: len(d.window_handles) > 1)
            # driver.switch_to.window(driver.window_handles[-1])
            # WebDriverWait(driver, 10).until(EC.url_contains("PostTestHrlyBrkupPopUp.htm"))
            # WebDriverWait(driver, 30).until(EC.element_to_be_clickable((By.ID, "inOutNgDownloadButton")))
            # for cookie in cookies:
            #     if cookie['name'] == 'JSESSIONID':
            #         df_post = get_post_data(today_day_first, f'JSESSIONID={cookie["value"]}')
            # return result_adhod, df_post
    except Exception as e:
        return f'Error: {str(e)}'
    finally:
        driver.quit()

def mis_search_adhod(cookie, from_date, to_date):
    try: 
        url = 'https://mis.bureauveritas.com/MIS/psdNgAjaxFormSubmit.htm'
        headers = {
            'Content-Type': 'application/json',
            'Cookie': cookie
        }
        payload = {
        "actualSubmissionType": ["0"],
        "clientType": "1",
        "dateType": "2",
        "dynamicFilterOneDetails": None,
        "dynamicFilterThreeDetails": None,
        "dynamicFilterTwoDetails": None,
        "expression": "A1",
        "fromDate": from_date,
        "labLocationId": ["46"],
        "queryType": "new",
        "sampleTypeId": ["2"],
        "saveSearchName": "",
        "searchId": None,
        "selectedCompanyId": None,
        "selectedDynamicFilterData": [
            {
                "items": [
                    {"identifier": "A1"},
                    {"attributes": None, "text": ""},
                    {"operator": "LIKE", "text": "LIKE"},
                    {"value": "", "type": "text", "subtype": "text"}
                ]
            }
        ],
        "selectedPsdColumns": [
            {
                "id": "GS1057",
                "text": "Master Sample #",
                "aliasName": None,
                "isFilter": "0",
                "cindex": 80,
                "columnName": "Master Sample #",
                "dynamicFilterColumn": None,
                "filterQuery": None,
                "psdColumnId": "GS1057",
                "queryName": "TO_CHAR(MASTER_SAMPLE.MASTER_ACTS_NO)",
                "rfColumn": "MASTER_SAMPLE",
                "rfTable": "MASTER_ACTS_NO"
            },
            {
                "id": "GS1175",
                "text": "Is Test Assigned",
                "aliasName": None,
                "isFilter": "0",
                "cindex": 64,
                "columnName": "Is Test Assigned",
                "dynamicFilterColumn": None,
                "filterQuery": None,
                "psdColumnId": "GS1175",
                "queryName": "DECODE(ACTSLAB.sf_is_test_assigned(master_sample.master_acts_no), 1, 'YES', 0, 'NO')",
                "rfColumn": None,
                "rfTable": None
            }
        ],
        "selectedSampleCheckbox": ["Logout", "WIP"],
        "toDate": to_date
    }

        response = requests.post(url=url, json=payload, headers=headers)
        data = response.json().get("psdAdhocReportEntityList", [])
        result = {}
        yes_count = sum(1 for item in data if item.get("GS1175") == "YES")
        result['total_ta_done'] = yes_count
        result['total_ta_processing'] = len(data) - yes_count
        result['total_login'] = len(data)
        result['total_ta_login_in_day_rate'] = result['total_ta_done']/result['total_login']

        return result
    except Exception as e:
        return f'Error: {str(e)}'

def get_login_ta_hour(today_str = '08-09-2025'):
    def get_hour(hour_str, i = 0):
        return hour_str.split('-')[i].strip() + 'h'
    
    ulr = 'https://mis.bureauveritas.com/MIS/PreTestHrlyBrkup.htm'
    payload = {
        'labLocationId': '46',
        'reportId': '117',
        'sampleTypeId': ['2'],
        'selectedDate': today_str,
        'tatId':'-1'
        }
    
    response = requests.post(ulr, json=payload)
    if response.status_code == 200:
        data = response.json()
        list_hour = [get_hour(data['preSampleInOutData'][0]['titleName'])]
        list_ta = [0]
        list_login = [0]
        for item in data['preSampleInOutData']:
            list_hour.append(get_hour(item['titleName'], 1))
            list_ta.append(item['tACountSPT'])
            list_login.append(item['loginCountSPT'])
    total_ta_complete = sum(map(int, list_ta))
    return {'list_hour': list_hour, 'list_ta': list_ta, 'list_login': list_login, 'total_ta_complete': total_ta_complete}

def get_post_data(today_day_first, cookie):
    url = "https://mis.bureauveritas.com/MIS/sampleInOutPostDownloadData.htm"
    headers = {'Cookie': cookie}
    data = {
                'sampleInOutPostFormData': f'{{"labLocationId":"46","sampleTypeId":["2"],"selectedDate":"{today_day_first}","tatId":"-1","reportId":"117"}}'
            }

    try:
        response = requests.post(url, headers=headers, data=data)
        excel_bytes = BytesIO(response.content)
        df = pd.read_excel(excel_bytes, skiprows=6, header=1)
        return df
    except requests.exceptions.RequestException as e:
        return f"Error: khi thực hiện request: {e}"


