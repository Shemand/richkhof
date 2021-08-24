from rh_database.common import get_or_create
from rh_http import http_server, db as database
from rh_database.Roles import privileges_of_role, Roles, Privileges
from rh_database.Tests import Tests, Questions, Appointed_users
from rh_database.Users import Users
from rh_database.Organizations import Organizations
from rh_http.common.functions import tangle_users_and_tests


def init_roles_and_privileges():
    privileges = [
        'create_posts',
        'create_tests',
        'create_all_tests',
        'show_all_users',
        'show_local_users',
        'show_all_tests',
        'show_private_tests',
    ]
    roles = {
        'super_admin' : [
            'create_posts',
            'create_tests',
            'create_all_tests',
            'show_all_users',
            'show_local_users',
            'show_all_tests',
            'show_private_tests',
        ],
        'admin' : [
            'create_posts',
            'create_tests',
            'show_local_users',
            'show_private_tests',
        ],
        'user' : [
            'show_private_tests',
        ],
        'guest' : [

        ]
    }
    for role in roles:
        role_object = get_or_create(database.session, Roles, name=role)
        for privilege in roles[role]:
            privilege_object = get_or_create(database.session, Privileges, name=privilege)
            role_object.privileges.append(privilege_object)
            database.session.add(role_object)
    database.session.commit()

def init_system_users():
    org = get_or_create(database.session, Organizations, name='System')
    archive_organization = get_or_create(database.session, Organizations, name='Archive')
    guest = get_or_create(database.session, Users, first_name='Дорогой',
                                                   second_name='Гость',
                                                   email='service_guest@gmail.com',
                                                   phone_number='81111111111',
                                                   password='service',
                                                   organization=org,
                                                   Roles_name='user')
    super_admin = get_or_create(database.session, Users, first_name='Service',
                                                         second_name='Admin',
                                                         email='service_admin@gmail.com',
                                                         phone_number='88888888888',
                                                         password='vspbmebel_service',
                                                         organization=org,
                                                         Roles_name='super_admin')
if __name__ == "__main__":
    database.create_all()
    tangle_users_and_tests()
    init_roles_and_privileges()
    init_system_users()
    http_server.run(host='0.0.0.0', port=5000)
