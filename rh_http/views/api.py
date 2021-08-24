import json
import os
import smtplib
from email.mime.text import MIMEText

from flask import Blueprint, render_template, request, session, url_for, send_from_directory
from sqlalchemy import or_, desc, and_
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename, redirect

from rh_database.Images import Images, Slider
from rh_database.Organizations import Organizations
from rh_database.Posts import Posts, Categories, Appointed_posts
from rh_database.Tests import Questions, Tests, Answers, Appointed_users, Test_Solutions, Users_Answers, Appointed_tests
from rh_database.Users import Users
from rh_http.common.decorators import requires_auth
from rh_http.common.functions import is_valid_phonenumber, is_valid_email, tangle_session, user_admin_of_organization, \
    allowed_file, build_test, tangle_users_and_tests, verificate_user_data, change_user_organization
from rh_http import db as database, app

mod = Blueprint('api', __name__, url_prefix='/api/')


## post: params:
## first_name
## second_name
## email
## phone_number
## organization name
## creating flag // for create new organization
## as_admin_flag // for registrate new administrator of organization
## password
## confirm password
@mod.route('/registrate', methods=['PUT'])
def registrate():
    response = {}
    error_messages = {}
    data = request.data
    data = json.loads(data)
    error_messages = verificate_user_data(data, isFull=True, isRegistration=True)
    if not error_messages:
        org = database.session.query(Organizations).filter_by(name=data['organization_name']).first()
        user = database.session.query(Users).filter_by(phone_number=data['phone_number']).first()
        data['phone_number'] = "8" + data['phone_number'][1:]
        if 'creating_flag' in data and data['creating_flag'] is True:
            if org is None:
                org = Organizations(name=data['organization_name'])
                database.session.add(org)
            else:
                error_messages['organization_exists'] = "Организация с таким именем уже существует."
        if not user:
            user = Users(first_name=data['first_name']
                         , second_name=data['second_name']
                         , email=data['email']
                         , phone_number=data['phone_number']
                         , password=data['password']
                         , organization=org
                         , Roles_name='admin' if 'admin_flag' in data and data['admin_flag'] is True else 'user'
                         )
            database.session.add(user)
        if True if error_messages == None else len(error_messages) == 0:
            database.session.commit()
            user = database.session.query(Users).filter_by(phone_number=data['phone_number']).first()
            if user:
                # tangle_tests_and_user(user.id)
                tangle_users_and_tests()
            return '{}'
    response = {
        "status": "error",
        "messages": [error_messages[message] for message in error_messages]
    }
    return json.dumps(response)


@mod.route('/authorization', methods=['POST'])
def authorization():
    response = {}
    error_messages = {}
    data = request.data
    data = json.loads(data)

    if not "phone_number" in data:
        error_messages['phone_number'] = "Не указан номер телефона пользователя."
    if not "password" in data:
        error_messages['password'] = "Не указан пароль пользователя."

    if len(data['password']) < 8:
        error_messages['password_length'] = "Длинна пароля должна быть не меньше 8 символов."

    if not is_valid_phonenumber(data['phone_number']):
        error_messages[
            'format_phone_number'] = "Формат номера телефона указан не корректно. Телефон должен состоять из 10 цифр и начинатья с '7' или '8."
    else:
        data['phone_number'] = "8" + data['phone_number'][1:]

    if len(error_messages) == 0:
        user = database.session.query(Users).filter_by(phone_number=data['phone_number']
                                                       , password=data['password']).first()
        if user:
            if user.organization.name == 'Archive':
                error_messages['archived_user'] = "Пользователь был лишен доступа."
            else:
                session['user_id'] = user.id
                return ' { "status" : "success", "data" : {} } '
        else:
            error_messages['undefined_user'] = "Пользователь с такими даннами не найден."
    response = {
        "status": "error",
        "messages": [error_messages[message] for message in error_messages]
    }
    return json.dumps(response)


@mod.route('/logout/', methods=['GET', 'POST'])
def logout():
    session.pop('user_id', None)
    return {}


@mod.route('/test/<test_id>', methods=['GET'])
def get_test(test_id):
    query = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test_id)
    test = query.first()
    if not test:
        return '{ "status" : "error", "messages" : ["Неизвестный id теста.,"] }'
    response = {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        'isImportant': not test.isPrepered,
        'category_id': test.Categories_id,
        'organization': test.organization.name if test.organization is not None else None,
        'category_closed': (True if test.category.organization else False) if test.category else False,
        'closed': test.closed,
        'opened': test.opened,
        'expired': test.expired_time,
        'tradable': True if test.tradable else False,
        'questions_count': len(test.questions),
        'attemptions': 0,
        'average_score': 4.2,
        'questions': [{
            "id": question.id,
            "index": question.number,
            "media_url": question.media_url,
            "text": question.text,
            "answers_count": len(question.answers),
            "answers": [{
                "id": answer.id,
                "index": answer.id,
                "text": answer.text,
                "rights": answer.isRight
            } for answer in question.answers]
        } for question in test.questions]
    }
    return '{ "status" : "success", "data" : ' + json.dumps(response) + ' }'


@mod.route('/tests/<type>', methods=['GET'])
@requires_auth
def get_tests(type):
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user:
        query = database.session.query(Tests).filter_by(isDeleted=False)
        if type == 'all':
            if user.Roles_name == 'super_admin':
                tests = query.all()
            else:
                tests = query.filter_by(Organization_id=user.Organizations_id).all()
        elif type == 'important':
            if user.Roles_name == 'super_admin':
                query = query.filter_by(isPrepered=False)
                tests = query.all()
            else:
                query = query.filter_by(isPrepered=False, Organization_id=user.Organizations_id)
                tests = query.all()
        elif type == 'not_important':
            if user.Roles_name == 'super_admin':
                query = query.filter_by(isPrepered=True)
                tests = query.all()
            else:
                query = query.filter_by(isPrepered=True, Organization_id=user.Organizations_id)
                tests = query.all()
        else:
            return '{ "status" : "error", "messages" : ["Неправильный тип тестов. (all, important, notimportant)"] }'
        response = []
        for test in tests:
            test_solutions = database.session.query(Test_Solutions).filter_by(Tests_id=test.id).all()
            test_solutions_quantity = len(test_solutions)
            test_solutions_average_score = 0
            if test_solutions_quantity > 0:
                for ts in test_solutions:
                    test_solutions_average_score += ts.average_score
                test_solutions_average_score /= test_solutions_quantity
            response.append({
                "id": test.id,
                "title": test.title,
                "description": test.description,
                'isImportant': not test.isPrepered,
                'organization': test.organization.name if test.organization is not None else None,
                'questions_count': len(test.questions),
                'closed': test.closed,
                'expired': test.expired_time,
                'attemptions': 0,
                'average_score': test_solutions_average_score,
                'questions': [{
                    "id": question.id,
                    "index": question.number,
                    "media_url": question.media_url,
                    "text": question.text,
                    "answers_count": len(question.answers),
                    "answers": [{
                        "id": answer.id,
                        "index": answer.id,
                        "text": answer.text
                    } for answer in question.answers]
                } for question in test.questions]
            })
        return '{ "status" : "success", "data" : ' + json.dumps(response) + ' }'
    return '{ "status" : "error", "messages" : "Что-то не так. :(" } '


