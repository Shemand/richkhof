import json
import math
from collections import OrderedDict

from flask import Blueprint, render_template, g, session, request

from sqlalchemy import or_, and_, desc

from rh_database.Images import Images, Slider
from rh_database.Organizations import Organizations
from rh_database.Tests import Test_Solutions, Tests, Questions, Users_Answers, Answers, Appointed_tests, Appointed_users
from rh_http.common.decorators import requires_auth
from rh_http.common.functions import tangle_session, cleanhtml
from rh_http import db as database
from rh_database.Users import Users
from rh_database.Posts import Posts, Categories, Appointed_posts
from rh_http.views.api import get_list_of_available_tests

mod = Blueprint('index', __name__, url_prefix='/')
post = Blueprint('post', __name__, url_prefix='/post')


@mod.before_request
def before_request():
    tangle_session()

@post.before_request
def post_before_request():
    tangle_session()


@mod.route('/index', methods=['GET'])
def index():
    studies = {}
    if g.user_role == 'super_admin':
        categories = database.session.query(Categories).filter_by(isDeleted=False).all()
    elif g.username:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user:
            categories = database.session.query(Categories).filter_by(isDeleted=False).filter(
                or_(Categories.organization == user.organization, Categories.Organizations_id == None)).all()
    else:
        categories = database.session.query(Categories).filter_by(isDeleted=False).filter_by(
            Organizations_id=None).all()
    for category in categories:
        if not category.name in studies:
            studies[category.name] = []
        posts = category.posts
        for post in posts:
            studies[category.name].append({
                "post_id": post.id,
                "post_title": post.title,
                "post_closed": post.closed,
                "Organizations_id": post.Organizations_id,
                "isDeleted": post.isDeleted,
                "isAdded": False,
                "section": post.category.section
            })
        for a_post in category.appointed_posts:
            studies[category.name].append({
                "post_id": a_post.root_post.id,
                "post_title": a_post.root_post.title,
                "post_closed": a_post.root_post.closed,
                "isDeleted": a_post.root_post.isDeleted,
                "Organizations_id": a_post.Organizations_id,
                "isAdded": True,
                "section": a_post.category.section
            })
    if g.username:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
    else:
        user = None
    final_studies = {}
    for category_name in studies:
        temporary_posts = []
        if studies[category_name] == []:
            continue
        for post in studies[category_name]:
            if user:
                if post['post_closed'] == True and post['Organizations_id'] == user.organization.id and post[
                    'isDeleted'] == False:
                    temporary_posts.append(post)
                elif post['post_closed'] == False and post['isDeleted'] == False:
                    temporary_posts.append(post)
                elif post['isAdded'] == True and post['Organizations_id'] == user.organization.id and post[
                    'isDeleted'] == False:
                    temporary_posts.append(post)
            else:
                if post['post_closed'] == False and post['isDeleted'] == False:
                    temporary_posts.append(post)
        if temporary_posts != []:
            if not (category_name in final_studies):
                final_studies[category_name] = temporary_posts
            else:
                for tp in temporary_posts:
                    final_studies[category_name].append(tp)
    study = {}
    news = {}
    for category_name in final_studies:
        for post in final_studies[category_name]:
            if post['section'] == 1:  # is study section
                if not category_name in study:
                    study[category_name] = []
                study[category_name].append(post)
            elif post['section'] == 2:  # is news section
                if not category_name in news:
                    news[category_name] = []
                news[category_name].append(post)
    # footer part
    footer_study = {}
    footer_news = {}
    footer_tests = {}
    tests = json.loads(get_list_of_available_tests('not_important'))['data']
    for category_name in tests:
        for test in tests[category_name]:
            footer_tests[test['id']] = test['title'] if len(test['title']) < 50 else test['title'][0:50]
    for category_name in study:
        for post in study[category_name]:
            footer_study[post['post_id']] = post['post_title'] if len(post['post_title']) < 50 else post['post_title'][
                                                                                                    0:50]
    for category_name in news:
        for post in news[category_name]:
            footer_news[post['post_id']] = post['post_title'] if len(post['post_title']) < 50 else post['post_title'][
                                                                                                   0:50]
    ordered_footer_study_first = OrderedDict()
    ordered_footer_study_second = OrderedDict()
    ordered_footer_news = OrderedDict()
    ordered_footer_tests = OrderedDict()
    index = 0
    for key in sorted(footer_study.keys(), reverse=True):
        if index == 10:
            break
        if index < 5:
            ordered_footer_study_first[key] = footer_study[key]
        else:
            ordered_footer_study_second[key] = footer_study[key]
        index += 1
    index = 0
    for key in sorted(footer_news.keys(), reverse=True):
        if index == 5:
            break
        ordered_footer_news[key] = footer_news[key]
        index += 1
    index = 0
    for key in sorted(footer_tests.keys(), reverse=True):
        if index == 5:
            break
        ordered_footer_tests[key] = footer_tests[key]
        index += 1
    return render_template('html/base.html', user_role=g.user_role, username=g.username,
                           studies=study, news=news,
                           footer={"study_first": ordered_footer_study_first,
                                   "study_second": ordered_footer_study_second,
                                   "news": ordered_footer_news,
                                   "tests": ordered_footer_tests})


