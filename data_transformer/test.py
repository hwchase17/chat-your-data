import mysql.connector
import pandas as pd
import json

# Database connection parameters
db_params = {
    'host': 'your_host',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'your_database'
}

# SQL query to get the top 5 posts
sql_query = '''
SELECT
    post_id,
    title,
    author_id,
    subreddit_id,
    score,
    num_comments,
    upvote_ratio,
    post_type,
    created_utc,
    permalink,
    url,
    body
FROM
    posts
ORDER BY
    score DESC
LIMIT 5;
'''

# Connect to the database and execute the query
connection = mysql.connector.connect(**db_params)
df = pd.read_sql_query(sql_query, connection)
connection.close()

# Convert the query result to JSON format
result_json = df.to_json(orient='records')

# Write the JSON data to a file
with open('top_5_posts.json', 'w') as f:
    f.write(result_json)

# Print the JSON data
print(result_json)