@mod.route('/tests/category/<category_id>', methods=['GET'])
@requires_auth
def get_tests_by_category(category_id):
    category = database.session.query(Categories).filter_by(isDeleted=False).filter_by(id=category_id).first()
    if category:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user.Roles_name == 'super_admin':
            tests = database.session.query(Tests).filter_by(isDeleted=False).filter_by(Categories_id=category_id).all()
        else:
            tests = database.session.query(Tests).filter_by(isDeleted=False).filter_by(
                Categories_id=category_id).filter(
                or_(Tests.Organization_id == user.Organizations_id, Tests.closed == False)).all()
        response = []
        for test in tests:
            test_solutions = database.session.query(Test_Solutions).filter_by(Tests_id=test.id).all()
            test_solutions_quantity = len(test_solutions)
            test_solutions_average_score = 0
            if test_solutions_quantity > 0:
                for ts in test_solutions:
                    test_solutions_average_score += ts.average_score
                test_solutions_average_score /= test_solutions_quantity
            response.append({
                "id": test.id,
                "title": test.title,
                "description": test.description,
                'isImportant': not test.isPrepered,
                'organization': test.organization.name if test.organization is not None else None,
                'questions_count': len(test.questions),
                'closed': test.closed,
                'expired': test.expired_time,
                'editable': True if (user.organization.id == test.Organization_id) or (
                            user.Roles_name == 'super_admin') else False,
                'attemptions': 0,
                'average_score': test_solutions_average_score,
                'questions': [{
                    "id": question.id,
                    "index": question.number,
                    "media_url": question.media_url,
                    "text": question.text,
                    "answers_count": len(question.answers),
                    "answers": [{
                        "id": answer.id,
                        "index": answer.id,
                        "text": answer.text
                    } for answer in question.answers]
                } for question in test.questions]
            })
        return '{ "status" : "success", "data" : ' + json.dumps(response) + ' }'
    return ' { "status" : "error" , "messages" : ["Произошла ошибка. Не найдена категория с таким id"] } '


@mod.route('/list/tests/<type>', methods=['GET'])
def get_list_of_available_tests(type):
    if 'user_id' in session:
        query = database.session.query(Appointed_users, Tests).filter(Tests.isDeleted == False).filter(
            Appointed_users.Tests_id == Tests.id).filter(Appointed_users.Users_id == session['user_id'])
    if type == 'all':
        a_users = query.filter(Appointed_users.availability == True).group_by(Tests.id).all()
    elif type == 'not_important':
        if 'user_id' in session:
            user = database.session.query(Users).filter_by(id=session['user_id'])
            if user:
                a_users = query.filter(Tests.isPrepered == True).group_by(Tests.id).all()
        else:
            a_users = database.session.query(Tests).filter_by(isDeleted=False).filter_by(isPrepered=True,
                                                                                         closed=False).all()
    elif type == 'important':
        a_users = query.filter(Tests.isPrepered == False).filter(Appointed_users.availability == True).group_by(
            Tests.id).all()
    else:
        return ' { "status" : "error", "messages" : ["Не правильный тип для списка тестов"] } '
    categories = {}
    tests = []
    for test in a_users:
        if 'user_id' in session:
            if not (test[1].Categories_id in categories):
                categories[test[1].Categories_id] = []
            categories[test[1].Categories_id].append({
                "title": test[1].title,
                "id": test[1].id
            })
        else:
            if not (test.Categories_id in categories):
                categories[test.Categories_id] = []
            categories[test.Categories_id].append({
                "id": test.id,
                "title": test.title
            })
    final_categories = {}
    for cat_id in categories:
        cat = database.session.query(Categories).filter_by(isDeleted=False).filter_by(id=cat_id).first()
        final_categories[cat.name] = categories[cat_id]
    return ' { "status" : "success" , "data" : ' + json.dumps(final_categories) + ' } '


@mod.route('/test/<test_solution_id>/result', methods=['GET'])
@requires_auth
def show_result_of_test(test_solution_id):
    solved_test = database.session.query(Test_Solutions).filter_by(id=test_solution_id).first()
    test = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=solved_test.Tests_id).first()
    if test and solved_test:
        response = []
        for question in test.questions:
            user_answer = database.session.query(Users_Answers).filter_by(Questions_id=question.id,
                                                                          Test_Solutions_id=solved_test.id).first()
            if user_answer:
                answer = database.session.query(Answers).filter_by(id=user_answer.Answers_id).first().text
            else:
                answer = None
            right_answers = [answer.text for answer in
                             database.session.query(Answers).filter_by(Questions_id=question.id, isRight=True).all()]
            response.append({
                "test_name": test.title,
                "text": question.text,
                "user_answer": answer,
                "answer_isRight": True if answer in right_answers else False,
                "right_answers": right_answers
            })
        return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
    return ' { "status" : "error" , "messages" : ["Произошла ошибка. Не найден тест или его решение."] } '


@mod.route('/test/<test_id>', methods=['POST'])
def edit_test(test_id):
    data = request.data
    data = json.loads(data)
    new_test = build_test(data)
    print(data)
    if new_test is None:
        return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса теста.\']" } '
    delete_test(test_id)
    # a_test = database.session.query(Appointed_tests).query(new_test=test_id, Organizations_id=user.organization)
    tangle_users_and_tests()
    return ' { "status" : "success" , "data" : {} } '


