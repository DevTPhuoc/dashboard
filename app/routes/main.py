from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required
from app.models import Item
from app import db

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required  
def main_page():
    items = Item.query.all()
    return render_template('base.html', items=items)

@main_bp.route('/add', methods=['POST'])
@login_required
def add_item():
    name = request.form['name']
    value = request.form['value']
    db.session.add(Item(name=name, value=value))
    db.session.commit()
    flash('Đã thêm dữ liệu!')
    return redirect(url_for('main.main_page'))

@main_bp.route('/edit/<int:item_id>', methods=['POST'])
@login_required
def edit_item(item_id):
    item = Item.query.get(item_id)
    if item:
        item.name = request.form['name']
        item.value = request.form['value']
        db.session.commit()
        flash('Đã cập nhật dữ liệu!')
    return redirect(url_for('main.main_page'))

@main_bp.route('/delete/<int:item_id>', methods=['POST'])
@login_required
def delete_item(item_id):
    item = Item.query.get(item_id)
    if item:
        db.session.delete(item)
        db.session.commit()
        flash('Đã xóa dữ liệu!')
    return redirect(url_for('main.main_page'))
#gắn route từ config.py vào đây

@main_bp.route("/index")
def index():
    items = Item.query.all()
    return render_template('/lab/device.html',items=items)

@main_bp.route("/approve-requests")
def approve_requests_page():
    items = Item.query.all()

    return render_template("/lab/approve_requests.html",items=items)

@main_bp.route("/classify-repairs")
def classify_repairs_page():
    return render_template("/lab/classify_repairs.html")

@main_bp.route("/baogia")
def baogia():
    return render_template("/lab/baogia.html")

@main_bp.route("/duyetbaogia")
def duyetbaogia():
    return render_template("/lab/duyetbaogia.html")

@main_bp.route("/dsyeucau")
def dsyeucau():
    return render_template("/lab/dsyeucau.html")

@main_bp.route("/yeucausuachua")
def yeucausuachua():
    return render_template("/lab/yeucausuachua.html")


