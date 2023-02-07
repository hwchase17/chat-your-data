import re
from typing import List

import twint
import nest_asyncio

from config import settings
nest_asyncio.apply()

def clean_text(tweet: str) -> str:
    """
    remove link and reply

    Args:
        tweet (str): raw_tweet

    Returns:
        str: tweet after removing link and reply
    """
    result = re.sub("https?://[\w!\?/\+\-_~=;\.,\*&@#\$%\(\)'\[\]]+", "", tweet)
    result = re.sub("@[\\w]{1,15}", "", result)
    return result


def get_recent_tweet(top_k: int = 20) -> List[str]:
    c = twint.Config()
    c.Username = settings.tweet_username
    c.Limit = top_k
    c.Pandas = True
    twint.run.Search(c)
    Tweets_df = twint.storage.panda.Tweets_df
    
    Tweets_df = Tweets_df.head(top_k) if len(Tweets_df) > top_k else Tweets_df
    return [clean_text(tweet) for tweet in Tweets_df.tweet.to_list()]



def get_recent_tweet_for_tool(top_k: str = "10")-> str:
    try:
        top_k = int(top_k)
        return "/".join(get_recent_tweet(top_k))
    except:
        return "We could not get tweet since no certification"
