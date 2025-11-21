from warnings import filters
from flask import Blueprint, json, jsonify, request
from models.models import RepairHistory, RepairRequest, Device, Quotation, QuoteOption,PA, RepairStatusHistory, Team, Lab, Status, QuotationHistory, Approval,DisposalDocument
from app.models import User
from app import db
from app.routes import auth 
from datetime import date, datetime
import os   # để xử lý đường dẫn lưu file
from flask import request, jsonify  # để nhận form data + trả JSON response
from werkzeug.utils import secure_filename  # để 
from flask import current_app
from sqlalchemy import  case, exists, func, or_, and_
from datetime import datetime, timedelta
import os



from flask_login import current_user


repair_request_bp = Blueprint("repair_request_api", __name__)
quotation_bp = Blueprint("quotation_bp", __name__)
global_bp = Blueprint("global_bp", __name__)
# -------------------------
# Lấy danh sách yêu cầu sửa chữa
# -------------------------
@repair_request_bp.route("/api/repair-requests", methods=["GET"])
def get_repair_requests():
    status_filter = request.args.get("status")  # quoted / approved / all
    device_name = request.args.get("device_name", type=str)  # 🔍 thêm dòng này
    search_term = request.args.get("search", "").strip()  # 🔍 thêm dòng này

    query = (
        db.session.query(RepairRequest, Device)
        .join(Device, RepairRequest.DeviceID == Device.id)
    )
    if device_name:
        query = query.filter(Device.DeviceName.ilike(f"%{device_name}%"))
    if search_term:
        query = query.filter(Device.DeviceName.ilike(f"%{search_term}%"))


    # Lọc theo trạng thái của quotation
    if status_filter in ["quoted", "approved","confirmed", "cancelled", "approved_first"]:
        query = query.join(Quotation, Quotation.RequestID == RepairRequest.id)
        if status_filter == "quoted":
            query = query.filter(
                (Quotation.status == "pendingquoting") | (RepairRequest.Status == "PendingApproval")
            )
            
        elif status_filter == "approved_first":
            query = query.filter(Quotation.status.in_(["Approved", "confirmed"]))
        elif status_filter == "approved":
            query = query.filter(Quotation.status == "Approved")
        elif status_filter == "confirmed":
            query = query.filter(Quotation.status == "confirmed")
        elif status_filter == "cancelled":
            query = query.filter(Quotation.status == "cancelled")

    results = query.all()

    data = []

    for req, device in results:
        quotation = Quotation.query.filter_by(RequestID=req.id).first()
        user = User.query.get(req.RequestedBy) if hasattr(req, 'RequestedBy') else None
        requested_by_name = user.username if user else "Unknown"
        tat_days = (date.today() - req.RequestDate.date()).days if req.RequestDate else None
        #them
        approved_option_id = None
        if quotation:
            approved_option = QuoteOption.query.filter_by(
                quotation_id=quotation.id, status="Approved"
            ).first()
            approved_option_id = approved_option.id if approved_option else None
        data.append({
            "request_id": req.id,
            "device_name": device.DeviceName,
            "device_code": device.DeviceCode,
            "requested_by": req.RequestedBy,
            
            "lab_id": req.LabID,
            "team_id": req.TeamID,
            "team_name": Team.query.get(req.TeamID).TeamName if req.TeamID else None,
            "lab_name": Team.query.get(req.LabID).lab.LabName if req.LabID else None,
            "description": req.Description,
            "status": req.Status or "",
            "request_date": f"{tat_days} ngày" if tat_days is not None else None,
            "quotation_id": quotation.id if quotation else None,
            "quotation_status": quotation.status if quotation else None,
            "options_count": len(quotation.options) if quotation else 0,
            
            "approved_option": quotation.approved_option_no if quotation else None,
            "approved_option_id": approved_option_id,
             "approved_date": quotation.em_apr_date
                          if quotation and quotation.status == "Approved" and quotation.em_apr_date else None,
            "approved_by": quotation.user2_id if quotation else None

        })

    return jsonify(data)


# -------------------------
# Gửi báo giá cho yêu cầu
# -------------------------


# -------------------------
# Phê duyệt hoặc từ chối yêu cầu
# -------------------------
@repair_request_bp.route("/api/<int:request_id>/approve", methods=["POST"])
def approve_request(request_id):
    req = RepairRequest.query.get_or_404(request_id)
    data = request.get_json() or {}

    action = data.get("action", "approve").lower()
    if action not in ["approve", "reject"]:
        return jsonify({"error": "Invalid action"}), 400

    req.Status = "approved" if action == "approve" else "rejected"
    req.Notes = data.get("notes")

    db.session.commit()
    return jsonify({"message": f"Request {req.Status}", "id": req.id})


# -------------------------
# Lấy danh sách tất cả báo giá
# -------------------------
# -------------------------
# Lấy danh sách tất cả báo giá (kèm option con)

# -------------------------
# Lấy danh sách tất cả báo giá (kèm option con)
# -------------------------
@repair_request_bp.route("/api/quotations", methods=["GET"])
def get_quotations():
    quotations = Quotation.query.all()
    grouped = []
    for q in quotations:
        req = RepairRequest.query.get(q.RequestID)
        device = Device.query.get(req.DeviceID) if req else None
        user = User.query.get(req.RequestedBy) if req else None
        requested_by_name = user.username if user else "Unknown"
        # Hiển thị từng option là một dòng trong danh sách đã gửi báo giá
        for opt in q.options:
            grouped.append({
                "request_id": q.RequestID,
                "device_name": device.DeviceName if device else "Unknown",
                "requested_by": requested_by_name,
                "quotation_id": q.id,
                "quotation_status": q.status,
                "approved_option_no": q.approved_option_no,
                "option_id": opt.id,
                "option_no": opt.option_no,
                "vendor_name": opt.vendor_name,
                "quantity": opt.quantity,
                "unit_price": float(opt.unit_price),
                "total_cost": opt.total_cost,
                "file_url": opt.file_url,
                "notes": opt.notes,
                "option_status": opt.status
            })
    return jsonify(grouped)

