import mysql.connector
from datetime import datetime
import logging

logging.basicConfig(filename="tranformer.log", level=logging.INFO, filemode='a')

def read_db_config():
    try:
        # Read the connection details from config/db.txt
        with open("db.txt", "r") as f:
            config = {}
            for line in f:
                key, value = line.strip().split("=")
                config[key] = value
        return config
    except FileNotFoundError:
        logging.error("Error: db.txt file not found.")
    else:
        logging.info("Success: Successfully read config/db.txt file.")
        return config
    
def connect_to_database():
    config = read_db_config()

    if config is None:
        logging.error("Error: Failed to read database configuration.")
        return None

    try:
        # Connect to the MySQL/MariaDB database
        connection = mysql.connector.connect(
            host=config["host"],
            user=config["user"],
            password=config["password"],
            database=config["database"]
        )
        logging.info("Success: Connected to database.")
        return connection
    except mysql.connector.Error as error:
        logging.error("Error connecting to database: %s", error)
        return None
    
def insert_subreddit(cursor, db, subreddit_name):
    try:
        cursor.execute("""
            INSERT IGNORE INTO subreddits (name)
            VALUES (%s)
        """, (subreddit_name,))
        db.commit()

        if cursor.rowcount == 1:
            logging.info(f"Inserted subreddit: {subreddit_name}")
        else:
            logging.info(f"Subreddit already exists: {subreddit_name}")

        cursor.execute("SELECT subreddit_id FROM subreddits WHERE name = %s", (subreddit_name,))
        subreddit_id = cursor.fetchone()[0]
        return subreddit_id

    except mysql.connector.Error as error:
        logging.error(f"Error inserting subreddit '{subreddit_name}': {error}")
        return None
    except Exception as error:
        logging.error(f"Error retrieving data from database: {error}")
        return None
    
def insert_user(cursor, db, username, comment_karma, created_utc, flair=None):
    try:
        cursor.execute("""
            INSERT IGNORE INTO users (username, comment_karma, created_utc, flair)
            VALUES (%s, %s, %s, %s)
        """, (username, comment_karma, created_utc, flair))
        db.commit()
        if cursor.rowcount == 1:
            logging.info(f"Inserted user: {username}")
        else:
            logging.info(f"User already exists: {username}")
    except mysql.connector.Error as error:
        logging.error(f"Error inserting user '{username}': {error}")

def insert_post(cursor, db, post_id, title, author_id, subreddit_id, score, num_comments, upvote_ratio, post_type, created_utc, permalink, url, body):
    if subreddit_id is not None and not post_exists(cursor, post_id):
        try:
            cursor.execute("""
    INSERT INTO posts (post_id, title, author_id, subreddit_id, score, num_comments, upvote_ratio, post_type, created_utc, permalink, url, body)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
    score = VALUES(score),
    num_comments = VALUES(num_comments)
""", (post_id, title, author_id, subreddit_id, score, num_comments, upvote_ratio, post_type, created_utc, permalink, url, body))
            db.commit()
            logging.info(f"Inserted post: {title}")
        except mysql.connector.Error as error:
            logging.error(f"Error inserting post '{title}': {error}")
    elif subreddit_id is None:
        logging.warning("subreddit_id is None for subreddit %s, post '%s' not inserted", subreddit_id, title)
    else:
        logging.info(f"Post already exists: {title}")


# def insert_post(cursor, db, post_id, title, author_id, subreddit_id, score, num_comments, upvote_ratio, post_type, created_utc, permalink, url, body):
#     if subreddit_id is not None and not post_exists(cursor, post_id):
#         try:
#             created_local_time = convert_utc_to_local(created_utc)
#             cursor.execute("""
#     INSERT INTO posts (post_id, title, author_id, subreddit_id, score, num_comments, upvote_ratio, post_type, created_utc, permalink, url, body)
#     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#     ON DUPLICATE KEY UPDATE
#     score = VALUES(score),
#     num_comments = VALUES(num_comments)
# """, (post_id, title, author_id, subreddit_id, score, num_comments, upvote_ratio, post_type, created_local_time, permalink, url, body))
#             db.commit()
#             logging.info(f"Inserted post: {title}")
#         except mysql.connector.Error as error:
#             logging.error(f"Error inserting post '{title}': {error}")
#     elif subreddit_id is None:
#         logging.warning("subreddit_id is None for subreddit %s, post '%s' not inserted", subreddit_id, title)
#     else:
#         logging.info(f"Post already exists: {title}")

def post_exists(cursor, post_id):
    try:
        cursor.execute("""
    SELECT EXISTS(
        SELECT 1
        FROM posts
        WHERE post_id = %s
    )
""", (post_id,))
        result = cursor.fetchone()[0]
        return result > 0
    except mysql.connector.Error as error:
        logging.error(f"Error checking if post with id '{post_id}' exists: {error}")
        return False
    
def insert_comment(cursor, db, parent_id, post_id, author_id, created_utc, body, score, upvote_ratio, is_submitter, gilded, permalink):
    if post_id is not None:
        try:
            cursor.execute("""
                SELECT * FROM comments
                WHERE parent_id = %s AND post_id = %s AND author_id = %s AND body = %s
            """, (parent_id, post_id, author_id, body))
            result = cursor.fetchone()
            if result is None:
                cursor.execute("""
                    INSERT INTO comments (parent_id, post_id, author_id, created_utc, body, score, upvote_ratio, is_submitter, gilded, permalink)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (parent_id, post_id, author_id, created_utc, body, score, upvote_ratio, is_submitter, gilded, permalink))
                db.commit()
                logging.info(f"Success: Comment inserted into database. Comment body: {body}")
            else:
                logging.info(f"Comment already exists in database. Comment body: {body}")
        except mysql.connector.Error as error:
            db.rollback()
            logging.error(f"Error inserting comment: {error}. Comment body: {body}")
    else:
        logging.warning("post_id is None for comment '%s', not inserted. Comment body: %s", body, body)

def get_last_scrape_time(cursor, subreddit_name):
    try:
        cursor.execute("""
            SELECT MAX(scrape_time)
            FROM subreddit_scrape
            WHERE subreddit_name = %s
        """, (subreddit_name,))
        result = cursor.fetchone()[0]
        if result is not None:
            last_scrape_time = datetime.strptime(result, '%Y-%m-%d %H:%M:%S')
        else:
            last_scrape_time = None
        return last_scrape_time
    except mysql.connector.Error as error:
        logging.error(f"Error retrieving last scrape time for subreddit '{subreddit_name}': {error}")
        return None
    
def update_last_scrape_time(cursor, subreddit_name, scrape_time):
    try:
        cursor.execute("""
            INSERT INTO subreddit_scrape (subreddit_name, scrape_time)
            VALUES (%s, %s)
        """, (subreddit_name, scrape_time))
        logging.info(f"Success: Updated last scrape time for subreddit '{subreddit_name}' to {scrape_time}")
    except mysql.connector.Error as error:
        logging.error(f"Error updating last scrape time for subreddit '{subreddit_name}': {error}")
