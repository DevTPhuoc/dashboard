from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
import requests
from app.models import User, db
from app.function.function_bvlab import login_bvlab

user_setting_bp = Blueprint('user_setting', __name__, url_prefix='/user_setting')

@user_setting_bp.route('/')
@login_required
def index():
    return render_template('pages/setting-user.html')

@user_setting_bp.route('/api/change_password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    old_password = data.get('old_password', '').strip()
    new_password = data.get('new_password', '').strip()
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"message": "Không tìm thấy người dùng."}), 404
    if not old_password or not new_password:
        return jsonify({"message": "Vui lòng nhập đủ thông tin."}), 400
    if not user.check_password(old_password):
        return jsonify({"message": "Mật khẩu hiện tại không đúng."}), 400
   
    if old_password == new_password:
        return jsonify({"message": "Mật khẩu mới phải khác mật khẩu hiện tại."}), 400
    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Đổi mật khẩu thành công."}), 200

@user_setting_bp.route('/api/save_bvlab', methods=['POST'])
@login_required
def save_bvlab():
    data = request.get_json()
    user_bvlab = data.get('user_bvlab', '').strip()
    password_bvlab = data.get('password_bvlab', '').strip()
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"message": "Không tìm thấy người dùng."}), 404
    if not user_bvlab or not password_bvlab:
        return jsonify({"message": "Vui lòng nhập đủ thông tin."}), 400
    user.user_bvlab = user_bvlab
    user.pass_bvlab = password_bvlab
    if "Lỗi" not in login_bvlab(user_bvlab, password_bvlab,session=requests.Session()):
        db.session.commit()
        return jsonify({"message": "Lưu BVLab thành công."}), 200
    else:
        return jsonify({"message": "Lỗi đăng nhập không thành công, vui lòng kiểm tra username & password"}), 400


