from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_required
from app.models import User, Role, Page
from app import db

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(func):
    from functools import wraps
    from flask_login import current_user
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.role or current_user.role.name != 'admin':
            return jsonify({'success': False, 'message': 'Bạn không có quyền truy cập trang này.'}), 403
        return func(*args, **kwargs)
    return decorated_view

@admin_bp.route('/', methods=['GET'])
@login_required
@admin_required
def admin_dashboard():
    users = User.query.all()
    roles = Role.query.all()
    pages = Page.query.all()
    return render_template('admin/admin.html', users=users, roles=roles, pages=pages)

@admin_bp.route('/add_role', methods=['POST'])
@login_required
@admin_required
def add_role():
    name = request.form['role_name']
    if Role.query.filter_by(name=name).first():
        return jsonify({'success': False, 'message': 'Role đã tồn tại!'})
    new_role = Role(name=name)
    db.session.add(new_role)
    db.session.commit()
    
    # Trả về thông tin role mới để JS có thể thêm vào danh sách
    return jsonify({
        'success': True, 
        'message': 'Đã thêm role!',
        'role': {
            'id': new_role.id,
            'name': new_role.name
        }
    })

@admin_bp.route('/delete_role/<int:role_id>', methods=['POST'])
@login_required
@admin_required
def delete_role(role_id):
    role = Role.query.get(role_id)
    if role and role.name != 'admin':
        db.session.delete(role)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Đã xóa role!'})
    return jsonify({'success': False, 'message': 'Không thể xóa role này!'})

@admin_bp.route('/add_user', methods=['POST'])
@login_required
@admin_required
def add_user():
    username = request.form['username']
    password = request.form['password']
    role_id = request.form['role_id']
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Tên đăng nhập đã tồn tại!'})
    role = Role.query.get(role_id)
    new_user = User(username=username, password=password, role=role)
    db.session.add(new_user)
    db.session.commit()
    
    # Trả về thông tin user mới để JS có thể thêm vào table
    return jsonify({
        'success': True, 
        'message': 'Thêm user thành công!',
        'user': {
            'id': new_user.id,
            'username': new_user.username,
            'role_id': new_user.role_id,
            'role_name': new_user.role.name
        }
    })

@admin_bp.route('/set_role/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def set_role(user_id):
    user = User.query.get(user_id)
    role_id = request.form['role_id']
    if user and user.username != 'admin':
        user.role_id = role_id
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cập nhật quyền thành công!'})
    return jsonify({'success': False, 'message': 'Không thể đổi quyền user này!'})

@admin_bp.route('/delete_user/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if user and user.username != 'admin':
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Đã xóa user!'})
    return jsonify({'success': False, 'message': 'Không thể xóa user này!'})

@admin_bp.route('/set_role_pages/<int:role_id>', methods=['POST'])
@login_required
@admin_required
def set_role_pages(role_id):
    role = Role.query.get(role_id)
    page_ids = request.form.getlist('page_ids')
    role.pages = [Page.query.get(int(pid)) for pid in page_ids]
    db.session.commit()
    return jsonify({'success': True, 'message': 'Cập nhật quyền truy cập trang cho role thành công!'})

@admin_bp.route('/set_user_pages/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def set_user_pages(user_id):
    user = User.query.get(user_id)
    page_ids = request.form.getlist('page_ids')
    user.pages = [Page.query.get(int(pid)) for pid in page_ids]
    db.session.commit()
    return jsonify({'success': True, 'message': 'Cập nhật quyền truy cập trang cho user thành công!'})