@mod.route('/test/<test_id>', methods=['DELETE'])
@requires_auth
def delete_test(test_id):
    test = database.session.query(Tests).filter_by(id=test_id).first()
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    # test_solutions = database.session.query(Test_Solutions).filter_by(Tests_id=test_id).all()
    # appointed_tests = database.session.query(Appointed_tests).filter_by(root_test_id=test_id).all()
    a_test = database.session.query(Appointed_tests).filter_by(Organizations_id=user.organization.id).filter_by(
        new_test_id=test.id).first()
    if a_test:
        database.session.delete(a_test)
    test.isDeleted = True
    database.session.commit()
    # for at in appointed_tests:
    #     rti = at.root_test_id
    #     delete_test(rti)
    #     database.session.delete(at)
    # to_test_appointed = database.session.query(Appointed_tests).filter_by(new_test_id=test_id).first()
    # if to_test_appointed:
    #     database.session.delete(to_test_appointed)
    # for ts in test_solutions:
    #     for answer in ts.user_answers:
    #         database.session.delete(answer)
    #     database.session.delete(ts)
    # for question in test.questions:
    #     for answer in question.answers:
    #         database.session.delete(answer)
    #     database.session.delete(question)
    # for a_user in test.appointed_users:
    #     database.session.delete(a_user)
    # database.session.delete(test)
    # database.session.commit()
    return ' { "status" : "success" , "data" : {} } '


@mod.route('/test/<test_id>/check', methods=['POST'])
def check_test(test_id):
    if 'user_id' in session:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
    else:
        user = database.session.query(Users).filter_by(phone_number='81111111111').first()

    def get_right_answers(tst_id):
        right_answers = []
        questions = database.session.query(Questions).filter_by(Tests_id=tst_id).all()
        for question in questions:
            for answer in database.session.query(Answers).filter_by(Questions_id=question.id, isRight=True).all():
                right_answers.append(answer)
        return right_answers

    data = request.data
    data = json.loads(data)
    test = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test_id).first()
    # if test and test.isPrepered == False:
    #     solved_test = database.session.query(Test_Solutions).filter_by(Tests_id=test_id, Users_id=user.id).first()
    #     if solved_test:
    #         return ' { "status" : "error" , "messages" : ["Тест уже был решен однажды."] } '
    right_answers = get_right_answers(test_id)
    solved_test = Test_Solutions(Tests_id=test_id, Users_id=user.id)
    database.session.add(solved_test)
    count_right_questions = 0
    count_all_questions = len(data)
    for question in data:
        for answer in question['answers']:
            if 'checked' in answer and answer['checked'] is True:
                anwr = Users_Answers(solved_test=solved_test, Questions_id=question['id'], Answers_id=answer['id'])
                database.session.add(anwr)
                for right_answr in right_answers:
                    if answer['id'] == right_answr.id:
                        count_right_questions += 1
                    if right_answr is None and len(right_answers) == 0:
                        count_right_questions += 1

    print(str(count_right_questions) + '/' + str(count_all_questions))
    solved_test.rights_answers = count_right_questions
    solved_test.average_score = ((count_right_questions / count_all_questions) * 10) / 2
    database.session.commit()
    if test.isPrepered == False:
        a_user = database.session.query(Appointed_users).filter_by(Users_id=user.id, Tests_id=test_id).first()
        a_user.availability = False
        database.session.commit()
    test_solution = database.session.query(Test_Solutions).filter_by(Tests_id=test_id, Users_id=user.id).order_by(
        desc(Test_Solutions.id)).first()
    response = {
        "id": test_solution.id
    }
    return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '


@mod.route('/users', methods=['GET'])
def get_users():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user:
        archive_org = database.session.query(Organizations).filter_by(name='Archive').first()
        if user.Roles_name == 'super_admin':
            users = database.session.query(Users).filter(Users.Organizations_id != archive_org.id).all()
        elif user.Roles_name == 'admin' and user.Organizations_id is not None:
            users = database.session.query(Users).filter(Users.Organizations_id != archive_org.id).filter_by(
                Organizations_id=user.Organizations_id).all()
        else:
            return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '

        response = []
        for user in users:
            average_score = 0
            test_solutions = database.session.query(Test_Solutions).filter_by(Users_id=user.id).all()
            ts_len = len(test_solutions)
            if ts_len > 0:
                for ts in test_solutions:
                    average_score += ts.average_score
                average_score /= ts_len
            response.append({
                "id": user.id,
                "first_name": user.first_name,
                "second_name": user.second_name,
                "email": user.email,
                "phone_number": user.phone_number,
                "organization_name": user.organization.name,
                "average_score": average_score,
                "tests_count": ts_len,
                "Role": user.Roles_name
            })
        return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = database.session.query(Users).filter_by(id=user_id).first()
    if user and (user.Roles_name != 'super_admin') and user.id != session['user_id']:
        test_solutions = database.session.query(Test_Solutions).filter_by(Users_id=user_id).all()
        for ts in test_solutions:
            for us in ts.user_answers:
                database.session.delete(us)
            database.session.delete(ts)
        user_appointed = database.session.query(Appointed_users).filter_by(Users_id=user.id).all()
        for ua in user_appointed:
            database.session.delete(ua)
        database.session.delete(user)
        database.session.commit()
        return ' { "status" : "success", "data" : {} } '
    return ' { "status" : "error", "messages" : ["Что-то пошло не так."] } '


@mod.route('/organizations', methods=['GET'])
def get_organizations():
    organizations = database.session.query(Organizations).filter_by(isArchived=False).all()
    response = []
    if len(organizations) == 0:
        return ' { "status" : "success" , "data" : [] } '
    for org in organizations:
        users = database.session.query(Users).filter_by(Organizations_id=org.id).all()
        quantity_users = len(users)
        test_solutions_average_score = 0
        test_solutions_quantity = 0
        for user in users:
            test_solutions = database.session.query(Test_Solutions).filter_by(Users_id=user.id).all()
            ts_quantity = len(test_solutions)
            if ts_quantity > 0:
                av_score = 0
                for ts in test_solutions:
                    av_score += ts.average_score
                av_score /= ts_quantity
                test_solutions_average_score += av_score
                test_solutions_quantity += 1
        if test_solutions_quantity > 0:
            test_solutions_average_score /= test_solutions_quantity
        response.append({
            "id": org.id,
            "name": org.name,
            "count": quantity_users,
            "average_score": test_solutions_average_score
        })
    return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '


