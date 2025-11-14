from flask import redirect, url_for, flash
from flask_login import current_user
from functools import wraps
from app.models import Page

def page_access_required(page_url):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated or not current_user.role:
                flash('Bạn cần đăng nhập!')
                return redirect(url_for('auth.login'))
            page = Page.query.filter_by(url=page_url).first()
            # Hợp quyền: role hoặc user đều được
            if not page or (page not in current_user.role.pages and page not in current_user.pages):
                flash('Bạn không có quyền truy cập trang này!')
                return redirect(url_for('dashboard.home'))
            return func(*args, **kwargs)
        return wrapper
    return decorator