# controllers/repair_requests_controller.py
from flask_login import current_user
from controllers.base_controller import BaseCRUDController
from flask import request, jsonify, session, current_app
from models.models import (
    RepairRequest, Device, RepairHistory, Approval,
    Quotation, Purchase, Team, Technician, db
)
from app.function.function_outlook import get_data_history, send_outlook_email, split_and_render_html_tables
from datetime import datetime
from sqlalchemy import or_
import os
from werkzeug.utils import secure_filename
import json


def create_blueprint():
    ctrl = BaseCRUDController("repair_requests", RepairRequest)
    ctrl.add_filter_route("Status", filter_type=str)
    ctrl.add_filter_route("TeamID", filter_type=int)
    # ----------------------------
    # Tạo yêu cầu sửa chữa cho nhiều thiết bị với mô tả riêng
    # ----------------------------
    def create_repair_request():
        try:
            data = request.form
            lab_id = data.get("lab_id")
            team_id = data.get("team_id")
            device_ids = request.form.getlist("device_ids[]")
            time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Lấy user ID từ current_user hoặc session
            if current_user.is_authenticated:
                username = current_user.username
            elif "username" in data:
                username = data.get("username")
            elif "user" in session:
                username = session["user"].get("username")
            else:
                username = 1  # fallback

            if not lab_id or not team_id or not device_ids:
                return jsonify({"error": "Missing required fields"}), 400

            request_ids = []
            for device_id in device_ids:
                description = data.get(f"description_{device_id}", "")
                if not description:
                    return jsonify(
                        {"error": f"Missing description for device {device_id}"}
                    ), 400

                repair_request = RepairRequest(
                    RequestedBy=username,
                    LabID=lab_id,
                    TeamID=team_id,
                    DeviceID=device_id,
                    Description=description,
                    Status=current_app.config["WAIT_EVALUATION"],
                    RequestDate=time,
                    Timeline=[],
                )
                db.session.add(repair_request)
                db.session.flush()
                request_ids.append(repair_request.id)
                # ✅ Update trạng thái thiết bị
                device = Device.query.get(device_id)
                if device:
                    device.Status = "broken"

            db.session.commit()

            return jsonify(
                {
                    "message": "Repair requests created successfully",
                    "request_ids": request_ids,
                    "request_id": f"RR-{'-'.join(str(id) for id in request_ids)}",
                }
            ), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    ctrl.add_custom_route(
        rule="/create", endpoint="create_repair_request", view_func=create_repair_request, methods=["POST"]
    )

    # ----------------------------
    # Đánh giá request: Internal/External Repair
    # ----------------------------
    # ----------------------------
