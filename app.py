from query_data import load_front_agent
from tools import load_tools


if __name__ == "__main__":
    tools = load_tools(["get_recent_tweet", "search_from_docs"])
    agent = load_front_agent(tools)
    chat_history = []
    print("Chat with your docs!")
    while True:
        print("Human:")
        question = input()
        result = agent({"input": question, "interviewee_name": settings.interviewee_name})
        print("AI:")
        print(result["output"])