@mod.route('/category/organizations', methods=['GET'])
def get_categories_organizations():
    if 'user_id' in session:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
    else:
        return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '
    if user and user.Roles_name == 'admin':
        organizations = database.session.query(Organizations).filter_by(id=user.Organizations_id).all()
    elif user and user.Roles_name == 'super_admin':
        organizations = database.session.query(Organizations).all()
    else:
        return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '
    response = []
    if len(organizations) == 0:
        return ' { "status" : "success" , "data" : [] } '
    for org in organizations:
        quantity_users = database.session.query(Users).filter_by(Organizations_id=org.id).all()
        response.append({
            "id": org.id,
            "name": org.name,
            "count": len(quantity_users),
            "average_score": 3.7
        })
    return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '


@mod.route('/category/<category_id>', methods=['GET'])
@requires_auth
def get_category(category_id):
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    category = database.session.query(Categories).filter_by(isDeleted=False).filter_by(id=category_id).first()
    if category:
        response = {
            "id": category.id,
            "name": category.name,
            "organization": category.organization.name if category.organization else None,
            "organization_id": category.organization.id if category.organization else None,
            "isSuperAdmin": True if user.Roles_name == 'super_admin' else False,
            "closed": True if category.organization else False
        }
        return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/user/<user_id>/tests', methods=['GET'])
@requires_auth
def get_user_tests(user_id):
    response = []
    solved_tests = database.session.query(Test_Solutions).filter_by(Users_id=user_id).all()
    for test in solved_tests:
        t = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test.Tests_id).first()
        if t:
            test_questions = database.session.query(Questions).filter_by(Tests_id=t.id).all()
            amount_questions = len(test_questions)
            response.append({
                "id": test.id,
                "test_name": t.title,
                "test_id": test.Tests_id,
                "average_score": test.average_score,
                "rights_answers": test.rights_answers,
                "all_answers": amount_questions,
                "created": test.created.timestamp() * 1000 if test.created is not None else None
            })
    return '{ "status" : "success", "data" : ' + json.dumps(response) + '}'


@mod.route('/test', methods=['PUT'])
def create_test():
    data = request.data
    data = json.loads(data)
    new_test = build_test(data)
    if new_test is None:
        return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса теста.\']" } '
    tangle_users_and_tests()
    return ' { "status" : "success" , "data" : "{}" } '


@mod.route('/categories', methods=['GET'])
def get_categories():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user.Roles_name == 'super_admin':
        categories = database.session.query(Categories).filter_by(isDeleted=False).all()
    elif user:
        if user:
            categories = database.session.query(Categories).filter_by(isDeleted=False).filter(
                or_(Categories.Organizations_id == user.Organizations_id, Categories.Organizations_id == None)).all()
    else:
        categories = database.session.query(Categories).filter_by(isDeleted=False).filter_by(
            Organizations_id=None).all()
    response = []
    if len(categories) == 0:
        return ' { "status" : "success" , "data" : [] } '
    for cat in categories:
        # quantity_tests = len(database.session.query(Tests).filter_by(isDeleted=False).filter_by(Categories_id = cat.id).filter(or_(Tests.Organization_id == user.Organizations_id, Tests.closed == False)).all())
        quantity_posts = len(json.loads(get_posts(cat.id))['data'])
        quantity_tests = len(json.loads(get_tests_by_category(cat.id))['data'])
        # if user.Roles_name == 'super_admin':
        #     quantity_posts = len(database.session.query(Posts).filter_by(isDeleted=False).filter(or_(and_(Posts.Categories_id == cat.id, Posts.closed == False), and_(Posts.Categories_id == cat.id, Posts.Organizations_id == user.Organizations_id))).all())
        #     quantity_posts += len(database.session.query(Appointed_posts).filter_by(Categories_id=cat.id, Organizations_id=user.Organizations_id).all())
        # else:
        #     quantity_posts = len(database.session.query(Posts).filter_by(isDeleted=False).filter(and_(Posts.Categories_id == cat.id, Posts.Organizations_id == user.Organizations_id)).all())
        response.append({
            "id": cat.id,
            "organization_id": cat.organization.id if cat.organization is not None else None,
            "name": cat.name,
            "organization": cat.organization.name if cat.organization is not None else "Для всех организаций",
            "count_posts": quantity_posts,
            "count_tests": quantity_tests,
            "editable": ((True if user.organization.id == cat.created_by_organization_id else False) if len(
                cat.posts) == 0 and len(cat.tests) == 0 else False) if user.Roles_name != 'super_admin' else True,
            "section": cat.section
        })
    return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '


@mod.route('/category/<category_id>', methods=['POST'])
def edit_categories(category_id):
    data = request.data
    data = json.loads(data)
    category = database.session.query(Categories).filter_by(isDeleted=False).filter_by(id=category_id).first()
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user and (user.Roles_name == 'super_admin' or user.Roles_name == 'admin'):
        if category \
                and 'organization_name' in data \
                and 'name' in data \
                and 'section' in data:
            section = 1 if data['section'] == 'study' else 2 if data['section'] == 'news' else None
            if category.section != section:
                category.section = section
            if category.name != data['name']:
                category.name = data['name']
            if (category.organization.name if category.organization else None) != data['organization_name']:
                old_organization_name = category.organization.name if category.organization else None
                new_organization_name = data['organization_name']
                old_organization = category.organization if category.organization else None
                new_organization = database.session.query(Organizations).filter_by(name=new_organization_name).first()
                posts = database.session.query(Posts).filter_by(Categories_id=category.id).all()
                tests = database.session.query(Tests).filter_by(Categories_id=category.id).all()
                if new_organization_name:
                    for post in posts:
                        if category.closed == True and post.closed == True:
                            post.Organizations_id = new_organization.id
                    for test in tests:
                        if category.closed == True and test.closed == True:
                            test.Organizations_id = new_organization.id
                print(tests)
                print(posts)
            if data['organization_name'] if data['organization_name'] else None:
                organization = database.session.query(Organizations).filter_by(name=data['organization_name']).first()
                category.organization = organization
            database.session.commit()
            return ' { "status" : "success" , "data" : {} } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/category/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = database.session.query(Categories).filter_by(id=category_id).first()
    if category:
        category.isDeleted = True
        for post in category.posts:
            delete_post(post.id)
        for test in category.tests:
            delete_test(test.id)
        # if len(category.posts) == 0:
        #     database.session.delete(category)
        # else:
        #     for post in category.posts:
        #         delete_post(post.id)
        #     for test in category.tests:
        #         delete_test(test.id)
        #     database.session.delete(category)
        database.session.commit()
        return ' { "status" : "success" , "data" : {} } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/category/<category_name>', methods=['PUT'])