@mod.route('/content/category', methods=['GET'])
@requires_auth
def content_category():
    return render_template('html/inners/create_category_of_post.html')


@mod.route('/content/make/post', methods=['GET'])
@requires_auth
def content_create_post():
    return render_template('html/inners/create_post.html')


@mod.route('/content/create_test', methods=['GET'])
@requires_auth
def content_create_test():
    return render_template('html/inners/create_test.html')


@mod.route('/content/categories', methods=['GET'])
@requires_auth
def content_categories():
    return render_template('html/inners/list_of_categories.html', user_role=g.user_role)


@mod.route('/content/tests', methods=['GET'])
@requires_auth
def content_tests():
    return render_template('html/inners/list_of_tests.html')


@mod.route('/content/tests/category/<category_id>', methods=['GET'])
@requires_auth
def content_tests_by_category(category_id):
    return render_template('html/inners/list_of_tests.html')


@mod.route('/content/users', methods=['GET'])
@requires_auth
def content_users():
    return render_template('html/inners/list_of_users.html')

@mod.route('/content/archive_of_users', methods=['GET'])
@requires_auth
def content_archive_of_users():
    return render_template('html/inners/archive_of_users.html')


@mod.route('/content/main', methods=['GET'])
def content_main():
    slides = database.session.query(Slider).order_by(Slider.index).limit(10).all()
    final_slides = []
    for slide in slides:
        final_slides.append({
            "url": slide.url,
            "reference": slide.reference
        })
    return render_template('html/inners/main.html', slides=final_slides)


@mod.route('/content/organizations', methods=['GET'])
@requires_auth
def content_organizations():
    return render_template('html/inners/list_of_organizations.html')

@mod.route('/content/archive/organizations', methods=['GET'])
@requires_auth
def content_organizations_archive():
    return render_template('html/inners/archive_of_organizations.html')

@mod.route('/content/registration', methods=['GET'])
@requires_auth
def content_registration():
    return render_template('html/inners/registration.html', user_role=g.user_role, organization_name=g.organization)


@mod.route('/content/user/tests', methods=['GET'])
@requires_auth
def content_organization_tests():
    return render_template('html/inners/results_of_test.html')


@mod.route('/content/user/test', methods=['GET'])
@requires_auth
def content_user_tests():
    return render_template('html/inners/tests_of_user.html')


@mod.route('/content/test', methods=['GET'])
def content_test():
    return render_template('html/inners/test.html')


@mod.route('/content/images_operations', methods=['GET'])
@requires_auth
def content_images_operations():
    images_on_page = 4
    all_pages = math.ceil(len(database.session.query(Images).all()) / images_on_page)
    return render_template('html/inners/images_operations.html', all_pages=all_pages)


