from app import create_app, db
from app.models import User, Role, Page

app = create_app()

with app.app_context():
    # db.create_all()
    
    
    # Tạo role mặc định
    if not Role.query.filter_by(name='admin').first():
        db.session.add(Role(name='admin'))
    if not Role.query.filter_by(name='user').first():
        db.session.add(Role(name='user'))
    db.session.commit()
    # Tạo user admin mặc định
    admin_role = Role.query.filter_by(name='admin').first()
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', password='admin', role=admin_role)
        db.session.add(admin)
        db.session.commit()

    # Gán quyền cho admin truy cập tất cả page
    admin_role = Role.query.filter_by(name='admin').first()
    all_pages = Page.query.all()
    admin_role.pages = all_pages
    db.session.commit()

if __name__ == '__main__':
    # app.run(host='0.0.0.0', debug=True)
    
    import webbrowser
    import threading

    host = '0.0.0.0'
    port = 5003

    def open_browser():
        webbrowser.open(f'http://127.0.0.1:{port}/')

    # threading.Timer(1.5, open_browser).start()
    app.run(host=host, port=port, debug=True)