from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from datetime import datetime
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = "auth.login"

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)

    # import models để Flask biết các bảng cần tạo
    

    # with app.app_context():
    #     db.create_all()
                      # tạo bảng cho default (database.db)

    # import và đăng ký blueprint
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.main import main_bp
    from .routes.user_setting import user_setting_bp
    from .routes.api import api_bp
    
    from .routes.repai_request import repair_request_bp
    from controllers.labs_controller import create_blueprint as labs_bp
    from controllers.teams_controller import create_blueprint as teams_bp
    from controllers.devices_controller import create_blueprint as devices_bp
    # from controllers.users_controller import create_blueprint as users_bp
    from controllers.repair_requests_controller import create_blueprint as requests_bp
    from controllers.quotations_controller import create_blueprint as quotations_bp
    from controllers.purchases_controller import create_blueprint as purchases_bp
    from controllers.history_repair_controller import create_blueprint as history_bp
    from controllers.techinician_controller import create_blueprint as tech_bp
    from controllers.approvals_controller import create_blueprint as approval_bp
    from controllers.timeline import create_blueprint as timeline_bp
    # from controllers.quotation_controller import create_blueprint as quotation_bp
    from app.routes.repai_request import repair_request_bp,quotation_bp, global_bp
    from controllers.repair_requests_status_history import create_blueprint as history_repair_status_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(user_setting_bp)
    app.register_blueprint(api_bp)
    
    app.register_blueprint(history_repair_status_bp(), url_prefix="/repair_requests_status_history")
    app.register_blueprint(labs_bp(), url_prefix="/labs")
    app.register_blueprint(teams_bp(), url_prefix="/teams")
    app.register_blueprint(devices_bp(), url_prefix="/devices")
    # app.register_blueprint(users_bp(), url_prefix="/users")
    app.register_blueprint(requests_bp(), url_prefix="/repair_requests")
    app.register_blueprint(quotations_bp(), url_prefix="/quotations")
    app.register_blueprint(purchases_bp(), url_prefix="/purchases")
    app.register_blueprint(history_bp(), url_prefix="/historyrepair")
    app.register_blueprint(tech_bp(), url_prefix="/technicians")
    app.register_blueprint(approval_bp(), url_prefix="/approvals")
    app.register_blueprint(repair_request_bp, url_prefix="/repair_request")
    app.register_blueprint(timeline_bp(), url_prefix="/timeline")
    app.register_blueprint(quotation_bp) 
    app.register_blueprint(global_bp)
    
    
    @app.route("/device")
    def device():
        return render_template("/lab/device.html")
    @app.route("/my_request")
    def my_request():
        return render_template("lab/my_request.html")
    @app.route("/em_approve")
    def em_approve_page():
        return render_template("/lab/em_approve.html")
    @app.route("/import")
    def import_page():
        return render_template("/lab/import.html")
    
    @app.route("/lm_approve")
    def lm_approve_page():
        return render_template("/lab/lm_approve.html")
    @app.route("/classify-repairs")
    def classify_repairs_page():
        return render_template("classify_repairs.html", now=datetime.now())
    # routes.py hoặc controller
    @app.route("/detail/<int:request_id>")
    def detail(request_id):
        return render_template("lab/timeline.html", request_id=request_id)

    @app.route("/baogia")
    def baogia():
        return render_template("baogia.html")
    @app.route('/timelined')
    def timeline_page():
        request_id = request.args.get('request_id')
        return render_template('lab/timeline.html', request_id=request_id)

    @app.route("/em_mn_apr")
    def em_mn_apr():
        return render_template("lab/EM_MN_apr.html")
    
    @app.route("/approvelab")
    def approvelab():
        return render_template("/lab/approvelab.html")
    @app.route("/dsyeucau")
    def dsyeucau():
        return render_template("dsyeucau.html")

    @app.route("/yeucausuachua")
    def yeucausuachua():
        return render_template("yeucausuachua.html")

    @app.route("/duyetyeucau")
    def duyetyeucau():
        return render_template("approve_requests.html")
    
    @app.route("/dashboard/sl")
    def dashboad():
        return render_template("/lab/dashboad.html")
    return app
    