@repair_request_bp.route("/api/<int:request_id>/quote", methods=["POST"])
def send_quote(request_id):
    data = request.form
    if not data:
        return jsonify({"error": "No data provided"}), 400
    req = RepairRequest.query.get_or_404(request_id)

    try:
        quotation = Quotation(
            RequestID=req.id,
            status=current_app.config['WAIT_EM_MANAGER_APPROVAL_QUOTATION']
        )
        db.session.add(quotation)
        db.session.flush()

        idx = 1
        while f"options[{idx-1}][vendor_name]" in request.form:
            vendor_name = request.form.get(f"options[{idx-1}][vendor_name]")
            unit_price = request.form.get(f"options[{idx-1}][unit_price]")
            notes = request.form.get(f"options[{idx-1}][notes]")

            file = request.files.get(f"options[{idx-1}][file]")
            file_url = None
            if file:
                # Lấy đường dẫn động theo thư mục static
                static_folder = current_app.static_folder  # VD: .../app/static
                word_folder = os.path.join(static_folder, "WORD")
                os.makedirs(word_folder, exist_ok=True)  # Tự tạo nếu chưa có
                
                # xử lý lại tên file
                name, ext = os.path.splitext(file.filename)
                filename = secure_filename(f"{name}_{request_id}_{idx}_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}{ext}")
                file.filename = filename
                save_path = os.path.join(word_folder, file.filename)
                
                file.save(save_path)

                # Đường dẫn public để hiển thị file
                file_url = f"/static/WORD/{file.filename}"


            option = QuoteOption(
                quotation_id=quotation.id,
                option_no=idx,
                vendor_name=vendor_name,
                unit_price=float(unit_price or 0),
                quantity=1,  # default

                file_url=file_url,
                quotation_note=notes,
                status=current_app.config['WAIT_EM_MANAGER_APPROVAL_QUOTATION']
            )
            db.session.add(option)

            idx += 1
        req.ChangeByUsername = current_user.username
        req.Status = current_app.config['WAIT_EM_MANAGER_APPROVAL_QUOTATION']
        db.session.add(req)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "message": "Quotation created",
        "quotation_id": quotation.id
    })


# -------------------------
# Lấy chi tiết báo giá theo request_id
# -------------------------
@repair_request_bp.route("/api/<int:request_id>/quotations", methods=["GET"])
def get_quotation_detail(request_id):
    req = RepairRequest.query.get_or_404(request_id)
    quotations = Quotation.query.filter_by(RequestID=request_id).all()
    device = Device.query.get(req.DeviceID)
    user = User.query.get(req.RequestedBy)

    options = []
    for q in quotations:
        for opt in q.options:
            options.append({
                "option_id": opt.id,
                "option_no": opt.option_no,
                "vendor_name": opt.vendor_name,
                "quantity": opt.quantity,
                "unit_price": float(opt.unit_price),
                "total_cost": opt.total_cost,
                "file_url": opt.file_url,
                "notes": opt.quotation_note,
                "status": opt.status,
                "LM_Notes" : opt.lab_note,
                "EM_Notes" : opt.em_note
            })

    data = {
        "request_id": req.id,
        "description": req.Description,
        "device_name": device.DeviceName if device else "Unknown",
        "requested_by": user.username if user else "Unknown",
        "options": options[:3]  # giới hạn tối đa 3 option
    }
    return jsonify(data)



@repair_request_bp.route("/api/<int:request_id>/quotations/update", methods=["PUT"])
def update_quote(request_id):
    req = RepairRequest.query.get_or_404(request_id)

    # Lấy dữ liệu từ FormData
    options_data = []
    try:
        idx = 0
        while f"options[{idx}][vendor_name]" in request.form:
            opt = {
                "option_id": request.form.get(f"options[{idx}][option_id]"),
                "option_no": request.form.get(f"options[{idx}][option_no]"),  # có thể None
                "vendor_name": request.form.get(f"options[{idx}][vendor_name]"),
                "quantity": int(request.form.get(f"options[{idx}][quantity]", 1)),
                "unit_price": float(request.form.get(f"options[{idx}][unit_price]", 0)),
                "quotation_note": request.form.get(f"options[{idx}][notes]"),
                "file_url": request.form.get(f"options[{idx}][file_url]"),
            }

            # Nếu có file upload
            file = request.files.get(f"options[{idx}][file]")
            if file:
                
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                filename = secure_filename(f"{name}_{request_id}_{idx}_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}{ext}")
# 
                #  Thay vì fix cứng, dùng đường dẫn theo Flask app
                upload_folder = os.path.join(current_app.root_path, "static", "WORD")
                os.makedirs(upload_folder, exist_ok=True)

                filepath = os.path.join(upload_folder, filename)
                file.save(filepath)

                #  Đường dẫn trả về cho frontend
                opt["file_url"] = f"/static/WORD/{filename}"

            options_data.append(opt)
            idx += 1
    except Exception as e:
        return jsonify({"error": f"Lỗi đọc form data: {str(e)}"}), 400

    if not options_data:
        return jsonify({"error": "No options provided"}), 400
    if len(options_data) > 3:
        return jsonify({"error": "Maximum 3 options allowed"}), 400

    try:
        quotation = Quotation.query.filter_by(RequestID=req.id).first()
        if not quotation:
            return jsonify({"error": "Quotation not found"}), 404

        new_options = []

        for opt in options_data:
            option_id = opt.get("option_id")

            if option_id:  # update option cũ
                existing_opt = QuoteOption.query.filter_by(
                    id=option_id, quotation_id=quotation.id
                ).first()
                if existing_opt:
                    old_url = existing_opt.file_url
                    # Nếu có file mới upload, xoá file cũ
                    if opt.get("file_url") and old_url:
                        try:
                            old_filepath = os.path.join(current_app.root_path, old_url.lstrip("/"))
                            if os.path.exists(old_filepath):
                                os.remove(old_filepath)
                        except Exception as e:
                            ...
                    if not opt.get("file_url") and old_url:
                        try:
                            old_filepath = os.path.join(current_app.root_path, old_url.lstrip("/"))
                            if os.path.exists(old_filepath):
                                os.remove(old_filepath)
                        except Exception as e:
                            ...

                    existing_opt.vendor_name = opt.get("vendor_name")
                    existing_opt.quantity = opt.get("quantity", 1)
                    existing_opt.unit_price = opt.get("unit_price", 0)
                    existing_opt.file_url = opt.get("file_url")
                    existing_opt.quotation_note = opt.get("quotation_note")
                    existing_opt.status = opt.get("status", existing_opt.status)
                    db.session.add(existing_opt)

                    new_options.append({
                        "option_id": existing_opt.id,
                        "option_no": existing_opt.option_no,
                        "vendor_name": existing_opt.vendor_name,
                        "quantity": existing_opt.quantity,
                        "unit_price": float(existing_opt.unit_price),
                        "file_url": existing_opt.file_url,
                        "quotation_note": existing_opt.quotation_note,
                        "status": existing_opt.status
                    })
                else:
                    return jsonify({"error": f"Option {option_id} not found"}), 404
            else:  # thêm option mới
                # Tự sinh option_no
                last_option = QuoteOption.query.filter_by(
                    quotation_id=quotation.id
                ).order_by(QuoteOption.option_no.desc()).first()
                new_option_no = (last_option.option_no + 1) if last_option else 1

                new_option = QuoteOption(
                    quotation_id=quotation.id,
                    option_no=new_option_no,
                    vendor_name=opt.get("vendor_name"),
                    quantity=opt.get("quantity", 1),
                    unit_price=opt.get("unit_price", 0),
                    file_url=opt.get("file_url"),
                    quotation_note=opt.get("quotation_note"),
                    status= current_app.config['WAIT_EM_MANAGER_APPROVAL_QUOTATION']
                )
                db.session.add(new_option)
                db.session.flush()

                new_options.append({
                    "option_id": new_option.id,
                    "option_no": new_option.option_no,
                    "vendor_name": new_option.vendor_name,
                    "quantity": new_option.quantity,
                    "unit_price": float(new_option.unit_price),
                    "file_url": new_option.file_url,
                    "quotation_note": new_option.quotation_note,
                    "status": new_option.status
                })

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "message": "Quotation updated",
        "quotation_id": quotation.id,
        "options_count": len(new_options),
        "options": new_options
    })


