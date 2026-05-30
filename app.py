from flask import Flask, render_template, request, jsonify, session
import sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = "chat_secret"


# ---------------- DATABASE ----------------
def init_db():
    conn = sqlite3.connect("chat.db")
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            sender TEXT,
            message TEXT,
            time TEXT,
            date TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()


# ---------------- HOME ----------------
@app.route("/")
def home():
    return render_template("index.html")


# ---------------- SET USER ----------------
@app.route("/set_user", methods=["POST"])
def set_user():
    data = request.get_json()
    session["username"] = data["username"]
    return jsonify({"status": "ok"})


# ---------------- SEND MESSAGE ----------------
@app.route("/send", methods=["POST"])
def send():

    data = request.get_json()
    message = data["message"]

    username = session.get("username", "Guest")

    now = datetime.now()
    time_str = now.strftime("%H:%M")
    date_str = now.strftime("%d/%m/%Y")

    conn = sqlite3.connect("chat.db")
    c = conn.cursor()

    # USER MESSAGE
    c.execute("""
        INSERT INTO messages (username, sender, message, time, date)
        VALUES (?, ?, ?, ?, ?)
    """, (username, "You", message, time_str, date_str))

    # BOT RESPONSE
    reply = bot_response(message)

    c.execute("""
        INSERT INTO messages (username, sender, message, time, date)
        VALUES (?, ?, ?, ?, ?)
    """, (username, "Support", reply, time_str, date_str))

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})


# ---------------- HISTORY ----------------
@app.route("/history")
def history():

    username = session.get("username", "Guest")

    conn = sqlite3.connect("chat.db")
    c = conn.cursor()

    c.execute("""
        SELECT sender, message, time, date
        FROM messages
        WHERE username = ?
        ORDER BY id ASC
    """, (username,))

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "sender": r[0],
            "message": r[1],
            "time": r[2],
            "date": r[3]
        } for r in rows
    ])


# ---------------- CLEAR ----------------
@app.route("/clear", methods=["POST"])
def clear():

    username = session.get("username", "Guest")

    conn = sqlite3.connect("chat.db")
    c = conn.cursor()

    c.execute("DELETE FROM messages WHERE username = ?", (username,))

    conn.commit()
    conn.close()

    return jsonify({"status": "cleared"})


# ---------------- 🤖 FLIPKART STYLE BOT ----------------
def bot_response(msg):
    msg = msg.lower()

    # greetings
    if any(word in msg for word in ["hi", "hello", "hey"]):
        return "👋 Hi! Welcome to ShopEasy. How can I help you today?"

    # help
    elif "help" in msg:
        return "🆘 I can help you with orders, products, delivery, payments and returns."

    # order
    elif "order" in msg and "status" in msg:
        return "📦 Please enter your Order ID to track your order."

    elif "order" in msg:
        return "🛍️ You can track your order in 'My Orders' section."

    # delivery
    elif "delivery" in msg or "shipping" in msg:
        return "🚚 Delivery takes 2–5 days depending on your location."

    # payment
    elif "payment" in msg:
        return "💳 We accept UPI, Cards, Net Banking and COD."

    # refund
    elif "refund" in msg or "return" in msg:
        return "🔄 Returns are available within 7 days of delivery."

    # price
    elif "price" in msg or "cost" in msg or "rate" in msg:
        return "💰 Tell me the product name, I will give you best price."

    # electronics
    elif "phone" in msg:
        return "📱 Phones start from ₹7,000. What is your budget?"

    elif "laptop" in msg:
        return "💻 Laptops start from ₹25,000. Gaming or study laptop?"

    elif "tv" in msg:
        return "📺 Smart TVs available from 24 to 75 inch."

    elif "headphone" in msg:
        return "🎧 Headphones start from ₹299. Wired or wireless?"

    # offers
    elif "offer" in msg or "discount" in msg:
        return "🔥 Today offers: Up to 70% OFF + Free delivery!"

    # default
    else:
        return "🤖 Sorry, I didn't understand. Ask about products, orders, delivery or payments."


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)