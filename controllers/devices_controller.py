
# controllers/devices_controller.py
from flask import request, jsonify, send_file
from flask_login import current_user
import pandas as pd
from controllers.base_controller import BaseCRUDController
from models.models import Device, Team, db
from flask import session


def create_blueprint():
    ctrl = BaseCRUDController("devices", Device)

    # Sẵn có filter theo TeamID
    ctrl.add_filter_route("TeamID", filter_type=int)

    # API chỉ lấy thiết bị của user hiện tại
    @ctrl.blueprint.route("/my_devices", methods=["GET"])
    def get_my_devices():
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
            if str(user.get('role_id')) == "1":
                devices = Device.query.filter(Device.Status.in_(['available', 'broken']))
            elif str(user.get('role_id')) == "4":
                    devices = (
                    Device.query.join(Team)
                    .filter(Team.LabID == current_user.idlab)
                    .all()
                )

            else:
                # Bắt đầu query
                query = Device.query
                # Lọc theo team_id hoặc lab_id của user
                if user.get('idteam'):
                    query = query.filter_by(TeamID=user['idteam']).filter(Device.Status.in_(['available', 'broken']))
                elif user.get('idlab'):
                    team_ids = [team.id for team in Team.query.filter_by(LabID=user['idlab']).all()]
                    if team_ids:
                        query = query.filter(Device.TeamID.in_(team_ids)).filter(Device.Status.in_(['available', 'broken']))
                    else:
                        return jsonify([]), 200
                else:
                    return jsonify([]), 200
                # Thực hiện query
                devices = query.filter(Device.Status.in_(['available', 'broken']))

            # Format response
            result = []
            for device in devices:
                device_data = {
                    "id": device.id,
                    "DeviceCode": device.DeviceCode ,
                    "DeviceName": device.DeviceName,
                    "TeamID": device.TeamID,
                    "Status": device.Status or "available",
                    "TeamName": "N/A",
                    "LabName": "N/A",
                    "LabID": NotImplementedError,
                    "Model": device.Model,
                    "Branch": device.Branch,
                    "ImportDate": device.ImportDate
                }

                # Thêm thông tin team và lab
                if device.team:
                    device_data["TeamName"] = device.team.TeamName or "N/A"
                    if device.team.lab:
                        device_data["LabName"] = device.team.lab.LabName or "N/A"
                        device_data["LabID"] = device.team.lab.id

                result.append(device_data)

            return jsonify(result), 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Internal server error"}), 500

    # API import devices từ file Excel
    @ctrl.blueprint.route("/import", methods=["POST"])
    def import_devices():
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file'}), 400
    
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400

        try:
            # Đọc file Excel
            df = pd.read_excel(file)
        
            # Kiểm tra cột bắt buộc
            if not all(col in df.columns for col in ['DeviceName', 'DeviceCode', 'TeamID', 'Model', 'Branch', 'ImportDate']):
                return jsonify({
                    'success': False, 
                    'message': 'Missing required columns. Required: DeviceName, DeviceCode, TeamID'
                }), 400

            success_count = 0
            error_count = 0
            errors = []

            for index, row in df.iterrows():
                try:
                    # Làm sạch dữ liệu
                    device_name = str(row['DeviceName']).strip() if pd.notna(row['DeviceName']) else None
                    device_code = str(row['DeviceCode']).strip() if pd.notna(row['DeviceCode']) else None
                    team_id = int(row['TeamID']) if pd.notna(row['TeamID']) else None
                    model = str(row['Model']).strip() if pd.notna(row['Model']) else None
                    brand=str(row['Branch']).strip() if pd.notna(row['Branch']) else None
                    importdate=str(row['ImportDate']).strip() if pd.notna(row['ImportDate']) else None
                    # Kiểm tra dữ liệu bắt buộc
                    if not device_name or not device_code or not team_id:
                        error_count += 1
                        errors.append(f"Dòng {index + 2}: Thiếu dữ liệu bắt buộc")
                        continue

                    # Kiểm tra TeamID có tồn tại không
                    team_exists = Team.query.get(team_id)
                    if not team_exists:
                        error_count += 1
                        errors.append(f"Dòng {index + 2}: TeamID {team_id} không tồn tại")
                        continue

                    # Kiểm tra DeviceCode trùng
                    existing_device = Device.query.filter_by(DeviceCode=device_code).first()
                    if existing_device:
                        error_count += 1
                        errors.append(f"Dòng {index + 2}: DeviceCode '{device_code}' đã tồn tại")
                        continue

                    # Tạo device mới
                    device = Device(
                        DeviceName=device_name,
                        DeviceCode=device_code,
                        TeamID=team_id,
                        Status=str(row.get('Status', 'available')).strip() if pd.notna(row.get('Status')) else 'available',
                        TotalRepairCount=int(row.get('TotalRepairCount', 0)) if pd.notna(row.get('TotalRepairCount')) else 0,
                        TotalRepairCost=float(row.get('TotalRepairCost', 0.0)) if pd.notna(row.get('TotalRepairCost')) else 0.0,
                        Model=model,
                        Branch=brand,
                        ImportDate=importdate

                    )
                    
                    db.session.add(device)
                    success_count += 1
                    
                except ValueError as e:
                    error_count += 1
                    errors.append(f"Dòng {index + 2}: Dữ liệu không hợp lệ - {str(e)}")
                except Exception as e:
                    error_count += 1
                    errors.append(f"Dòng {index + 2}: {str(e)}")

           
            if success_count > 0:
                db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Import completed',
                'success_count': success_count,
                'error_count': error_count,
                'errors': errors
            })

        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False, 
                'message': f'Error: {str(e)}'
            }), 500

    @ctrl.blueprint.route("/filter", methods=["GET"])
    def get_devices_filtered():
        try:
            data = request.args
            lab_id = data.get("lab_id")
            team_id = data.get("team_id")

            query = Device.query

            if team_id:
                query = query.filter_by(TeamID=team_id)
            elif lab_id:
                team_ids = [team.id for team in Team.query.filter_by(LabID=lab_id).all()]
                query = query.filter(Device.TeamID.in_(team_ids))
            else:
                return jsonify({"error": "Missing lab_id or team_id"}), 400

            devices = query.all()

            result = [
                {
                    "id": d.id,
                    "DeviceCode": d.DeviceCode,
                    "DeviceName": d.DeviceName,
                    "Status": d.Status,
                    "TeamID": d.TeamID,
                    "TeamName": d.team.TeamName if d.team else "N/A",
                    "LabID": d.team.LabID if d.team else None,
                    "LabName": d.team.lab.LabName if d.team and d.team.lab else "N/A",
                }
                for d in devices
            ]

            return jsonify(result), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @ctrl.blueprint.route("/active", methods=["GET"])
    def get_active_devices():
        try:
            user = None
            if current_user.is_authenticated:
                user = {
                    "id": current_user.id,
                    "idlab": current_user.idlab,
                    "idteam": current_user.idteam,
                    "role_id": current_user.role_id,
                }
            elif "user" in session:
                user = session["user"]

            if not user:
                return jsonify({"error": "User not authenticated"}), 401

            query = Device.query
            if user.get("idteam"):
                query = query.filter(Device.TeamID == user["idteam"])
            elif user.get("idlab"):
                team_ids = [t.id for t in Team.query.filter_by(LabID=user["idlab"]).all()]
                if team_ids:
                    query = query.filter(Device.TeamID.in_(team_ids))

            status_filter = request.args.get("Status")
            if status_filter:
                query = query.filter(Device.Status == status_filter)

            devices = query.all()

            result = []
            for d in devices:
                result.append({
                    "id": d.id,
                    "DeviceCode": d.DeviceCode,
                    "DeviceName": d.DeviceName,
                    "Status": d.Status,
                    "TeamID": d.TeamID,
                    "TeamName": d.team.TeamName if d.team else "N/A",
                    "LabID": d.team.LabID if d.team else None,
                    "LabName": d.team.lab.LabName if d.team and d.team.lab else "N/A",
                })

            return jsonify(result), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    @ctrl.blueprint.route('/template', methods=['GET'])
    def download_template():
        import pathlib
        BASE_DIR = pathlib.Path(__file__).parent.parent
        file_path = BASE_DIR / 'app' / 'static' / 'Template' / 'Device Template.xlsx'
        return send_file(file_path, as_attachment=True)

    return ctrl.blueprint

   