@repair_request_bp.route("/api/<int:request_id>/quotations/delete", methods=["DELETE"])
def delete_quotation(request_id):
    quotation = Quotation.query.filter_by(RequestID=request_id).first()
    quotation_option = QuoteOption.query.filter_by(quotation_id=quotation.id).all()
    
    # duyệt qua từng option để xoá file nếu có
    for option in quotation_option:
        if option.file_url:
            try:
                file_path = os.path.join(current_app.root_path, option.file_url.lstrip("/"))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                ...
    
    if not quotation:
        return jsonify({"error": "Quotation not found"}), 404

    try:
        # Xoá hết options
        db.session.delete(quotation)
        db.session.commit()
                # Xoá quotation
        # Cập nhật trạng thái request về "waiting"
        req = RepairRequest.query.get(request_id)
        if req:
            req.ChangeByUsername = current_user.username
            req.Status = current_app.config['WAIT_QUOTATION']
        db.session.add(req) 
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Quotation deleted, request set to waiting"})




@repair_request_bp.route("/api/quotation-options/<int:option_id>/delete", methods=["DELETE"])
def delete_quote_option(option_id):
    option = QuoteOption.query.get_or_404(option_id)

    try:
        db.session.delete(option)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Option deleted", "option_id": option_id})




# -------------------------------------------
# API duyệt báo giá
# -------------------------------------------
# -------------------------------------------
# API duyệt báo giá (approve/reject)
# -------------------------------------------
@quotation_bp.route("/api/quotations/<int:quotation_id>/approve", methods=["PUT"])
def approve_quotation(quotation_id):
    data = request.get_json()
    option_no = data.get("option_no")
    remark = data.get("remark", "")  # EM remark (ghi chú)


    quotation = Quotation.query.get_or_404(quotation_id)

    # Tìm option được duyệt
    approved_opt = QuoteOption.query.filter_by(
        quotation_id=quotation_id,
        option_no=option_no
    ).first()

    if not approved_opt:
        return jsonify({"error": "Option not found"}), 404
    #gán remark cho option được duyệt 
    
    approved_opt.em_note = remark  
    approved_opt.status = current_app.config['WAIT_LM_MANAGER_APPROVAL_QUOTATION']

    quotation.approved_option_no = option_no
    quotation.status = current_app.config['WAIT_LM_MANAGER_APPROVAL_QUOTATION']
    quotation.em_apr_date = datetime.now()
    quotation.user1_id = current_user.id 
    
    pre_re= RepairRequest.query.filter_by(id = quotation.RequestID).first()
    if pre_re:
        pre_re.ChangeByUsername = current_user.username
        pre_re.NoteByUsername = remark
        pre_re.Status = current_app.config['WAIT_LM_MANAGER_APPROVAL_QUOTATION']
        db.session.add(pre_re)
    else:
        return jsonify({"error": "RepairRequest not found id"}), 404
    
    db.session.commit()
    return jsonify({"message": "Quotation approved", "quotation_id": quotation.id})

@quotation_bp.route("/api/quotations/<int:quotation_id>/reject", methods=["PUT"])
def reject_quotation(quotation_id):
    data = request.get_json()
    remark = data.get("remark", "")
    
    quotation = Quotation.query.filter_by(id=quotation_id).first()
    quote_options = QuoteOption.query.filter_by(quotation_id=quotation.id).all()
    quote_history = QuotationHistory.query.filter_by(id_request=quotation.RequestID).first()
    
    new_history_delete =  [
                {
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "vendor": opt.vendor_name,
                    "Price": str(opt.unit_price),
                    "Remark": opt.quotation_note,
                    "LMNote": opt.lab_note,
                    "EMNote": opt.em_note
                }
                for opt in quote_options
            ]
    
    if quote_history:
        history_delete = quote_history.history_delete or []
        if isinstance(history_delete, str):
            history_delete = json.loads(history_delete)
        history_delete.extend(new_history_delete)
        quote_history.history_delete = json.dumps(history_delete)
    else:
        quote_history = QuotationHistory(
            id_request=quotation.RequestID,
            history_delete= json.dumps(new_history_delete)
        )
        
    db.session.add(quote_history)
    db.session.flush()
        

    for opt in quote_options:
        db.session.delete(opt)
    db.session.delete(quotation)

    # Cập nhật trạng thái RepairRequest về "rejected"
    req = RepairRequest.query.get(quotation.RequestID)
    if req:
        req.ChangeByUsername = current_user.username
        req.NoteByUsername = remark
        req.Status = current_app.config['WAIT_RE_QUOTATION']
        db.session.add(req)

    db.session.commit()
    return jsonify({"message": "Quotation and options deleted, request set to rejected", "quotation_id": quotation_id})


@repair_request_bp.route("/api/approved-requests/<int:request_id>", methods=["GET"])
def get_approved_request_detail(request_id):
    req = RepairRequest.query.get_or_404(request_id)

    quotation = Quotation.query.filter_by(RequestID=req.id).first()
    if not quotation:
        return jsonify({"error": "No approved quotation found"}), 404

    approved_option = QuoteOption.query.filter_by(
        quotation_id=quotation.id,
        option_no=quotation.approved_option_no,
        status="Approved"
    ).first()

    device = Device.query.get(req.DeviceID)
    user = User.query.get(req.RequestedBy)

    data = {
        "request_id": req.id,
        "device_name": device.DeviceName if device else "Unknown",
        "device_code": device.DeviceCode if device else "Unknown",
        "requested_by": user.username if user else "Unknown",
        "lab_id": req.LabID,
        "team_id": req.TeamID,
        "description": req.Description,
        "status": req.Status.lower(),
        "request_date": req.RequestDate.strftime("%Y-%m-%d %H:%M:%S") if req.RequestDate else None,
        "quotation_id": quotation.id,
        "approved_option": {
            "option_id": approved_option.id if approved_option else None,
            "option_no": approved_option.option_no if approved_option else None,
            "vendor_name": approved_option.vendor_name if approved_option else None,
            "quantity": approved_option.quantity if approved_option else None,
            "unit_price": float(approved_option.unit_price) if approved_option else None,
            "total_cost": approved_option.total_cost if approved_option else None,
            "file_url": approved_option.file_url if approved_option else None,
            "notes": approved_option.notes if approved_option else None,
            "status": approved_option.status if approved_option else None
        } if approved_option else None,
        "approved_date": quotation.CreatedDate.strftime("%Y-%m-%d %H:%M:%S") if quotation.CreatedDate else None
    }
    return jsonify(data)

