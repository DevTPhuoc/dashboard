import win32com.client
import requests
import pythoncom

import json
from datetime import datetime
#`/timeline/by_repair_request_id?repair_request_id=${requestId}`
def get_data_history(id):
    url=f"http://10.141.13.151:5002/timeline/Outlook_history/{id}"
    response = requests.get(url)
    if response.status_code==200:
        data = response.json()
        return data
    else:
        print(f"Lỗi khi lấy dữ liệu: {response.status_code} - {response.text}")
        return None        
def split_and_render_html_tables(data):
    if not data:
        return "<p>Không có dữ liệu</p>"

    # Tìm dict có thời gian mới nhất
    latest_item = max(data, key=lambda x: datetime.strptime(x['change_timestamp'], "%Y-%m-%d %H:%M:%S"))
    remaining_items = [item for item in data if item != latest_item]

    subject = f"Equipment broken :Req ID:  {latest_item.get('repair_request_id', '')} + Department: {latest_item.get('department_name', '')} + Iden. NO (device code): {latest_item.get('device_code', '')} + Status: {latest_item.get('new_status', '')}"
    def render_table(title, items):
        if not items:
            return ""
        html = f"<h3>{title}</h3>"
        html += "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse;'>"
        html += "<tr><th>Thời gian thay đổi</th><th>Người thay đổi</th><th>Phòng ban</th><th>Mã thiết bị</th><th>Trạng thái cũ</th><th>Trạng thái mới</th><th>Ghi chú</th><th>ID yêu cầu</th></tr>"
        for item in items:
            html += "<tr>"
            html += f"<td>{item.get('change_timestamp', '')}</td>"
            html += f"<td>{item.get('changed_by', '')}</td>"
            html += f"<td>{item.get('department_name', '')}</td>"
            html += f"<td>{item.get('device_code', '')}</td>"
            html += f"<td>{item.get('old_status', '')}</td>"
            html += f"<td>{item.get('new_status', '')}</td>"
            html += f"<td>{item.get('notes', '')}</td>"
            html += f"<td>{item.get('repair_request_id', '')}</td>"
            html += "</tr>"
        
        html += "</table><br>"
        return html
 
    html_output   = ""
    html_output += render_table(" Thay đổi mới nhất", [latest_item])

    html_output += render_table(" Các thay đổi trước đó", remaining_items)

    return html_output, subject

def send_outlook_email(to, subject, body, cc=None, bcc=None, attachments=None, from_addr=None):
    pythoncom.CoInitialize()  # Khởi tạo COM cho thread hiện tại
    try:
        outlook = win32com.client.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(0)
        namespace = outlook.GetNamespace("MAPI")

        mail.To = ";".join(to) if isinstance(to, list) else to
        mail.Subject = subject
        mail.HTMLBody = body

        if cc:
            mail.CC = ";".join(cc) if isinstance(cc, list) else cc
        if bcc:
            mail.BCC = ";".join(bcc) if isinstance(bcc, list) else bcc
        if attachments:
            for file_path in attachments:
                mail.Attachments.Add(file_path)

        if from_addr:
            found = False
            for acc in namespace.Accounts:
                if acc.SmtpAddress.lower() == from_addr.lower():
                    mail._oleobj_.Invoke(*(64209, 0, 8, 0, acc))
                    found = True
                    break
            if not found:
                print(f"Không tìm thấy tài khoản Outlook với địa chỉ: {from_addr}")

        mail.Send()
        print("Email đã được gửi thành công!")
    finally:
        pythoncom.CoUninitialize()  # Giải phóng COM sau khi xong

# to=["thuyhang.dinh.ext@bureauveritas.com", "jack.doan@bureauveritas.com"]
# cc=["thuyhang.dinh.ext@bureauveritas.com","jack.doan@bureauveritas.com"]
# bcc=["jack.doan@bureauveritas.com"]
# # Ví dụ sử dụng
# data =get_data_history(12)
# data_table,subject=split_and_render_html_tables(data)
# send_outlook_email(
#     to=to,
#     subject=subject,
#     body=data_table,  # dùng bảng HTML làm nội dung
#     cc=cc,
#     bcc=bcc,
#     from_addr="jack.doan@bureauveritas.com",
#     # attachments=["C:\\Users\\Phuoc\\Documents\\file.pdf"]
# )