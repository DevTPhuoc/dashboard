import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = 'avis.vo'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'instance', 'database.db')
    SQLALCHEMY_BINDS = {
        'cmms': 'sqlite:///' + os.path.join(BASE_DIR, 'instance', 'cmms.db'),
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True


    WAIT_LAB_CONFIRM = "Wait Lab Confirm"
    
    WAIT_EVALUATION = 'Wait Evaluation'
    WAIT_EM_RE_EVALUATION = 'Wait EM Re-Evaluation'
    
    WAIT_EM_MANAGER_APPROVAL_EXTERNAL = "Wait EM Manager's Approval External"
    WAIT_EM_CONFIRM_FIXED = "Wait EM Confirm Fixed"
    WAIT_EM_MANAGER_APPROVAL_QUOTATION= "Wait EM Manager's Approval Quotation"
    WAIT_EM_MANAGER_RE_APPROVAL_QUOTATION = "Wait EM Manager's Re-Approval Quotation"
    
    WAIT_LM_MANAGER_APPROVAL_EXTERNAL = "Wait LM Manager's Approval External"
    WAIT_LM_MANAGER_APPROVAL_QUOTATION = "Wait LM Manager's Approval Quotation"
    
    WAIT_QUOTATION = "Wait Quotation"
    WAIT_RE_QUOTATION = "Wait Re-Quotation"
    
    WAIT_PR = "Wait PR"
    
    WAIT_PO = "Wait PO"