@repair_request_bp.route("/api/approved-quotation/<int:quotation_id>", methods=["GET"])
def get_approved_quotation_detail(quotation_id):

    quotation = Quotation.query.filter_by(id=quotation_id, status="Approved").first()
    if not quotation:
        return jsonify({"error": "No approved quotation found"}), 404

    req = RepairRequest.query.get_or_404(quotation.RequestID)
    
    approved_options = (
        QuoteOption.query
        .filter(QuoteOption.quotation_id == quotation.id)
        .filter(QuoteOption.status != "cancelled")
        .all()
    )
    
    options_data = [
        {
            "option_id": opt.id,
            "option_no": opt.option_no,
            "vendor_name": opt.vendor_name,
            "quantity": opt.quantity,
            "unit_price": float(opt.unit_price) if opt.unit_price else None,
            "total_cost": opt.total_cost,
            "file_url": opt.file_url,
            "notes": opt.notes,
            "EM_Notes" :opt.EM_Notes,
            "status": opt.status
        }
        for opt in approved_options
    ]

    device = Device.query.get(req.DeviceID)

    data = {
        "request_id": req.id,
        "device_name": device.DeviceName if device else "Unknown",
        "device_code": device.DeviceCode if device else "Unknown",
        "requested_by":req.RequestedBy,
        "lab_id": req.LabID,
        "team_id": req.TeamID,
        "description": req.Description,
        "status": req.Status.lower(),
        "request_date": req.RequestDate.strftime("%Y-%m-%d %H:%M:%S") if req.RequestDate else None,
        "quotation_id": quotation.id,
        "approved_option": options_data,
        "approved_date": quotation.CreatedDate.strftime("%Y-%m-%d %H:%M:%S") if quotation.CreatedDate else None
    }
    return jsonify(data)

#cònirm
@quotation_bp.route("/api/quotations/<int:req_id>/confirm", methods=["PUT"])
def confirm_quotation(req_id):
    data = request.get_json()
    option_no = data.get("option_no")
    remark = data.get("remark", "")  # LM remark (ghi chú)


    quotation = Quotation.query.filter_by(RequestID=req_id).first()
    
    approved_opt = QuoteOption.query.filter_by(
        quotation_id=quotation.id,
        option_no=option_no
    ).first()
    approved_opt.lab_note = remark  
    approved_opt.status = "Approved"
    db.session.add(approved_opt)
    
    # cập nhật no use cho các option khác
    other_options = QuoteOption.query.filter(
        QuoteOption.quotation_id == quotation.id,
        QuoteOption.status == current_app.config['WAIT_EM_MANAGER_APPROVAL_QUOTATION'],
    ).all()
    for opt in other_options:
        opt.status = "No Use"
        db.session.add(opt)

    quotation.status = "confirmed"
    quotation.user2_id = current_user.id  # Giả sử bạn có thông tin người dùng hiện tại
    db.session.add(quotation)
    
    
    #  Cập nhật luôn RepairRequest
    req = RepairRequest.query.get(quotation.RequestID)
    if req:
        req.ChangeByUsername = current_user.username
        req.NoteByUsername = remark
        req.Status = current_app.config["WAIT_PR"]
        db.session.add(req)

    db.session.commit()
    return jsonify({"message": "Quotation approved", "quotation_id": quotation.id})

@quotation_bp.route("/api/quotations/<int:quotation_id>/cancel", methods=["PUT"])
def cancel_quotation(quotation_id):
    data = request.get_json()
    option_no = data.get("option_no")
    remark = data.get("remark", "")
    quotation = Quotation.query.filter_by(RequestID=quotation_id).first()
    
    approved_opt = QuoteOption.query.filter_by(
        quotation_id=quotation.id,
        option_no=quotation.approved_option_no
    ).first()
    approved_opt.lab_note = remark

    if not approved_opt:
        return jsonify({"error": "Option not found"}), 404

    approved_opt.status = "cancelled"

    quotation.status = current_app.config["WAIT_EM_MANAGER_RE_APPROVAL_QUOTATION"] 
    pre_re= RepairRequest.query.filter_by(id = quotation.RequestID).first()
    if pre_re:
        pre_re.ChangeByUsername = current_user.username
        pre_re.NoteByUsername = remark
        pre_re.Status = current_app.config["WAIT_EM_MANAGER_RE_APPROVAL_QUOTATION"] 
        db.session.add(pre_re)
    else:
        return jsonify({"error": "RepairRequest not found id"}), 404
    

    db.session.commit()
    return jsonify({"message": "Quotation approved", "quotation_id": quotation.id})


@repair_request_bp.route("/api/approved-quotation-confirm/<int:request_id>", methods=["GET"])
def get_confirmed_option_detail(request_id):
    # B1: Lấy request
    req = RepairRequest.query.get_or_404(request_id)
    device = Device.query.get(req.DeviceID)
    user = User.query.get(req.RequestedBy)

    # B2: Lấy quotation có status = confirmed của request này
    quotation = Quotation.query.filter_by(RequestID=request_id, status="confirmed").first()
    if not quotation:
        return jsonify({"error": "No confirmed quotation found for this request"}), 404

    # B3: Lấy các option Approved
    approved_options = QuoteOption.query.filter(
    QuoteOption.quotation_id == quotation.id,
    QuoteOption.status == "Approved").all()

    if not approved_options:
        return jsonify({"error": "No approved options found"}), 404

    options_data = [
        {
            "option_id": opt.id,
            "option_no": opt.option_no,
            "vendor_name": opt.vendor_name,
            "quantity": opt.quantity,
            "unit_price": float(opt.unit_price) if opt.unit_price else 0,
            "total_cost": opt.total_cost,
            "file_url": opt.file_url,
            "notes": opt.quotation_note,
            "status": opt.status
        }
        for opt in approved_options
    ]

    # B4: Build response
    data = {
        "quotation_id": quotation.id,
        "request_id": req.id,
        "device_name": device.DeviceName if device else "Unknown",
        "device_code": device.DeviceCode if device else "Unknown",
        "requested_by": req.RequestedBy,
        "lab_id": req.LabID,
        "team_id": req.TeamID,
        "description": req.Description,
        "status": quotation.status,   # confirmed
        "request_date": req.RequestDate,
        "em_apr_date": quotation.em_apr_date if quotation.em_apr_date else None,
        "lm_apr_date": quotation.lm_apr_date if quotation.lm_apr_date else None,
        "approved_options": options_data,
        "approved_by": quotation.user2_id if quotation else None

    }

    return jsonify(data)