@mod.route('/content/test_conclusion/<test_solutions_id>', methods=['GET'])
def content_conclusion_test(test_solutions_id):
    test_solution = database.session.query(Test_Solutions).filter_by(id=test_solutions_id).first()
    test = database.session.query(Tests).filter_by(isDeleted=False).filter_by(id=test_solution.Tests_id).first()
    ready_questions = []
    if test_solution:
        questions = database.session.query(Questions).filter_by(Tests_id=test_solution.Tests_id).order_by(
            Questions.id).all()
        for question in questions:
            right_answers = database.session.query(Answers).filter_by(Questions_id=question.id) \
                .filter_by(isRight=True) \
                .all()
            user_answer = database.session.query(Users_Answers).filter_by(Test_Solutions_id=test_solution.id).filter_by(
                Questions_id=question.id).first()
            if user_answer:
                anwr = database.session.query(Answers).filter_by(id=user_answer.Answers_id).first().text
            else:
                anwr = None
            ready_questions.append({
                "text": question.text,
                "user_answer": anwr,
                "right_answers": [a.text for a in right_answers]
            })
    final_questions = []
    for rq in ready_questions:
        if not (rq['user_answer'] in rq['right_answers']):
            final_questions.append(rq)
    if test_solution:
        quantity_all_answers = len(database.session.query(Questions).filter_by(Tests_id=test_solution.Tests_id).all())
        quantity_right_answers = 0
        right_answers = []
        questions = test_solution.test.questions
        for qst in questions:
            aswr = database.session.query(Answers).filter_by(Questions_id=qst.id, isRight=True).all()
            for a in aswr:
                right_answers.append(a)
        for ra in right_answers:
            isExists = database.session.query(Users_Answers).filter_by(Test_Solutions_id=test_solution.id,
                                                                       Answers_id=ra.id).first()
            if isExists:
                quantity_right_answers += 1
        if g.username:
            username = g.username
        else:
            username = 'Гость'
        return render_template('html/inners/test_conclusion.html', right_answers=quantity_right_answers,
                               all_answers=quantity_all_answers,
                               username=username,
                               questions=final_questions,
                               isImportant=not test.isPrepered,
                               isClosed=test.closed)
    return render_template('html/inners/main.html')


@mod.route('/content/post', methods=['POST'])
def content_post():
    data = request.data
    print(data)
    data = json.loads(data)
    if 'post_id' in data and data['post_id']:
        post = database.session.query(Posts).filter_by(isDeleted=False).filter_by(id=data['post_id']).first()
    else:
        post = None
    if 'user_id' in session:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        post_id = data['post_id']
        appointed_post = database.session.query(Appointed_posts).filter_by(Organizations_id=user.Organizations_id,
                                                                           root_post_id=post_id).first()
        isAccessable = database.session.query(Posts).filter_by(isDeleted=False) \
            .filter(or_(Posts.closed == False, Posts.Organizations_id == user.Organizations_id)) \
            .filter_by(id=post_id) \
            .first()
        isAccessable = (isAccessable and appointed_post) or user.Roles_name == 'super_admin'
    if not post:
        article = {
            "title": None,
            "text": None
        }
    else:
        if post.closed is False or isAccessable:
            article = {
                "title": post.title,
                "text": post.text
            }
        else:
            article = {
                "title": None,
                "text": None
            }
    return render_template('html/inners/post.html', article=article)


@mod.route('/content/list_of_catalog_tests', methods=['GET'])
@requires_auth
def content_list_of_catalog_tests():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    tests = database.session.query(Tests).filter_by(isDeleted=False).filter_by(tradable=True).filter_by(
        closed=True).all()
    added_tests = database.session.query(Tests, Appointed_tests).filter(Tests.isDeleted == False).filter(
        Tests.id == Appointed_tests.root_test_id) \
        .all()
    # .filter(Tests.tradable == True)\
    # .filter(Tests.Organization_id == user.Organizations_id)\
    added_tests = [t.Tests.id for t in added_tests]
    response = []
    for test in tests:
        if not (test.id in added_tests) and test.Organization_id != user.organization.id:
            response.append({
                "id": test.id,
                "title": test.title,
                "description": test.description,
                "question_count": len(test.questions),
            })
    return render_template('html/inners/list_of_catalog_tests.html', tests_list=response)


