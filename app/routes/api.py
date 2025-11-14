from flask import Blueprint, jsonify, render_template
from flask_login import login_required, current_user
from app.models import Page

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/test-menu')
def test_menu():
    """Test page for dynamic menu system"""
    return render_template('test_menu.html')

@api_bp.route('/user/menu', methods=['GET'])
@login_required
def get_user_menu():
    """Get user's allowed pages based on role and individual permissions"""
    try:
        # Get pages from role
        role_pages = list(current_user.role.pages) if current_user.role else []
        
        # Get individual user pages
        user_pages = list(current_user.pages) if current_user.pages else []
        
        # Combine and remove duplicates
        allowed_pages = []
        seen_ids = set()
        
        for page in role_pages + user_pages:
            if page.id not in seen_ids:
                allowed_pages.append(page)
                seen_ids.add(page.id)
        
        # Convert to dictionary format
        pages_data = []
        for page in allowed_pages:
            page_data = {
                'id': page.id,
                'name': page.name,
                'url': page.url,
                'parent_id': page.parent.id if page.parent else None,
                'icon': getattr(page, 'icon', None),  # If you have icon field
                'order': getattr(page, 'order', 999)  # If you have order field
            }
            pages_data.append(page_data)
        
        # Sort by order and name
        pages_data.sort(key=lambda x: (x['order'], x['name']))
        
        return jsonify({
            'success': True,
            'pages': pages_data,
            'user': {
                'username': current_user.username,
                'role': current_user.role.name if current_user.role else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/user/permissions', methods=['GET'])
@login_required
def get_user_permissions():
    """Get detailed user permissions"""
    try:
        permissions = []
        
        if current_user.role:
            role_permissions = [
                {
                    'source': 'role',
                    'role_name': current_user.role.name,
                    'pages': [
                        {
                            'id': page.id,
                            'name': page.name,
                            'url': page.url,
                            'parent_id': page.parent.id if page.parent else None
                        }
                        for page in current_user.role.pages
                    ]
                }
            ]
            permissions.extend(role_permissions)
        
        if current_user.pages:
            user_permissions = [
                {
                    'source': 'user',
                    'pages': [
                        {
                            'id': page.id,
                            'name': page.name,
                            'url': page.url,
                            'parent_id': page.parent.id if page.parent else None
                        }
                        for page in current_user.pages
                    ]
                }
            ]
            permissions.extend(user_permissions)
        
        return jsonify({
            'success': True,
            'permissions': permissions,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'role': current_user.role.name if current_user.role else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
