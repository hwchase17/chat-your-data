from typing import List

from langchain.agents.tools import Tool

from tools.get_tweet import get_recent_tweet_for_tool
from tools.search_from_docs import SearchFromDocs


def get_recent_tweet_tool() -> Tool:
    return Tool(
        "Get recent tweet",
        get_recent_tweet_for_tool,
        "Use this tool when you are asked about the interviewee's recent activities, interests, etc.. this tool get recent tweet. input should be int. this number stand for the number of tweet we get. default is 10",
    )


def get_search_from_docs_tool() -> Tool:
    search_from_docs = SearchFromDocs()
    return Tool(
        "Search from docs",
        search_from_docs.run,
        "Use this tool when you are asked about the interviewee. this tool search the info of interviewee from documents. input should be question.",
    )


name2tool = {
    "get_recent_tweet": get_recent_tweet_tool(),
    "search_from_docs": get_search_from_docs_tool(),
}


def load_tools(tool_names: List[str]):
    res = []

    for tool_name in tool_names:
        if tool_name in name2tool:
            res.append(name2tool[tool_name])
        else:
            raise ValueError(f"{tool_name} is not defined")
    return res
