from flask import Blueprint, jsonify, render_template, redirect, url_for, request, flash, session
from flask_login import current_user, login_user, logout_user, login_required
from app.models import User
from app import db, login_manager

auth_bp = Blueprint('auth', __name__)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username, password=password).first()
        if user:
            # Clear any existing flash messages before success
            session.pop('_flashes', None)
            login_user(user)
            # Show success page first, then redirect
            return render_template('auth/login_success.html')
        else:
            flash('Invalid credentials')
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))


@auth_bp.route('/login1', methods=['POST'])
def login1():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username, password=password).first()
    if user:
        login_user(user)
        
        # Lưu thông tin user vào session để dự phòng
        user_data = {
            "id": user.id,
            "username": user.username,
            "idlab": user.idlab,
            "idteam": user.idteam,
            "role_id": user.role_id
        }
        session['user'] = user_data
        
        print(f"User logged in successfully: {user_data}")  # Debug log
        return jsonify({"status": "success", "user": user_data}), 200

    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@auth_bp.route('/current_user', methods=['GET'])
def get_current_user():
    """API để lấy thông tin user hiện tại (cho debug)"""
    if current_user.is_authenticated:
        user_data = {
            "id": current_user.id,
            "username": current_user.username,
            "idlab": current_user.idlab,
            "idteam": current_user.idteam,
            "role_id": current_user.role_id
        }
        return jsonify({"user": user_data}), 200
    elif 'user' in session:
        return jsonify({"user": session['user']}), 200
    else:
        return jsonify({"error": "No user authenticated"}), 401