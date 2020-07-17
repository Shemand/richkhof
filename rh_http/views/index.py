mod = Blueprint('index', __name__, url_prefix='/')

@mod.route('/', methods=['GET', 'POST'])
def index():
    return render_template('html/index.html')