def create_category(category_name):
    data = request.data
    data = json.loads(data)
    # category = database.session.query(Categories).filter_by(isDeleted=False).filter_by(name=category_name).first()
    # if not category:
    section = 1 if data['section'] == 'study' else 2 if data['section'] == 'news' else None
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if 'organization_name' in data and data['organization_name']:
        organization = database.session.query(Organizations).filter_by(name=data['organization_name']).first()
    else:
        organization = None
    if user and section:
        if 'organization_name' in data:
            if user.Roles_name == 'admin':
                if organization is None:
                    category = Categories(name=category_name, Organizations_id=None,
                                          created_by_organization_id=user.organization.id, section=section)
                else:
                    category = Categories(name=category_name, organization=organization,
                                          created_by_organization_id=user.organization.id, section=section)
            elif user.Roles_name == 'super_admin':
                if organization is None:
                    category = Categories(name=category_name, Organizations_id=None,
                                          created_by_organization_id=user.organization.id, section=section)
                else:
                    category = Categories(name=category_name, Organizations_id=organization.id,
                                          created_by_organization_id=organization.id, section=section)
            else:
                return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '
            database.session.add(category)
            database.session.commit()
            # cat = database.session.query(Categories).filter_by(isDeleted=False).filter_by(name=category_name).first()
            response = {"id": category.id}
            return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
            # old creating
            # if user.Roles_name == 'admin':
            #     if data['organization_name'] is None\
            #         or organization == user.organization:
            #         category = Categories(name=category_name, Organizations_id=None, created_by_organization_id=user.organization.id)
            #         database.session.add(category)
            #         database.session.commit()
            #         cat = database.session.query(Categories).filter_by(isDeleted=False).filter_by(name = category_name).first()
            #         response = {"id": cat.id}
            #         return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
            # elif user.Roles_name == 'super_admin':
            #     category = Categories(name=category_name, organization=organization, created_by_organization_id=organization.id)
            #     database.session.add(category)
            #     database.session.commit()
            #     cat = database.session.query(Categories).filter_by(isDeleted=False).filter_by(name=category_name).first()
            #     response = { "id" : cat.id}
            #     return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
            # else:
            #     pass
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


# title
# category_name
# text
@mod.route('/category/<category_id>/post', methods=['PUT'])
def create_post(category_id):
    data = request.data
    data = json.loads(data)
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user:
        if 'title' in data and 'text' in data and 'tradable' in data and 'closed' in data:
            category = database.session.query(Categories).filter_by(isDeleted=False).filter_by(id=category_id).first()
            if category:
                post = Posts(title=data['title']
                             , text=data['text']
                             , closed=data['closed']
                             , tradable=data['tradable']
                             , category=category
                             , Organizations_id=user.organization.id if not data['organization_id'] or not data[
                        'closed'] else data['organization_id']
                             )
                database.session.add(post)
                database.session.commit()
                return ' { "status" : "success" , "data" : {} } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/category/<category_id>/posts', methods=['GET'])
@requires_auth
def get_posts(category_id):
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    category = database.session.query(Categories).filter_by(isDeleted=False).filter(
        Categories.id == category_id).first()
    posts = category.posts
    response = []
    for post in posts:
        if post.isDeleted == False:
            if user.Roles_name == 'admin':
                if post.Organizations_id == user.Organizations_id:
                    response.append({
                        "id": post.id,
                        "title": post.title,
                        "text": post.text,
                        "organization": post.organization.name,
                        "isAdded": False,
                        "editable": post.organization.id == user.Organizations_id if user.Roles_name != 'super_admin' else True
                    })
                elif post.category.Organizations_id is None and post.category.created_by_organization_id == user.Organizations_id:
                    response.append({
                        "id": post.id,
                        "title": post.title,
                        "text": post.text,
                        "organization": post.organization.name,
                        "isAdded": False,
                        "editable": post.organization.id == user.Organizations_id if user.Roles_name != 'super_admin' else True
                    })
            elif user.Roles_name == 'super_admin':
                response.append({
                    "id": post.id,
                    "title": post.title,
                    "text": post.text,
                    "organization": post.organization.name,
                    "isAdded": False,
                    "editable": post.organization.id == user.Organizations_id if user.Roles_name != 'super_admin' else True
                })
    a_posts = database.session.query(Appointed_posts).filter_by(Organizations_id=user.Organizations_id,
                                                                Categories_id=category.id).all()
    for ap in a_posts:
        response.append({
            "id": ap.root_post.id,
            "title": ap.root_post.title,
            "text": ap.root_post.text,
            "isAdded": True,
            "editable": ap.organization.id == user.Organizations_id if user.Roles_name != 'super_admin' else True
        })
    return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '


@mod.route('/category/<category_id>/appoint_post/<post_id>', methods=['POST'])
@requires_auth
def appoint_post(category_id, post_id):
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    category = database.session.query(Categories).filter_by(isDeleted=False).filter_by(id=category_id).filter(
        or_(Categories.Organizations_id == None, Categories.Organizations_id == user.organization.id)).first()
    post = database.session.query(Posts).filter_by(isDeleted=False).filter_by(id=post_id).first()
    if user and post and category and post.tradable is True:
        # new_post = Posts(title=post.title, text=post.text, closed=True, tradable=False, category=category, organization=user.organization)
        # database.session.add(new_post)
        a_post = Appointed_posts(root_post_id=post.id, Categories_id=category.id, Organizations_id=user.organization.id,
                                 created_by_post_id=post.id)
        database.session.add(a_post)
        database.session.commit()
        response = {
            'post_id': post.id
        }
        return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/post/<post_id>', methods=['POST'])
