import time
import win32com.client

def send_outlook_mail(from_addr, to_addrs, cc_addrs, subject, body, req_id,
                      attachments=None, reply_entry_id=None, reply_store_id=None):
    """
    Gửi mail qua Outlook bằng COM, có thể tái sử dụng cho nhiều nội dung khác nhau.
    Nếu có reply_entry_id + reply_store_id thì sẽ reply vào mail trước đó.
    
    Returns:
        (entry_id, store_id): để dùng cho mail sau.
    """
    outlook = win32com.client.Dispatch("Outlook.Application")
    namespace = outlook.GetNamespace("MAPI")

    # Nếu có mail trước thì lấy lại từ Sent Items
    if reply_entry_id and reply_store_id:
        prev_mail = namespace.GetItemFromID(reply_entry_id, reply_store_id)
        mail = prev_mail.Reply()
        mail.Subject = f"[REQ-{req_id}] {subject}"
        mail.HTMLBody = body + "<br><br>" + mail.HTMLBody
    else:
        mail = outlook.CreateItem(0)  # 0 = MailItem
        mail.Subject = f"[REQ-{req_id}] {subject}"
        mail.HTMLBody = body

    # Chọn account gửi
    if from_addr:
        for acc in namespace.Accounts:
            if acc.SmtpAddress.lower() == from_addr.lower():
                mail._oleobj_.Invoke(*(64209, 0, 8, 0, acc))
                break

    # Người nhận
    if to_addrs:
        mail.To = ";".join(to_addrs)
    if cc_addrs:
        mail.CC = ";".join(cc_addrs)

    # File đính kèm
    if attachments:
        for att in attachments:
            mail.Attachments.Add(att)

    # In thông tin trước khi gửi
    print(f"Mail sẽ gửi tới {mail.To}")
    mail.Send()
    time.sleep(3)#Nghỉ để load lại server tránh trường hợp nó chưa được load trong send item
    # Sau khi gửi, lấy lại từ Sent Items để có EntryID/StoreID hợp lệ
    sent_folder = namespace.GetDefaultFolder(5)  # 5 = olFolderSentMail
    last_mail = sent_folder.Items.GetLast()#Lấy mail cuối cùng với req tương tự
    entry_id = last_mail.EntryID
    store_id = last_mail.Parent.StoreID

    return entry_id, store_id

# Mail đầu tiên cho req-123
entry_id1, store_id1 = send_outlook_mail(
    from_addr="jack.doan@bureauveritas.com",
    to_addrs=["myduyen.quach.ext@bureauveritas.com"],
    cc_addrs=["thuyhang.dinh.ext@bureauveritas.com"],
    subject="Thông báo khởi tạo",
    body="<b>Xin chào</b>, đây là mail đầu tiên cho req-123",
    req_id="123"
)

# Mail tiếp theo cùng req-123, reply vào mail trước
entry_id2, store_id2 = send_outlook_mail(
    from_addr="jack.doan@bureauveritas.com",
    to_addrs=["myduyen.quach.ext@bureauveritas.com"],
    cc_addrs=["thuyhang.dinh.ext@bureauveritas.com"],
    subject="Cập nhật tiến độ",
    body="Đây là mail cập nhật tiến độ cho req-123",
    req_id="123",
    reply_entry_id=entry_id1,
    reply_store_id=store_id1
)