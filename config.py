import os
from typing import Optional

from pydantic import BaseSettings, HttpUrl


class Settings(BaseSettings):
    ## Basic
    interviewee_name: str = "Yongtae Hwang"
    tweet_username: str = "Yoooongtae"
    
    HyDE_n: int = 4
    HyDE_best_of: int = 4    
    
settings = Settings()
