from flask import Flask, render_template, request, jsonify
import sqlite3
import webview
import threading

app = Flask(__name__, static_folder='./static', template_folder='./templates')

# this will create "mydb.sqlite" if it doesn't exist
conn = sqlite3.connect("mydb.sqlite", check_same_thread=False)
cursor = conn.cursor()

@app.route('/home', methods=['GET', 'POST'])
def home():
    return render_template('index.html')

@app.route('/home/product-data', methods=['GET', 'POST'])
def product_data():
    data = request.get_json()
    barcode = data.get('barcode')

    cursor.execute(''' SELECT * FROM product_info WHERE barcode = ?''', (barcode,))
    result = cursor.fetchone()

    if result is None:
        return jsonify({'success': False, 'message': 'Invalid barcode!'})
    else:
        return jsonify({'success': True,
                        'data':{
                            'id': result[0],
                            'barcode': result[1],
                            'product_name': result[2],
                            'price': result[4]
                        }
        })

def start_flask():
    app.run(debug=False, port=5000, use_reloader=False)

if __name__ == '__main__':
    start_flask()
    # Run Flask in a background thread
    '''
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Open pywebview window pointing to Flask server
    webview.create_window(
        'POS System',
        'http://127.0.0.1:5000/home',
        width=100,   # window width
        height=150,  # window height
        resizable=True,   # allow resizing (default True)
        fullscreen=False  # disable fullscreen (default False)
    )
    webview.start() 

'''