# Đánh giá yêu cầu sửa chữa (InternalRepair / ExternalRepair)
# ----------------------------
    def evaluate_request(request_id):
        try:
            req = RepairRequest.query.get(request_id)
            if not req:
                return jsonify({"error": "Request not found"}), 404

            data = request.json
            decision = data.get("decision")
            notes = data.get("notes", "")
            technician_id = data.get("technician_id")
            is_confirm_done = data.get("is_confirm_done", False)
            req.NoteByUsername = notes
            req.ChangeByUsername = current_user.username
        # Validate technician
            if not technician_id:
                return jsonify(
                {"error": "technician_id is required for InternalRepair or ExternalRepair"}
            ), 400

            technician = Technician.query.get(technician_id)
            if not technician:
                return jsonify({"error": "Technician not found"}), 404

        # Update technician info
            req.TechName = technician.Name
            device = Device.query.get(req.DeviceID)

        # Update status depending on decision type
            if decision == "InternalRepair":
                if is_confirm_done:
                    req.Status = current_app.config["WAIT_LAB_CONFIRM"]
                else:
                    req.Status = current_app.config["WAIT_EM_CONFIRM_FIXED"]
            elif decision == "ExternalRepair":
                req.Status = current_app.config["WAIT_EM_MANAGER_APPROVAL_EXTERNAL"]
                apr=Approval(
                    RequestID=req.id,
                    Status=current_app.config["WAIT_LM_MANAGER_APPROVAL_EXTERNAL"],
                    Comment = notes
                )
                db.session.add(apr)
        
        # Append timeline entry (lưu tất cả các lần đánh giá kỹ thuật)
            timeline_entry = {
                "event": "TechnicianEvaluation",
                "decision": decision,
                "notes": notes,
                "technician_id": technician_id,
                "technician_name": technician.Name,
                "time": data["time"],
            }

            tl = req.Timeline
            if not tl: 
                tl = []
            else:
                if isinstance(tl, str):
                    tl = json.loads(tl)

            tl.append(timeline_entry)
            req.Timeline = json.dumps(tl)
            
            
            
            db.session.add(req)

        # Nếu là internal repair — tạo lịch sử sửa chữa
            # if decision == "InternalRepair":
            #     history = RepairHistory(
            #     DeviceID=req.DeviceID,
            #     RequestID=req.id,
            #     RepairType="Internal",
            #     TechName=technician.Name,
            #     Notes=notes,
            #     RepairDate=datetime.utcnow(),
            # )
            #     db.session.add(history)

            # # Cập nhật thống kê thiết bị
            # if device:
            #     device.TotalRepairCount = (device.TotalRepairCount or 0) + 1

            db.session.commit()
#             to=["thuyhang.dinh.ext@bureauveritas.com", "jack.doan@bureauveritas.com"]
#             cc=["thuyhang.dinh.ext@bureauveritas.com","jack.doan@bureauveritas.com"]
#             bcc=["jack.doan@bureauveritas.com"]
#             data =get_data_history(request_id)
#             data_table,subject=split_and_render_html_tables(data)
#             send_outlook_email(
#                 to=to,
#                 subject=subject,
#                 body=data_table,  # dùng bảng HTML làm nội dung
#                 cc=cc,
#                 bcc=bcc,
#                 from_addr="jack.doan@bureauveritas.com",
#     # attachments=["C:\\Users\\Phuoc\\Documents\\file.pdf"]
# )
            return jsonify(req.to_dict())

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