def edit_post(post_id):
    data = request.data
    data = json.loads(data)
    if 'title' in data and 'text' in data and 'tradable' in data and 'closed' in data and 'audience' in data:
        post = database.session.query(Posts).filter_by(isDeleted=False).filter_by(id=post_id).first()
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if post:
            post.title = data['title']
            post.text = data['text']
            post.closed = data['closed']
            post.tradable = data['tradable']
            post.Organizations_id = user.organization.id if not data['audience'] else data['audience']
            database.session.commit()
            return ' { "status" : "success" , "data" : {} } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/post/<post_id>', methods=['DELETE'])
@requires_auth
def delete_post(post_id):
    post = database.session.query(Posts).filter_by(id=post_id).first()
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if post:
        a_post = database.session.query(Appointed_posts).filter_by(Organizations_id=user.organization.id).filter_by(
            root_post_id=post.id).first()
        if a_post:
            database.session.delete(a_post)
        if post.Organizations_id == user.Organizations_id:
            post.isDeleted = True
        database.session.commit()
        # user = database.session.query(Users).filter_by(id=session['user_id']).first()
        # a_post = database.session.query(Appointed_posts).filter_by(root_post_id=post.id).first()
        # if a_post:
        #     database.session.delete(a_post)
        # database.session.delete(post)
        # database.session.commit()
        return ' { "status" : "success" , "data" : {} } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/post/<post_id>', methods=['GET'])
def get_post(post_id):
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    post = database.session.query(Posts).filter_by(isDeleted=False).filter_by(id=post_id).first()
    appointed_post = database.session.query(Appointed_posts).filter_by(Organizations_id=user.Organizations_id, root_post_id=post_id).first()
    isAccessable = database.session.query(Posts).filter_by(isDeleted=False)\
                                                .filter(or_(Posts.closed == False, Posts.Organizations_id == user.Organizations_id))\
                                                .filter_by(id=post_id)\
                                                .first()
    isAccessable = (isAccessable and appointed_post) or user.Roles_name == 'super_admin'
    if isAccessable and post:
        response = {
            "id": post.id,
            "title": post.title,
            "text": post.text,
            "category": post.category.name,
            "category_closed": False if post.category.Organizations_id is None else True,
            "isSuperAdmin": True if user.Roles_name == 'super_admin' else False,
            "organization": post.organization.name,
            "organization_id": post.organization.id,
            "closed": post.closed,
            "tradable": post.tradable
        }
        return ' { "status" : "success" , "data" : ' + json.dumps(response) + ' } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/test/<test_id>/users', methods=['GET'])
def get_test_users(test_id):
    test = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test_id).first()
    response = []
    for appointed_user in test.appointed_users:
        test_solution = database.session.query(Test_Solutions).filter_by(Tests_id=test.id,
                                                                         Users_id=appointed_user.Users_id).order_by(
            desc(Test_Solutions.created)).first()
        response.append({
            "id": appointed_user.id,
            "user_id": appointed_user.user.id,
            "first_name": appointed_user.user.first_name,
            "second_name": appointed_user.user.second_name,
            "attempts": len(database.session.query(Test_Solutions).filter_by(Tests_id=test.id,
                                                                             Users_id=appointed_user.Users_id).all()) if test_solution else 0,
            "score": test_solution.average_score if test_solution else None,
            "availability": appointed_user.availability
        })
    return '{ "status" : "success", "data" : ' + json.dumps(response) + ' }'


@mod.route('/test/<test_id>/users', methods=['POST'])
def appoint_users_to_test(test_id):
    data = request.data
    data = json.loads(data)
    appointed_users = database.session.query(Appointed_users).filter_by(Tests_id=test_id).all()
    test = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test_id).first()
    for a_user in data:
        for ap_user in appointed_users:
            if a_user['appointed_id'] == ap_user.id:
                if a_user['availability'] == True:
                    test_solution = database.session.query(Test_Solutions).filter_by(Tests_id=test_id,
                                                                                     Users_id=ap_user.Users_id).first()
                    # if test_solution and (not test.isPrepered is True):
                    #     for ua in test_solution.user_answers:
                    #         database.session.delete(ua)
                    #     database.session.delete(test_solution)
                    #     database.session.commit()
                ap_user.availability = a_user['availability']
                break
    database.session.commit()
    return ' { "status" : "success", "data" : [] } '


@mod.route('/images/', methods=['GET'])
def get_images():
    response = []
    images = database.session.query(Images).order_by(desc(Images.id)).all()
    for img in images:
        response.append({
            "url": img.url,
            "id": img.id
        });
    return ' { "status" : "success", "data" : ' + json.dumps(response) + '} '


@mod.route('/image/<image_id>', methods=['DELETE'])
def delete_image(image_id):
    response = []
    image = database.session.query(Images).filter_by(id=image_id).first()
    database.session.delete(image)
    database.session.commit()
    return ' { "status" : "success", "data" : ' + json.dumps(response) + '} '


@mod.route('/upload_image', methods=['POST'])
def upload_image():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            after_dot = file.filename.rsplit('.', 1)[1]
            image = database.session.query(Images).order_by(desc(Images.id)).first()
            if image:
                image_id = image.id + 1
            else:
                image_id = 1
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], str(image_id) + '.' + str(after_dot)))
            database.session.add(
                Images(id=image_id, url=request.host_url + 'api/image/' + str(image_id) + '.' + str(after_dot)))
            database.session.commit()
            return '{ "status" : "success", "data" : [] }'
    return '{ "status" : "error", "messages" : ["Данные отправленны не правильным методом."] }'


@mod.route('/image/<filename>', methods=['GET'])
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@mod.route('/appoint_test/<test_id>', methods=['PUT'])
def appoint_test_to_organization(test_id):
    data = request.data
    data = json.loads(data)
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    data['tradable'] = False
    data['isClosed'] = True
    data['audience'] = user.organization.name
    new_test = build_test(data)
    object = Appointed_tests(root_test_id=data['old_test_id'], new_test=new_test, organization=new_test.organization)
    database.session.add(object)
    database.session.commit()
    tangle_users_and_tests()
    return ' { "status" : "success", "data" : [] } '


