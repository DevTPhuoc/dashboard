from flask import Blueprint, jsonify, request
from models.models import RepairRequest, Device, Quotation, QuoteOption,PA
from app.models import User
from app import db
from app.routes import auth 
from datetime import date
import os   # để xử lý đường dẫn lưu file
from flask import request, jsonify  # để nhận form data + trả JSON response
from werkzeug.utils import secure_filename  # để 
from flask import current_app



from flask_login import current_user


repair_request_bp = Blueprint("repair_request_api", __name__)
quotation_bp = Blueprint("quotation_bp", __name__)
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
            query = query.filter(Quotation.status == "pendingquoting")
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
            "description": req.Description,
            "status": (req.Status or "").lower(),
            # "request_date": req.RequestDate.strftime("%Y-%m-%d %H:%M:%S") if req.RequestDate else None,
            "request_date": f"{tat_days} ngày" if tat_days is not None else None,
            "quotation_id": quotation.id if quotation else None,
            "quotation_status": quotation.status if quotation else None,
            "options_count": len(quotation.options) if quotation else 0,
            
            "approved_option": quotation.approved_option_no if quotation else None,
            "approved_option_id": approved_option_id,
             "approved_date": quotation.approve_date.strftime("%Y-%m-%d %H:%M:%S") 
                          if quotation and quotation.status == "Approved" and quotation.approve_date else None,
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


# -------------------------
# Gửi báo giá cho yêu cầu
# -------------------------
# @repair_request_bp.route("/api/<int:request_id>/quote", methods=["POST"])
# def send_quote(request_id):
#     req = RepairRequest.query.get_or_404(request_id)
#     data = request.get_json() or {}
#     options_data = data.get("options", [])

#     if not options_data:
#         return jsonify({"error": "No options provided"}), 400
#     if len(options_data) > 3:
#         return jsonify({"error": "Maximum 3 options allowed"}), 400

#     try:
#         # Tạo mới Quotation
#         quotation = Quotation(
#             RequestID=req.id,
#             status="pendingquoting"
#         )
#         db.session.add(quotation)
#         db.session.flush()  # để lấy quotation.id

#         # Thêm các phương án báo giá
#         for idx, opt in enumerate(options_data, start=1):
#             option = QuoteOption(
#                 quotation_id=quotation.id,
#                 option_no=idx,
#                 vendor_name=opt.get("vendor_name"),
#                 quantity=int(opt.get("quantity", 1)),
#                 unit_price=float(opt.get("unit_price", 0)),
#                 file_url=opt.get("file_url"),
#                 notes=opt.get("notes"),
#                 status="pendingquoting"
#             )
#             db.session.add(option)

#         # Cập nhật trạng thái yêu cầu
#         req.Status = "Quoted"
#         db.session.commit()

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500

#     return jsonify({
#         "message": "Quotation created",
#         "quotation_id": quotation.id,
#         "options_count": len(options_data)
#     })
@repair_request_bp.route("/api/<int:request_id>/quote", methods=["POST"])
def send_quote(request_id):
    req = RepairRequest.query.get_or_404(request_id)

    try:
        quotation = Quotation(
            RequestID=req.id,
            status="pendingquoting"
        )
        db.session.add(quotation)
        db.session.flush()

        idx = 1
        while f"options[{idx-1}][vendor_name]" in request.form:
            vendor_name = request.form.get(f"options[{idx-1}][vendor_name]")
            unit_price = request.form.get(f"options[{idx-1}][unit_price]")
            notes = request.form.get(f"options[{idx-1}][notes]")

            file = request.files.get(f"options[{idx-1}][file]")
            # file_url = None
            # if file:
            #     save_path = os.path.join(r"D:\code\onlyme\app\static\WORD", file.filename)
            #     file.save(save_path)
            #     file_url = f"/static/WORD/{file.filename}"


            file_url = None
            if file:
                # Lấy đường dẫn động theo thư mục static
                static_folder = current_app.static_folder  # VD: .../app/static
                word_folder = os.path.join(static_folder, "WORD")
                os.makedirs(word_folder, exist_ok=True)  # Tự tạo nếu chưa có

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
                notes=notes,
                status="pendingquoting"
            )
            db.session.add(option)

            idx += 1

        req.Status = "Quoted"
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
    # print("🚀 ~ quotations:", quotations)
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
                "notes": opt.notes,
                "status": opt.status
            })

    data = {
        "request_id": req.id,
        "device_name": device.DeviceName if device else "Unknown",
        "requested_by": user.username if user else "Unknown",
        "options": options[:3]  # giới hạn tối đa 3 option
    }
    return jsonify(data)