@quotation_bp.route("/quote_option/<int:requestID>/waitpr", methods=["POST"])
def set_waitpr(requestID):
    data = request.get_json()
    pa_no = data.get("PA_no")

    if not pa_no:
        return jsonify({"error": "PA_no is required"}), 400

    # --- cập nhật trạng thái request thay vì option ---
    repair_request = RepairRequest.query.get(requestID)
    if not repair_request:
        return jsonify({"error": "RepairRequest not found"}), 404

    repair_request.ChangeByUsername = current_user.username
    repair_request.NoteByUsername = f"PA_no: {pa_no}"
    repair_request.Status  = current_app.config['WAIT_PO']
    db.session.add(repair_request)

    # Kiểm tra PA cho request_id
    is_pa_exists = PA.query.filter_by(PA_no=pa_no).first()
    if is_pa_exists:
        return jsonify({"error": "PA_no already exists"}), 200
    
    pa = PA.query.filter_by(request_id=repair_request.id).first()
    if pa:
        pa.PA_no = pa_no
    else:
        pa = PA(
            request_id=repair_request.id,
            PA_no=pa_no
        )
    db.session.add(pa)

    db.session.commit()

    return jsonify({
        "message": "RepairRequest status updated to waitPO and PA recorded",
        "repair_request": {
            "id": repair_request.id,
            "status": repair_request.Status  
        },
        "pa": pa.to_dict()
    }), 200
    
    
    