@mod.route('/send_feedback/', methods=['POST'])
def send_feedback():
    data = request.data
    data = json.loads(data)
    print(data)
    if not is_valid_email(data['email_user']):
        return '{ "status" : "error", "messages" : ["Неверный формат вашей почты."] }'
    if not is_valid_email(data['email_admin']):
        return '{ "status" : "error", "messages" : ["Неверный формат почты администратора."] }'
    if not is_valid_phonenumber(data['phone_number']):
        return '{ "status" : "error", "messages" : ["Неверный формат номера телефона."] }'

    test_solution = database.session.query(Test_Solutions).filter_by(id=int(data['test_solution_id'])).first()
    if test_solution:
        test = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test_solution.Tests_id).first()
    else:
        return '{ "status" : "error", "messages" : ["Произошла какая-то ошибка."] }'
    # send email
    HOST = "smtp.yandex.ru"
    SUBJECT = "Результат теста"
    TO = data['email_admin']
    FROM = "study@vspbmebel.ru"
    text = "Здраствуйте, я " + data['fio'] + '\n'
    text += '\n'
    text += 'Мною был выполнен тест "' + test.title + '" с результатом ' + data['right_answers'] + "/" + data[
        'all_answers'] + '.'
    if len(data['questions']) != 0:
        text += '\nМои неправильные ответы:'
        for question in data['questions']:
            text += '\n' + question['index']
            text += ' ' + question['text']
            text += ' - ' + question['user_answer']
            text += ' ' + str(question['right_answers'])
            text += '\n'
    else:
        text += '\nВсе мои ответы по этому тесту оказались - верными.\n'
    text += 'С Уважением, ' + data['fio'] + '. ' + data['email_user'] + ' (' + data['phone_number'] + ')'

    BODY = "\r\n".join((
        "From: %s" % FROM,
        "To: %s" % TO,
        "Subject: %s" % SUBJECT,
        "",
        text
    ))
    # BODY = MIMEText(BODY, 'html')
    # try:
    server = smtplib.SMTP_SSL(HOST, 465)
    # server.set_debuglevel(1)
    server.login('study@vspbmebel.ru', 'RichHof1')
    server.auth_plain()
    server.sendmail(FROM, TO, BODY.encode('cp1251'))
    server.quit()
    # except Exception:
    #     return '{ "status" : "error", "messages" : ["Произошла какая-то ошибка."] }'
    # end send email
    return '{ "status" : "success", "data" : [] }'


@mod.route('/slider/slides', methods=["GET"])
@requires_auth
def get_slides():
    response = []
    slides = database.session.query(Slider).order_by(Slider.index).limit(10).all()
    for slide in slides:
        response.append({
            "image_url": slide.url,
            "image_reference": slide.reference,
            "image_index": slide.index
        })
    return '{ "status" : "success", "data" : ' + json.dumps(response) + ' }'


@mod.route('/slider/slides', methods=['POST'])
@requires_auth
def update_slides():
    data = request.data
    data = json.loads(data)
    slides = database.session.query(Slider).delete()
    for slide in data:
        s = Slider(index=slide['image_index'],
                   url=slide['image_url'],
                   reference=slide['image_reference'])
        database.session.add(s)
    database.session.commit()
    return '{ "status" : "success", "data" : [] }'


@mod.route('/user/<user_id>', methods=['GET'])
@requires_auth
def get_user_info(user_id):
    if 'user_id' in session:
        admin_user = database.session.query(Users).filter_by(id=session['user_id']).first()
        user = database.session.query(Users).filter_by(id=user_id).first()
        if admin_user and user:
            response = {
                "first_name": user.first_name,
                "second_name": user.second_name,
                "phone_number": user.phone_number,
                "email": user.email
            }
            if admin_user.Roles_name == 'super_admin':
                response['organization_name'] = user.organization.id
                response['organization_id'] = user.organization.name
                response['role'] = user.Roles_name
                response['password'] = user.password
            return '{ "status" : "success", "user" : {"role" : "' + admin_user.Roles_name + '"}, "data" : ' + json.dumps(
                response) + ' }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией о пользователе."] }'


@mod.route('/user/<user_id>', methods=['POST'])
@requires_auth
def edit_user(user_id):
    data = request.data
    data = json.loads(data)
    admin_user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if admin_user:
        user = database.session.query(Users).filter_by(id=user_id).first()
    if user:
        error_messages = verificate_user_data(data,
                                              isFull=True) if admin_user.Roles_name == 'super_admin' else verificate_user_data(
            data)
        if not error_messages:
            if 'second_name' in data and user.first_name != data['first_name']:
                user.first_name = data['first_name']
            if 'second_name' in data and user.second_name != data['second_name']:
                user.second_name = data['second_name']
            if 'email' in data and user.email != data['email']:
                user.email = data['email']
            if 'phone_number' in data and user.phone_number != data['phone_number']:
                user.phone_number = data['phone_number']
            if admin_user.Roles_name == 'super_admin':
                if 'password' in data \
                        and 'confirm_password' in data \
                        and data['confirm_password'] == data['password'] \
                        and user.password != data['password']:
                    user.password = data['password']
                if 'organization_name' in data and user.organization.name != data['organization_name'] \
                        or 'organization_id' in data and user.organization.id == data['organization_id']:

                    if 'isNewOrg' in data and data['isNewOrg'] == True and data['organization_name']:
                        new_org = Organizations(name=data['organization_name'])
                        database.session.add(new_org)
                        user.Organizations_id = new_org.id
                    elif 'organization_id' in data:
                        org = database.session.query(Organizations).filter_by(id=data['organization_id']).first()
                        if org:
                            change_user_organization(user_id, organization_id=org.id)
                        else:
                            return '{ "status" : "error", "messages" : ["Такой организации не существует."] }'
                    else:
                        return '{ "status" : "error", "messages" : ["Проблема с информацией об организации."] }'
                    if 'like_admin' in data and data['like_admin'] == True:
                        user.Roles_name = 'admin'
                    else:
                        user.Roles_name = 'user'
            database.session.commit()
            return '{ "status" : "success", "data" : [] }'
        else:
            return '{ "status" : "error", "messages" : ' + json.dumps(
                [error_messages[message] for message in error_messages]) + ' }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией о пользователе."] }'


@mod.route('/user/<user_id>/archived', methods=['POST'])
@requires_auth
def archived_user(user_id):
    user = database.session.query(Users).filter_by(id=user_id).first()
    if user.Roles_name == 'super_admin':
        return '{ "status" : "error", "messages" : ["Невозможно архивировать суперадминистратора"] }'
    if user_id == session['user_id']:
        return '{ "status" : "error", "messages" : ["Невозможно архивировать себя."] }'
    if user:
        change_user_organization(user_id)
        return '{ "status" : "success", "data" : [] }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией о пользователе."] }'