# -------------------------
# Cập nhật báo giá (giữ nguyên quotation_id, chỉ thay options)
# -------------------------
# @repair_request_bp.route("/api/<int:request_id>/quotations/update", methods=["PUT"])
# def update_quote(request_id):
#     req = RepairRequest.query.get_or_404(request_id)
#     data = request.get_json() or {}
#     options_data = data.get("options", [])

#     if not options_data:
#         return jsonify({"error": "No options provided"}), 400
#     if len(options_data) > 3:
#         return jsonify({"error": "Maximum 3 options allowed"}), 400

#     try:
#         quotation = Quotation.query.filter_by(RequestID=req.id).first()
#         if not quotation:
#             return jsonify({"error": "Quotation not found"}), 404

#         # Xóa option cũ
#         QuoteOption.query.filter_by(quotation_id=quotation.id).delete()

#         # Thêm option mới (giữ nguyên quotation_id)
#         new_options = []
#         for idx, opt in enumerate(options_data, start=1):
#             new_option = QuoteOption(
#                 quotation_id=quotation.id,
#                 option_no=idx,
#                 vendor_name=opt.get("vendor_name"),
#                 quantity=int(opt.get("quantity", 1)),
#                 unit_price=float(opt.get("unit_price", 0)),
#                 file_url=opt.get("file_url"),
#                 notes=opt.get("notes"),
#                 status="pendingquoting"
#             )
#             db.session.add(new_option)
#             new_options.append({
#                 "option_id": None,  # sẽ có sau khi commit
#                 "option_no": idx,
#                 "vendor_name": new_option.vendor_name,
#                 "quantity": new_option.quantity,
#                 "unit_price": float(new_option.unit_price),
#                 "file_url": new_option.file_url,
#                 "notes": new_option.notes,
#                 "status": new_option.status
#             })

#         req.Status = "Quoted"
#         quotation.status = "pendingquoting"
#         db.session.commit()

#         # Sau commit, lấy lại id cho từng option
#         options_db = QuoteOption.query.filter_by(quotation_id=quotation.id).order_by(QuoteOption.option_no).all()
#         for idx, opt in enumerate(options_db):
#             new_options[idx]["option_id"] = opt.id

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500

#     return jsonify({
#         "message": "Quotation updated",
#         "quotation_id": quotation.id,
#         "options_count": len(options_data),
#         "options": new_options
#     })
import os
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
                "notes": request.form.get(f"options[{idx}][notes]"),
                "file_url": request.form.get(f"options[{idx}][file_url]"),
            }

            # Nếu có file upload
            file = request.files.get(f"options[{idx}][file]")
            if file:
                filename = secure_filename(file.filename)

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
                    existing_opt.vendor_name = opt.get("vendor_name")
                    existing_opt.quantity = opt.get("quantity", 1)
                    existing_opt.unit_price = opt.get("unit_price", 0)
                    existing_opt.file_url = opt.get("file_url")
                    existing_opt.notes = opt.get("notes")
                    existing_opt.status = opt.get("status", existing_opt.status)
                    db.session.add(existing_opt)

                    new_options.append({
                        "option_id": existing_opt.id,
                        "option_no": existing_opt.option_no,
                        "vendor_name": existing_opt.vendor_name,
                        "quantity": existing_opt.quantity,
                        "unit_price": float(existing_opt.unit_price),
                        "file_url": existing_opt.file_url,
                        "notes": existing_opt.notes,
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
                    notes=opt.get("notes"),
                    status="pendingquoting"
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
                    "notes": new_option.notes,
                    "status": new_option.status
                })

        # Cập nhật trạng thái
        req.Status = "Quoted"
        quotation.status = "pendingquoting"
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
            req.Status = "Quoting"
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

    quotation = Quotation.query.get_or_404(quotation_id)

    # Tìm option được duyệt
    approved_opt = QuoteOption.query.filter_by(
        quotation_id=quotation_id,
        option_no=option_no
    ).first()

    if not approved_opt:
        return jsonify({"error": "Option not found"}), 404

    approved_opt.status = "Approved"
    quotation.approved_option_no = option_no
    quotation.status = "Approved"
    
    quotation.user1_id = current_user.id  # Giả sử bạn có thông tin người dùng hiện tại
    
    db.session.commit()
    return jsonify({"message": "Quotation approved", "quotation_id": quotation.id})