@quotation_bp.route("/quote_option/<int:requestID>/waitpo", methods=["POST"])
def set_waitpo(requestID):
    data = request.get_json()
    po_no = data.get("PO_no")
    delivery = data.get("Delivery")
    note = data.get("note")

    if not po_no:
        return jsonify({"error": "PO_no is required"}), 400

    repair_request = RepairRequest.query.get(requestID)
    if not repair_request:
        return jsonify({"error": "RepairRequest not found"}), 404
    pa = PA.query.filter_by(request_id=repair_request.id).first()
    if not pa or not pa.PA_no:
        return jsonify({"error": "PA_no must exist before creating PO"}), 400

    is_po_exists = PA.query.filter_by(PO_no=po_no).first()
    if is_po_exists:
        return jsonify({"error": "PO_no already exists"}), 200
    repair_request.ChangeByUsername = current_user.username
    repair_request.NoteByUsername = f"PO_no: {po_no}"
    repair_request.Status = current_app.config['WAIT_EM_CONFIRM_FIXED']
    db.session.add(repair_request)
    pa.PO_no = po_no
    if delivery:
        from datetime import datetime
        try:
            pa.Delivery = datetime.strptime(delivery, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format for Delivery, expected YYYY-MM-DD"}), 400
    if note:
        pa.note = note
    db.session.add(pa)

    db.session.commit()

    return jsonify({
        "message": "RepairRequest status updated to waitTechnicalDone and PO recorded",
        "repair_request": {
            "id": repair_request.id,
            "status": repair_request.Status
        },
        "pa": pa.to_dict()
    }), 200


@repair_request_bp.route("/api/pending_approval", methods=["POST"])
def pending_approval():
    data = request.get_json() or {}
    id = data.get("id")
    re_re = RepairRequest.query.filter_by(id = id).first()
    if not re_re:
        return jsonify({"error": "RepairRequest not found"}), 404
    
    data_re = {
        "Description": re_re.Description,
        "DeviceID": re_re.DeviceID,
        "DeviceName": re_re.devices.DeviceName,
        "LabID": re_re.LabID,
        "LabName": re_re.lab.LabName,
        "RequestDate": re_re.RequestDate,
        "RequestedBy": re_re.RequestedBy,
        "Status": re_re.Status,
        "TeamID": re_re.TeamID,
        "TeamName": re_re.team.TeamName,
        "TechName": re_re.TechName,
        "NoteByUsername": re_re.NoteByUsername,
        "ChangeByUsername": re_re.ChangeByUsername,
    }
    
    return jsonify(data_re), 200
        
@global_bp.route("/api/get_department", methods=["GET"])
def get_department():
    departments = Lab.query.all()
    return jsonify([
        {"id": dept.id, "name": dept.LabName} for dept in departments
    ]), 200
@global_bp.route("/api/get_team", methods=["GET"])
def get_team():
    try:
        
        user = None

            # Ưu tiên 1: Dùng current_user từ Flask-Login
        if current_user.is_authenticated:
                user = {
                    "id": current_user.id,
                    "username": current_user.username,
                    "idlab": current_user.idlab,
                    "idteam": current_user.idteam,
                    "role_id": current_user.role_id,
                }
            # Nếu là admin (role_id == 1), trả về tất cả thiết bị
        if str(user.get('role_id')) == "4":
            teams = Team.query.filter_by(LabID=current_user.idlab).all()

        else: 
            teams = Team.query.all()
        return jsonify([
            {"id": team.id, "name": team.TeamName} for team in teams
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@global_bp.route("/api/get_dic_status", methods=["GET"])
def get_dic_status():
    status = Status.query.all()
    return jsonify([
        {"id": s.id, "name": s.StatusName} for s in status
    ]), 200

@repair_request_bp.route("/api/get_data", methods=["POST"])
def get_repair_requests_data():
    filters = request.get_json() or {}

    query = RepairRequest.query
    if filters.get("isQuotation") and filters["isQuotation"]:
        query = query.join(Approval, and_(Approval.RequestID == RepairRequest.id, Approval.Status != "Rejected"))

    if filters.get("id") and filters["id"][0] and filters["id"][0] != "":
        query = query.filter(RepairRequest.id.in_(filters["id"]))
    if filters.get("DeviceName") and filters["DeviceName"][0] and filters["DeviceName"][0] != "":
        device_names = [name for name in filters["DeviceName"] if name]
        query = query.join(Device, RepairRequest.DeviceID == Device.id).filter(
            or_(*[Device.DeviceName.ilike(f"%{name}%") for name in device_names])
        )
    if filters.get("RequestedBy") and filters["RequestedBy"][0] and filters["RequestedBy"][0] != "":
        requested_by_names = [name for name in filters["RequestedBy"] if name]
        query = query.filter(
            or_(*[RepairRequest.RequestedBy.ilike(f"%{name}%") for name in requested_by_names])
        )
    if filters.get("LabId") and filters["LabId"][0]:
        query = query.join(Lab, RepairRequest.LabID == Lab.id).filter(Lab.id.in_(filters["LabId"]))
    if filters.get("TeamId") and filters["TeamId"][0]:
        query = query.join(Team, RepairRequest.TeamID == Team.id).filter(Team.id.in_(filters["TeamId"]))
    if filters.get("status") and filters["status"][0] and filters["status"][0] != "":
        query = query.filter(RepairRequest.Status.in_(filters["status"]))
    if filters.get("FromDate") and filters["FromDate"][0] and filters["FromDate"][0] != "":
        from_date = datetime.strptime(filters["FromDate"][0], "%Y-%m-%d")
        query = query.filter(RepairRequest.RequestDate >= from_date)
    if filters.get("ToDate") and filters["ToDate"][0] and filters["ToDate"][0] != "":
        to_date = datetime.strptime(filters["ToDate"][0], "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(RepairRequest.RequestDate < to_date)

    results = query.all()

    data = []
    for req in results:
        device = Device.query.get(req.DeviceID)
        lab = Lab.query.get(req.LabID)
        team = Team.query.get(req.TeamID)
        user = User.query.get(req.RequestedBy)
        # Kiểm tra xem có status history với new_status là "Done" không
        done_history = RepairStatusHistory.query.filter_by(
            repair_request_id=req.id, 
            new_status="Done"
        ).order_by(RepairStatusHistory.change_timestamp.desc()).first()
        lab_mn_approve_external = (
            RepairStatusHistory.query
            .filter(
                RepairStatusHistory.repair_request_id == req.id,
                RepairStatusHistory.new_status == "Wait Quotation",
                ~exists().where(
                    and_(
                        RepairStatusHistory.repair_request_id == req.id,
                        RepairStatusHistory.old_status == "Wait Quotation"
                    )
                )
            )
            .order_by(RepairStatusHistory.change_timestamp.desc())
            .first()
        )

        if lab_mn_approve_external:
            result_date = lab_mn_approve_external.change_timestamp
        else:
            result_date = req.RequestDate

        # Tính TAT days
        if req.RequestDate:
            request_date = datetime.strptime(req.RequestDate, '%Y-%m-%d %H:%M:%S').date()
            
            if done_history and done_history.change_timestamp:
                # Nếu có status "Done", sử dụng ngày từ change_timestamp
                done_date = datetime.strptime(done_history.change_timestamp, '%Y-%m-%d %H:%M:%S').date()
                tat_days = (done_date - request_date).days
            else:
                # Nếu chưa có "Done", sử dụng ngày hiện tại
                tat_days = (date.today() - request_date).days
        else:
            tat_days = None
        #tat_days = (date.today() - datetime.strptime(req.RequestDate, '%Y-%m-%d %H:%M:%S').date()).days if req.RequestDate else None
        quotation = Quotation.query.filter_by(RequestID=req.id).first()

        time_line_json = req.Timeline or []
        if isinstance(time_line_json, str):
            time_line_json = json.loads(req.Timeline)
        if len(time_line_json) == 0:
            final_em = {}
        else:
            final_em = list(filter(lambda x: x.get("event") == "TechnicianEvaluation", time_line_json))[-1]
        if lab_mn_approve_external:
            lab_mn_approve_external = datetime.strptime(lab_mn_approve_external.change_timestamp, '%Y-%m-%d %H:%M:%S').date()
            pro_tat =  (date.today() - lab_mn_approve_external).days
        else:
            # Nếu không có thì fallback sang requestDate
            pro_tat =tat_days
        data.append({
            "Description": req.Description,
            "DeviceID":req.DeviceID,
            "DeviceCode": device.DeviceCode if device else None,
            "DeviceName": device.DeviceName if device else None,
            "LabID": req.LabID,
            "LabName": lab.LabName if lab else None,
            "RequestDate": req.RequestDate if req.RequestDate else None,
            "RequestedBy": req.RequestedBy if req.RequestedBy else None,
            "Status": req.Status,
            "TeamID": req.TeamID,
            "TeamName": team.TeamName if team else None,
            "TechName": req.TechName,
            "Priority": "Priority" if req.Priority else "Normal",
            "Timeline": req.Timeline,
            "id": req.id,
            "quotation_id": quotation.id if quotation else None,
            "options_count": len(quotation.options) if quotation else 0,
            "approved_date": quotation.em_apr_date
                          if quotation and quotation.status == "Approved" and quotation.em_apr_date else None,
            "approved_by": quotation.user2_id if quotation else None,
            "quotation_status": quotation.status if quotation else None,

            "request_date": f"{tat_days} ngày" if tat_days is not None else None,
            "approved_option": quotation.approved_option_no if quotation else None,
            "final_em_evaluation": final_em,
            "lab_mn_approve_external":result_date,
            "TAT": f"{tat_days} ngày",
            "pro_tat": f"{pro_tat} ngày"
        })

    return jsonify(data), 200


@repair_request_bp.route("/api/quotation/<int:request_id>", methods=["GET"])
def get_quotation_from_id(request_id):
    quotation = Quotation.query.filter_by(RequestID=request_id).first()
    
    quotation_history = QuotationHistory.query.filter_by(id_request=request_id).first()
    if quotation_history:
        history_data = {
            "HistoryDelete": json.loads(quotation_history.history_delete)
        }
    else:
        history_data = None
    
    data = {}
    if quotation_history:
        data["history"] = history_data
    if quotation:
        data.update({
            "quotation": quotation.to_dict(),
            "quotation_options": [opt.to_dict() for opt in quotation.options]
        })
    
    return jsonify(data), 200


@repair_request_bp.route('/api/repair_requests/<int:request_id>/disposal_document', methods=['POST'])
def upload_disposal_document(request_id):
    try:
        if 'disposal_file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['disposal_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Kiểm tra file type
        allowed_extensions = {'pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Tạo tên file unique
        filename = secure_filename(file.filename)
        unique_filename = f"disposal_{request_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        
        # Tạo thư mục nếu chưa tồn tại
        upload_folder = 'static/uploads/disposal_docs'
        os.makedirs(upload_folder, exist_ok=True)
        
        # Lưu file
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Lưu thông tin file vào database bằng SQLAlchemy
        disposal_doc = DisposalDocument(
            request_id=request_id,
            file_name=unique_filename,
            file_path=file_path
        )
        
        db.session.add(disposal_doc)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'File uploaded successfully',
            'file_name': unique_filename,
            'file_url': f'/static/uploads/disposal_docs/{unique_filename}',
            'upload_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
import os
from flask import send_file, current_app
from werkzeug.utils import safe_join

@repair_request_bp.route('/api/repair_requests/<int:request_id>/disposal_document')
def get_disposal_document(request_id):
    try:
        disposal_doc = DisposalDocument.query.filter_by(
            request_id=request_id
        ).order_by(DisposalDocument.upload_date.desc()).first()
        
        if disposal_doc:
            repair_request = RepairRequest.query.get(request_id)
            
            # CHUẨN HÓA ĐƯỜNG DẪN
            normalized_file_name = disposal_doc.file_name.replace('\\', '/')
            clean_file_name = os.path.basename(normalized_file_name)
            
            # SỬA ĐƯỜNG DẪN - BỎ THƯ MỤC 'app' VÌ FILE Ở NGOÀI
            # Đường dẫn mới: D:\EquipmentBroken\EquipmentBroken\EQIPMENT\static\uploads\
            file_path = os.path.join(current_app.root_path, '..', 'static', 'uploads', 'disposal_docs', clean_file_name)
            file_path = os.path.abspath(file_path)  # Chuẩn hóa đường dẫn
            
            file_exists = os.path.exists(file_path)
            
            # DEBUG
            print(f"=== DEBUG FILE PATH ===")
            print(f"Current app root: {current_app.root_path}")
            print(f"Looking for file at: {file_path}")
            print(f"File exists: {file_exists}")
            
            # THỬ KIỂM TRA CÁC ĐƯỜNG DẪN KHÁC
            alternative_paths = [
                os.path.join(current_app.root_path, '..', 'static', 'uploads', clean_file_name),
                os.path.join(current_app.root_path, 'static', 'uploads', 'disposal_docs', clean_file_name),
                os.path.join(current_app.root_path, '..', 'static', 'uploads', 'disposal_docs', clean_file_name),
            ]
            
            for i, alt_path in enumerate(alternative_paths):
                alt_path = os.path.abspath(alt_path)
                print(f"Alternative {i+1}: {alt_path} -> {os.path.exists(alt_path)}")
            
            upload_date = None
            if disposal_doc.upload_date:
                upload_date = disposal_doc.upload_date.strftime('%Y-%m-%d %H:%M:%S')
            
            return jsonify({
                'file_name': clean_file_name,
                'file_path': file_path,
                'file_url': f"/static/uploads/disposal_docs/{clean_file_name}",
                'download_url': f"/repair_request/api/repair_requests/{request_id}/download_disposal_doc",
                'file_exists': file_exists,
                'upload_date': upload_date,
                'rejection_type': repair_request.RejectType if repair_request else None,
                'remark': repair_request.NoteByUsername if repair_request else None,
                'exists': True
            })
        else:
            return jsonify({'exists': False})
            
    except Exception as e:
        print(f"Error in get_disposal_document: {str(e)}")
        return jsonify({'error': str(e)}), 500

@repair_request_bp.route('/api/repair_requests/<int:request_id>/download_disposal_doc')
def download_disposal_document(request_id):
    try:
       
        
        disposal_doc = DisposalDocument.query.filter_by(
            request_id=request_id
        ).order_by(DisposalDocument.upload_date.desc()).first()
        
        if disposal_doc:
            
            normalized_file_name = disposal_doc.file_name.replace('\\', '/')
            clean_file_name = os.path.basename(normalized_file_name)
            base_dir = current_app.root_path  # D:\EquipmentBroken\EquipmentBroken\EQIPMENT\app
            file_path = os.path.abspath(os.path.join(base_dir, '..', '..', 'static', 'uploads', 'disposal_docs', clean_file_name))
            
            if not os.path.exists(file_path):
                alternative_paths = [
                    # os.path.abspath(os.path.join(base_dir, 'static', 'uploads', 'disposal_docs', clean_file_name)),
                    os.path.abspath(os.path.join(base_dir, '..', 'static', 'uploads', 'disposal_docs', clean_file_name)),
                    # os.path.abspath(os.path.join(base_dir, '..', '..', 'static', 'uploads', clean_file_name)),
                ]
                
                for i, alt_path in enumerate(alternative_paths):
                    if os.path.exists(alt_path):
                        file_path = alt_path
                        break
            
            if os.path.exists(file_path):
                # KIỂM TRA FILE
                file_size = os.path.getsize(file_path)
                
                if file_size == 0:
                    return jsonify({'error': 'File is empty'}), 500
                
                action = request.args.get('action', 'download')
                
                # XÁC ĐỊNH MIME TYPE
                file_extension = os.path.splitext(clean_file_name)[1].lower()
                mime_types = {
                    '.pdf': 'application/pdf',
                    '.doc': 'application/msword',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.xls': 'application/vnd.ms-excel',
                    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.txt': 'text/plain'
                }
                mimetype = mime_types.get(file_extension, 'application/octet-stream')
                
                if action == 'view':
                    return send_file(
                        file_path,
                        as_attachment=False,
                        download_name=clean_file_name,
                        mimetype=mimetype
                    )
                else:
                    return send_file(
                        file_path,
                        as_attachment=True,
                        download_name=clean_file_name,
                        mimetype=mimetype
                    )
            else:
                return jsonify({'error': f'File not found. Tried: {file_path}'}), 404
        else:
            return jsonify({'error': 'Document not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@repair_request_bp.route("/device_history", methods=["POST"])
def device_history():
        filters = request.get_json() or {}
        query = RepairRequest.query
        if filters.get("isQuotation") and filters["isQuotation"]:
            query = query.join(Approval, and_(Approval.RequestID == RepairRequest.id, Approval.Status != "Rejected"))

        if filters.get("id") and filters["id"][0] and filters["id"][0] != "":
            query = query.filter(RepairRequest.id.in_(filters["id"]))
        if filters.get("DeviceName") and filters["DeviceName"][0] and filters["DeviceName"][0] != "":
            device_names = [name for name in filters["DeviceName"] if name]
            query = query.join(Device, RepairRequest.DeviceID == Device.id).filter(
                or_(*[Device.DeviceName.ilike(f"%{name}%") for name in device_names])
            )
        if filters.get("RequestedBy") and filters["RequestedBy"][0] and filters["RequestedBy"][0] != "":
            requested_by_names = [name for name in filters["RequestedBy"] if name]
            query = query.filter(
                or_(*[RepairRequest.RequestedBy.ilike(f"%{name}%") for name in requested_by_names])
            )
        if filters.get("LabId") and filters["LabId"][0]:
            query = query.join(Lab, RepairRequest.LabID == Lab.id).filter(Lab.id.in_(filters["LabId"]))
        if filters.get("TeamId") and filters["TeamId"][0]:
            query = query.join(Team, RepairRequest.TeamID == Team.id).filter(Team.id.in_(filters["TeamId"]))
        if filters.get("status") and filters["status"][0] and filters["status"][0] != "":
            query = query.filter(RepairRequest.Status.in_(filters["status"]))
        from_date = None
        to_date = None    
        if filters.get("FromDate") and filters["FromDate"][0] and filters["FromDate"][0] != "":
            from_date = datetime.strptime(filters["FromDate"][0], "%Y-%m-%d")
            query = query.filter(RepairRequest.RequestDate >= from_date)
        if filters.get("ToDate") and filters["ToDate"][0] and filters["ToDate"][0] != "":
            to_date = datetime.strptime(filters["ToDate"][0], "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(RepairRequest.RequestDate < to_date)

        results = query.all()

        data = []
        # for req in results:
        #     device = Device.query.get(req.DeviceID)
        #     lab = Lab.query.get(req.LabID)
        #     team = Team.query.get(req.TeamID)
        #     user = User.query.get(req.RequestedBy)
        
       
        # --- top 5 thiết bị mắc nhất ---
        top_devices_query = db.session.query(
            Device.DeviceName,
            Lab.LabName,
            Device.DeviceCode,
            func.count(RepairHistory.DeviceID).label("RepairCount"),
            Team.TeamName,
            func.sum(RepairHistory.Cost).label("TotalCost")
        ).join(RepairRequest, RepairHistory.RequestID == RepairRequest.id) \
        .join(Device, RepairHistory.DeviceID == Device.id)\
        .join(Lab, RepairRequest.LabID==Lab.id)\
        .join(Team,RepairRequest.TeamID==Team.id)
        # Query cho top theo số lần hỏng
        top_devices_query_count = db.session.query(
            Device.DeviceName,
            Lab.LabName,
            Device.DeviceCode,
            Team.TeamName,
          
            func.count(RepairHistory.DeviceID).label("RepairCountFaulty"),
        ).join(RepairRequest, RepairHistory.RequestID == RepairRequest.id) \
        .join(Device, RepairHistory.DeviceID == Device.id) \
        .join(Lab, RepairRequest.LabID == Lab.id) \
        .join(Team, RepairRequest.TeamID == Team.id)
            # --- tính tổng chi phí một lần ---id
        total_costs = db.session.query(func.sum(RepairHistory.Cost)) \
            .join(RepairRequest, RepairHistory.RequestID == RepairRequest.id)
        total_pendings = db.session.query(func.count(RepairRequest.id)) \
            .filter(RepairRequest.Status!="Done")
    
        total_request=db.session.query(func.count(RepairRequest.id))
        team_filter=filters.get("TeamId") and filters["TeamId"]
        lab_filter=filters.get("LabId") and filters["LabId"]
        
        #FILLTER THEO LAB
        if team_filter:
            total_costs = total_costs.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
            total_pendings = total_pendings.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
            total_request=total_request.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
            #thiet bi mac nhat 
            top_devices_query = top_devices_query.filter(RepairRequest.TeamID.in_(filters["TeamId"]))
            #thiet bi hu nhieu nhat 
            top_devices_query_count = top_devices_query_count.filter(RepairRequest.TeamID.in_(filters["TeamId"])
    )

        if lab_filter :
            total_costs = total_costs.filter(RepairRequest.LabID.in_(filters["LabId"]))
            total_pendings = total_pendings.filter(RepairRequest.LabID.in_(filters["LabId"]))
            total_request = total_request.filter(RepairRequest.LabID.in_(filters["LabId"]))
            #thiet bi mac nhat 
            top_devices_query = top_devices_query.filter(RepairRequest.LabID.in_(filters["LabId"]))
            #thiet bi hu nhieu nhat 
            top_devices_query_count = top_devices_query_count.filter(
            RepairRequest.LabID.in_(filters["LabId"])
        )
        
        # filter theo ngày
        if from_date:
            total_costs = total_costs.filter(RepairHistory.RepairDate >= from_date)
            total_pendings = total_pendings.filter(RepairRequest.RequestDate >= from_date)
            total_request  = total_request.filter(RepairRequest.RequestDate >= from_date)
            #thiet bi mac nhat 
            top_devices_query = top_devices_query.filter(RepairHistory.RepairDate >= from_date)
            #thiet bi hu nhieu nhat
            top_devices_query_count = top_devices_query_count.filter(RepairHistory.RepairDate >= from_date)

        if to_date:
            total_costs = total_costs.filter(RepairHistory.RepairDate <= to_date)
            total_pendings = total_pendings.filter(RepairRequest.RequestDate < to_date)
            total_request  = total_request.filter(RepairRequest.RequestDate < to_date)
            #thiet bi mac nhat 
            top_devices_query = top_devices_query.filter(RepairHistory.RepairDate <= to_date)
            #thiet bi hu nhieu nhat
            top_devices_query_count = top_devices_query_count.filter(RepairHistory.RepairDate <= to_date)

        #xu ly device
        top_devices = top_devices_query.group_by(RepairHistory.DeviceID, Device.DeviceName, Lab.LabName, Team.TeamName) \
                                   .order_by(func.sum(RepairHistory.Cost).desc()) \
                                   .limit(5).all()  
        


        top_devices_count = top_devices_query_count.group_by(
            RepairHistory.DeviceID,
            Device.DeviceName,
            Team.TeamName,
            Lab.LabName,
            Device.DeviceCode
        ).order_by(func.count(RepairHistory.DeviceID).desc()).limit(5).all()


        top5_list = [{"DeviceName": d.DeviceName, "TotalCost": d.TotalCost,"Lab": d.LabName,
        "RepairCount": d.RepairCount,"DeviceCode":d.DeviceCode} for d in top_devices]   
        top5_faulty = [ {
                "DeviceName": d.DeviceName,
                "Team": d.TeamName,
                "Lab": d.LabName,
                "RepairCountFaulty": d.RepairCountFaulty,
                "DeviceCode":d.DeviceCode
            }
            for d in top_devices_count]


        grand_total = total_costs.scalar() or 0
        grand_total_pendings = total_pendings.scalar() or 0
        grand_total_requests=total_request.scalar() or 0
        #tinh top 5 the most expensive 

        # append thêm tổng chi phí vào mảng data
        data.append({
            "TotalCost": grand_total,
            "total_pendings": grand_total_pendings,
            "total_requests": grand_total_requests,
            "top5_devices": top5_list,
            "top5_faulty":top5_faulty
        })
        return jsonify(data), 200
    