@mod.route('/user/<user_id>/restore', methods=['POST'])
@requires_auth
def restore_user(user_id):
    admin_user = database.session.query(Users).filter_by(id=session['user_id']).first()
    user = database.session.query(Users).filter_by(id=user_id).first()
    if user.organization.name != 'Archive':
        return '{ "status" : "error", "messages" : ["Пользователь не находиться в архиве."] }'
    if user and admin_user:
        if change_user_organization(user_id, organization_id=admin_user.Organizations_id):
            return '{ "status" : "success", "data" : [] }'
        else:
            return '{ "status" : "error", "messages" : ["Неизвестная ошибка архивирования."] }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией о пользователе."] }'


@mod.route('/organization/<org_id>/archive', methods=['POST'])
@requires_auth
def archived_organization(org_id):
    org = database.session.query(Organizations).filter_by(id=org_id).first()
    if org:
        org.isArchived = True
        database.session.commit()
        for user in org.staff:
            change_user_organization(user.id)
        return '{ "status" : "success", "data" : [] }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией об организации."] }'


@mod.route('/organization/<org_id>/restore', methods=['POST'])
@requires_auth
def restore_organization(org_id):
    org = database.session.query(Organizations).filter_by(id=org_id).first()
    if org:
        org.isArchived = False
        for user in org.staff:
            user.isArchived = False
        database.session.commit()
        return '{ "status" : "success", "data" : [] }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией об организации."] }'


@mod.route('/archive/users', methods=['GET'])
def get_archived_users():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user:
        user_response = {
            "role": user.Roles_name
        }
        archive_org = database.session.query(Organizations).filter_by(name='Archive').first()
        users = database.session.query(Users).filter(Users.Organizations_id == archive_org.id).all()
        response = []
        for user in users:
            average_score = 0
            test_solutions = database.session.query(Test_Solutions).filter_by(Users_id=user.id).all()
            ts_len = len(test_solutions)
            if ts_len > 0:
                for ts in test_solutions:
                    average_score += ts.average_score
                average_score /= ts_len
            response.append({
                "id": user.id,
                "first_name": user.first_name,
                "second_name": user.second_name,
                "email": user.email,
                "phone_number": user.phone_number,
                "organization_name": user.organization.name,
                "average_score": average_score,
                "tests_count": ts_len,
                "prev_organization_name" : user.prev_organization.name if user.prev_Organizations_id is not None else None,
                "Role": user.Roles_name
            })
        return ' { "status" : "success" , "user" : ' + json.dumps(user_response) + ', "data" : ' + json.dumps(
            response) + ' } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/archive/organizations', methods=['GET'])
def get_archived_organizations():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    if user:
        user_response = {
            "role": user.Roles_name
        }
        archive_orgs = database.session.query(Organizations).filter_by(isArchived=True).all()
        response = []
        for org in archive_orgs:
            response.append({
                "id": org.id,
                "name": org.name
            })
        return ' { "status" : "success" , "user" : ' + json.dumps(user_response) + ', "data" : ' + json.dumps(
            response) + ' } '
    return ' { "status" : "error" , "messages" : "[\'Произошла ошибка. Скорее всего переданы неправильные параметры запроса.\']" } '


@mod.route('/organization/<org_id>', methods=['POST'])
@requires_auth
def edit_organization(org_id):
    data = request.data
    data = json.loads(data)
    org = database.session.query(Organizations).filter_by(id=org_id).first()
    if org:
        if 'name' in data:
            org.name = data['name']
        database.session.commit()
        return '{ "status" : "success", "data" : [] }'
    return '{ "status" : "error", "messages" : ["Проблема с информацией об организации."] }'


@mod.route('/simple_feedback', methods=['POST'])
def feedback():
    data = request.data
    data = json.loads(data)
    print(data)
    if not is_valid_email(data['email']):
        return '{ "status" : "error", "messages" : ["Неверный формат вашей почты."] }'

    # send email
    HOST = "smtp.yandex.ru"
    SUBJECT = "Общение от " + data['email']
    TO = 'info@richhof.ru'
    FROM = "study@vspbmebel.ru"
    text = "Здраствуйте, я " + data['name'] + '\n\n'
    text += data['text']
    text += '\n\nС Уважением, ' + data['name'] + '. Email: ' + data['email'] + '.'

    BODY = "\r\n".join((
        "From: %s" % FROM,
        "To: %s" % TO,
        "Subject: %s" % SUBJECT,
        "",
        text
    ))

    server = smtplib.SMTP_SSL(HOST, 465)
    server.login('study@vspbmebel.ru', 'RichHof1')
    server.auth_plain()
    server.sendmail(FROM, TO, BODY.encode('cp1251'))
    server.quit()
    return '{ "status" : "success", "data" : [] }'

@mod.route('/restore/password', methods=['POST'])
def restore_password():
    data = request.data
    data = json.loads(data)
    print(data)
    if not is_valid_email(data['email']):
        return '{ "status" : "error", "messages" : ["Неверный формат вашей почты."] }'

    user = database.session.query(Users).filter_by(email=data['email']).first()
    if not user:
        return '{ "status" : "error", "messages" : ["Пользователя с таким email адресом не существует."] }'

    # send email
    HOST = "smtp.yandex.ru"
    SUBJECT = "Восстановление пароля"
    TO = data['email']
    FROM = "study@vspbmebel.ru"
    text = 'Здраствуйте.\n'
    text += "Ваш номер телефона:" + user.phone_number + '\n'
    text += "Ваш пароль: " + user.password + '\n'
    text += '\n\nС Уважением, администрация Richhof (info@richhof.ru)'

    BODY = "\r\n".join((
        "From: %s" % FROM,
        "To: %s" % TO,
        "Subject: %s" % SUBJECT,
        "",
        text
    ))

    server = smtplib.SMTP_SSL(HOST, 465)
    server.login('study@vspbmebel.ru', 'RichHof1')
    server.auth_plain()
    server.sendmail(FROM, TO, BODY.encode('cp1251'))
    server.quit()
    return '{ "status" : "success", "data" : [] }'