@quotation_bp.route("/api/quotations/<int:quotation_id>/reject", methods=["PUT"])
def reject_quotation(quotation_id):
    quotation = Quotation.query.get_or_404(quotation_id)

    # Xóa tất cả các option liên quan
    QuoteOption.query.filter_by(quotation_id=quotation.id).delete()

    # Xóa quotation
    db.session.delete(quotation)

    # Cập nhật trạng thái RepairRequest về "rejected"
    req = RepairRequest.query.get(quotation.RequestID)
    if req:
        req.Status = "rejected"
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
            "status": opt.status
        }
        for opt in approved_options
    ]

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
        "approved_option": options_data,
        "approved_date": quotation.CreatedDate.strftime("%Y-%m-%d %H:%M:%S") if quotation.CreatedDate else None
    }
    return jsonify(data)

#cònirm
@quotation_bp.route("/api/quotations/<int:quotation_id>/confirm", methods=["PUT"])
def confirm_quotation(quotation_id):
    print("🚀 ~ quotation_id:", quotation_id)

    quotation = Quotation.query.get_or_404(quotation_id)

    quotation.status = "confirmed"
    
    quotation.user2_id = current_user.id  # Giả sử bạn có thông tin người dùng hiện tại

    #  Cập nhật luôn RepairRequest
    req = RepairRequest.query.get(quotation.RequestID)
    if req:
        req.Status = "waitPR"
        db.session.add(req)

    db.session.commit()
    return jsonify({"message": "Quotation approved", "quotation_id": quotation.id})

@quotation_bp.route("/api/quotations/<int:quotation_id>/cancel", methods=["PUT"])
def cancel_quotation(quotation_id):

    quotation = Quotation.query.get_or_404(quotation_id)
    
    approved_opt = QuoteOption.query.filter_by(
        quotation_id=quotation_id,
        option_no=quotation.approved_option_no
    ).first()

    if not approved_opt:
        return jsonify({"error": "Option not found"}), 404

    approved_opt.status = "cancelled"

    quotation.status = "pendingquoting"

    db.session.commit()
    return jsonify({"message": "Quotation approved", "quotation_id": quotation.id})

# @quotation_bp.route("/api/quotations/<int:quotation_id>/cancel", methods=["PUT"])
# def cancel_quotation(quotation_id):
#     quotation = Quotation.query.get_or_404(quotation_id)

#     # Lấy option đã approve
#     approved_opt = QuoteOption.query.filter_by(
#         quotation_id=quotation_id,
#         option_no=quotation.approved_option_no
#     ).first()

#     if not approved_opt:
#         return jsonify({"error": "Option not found"}), 404

#     # Xóa option bị từ chối
#     db.session.delete(approved_opt)
#     db.session.flush()  # flush để cập nhật trước khi kiểm tra số lượng option còn lại

#     # Lấy RepairRequest
#     req = RepairRequest.query.get_or_404(quotation.RequestID)

#     # Nếu còn option khác trong quotation
#     remaining_opts = QuoteOption.query.filter_by(quotation_id=quotation_id).all()
#     if remaining_opts:
#         quotation.status = "Pending"
#         quotation.approved_option_no = None
#         quotation.approve_date = None
#         req.Status = "Quoted"
#     else:
#         # Không còn option nào -> từ chối luôn request
#         quotation.status = "rejected"
#         req.Status = "rejected"

#     db.session.commit()

#     return jsonify({
#         "message": "Quotation option rejected and removed",
#         "quotation_id": quotation.id,
#         "quotation_status": quotation.status,
#         "request_id": req.id,
#         "request_status": req.Status
#     })
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
    QuoteOption.status.in_(["Approved", "waitPR", "waitPO","waitTechnicalDone"])
).all()

    if not approved_options:
        return jsonify({"error": "No approved options found"}), 404

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
        "request_date": req.RequestDate.strftime("%Y-%m-%d %H:%M:%S") if req.RequestDate else None,
        "approved_date": quotation.approve_date.strftime("%Y-%m-%d %H:%M:%S") if quotation.approve_date else None,
        "approved_options": options_data,
        "approved_by": quotation.user2_id if quotation else None

    }

    return jsonify(data)


    
  