@mod.route('/content/list_of_catalog_posts', methods=['GET'])
@requires_auth
def content_list_of_catalog_posts():
    user = database.session.query(Users).filter_by(id=session['user_id']).first()
    posts = database.session.query(Posts).filter_by(isDeleted=False).filter_by(tradable=True).filter_by(
        closed=True).all()
    added_posts = database.session.query(Appointed_posts).filter_by(Organizations_id=user.organization.id).all()
    added_posts = [p.root_post_id for p in added_posts]
    posts_response = []
    for post in posts:
        if (not post.id in added_posts) and post.Organizations_id != user.organization.id:
            posts_response.append({
                "id": post.id,
                "title": post.title,
                "from_category": post.category.name,
                "text": post.text if len(post.text) < 250 else post.text[0:250] + '...',
            })
    categories = database.session.query(Categories).filter_by(isDeleted=False).filter(
        or_(Categories.Organizations_id == user.organization.id, Categories.Organizations_id == None)).all()
    categories_response = []
    for category in categories:
        categories_response.append({
            "id": category.id,
            "name": category.name
        })
    return render_template('html/inners/list_of_catalog_posts.html', posts_list=posts_response,
                           categories_list=categories_response)


@mod.route('/content/slider', methods=['GET'])
@requires_auth
def content_slider_control():
    return render_template('html/inners/slider_operations.html')


@mod.route('/content/search_list/<founder_string>', methods=['GET'])
def content_founder_list(founder_string):
    posts = {}
    base_query = database.session.query(Posts).filter_by(isDeleted=False)

    if 'user_id' in session:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()

        appointed_posts = database.session.query(Appointed_posts).filter_by(Organizations_id=user.organization.id).all()
        request_by_appointed_headers = [base_query.filter_by(id=a_post.root_post_id)
                                            .filter(Posts.title.like('%' + founder_string + '%'))
                                            .first()
                                        for a_post in appointed_posts]
        request_by_appointed_text = [base_query.filter_by(id=a_post.root_post_id)
                                         .filter(Posts.text.like('%' + founder_string + '%'))
                                         .first()
                                     for a_post in appointed_posts]
        request_by_appointed_headers = list(filter(lambda x: x is not None, request_by_appointed_headers))
        request_by_appointed_text = list(filter(lambda x: x is not None, request_by_appointed_text))

        base_query = base_query.filter(or_(Posts.Organizations_id == user.Organizations_id, Posts.closed == False))
    else:
        base_query = base_query.filter(Posts.closed == False)

    query_by_headers = base_query.filter(Posts.title.like('%' + founder_string + '%')).all()
    query_by_text = base_query.filter(Posts.text.like('%' + founder_string + '%')).all()

    for post in query_by_headers:
        if not post.id in posts:
            posts[post.id] = post
    if 'user_id' in session:
        for post in request_by_appointed_headers:
            if not post.id in posts:
                posts[post.id] = post
    for post in query_by_text:
        if not post.id in posts:
            posts[post.id] = post
    if 'user_id' in session:
        for post in request_by_appointed_text:
            if not post.id in posts:
                posts[post.id] = post
    counter = 0
    final_posts = {}
    for id in posts:
        if counter == 50:
            break
        final_posts[id] = {
            "id"    : id,
            "title" : posts[id].title,
            "text"  : cleanhtml(posts[id].text)
        }
        counter += 1
    for fp in final_posts:
        if len(final_posts[fp]['text']) > 350:
            final_posts[fp]['text'] = final_posts[fp]['text'][0:350] + '...'
    return render_template('html/inners/search_list.html', posts=final_posts, amount_posts=len(posts))


@mod.route('/content/edit_user/<user_id>', methods=['GET'])
@requires_auth
def edit_user(user_id):
    user = database.session.query(Users).filter_by(id=user_id).first()
    user = {
        "id": user.id,
        "first_name": user.first_name,
        "second_name": user.second_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "organization_id": user.Organizations_id,
        "organization_name": user.organization.name,
        "role": user.Roles_name,
        "password": user.password
    }
    organizaitons = database.session.query(Organizations)
    if g.user_role == 'super_admin':
        organizations = organizaitons.all()
    elif g.user_role == 'admin':
        organizations = organizaitons.filter_by(id=user['organization_id']).all()
    return render_template('html/inners/edit_user.html', user=user, organizations=organizations, user_role=g.user_role)

@mod.route('/content/feedback', methods=['GET'])
def feedback_page():
    return render_template('html/inners/feedback.html')

