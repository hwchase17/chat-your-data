# 😆 Ask Everything About Me

This bot can do the following on your behalf
- Analyze your tweets and show you what you are interested in these days.
- Answer questions about you from your blog or profile.


# ⭐ Use Case

The use cases I assume are as follows

- Individuals/companies can introduce themselves to individuals/companies
- When you don't know how to write your introduction, Bot can help you

I hope you will be able to customize this bot for your own use and use it to introduce yourself, especially as a job-seeking appeal.

The BOT is instructed to reply in a way that the questioner will like the interviewee via [prompt](query_data.py). 

# 👀 Let's try!
You can try this bot at [here](https://about-yongtae-cfa5uiil5a-an.a.run.app/).
# 🧠 Basic architecture
![architecture](/architecture.png)

This repository is made based on [🦜️🔗 LangChain](https://github.com/hwchase17/langchain), which is excellent library to make text generation application.

ZeroShotAgent uses the following tools for answering questions.
- **Get recent tweets**: Returns the content of recent tweets. From this content, bot can reply to the recent interests and trends of the interviewee. in this repo, I sellect twint libirally because tweet API in not stable right now.
- **Question answering from docs**: Answer questions about you from pre-defined profiles, blogs, etc. The algorithm uses [HyDE](https://langchain.readthedocs.io/en/latest/modules/utils/combine_docs_examples/hyde.html?highlight=Hyde).


# 🚀 Quick Custom
You can customize your own BOT!
If you want, see [here](https://github.com/Yongtae723/ask_everything_about_me)