# @quotation_bp.route("/quote_option/<int:option_id>/waitpr", methods=["PUT"])
# def set_waitpa(option_id):
#     option = QuoteOption.query.get(option_id)
#     if not option:
#         return jsonify({"error": "QuoteOption not found"}), 404

#     # Chỉ cho phép chuyển nếu status hiện tại là Approved
#     # if option.status.lower() != "Approved":
#     #     return jsonify({"error": "Only Approved options can be updated to waitPA"}), 400
#     if option.status == "waitPR":
#             return jsonify({"error": "Option is already in waitPR status"}), 400
#     option.status = "waitPR"
#     db.session.commit()

#     return jsonify({
#         "message": "Option status updated to waitPA",
#         "option": {
#             "id": option.id,
#             "quotation_id": option.quotation_id,
#             "option_no": option.option_no,
#             "vendor_name": option.vendor_name,
#             "status": option.status,
#             "total_cost": option.total_cost
#         }
#     }), 200

@quotation_bp.route("/quote_option/<int:option_id>/waitpr", methods=["POST"])
def set_waitpr(option_id):
    data = request.get_json()
    pa_no = data.get("PA_no")

    if not pa_no:
        return jsonify({"error": "PA_no is required"}), 400

    option = QuoteOption.query.get(option_id)
    if not option:
        return jsonify({"error": "QuoteOption not found"}), 404

    # Option phải là Approved thì mới cho tạo PA
    if option.status != "Approved":
        return jsonify({"error": "Only Approved option can be used to create PA"}), 400

    quotation = option.quotation
    if not quotation:
        return jsonify({"error": "Quotation not found for this option"}), 404

    # --- cập nhật trạng thái request thay vì option ---
    repair_request = RepairRequest.query.get(quotation.RequestID)
    if not repair_request:
        return jsonify({"error": "RepairRequest not found"}), 404

    repair_request.Status  = "waitPO"

    # Kiểm tra PA cho request_id
    pa = PA.query.filter_by(request_id=repair_request.id).first()
    if pa:
        pa.PA_no = pa_no
        pa.approved_option_id = option.id
    else:
        pa = PA(
            request_id=repair_request.id,
            approved_option_id=option.id,
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
        "option": {
            "id": option.id,
            "quotation_id": option.quotation_id,
            "option_no": option.option_no,
            "vendor_name": option.vendor_name,
            "status": option.status,
            "total_cost": option.total_cost
        },
        "pa": pa.to_dict()
    }), 200
    
    
    

@quotation_bp.route("/quote_option/<int:option_id>/waitpo", methods=["POST"])
def set_waitpo(option_id):
    data = request.get_json()
    po_no = data.get("PO_no")
    delivery = data.get("Delivery")
    note = data.get("note")

    if not po_no:
        return jsonify({"error": "PO_no is required"}), 400

    option = QuoteOption.query.get(option_id)
    if not option:
        return jsonify({"error": "QuoteOption not found"}), 404

    # Option phải là Approved thì mới cho tạo PO
    if option.status != "Approved":
        return jsonify({"error": "Only Approved option can be used to create PO"}), 400

    quotation = option.quotation
    if not quotation:
        return jsonify({"error": "Quotation not found for this option"}), 404

    # --- cập nhật trạng thái request ---
    repair_request = RepairRequest.query.get(quotation.RequestID)
    if not repair_request:
        return jsonify({"error": "RepairRequest not found"}), 404

    # Chỉ khi đã có PA_no mới cho tạo PO
    pa = PA.query.filter_by(request_id=repair_request.id).first()
    if not pa or not pa.PA_no:
        return jsonify({"error": "PA_no must exist before creating PO"}), 400

    # Cập nhật trạng thái request
    repair_request.Status = "waitTechnicalDone"

    # Cập nhật hoặc thêm PO info
    pa.PO_no = po_no
    pa.approved_option_id = option.id
    if delivery:
        from datetime import datetime
        try:
            pa.Delivery = datetime.strptime(delivery, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format for Delivery, expected YYYY-MM-DD"}), 400
    if note:
        pa.note = note

    db.session.commit()

    return jsonify({
        "message": "RepairRequest status updated to waitTechnicalDone and PO recorded",
        "repair_request": {
            "id": repair_request.id,
            "status": repair_request.Status
        },
        "option": {
            "id": option.id,
            "quotation_id": option.quotation_id,
            "option_no": option.option_no,
            "vendor_name": option.vendor_name,
            "status": option.status,
            "total_cost": option.total_cost
        },
        "pa": pa.to_dict()
    }), 200