@post.route('/<post_id>', methods=['GET'])
def some_post(post_id):
    studies = {}
    if g.user_role == 'super_admin':
        categories = database.session.query(Categories).filter_by(isDeleted=False).all()
    elif g.username:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
        if user:
            categories = database.session.query(Categories).filter_by(isDeleted=False).filter(
                or_(Categories.organization == user.organization, Categories.Organizations_id == None)).all()
    else:
        categories = database.session.query(Categories).filter_by(isDeleted=False).filter_by(
            Organizations_id=None).all()
    for category in categories:
        if not category.name in studies:
            studies[category.name] = []
        posts = category.posts
        for post in posts:
            studies[category.name].append({
                "post_id": post.id,
                "post_title": post.title,
                "post_closed": post.closed,
                "Organizations_id": post.Organizations_id,
                "isDeleted": post.isDeleted,
                "isAdded": False,
                "section": post.category.section
            })
        for a_post in category.appointed_posts:
            studies[category.name].append({
                "post_id": a_post.root_post.id,
                "post_title": a_post.root_post.title,
                "post_closed": a_post.root_post.closed,
                "isDeleted": a_post.root_post.isDeleted,
                "Organizations_id": a_post.Organizations_id,
                "isAdded": True,
                "section": a_post.category.section
            })
    if g.username:
        user = database.session.query(Users).filter_by(id=session['user_id']).first()
    else:
        user = None
    final_studies = {}
    for category_name in studies:
        temporary_posts = []
        if studies[category_name] == []:
            continue
        for post in studies[category_name]:
            if user:
                if post['post_closed'] == True and post['Organizations_id'] == user.organization.id and post[
                    'isDeleted'] == False:
                    temporary_posts.append(post)
                elif post['post_closed'] == False and post['isDeleted'] == False:
                    temporary_posts.append(post)
                elif post['isAdded'] == True and post['Organizations_id'] == user.organization.id and post[
                    'isDeleted'] == False:
                    temporary_posts.append(post)
            else:
                if post['post_closed'] == False and post['isDeleted'] == False:
                    temporary_posts.append(post)
        if temporary_posts != []:
            if not (category_name in final_studies):
                final_studies[category_name] = temporary_posts
            else:
                for tp in temporary_posts:
                    final_studies[category_name].append(tp)
    study = {}
    news = {}
    for category_name in final_studies:
        for post in final_studies[category_name]:
            if post['section'] == 1:  # is study section
                if not category_name in study:
                    study[category_name] = []
                study[category_name].append(post)
            elif post['section'] == 2:  # is news section
                if not category_name in news:
                    news[category_name] = []
                news[category_name].append(post)
    # footer part
    footer_study = {}
    footer_news = {}
    footer_tests = {}
    tests = json.loads(get_list_of_available_tests('not_important'))['data']
    for category_name in tests:
        for test in tests[category_name]:
            footer_tests[test['id']] = test['title'] if len(test['title']) < 50 else test['title'][0:50]
    for category_name in study:
        for post in study[category_name]:
            footer_study[post['post_id']] = post['post_title'] if len(post['post_title']) < 50 else post[
                                                                                                        'post_title'][
                                                                                                    0:50]
    for category_name in news:
        for post in news[category_name]:
            footer_news[post['post_id']] = post['post_title'] if len(post['post_title']) < 50 else post[
                                                                                                       'post_title'][
                                                                                                   0:50]
    ordered_footer_study_first = OrderedDict()
    ordered_footer_study_second = OrderedDict()
    ordered_footer_news = OrderedDict()
    ordered_footer_tests = OrderedDict()
    index = 0
    for key in sorted(footer_study.keys(), reverse=True):
        if index == 10:
            break
        if index < 5:
            ordered_footer_study_first[key] = footer_study[key]
        else:
            ordered_footer_study_second[key] = footer_study[key]
        index += 1
    index = 0
    for key in sorted(footer_news.keys(), reverse=True):
        if index == 5:
            break
        ordered_footer_news[key] = footer_news[key]
        index += 1
    index = 0
    for key in sorted(footer_tests.keys(), reverse=True):
        if index == 5:
            break
        ordered_footer_tests[key] = footer_tests[key]
        index += 1
    return render_template('html/base.html', user_role=g.user_role, username=g.username,
                           studies=study, news=news,
                           footer={"study_first": ordered_footer_study_first,
                                   "study_second": ordered_footer_study_second,
                                   "news": ordered_footer_news,
                                   "tests": ordered_footer_tests},
                           show_post=post_id)