# Add custom route
    ctrl.add_custom_route(
        rule="/<int:request_id>/evaluate",
        endpoint="evaluate_request",
        view_func=evaluate_request,
        methods=["POST"],
)


    # ----------------------------
    # Get repair requests for user (lab + team)
    # ----------------------------
    @ctrl.blueprint.route("/my_request", methods=["GET"])
    def get_repair_requests():
        try:
            user = None
            if current_user.is_authenticated:
                user = {
                    "id": current_user.id,
                    "username": current_user.username,
                    "idlab": current_user.idlab,
                    "idteam": current_user.idteam,
                    "role_id": current_user.role_id,
                }
            elif "user" in session:
                user = session["user"]

            if not user:
                return jsonify({"error": "User not authenticated"}), 401

            print(f"Loading repair requests for user: {user}")

            query = RepairRequest.query
            team_ids = []

            # Admin → lấy tất cả
            if user.get("role_id") == 1:
                pass
            else:
                if user.get("idteam"):
                    print(f"Filtering by team ID: {user['idteam']}")
                    team_ids.append(user["idteam"])

                if user.get("idlab"):
                    print(f"Filtering by lab ID: {user['idlab']}")
                    lab_team_ids = [
                        team.id
                        for team in Team.query.filter_by(LabID=user["idlab"]).all()
                    ]
                    print(f"Team IDs in lab: {lab_team_ids}")
                    team_ids.extend(lab_team_ids)

                if team_ids:
                    query = query.filter(RepairRequest.TeamID.in_(team_ids))
                else:
                    return jsonify([]), 200

            # Apply filters
            status_filter = request.args.get("status")
            lab_filter = request.args.get("lab_id")
            search_filter = request.args.get("search")

            if status_filter:
                query = query.filter_by(Status=status_filter)

            if lab_filter:
                lab_team_ids = [
                    team.id for team in Team.query.filter_by(LabID=lab_filter).all()
                ]
                if lab_team_ids:
                    query = query.filter(RepairRequest.TeamID.in_(lab_team_ids))

            if search_filter:
                query = query.filter(
                    (RepairRequest.Description.ilike(f"%{search_filter}%"))
                    | (
                        RepairRequest.DeviceID.in_(
                            Device.query.filter(
                                Device.DeviceName.ilike(f"%{search_filter}%")
                            ).with_entities(Device.id)
                        )
                    )
                )

            repair_requests = query.order_by(
                RepairRequest.RequestDate.desc()).all()

            result = []
            for req in repair_requests:
                request_data = {
                    "id": req.id,
                    "DeviceID": req.DeviceID,
                    "Description": req.Description,
                    "LabID": req.LabID,
                    "TeamID": req.TeamID,
                    "RequestedBy": req.RequestedBy,
                    "RequestDate": req.RequestDate.isoformat()
                    if req.RequestDate
                    else None,
                    "Status": req.Status,
                    "DeviceName": "N/A",
                    "LabName": "N/A",
                    "TeamName": "N/A",
                }

                if req.device:
                    request_data["DeviceName"] = (
                        req.device.DeviceName or f"Thiết bị {req.DeviceID}"
                    )

                if req.team:
                    request_data["TeamName"] = req.team.TeamName or "N/A"
                    if req.team.lab:
                        request_data["LabName"] = req.team.lab.LabName or "N/A"

                result.append(request_data)

            print(f"Returning {len(result)} repair requests")
            return jsonify(result), 200

        except Exception as e:
            print(f"Error in get_repair_requests: {str(e)}")
            import traceback

            traceback.print_exc()
            return jsonify({"error": "Internal server error"}), 500
        
    @ctrl.blueprint.route("/approve_requests/<int:request_id>", methods=["POST"])
    def handle_approval(request_id):
        try:
            data = request.get_json()
            action = data.get('action')  # 'approve' or 'reject'
            comment = data.get('comment')

            repair_request = RepairRequest.query.get(request_id)
            if not repair_request:
                return jsonify({'error': 'Repair request not found'}), 404
        
            # Lấy approval record hiện có (nếu có)
            existing_approval = Approval.query.filter(Approval.RequestID==request_id,Approval.Status.in_([current_app.config["WAIT_EM_MANAGER_APPROVAL_EXTERNAL"], current_app.config["WAIT_LM_MANAGER_APPROVAL_EXTERNAL"]])).first()
            if not existing_approval:
                return jsonify({'error': 'No existing approval found for this request'}), 404

            
            repair_request.ChangeByUsername = current_user.username
            repair_request.NoteByUsername = comment 
            existing_approval.Comment = comment
            # Xử lý REJECT
            if action == 'reject':
                if not comment:
                    return jsonify({'error': 'Comment is required for rejection'}), 400
            
                # Cập nhật status repair request
                repair_request.Status = current_app.config["WAIT_EM_RE_EVALUATION"]
            
                existing_approval.Status = 'Rejected'
            # Xử lý APPROVE
            if action == 'approve':
                if repair_request.Status == current_app.config["WAIT_EM_MANAGER_APPROVAL_EXTERNAL"]:
                    existing_approval.Status = current_app.config["WAIT_LM_MANAGER_APPROVAL_EXTERNAL"]
                    repair_request.Status = current_app.config["WAIT_LM_MANAGER_APPROVAL_EXTERNAL"]
                else:
                    existing_approval.Status ="Approved"
                    repair_request.Status = current_app.config["WAIT_QUOTATION"]
                    

            db.session.add(existing_approval)
            db.session.add(repair_request)
            db.session.commit()  
            # sendemail(request_id)
            
            return jsonify({
                'new_status': repair_request.Status,
                'new_comment': repair_request.NoteByUsername
            }),200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    return ctrl.blueprint
