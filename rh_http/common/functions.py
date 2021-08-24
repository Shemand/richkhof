import codecs
import re

from flask import session, g
from sqlalchemy import or_

from rh_database.Organizations import Organizations
from rh_database.Tests import Tests, Appointed_users, Appointed_tests, Questions, Answers
from rh_database.Users import Users
from rh_http import db as database
from rh_http.common.decorators import requires_auth


def build_test(data):
    title = data['title'] if 'title' in data and data['title'] != "" else None
    category_id = data['category_id'] if 'category_id' in data else None
    description = data['description'] if 'description' in data and data['description'] != "" else None
    availability = data['availability'] if 'availability' in data else None
    isImportant = data['important'] if 'important' in data else None
    questions = data['questions'] if 'questions' in data and len(data['questions']) > 0 else None
    expired = data['expired'] if 'expired' in data else None
    tradable = data['tradable'] if 'tradable' in data else None
    opened = data['opened'] if 'opened' in data else False
    if not(title is not None\
       and availability is not None\
       and isImportant is not None\
       and questions is not None\
       and category_id is not None\
       and 'audience' in data):
        database.session.rollback()
        return None
    organization = data['audience']
    if organization is not None:
        isClosed = True
        organization = database.session.query(Organizations).filter_by(name=organization).first()
    else:
        isClosed = False
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user:
            organization = database.session.query(Organizations).filter_by(id=user.Organizations_id).first()
    new_test = Tests(title=title, description=description, isPrepered=not isImportant,
                     closed=isClosed, availability=availability, organization=organization,
                     Categories_id=category_id, expired_time=expired*60, tradable=tradable, opened=opened)
    database.session.add(new_test)
    for question in questions:
        number = question['index'] if 'index' in question else None
        text = question['text'] if 'text' in question else None
        media_url = question['media_url'] if 'media_url' in question else None
        if not( number is not None\
           and text is not None
           and 'answers' in question
           and len(question['answers']) > 0 ):
            database.session.rollback()
            return None
        answers = question['answers'] if 'answers' in question else None
        qst = Questions( number=number
                        ,media_url=media_url
                        ,text=text
                        ,test=new_test)
        database.session.add(qst)
        for answer in answers:
            index = answer['index'] if 'index' in answer else None
            isRight = answer['isRight'] if 'isRight' in answer else None
            text = answer['text'] if 'text' in answer and answer['text'] != "" else None
            if not (index is not None\
               and isRight is not None\
               and text is not None):
                database.session.rollback()
                return None
            aswr = Answers(number=index, text=text, isRight=isRight, question=qst)
            database.session.add(aswr)
    database.session.commit()
    tangle_users_and_tests()
    return new_test

def tangle_session():
    g.username = None
    g.user_role = None
    g.user_phone = None
    g.organization = None
    if 'user_id' in session:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user is not None:
            g.username = user.first_name + " " + user.second_name
            g.phone = user.phone_number
            g.user_role = user.Roles_name
            g.organization = user.organization.name

def is_valid_phonenumber(phone_number):
    if re.match(r'^[78]?\d{10}$', phone_number):
        return True
    return False

def is_valid_email(email):
    if re.match(r'^([a-z0-9_-]+\.)*[a-z0-9_-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$', email):
        return True
    return False


def user_in_organization(organization_name):
    if 'user_id' in session:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user:
            if user.Roles_name == 'super_admin':
                return True
            org = database.session.query(Organizations).filter_by(name=organization_name).first()
            if org:
                if user.organization.name == org.name:
                    return True
    return False

def user_admin_of_organization(organization_name):
    if user_in_organization(organization_name):
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user.Roles_name == 'admin' or user.Roles_name == 'super_admin':
            return True
    return False

def user_super_admin():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user:
        if user.Roles_name == 'super_admin':
            return True
    return False

def tangle_users_and_tests():
    tests = database.session.query(Tests).all()
    for test in tests:
        if test.closed is True:
            users = database.session.query(Users).filter_by(Organizations_id=test.Organization_id).all()
        else:
            users = database.session.query(Users).all()
        for user in users:
            au = database.session.query(Appointed_users).filter_by(Tests_id=test.id, Users_id=user.id).first()
            if not au:
                database.session.add(Appointed_users(user=user, Tests_id=test.id, availability=test.availability))
        database.session.commit()

def allowed_file(filename):
    ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'png', 'bmp']
    return '.' in filename and \
        filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def verificate_user_data(data, isFull=False, isRegistration=False):
    error_messages = {}

    if not "first_name" in data or not data['first_name']:
        error_messages['first_name'] = "Не указано имя пользователя."
    if not "second_name" in data or not data['second_name']:
        error_messages['second_name'] = "Не указана фамилия пользователя."
    if not "email" in data or not data['email']:
        error_messages['email'] = "Не указана электронная почта пользователя."
    if not "phone_number" in data or not data['phone_number']:
        error_messages['phone_number'] = "Не указан телефонный номер пользователя."
    if isFull and (not "organization_name" in data or not data['organization_name']):
        error_messages['organization_name'] = "Не указано название организации пользователя."
    if isFull and (not "password" in data or not data['password']):
        error_messages['password'] = "Не указан пароль пользователя."
    if isFull and (not "confirm_password" in data or not data['confirm_password']):
        error_messages['confirm_password'] = "Не указано подтверждение пароля пользователя."
    if isFull and ( (not "password" in error_messages) or (not "confirm_password" in error_messages) ):
        if data['password'] != data['confirm_password']:
            error_messages['equal_passwords'] = "Пароль и подтверждение пароля не сопадают."
        if len(data['password']) < 8:
            error_messages['password_length'] = "Длинная пароля должна быть не меньше 8 символов."
        if not is_valid_phonenumber(data['phone_number']):
            error_messages[
                'format_phone_number'] = "Формат номера телефона указан не корректно. Телефон должен состоять из 10 цифр и начинатья с '7' или '8."
        else:
            data['phone_number'] = "8" + data['phone_number'][1:]
            if isRegistration and database.session.query(Users).filter_by(phone_number=data['phone_number']).first():
                error_messages['exists_phone_number'] = 'Этот номер уже используется.'
    if not "email" in error_messages:
        if not is_valid_email(data['email']):
            error_messages['format_email'] = "Формат адреса электронный почты задан не корректно."
        else:
            if isRegistration and database.session.query(Users).filter_by(email=data['email']).first():
                error_messages['exists_email'] = 'Этот адрес электронной почты уже используется.'

    if len(error_messages) == 0:
        return []
    else:
        return error_messages

def change_user_organization(user_id, organization_id=None):
    user = database.session.query(Users).filter_by(id=user_id).first()
    archive_org = database.session.query(Organizations).filter_by(name='Archive').first()
    if not user:
        return False
    if user.organization.name == 'System':
        return False
    if organization_id is None: # archivate user
        if user.Roles_name != 'super_admin':
            user.prev_Organizations_id = user.Organizations_id
            user.organization = archive_org
        else:
            return False
    else:
        org = database.session.query(Organizations).filter_by(id=organization_id).first()
        if not org:
            return False
        user.organization = org
    appointed_users = database.session.query(Appointed_users).filter_by(Users_id=user_id).all()
    for au in appointed_users:
        database.session.delete(au)
    database.session.commit()
    tangle_users_and_tests()
    return True

def cleanhtml(raw_html):
  raw_html = raw_html.replace('<br>', '. ')
  raw_html = raw_html.replace('</span>', ' ')
  cleanr = re.compile('<.*?>')
  cleantext = re.sub(cleanr, '', raw_html)
  cleantext = cleantext.replace('&nbsp;', '')
  return cleantext